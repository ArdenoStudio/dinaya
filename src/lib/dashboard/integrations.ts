import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, businesses, socialConnections, voiceIntegrations, webhooks } from "@/db/schema";
import { GOOGLE_PROVIDER, googleOAuthConfigured } from "@/lib/google-calendar";
import { canUseFeature, minimumPlanForFeature, planDisplayName, type Plan, type PlanFeature } from "@/lib/plan";
import { voiceStatusLabel } from "@/lib/voice-receptionist";

export type DashboardIntegrationDetail = Awaited<ReturnType<typeof getIntegrationDashboardDetail>>;
export type DashboardIntegrationsList = Awaited<ReturnType<typeof getIntegrationsDashboardList>>;
export type DashboardIntegrationStatusFilter =
  | "action_required"
  | "all"
  | "available"
  | "connected"
  | "env_required"
  | "gated";

export const dashboardIntegrationStatusFilters = [
  "all",
  "connected",
  "available",
  "action_required",
  "env_required",
  "gated",
] as const;

export type DashboardIntegrationsListOptions = {
  limit?: number;
  q?: string;
  status?: DashboardIntegrationStatusFilter;
};

const DEFAULT_INTEGRATION_LIMIT = 80;
const MAX_INTEGRATION_LIMIT = 150;

function normalizeIntegrationLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_INTEGRATION_LIMIT;
  return Math.min(MAX_INTEGRATION_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_INTEGRATION_LIMIT)));
}

export function isDashboardIntegrationStatusFilter(value: string): value is DashboardIntegrationStatusFilter {
  return dashboardIntegrationStatusFilters.includes(value as DashboardIntegrationStatusFilter);
}

function gatedStatus(plan: Plan, feature: PlanFeature) {
  return {
    actionLabel: "Upgrade",
    planRequired: planDisplayName(minimumPlanForFeature(feature)),
    setupPath: "/dashboard/billing",
    status: "gated" as const,
    statusLabel: `${planDisplayName(minimumPlanForFeature(feature))} required`,
  };
}

function voiceListStatus(status: string | undefined) {
  if (!status || status === "not_requested") {
    return {
      actionLabel: "Set up",
      status: "action_required" as const,
      statusLabel: "Not requested",
    };
  }
  if (status === "live" || status === "active") {
    return {
      actionLabel: "Manage",
      status: "connected" as const,
      statusLabel: voiceStatusLabel(status),
    };
  }
  return {
    actionLabel: "Continue setup",
    status: "available" as const,
    statusLabel: voiceStatusLabel(status),
  };
}

export async function getIntegrationsDashboardList(
  businessId: string,
  options: DashboardIntegrationsListOptions = {},
) {
  const [[business], socialRows, voiceRows, [{ webhookCount }], [{ apiKeyCount }]] = await Promise.all([
    db
      .select({
        customDomain: businesses.customDomain,
        customDomainConfig: businesses.customDomainConfig,
        customDomainError: businesses.customDomainError,
        customDomainStatus: businesses.customDomainStatus,
        customDomainVerification: businesses.customDomainVerification,
        customDomainVerificationToken: businesses.customDomainVerificationToken,
        customDomainVerified: businesses.customDomainVerified,
        payhereEnabled: businesses.payhereEnabled,
        payhereMerchantId: businesses.payhereMerchantId,
        plan: businesses.plan,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1),
    db
      .select({
        accountName: socialConnections.accountName,
        createdAt: socialConnections.createdAt,
        id: socialConnections.id,
        isActive: socialConnections.isActive,
        provider: socialConnections.provider,
        updatedAt: socialConnections.updatedAt,
      })
      .from(socialConnections)
      .where(eq(socialConnections.businessId, businessId))
      .orderBy(asc(socialConnections.provider)),
    db
      .select({
        id: voiceIntegrations.id,
        providerName: voiceIntegrations.providerName,
        status: voiceIntegrations.status,
        updatedAt: voiceIntegrations.updatedAt,
      })
      .from(voiceIntegrations)
      .where(eq(voiceIntegrations.businessId, businessId))
      .limit(1),
    db.select({ webhookCount: count() }).from(webhooks).where(eq(webhooks.businessId, businessId)),
    db
      .select({ apiKeyCount: count() })
      .from(apiKeys)
      .where(and(eq(apiKeys.businessId, businessId), eq(apiKeys.keyType, "generic"))),
  ]);

  const plan = business?.plan ?? "free";
  const google = socialRows.find((row) => row.provider === GOOGLE_PROVIDER);
  const voice = voiceRows[0];
  const canUseWebhooks = canUseFeature(plan, "webhooks");
  const canUseGoogleCalendar = canUseFeature(plan, "googleCalendarSync");
  const canUseWhatsappSms = canUseFeature(plan, "whatsappSms");
  const canUseVoice = canUseFeature(plan, "aiVoiceReceptionist");
  const canUseCustomDomain = canUseFeature(plan, "publicBookingPageCustomization");
  const payhereConnected = Boolean(business?.payhereEnabled && business.payhereMerchantId);
  const googleConfigured = googleOAuthConfigured();
  const messagingConfigured = Boolean(process.env.META_WHATSAPP_TOKEN || process.env.SMS_HTTP_ENDPOINT);
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const voiceStatus = canUseVoice
    ? voiceListStatus(voice?.status)
    : gatedStatus(plan, "aiVoiceReceptionist");
  const voiceSetupPath = "setupPath" in voiceStatus
    ? voiceStatus.setupPath
    : "/dashboard/settings/voice-receptionist";

  const rows = [
    {
      accountName: payhereConnected ? "Merchant configured" : null,
      actionLabel: "Configure",
      category: "payments",
      description: "Accept LKR deposits and full payments from clients.",
      detailId: null,
      id: "payhere",
      kind: "built_in",
      name: "PayHere",
      provider: "payhere",
      setupPath: "/dashboard/settings",
      status: payhereConnected ? "connected" : "action_required",
      statusLabel: payhereConnected ? "Connected" : "Not connected",
      updatedAt: null,
    },
    {
      accountName: null,
      actionLabel: canUseWebhooks ? "Manage" : "Upgrade",
      category: "developer",
      description: "Send booking events to external systems or Zapier-style workflows.",
      detailId: null,
      id: "webhooks",
      kind: "developer",
      name: "Webhooks",
      provider: "webhooks",
      setupPath: canUseWebhooks ? "/dashboard/settings/webhooks" : "/dashboard/billing",
      status: canUseWebhooks ? Number(webhookCount) > 0 ? "connected" : "available" : "gated",
      statusLabel: canUseWebhooks
        ? Number(webhookCount) > 0
          ? `${webhookCount} endpoint${Number(webhookCount) === 1 ? "" : "s"}`
          : "Not connected"
        : `${planDisplayName(minimumPlanForFeature("webhooks"))} required`,
      updatedAt: null,
    },
    {
      accountName: google?.accountName ?? null,
      actionLabel: !canUseGoogleCalendar ? "Upgrade" : google?.isActive ? "Manage" : googleConfigured ? "Connect" : "Configure env",
      category: "calendar",
      description: "Push confirmed bookings to a connected Google Calendar.",
      detailId: google?.id ?? null,
      id: "google-calendar",
      kind: "social",
      name: "Google Calendar",
      provider: GOOGLE_PROVIDER,
      setupPath: canUseGoogleCalendar ? google?.isActive ? "/dashboard/settings/integrations" : "/api/dashboard/integrations/google" : "/dashboard/billing",
      status: !canUseGoogleCalendar
        ? "gated"
        : !googleConfigured
          ? "env_required"
          : google?.isActive
            ? "connected"
            : "action_required",
      statusLabel: !canUseGoogleCalendar
        ? `${planDisplayName(minimumPlanForFeature("googleCalendarSync"))} required`
        : !googleConfigured
          ? "Env required"
          : google?.isActive
            ? "Connected"
            : "Not connected",
      updatedAt: google?.updatedAt.toISOString() ?? null,
    },
    {
      accountName: null,
      actionLabel: "Use in automations",
      category: "automation",
      description: "Transactional email for confirmations, reminders, and automations.",
      detailId: null,
      id: "resend",
      kind: "provider",
      name: "Resend",
      provider: "resend",
      setupPath: "/dashboard/automations",
      status: resendConfigured ? "connected" : "env_required",
      statusLabel: resendConfigured ? "Configured" : "Env required",
      updatedAt: null,
    },
    {
      accountName: null,
      actionLabel: canUseWhatsappSms ? "Use in AI Hub" : "Upgrade",
      category: "messaging",
      description: "AI reminders and campaigns through WhatsApp or SMS gateway.",
      detailId: null,
      id: "whatsapp-sms",
      kind: "provider",
      name: "WhatsApp / SMS",
      provider: "messaging",
      setupPath: canUseWhatsappSms ? "/dashboard/automations" : "/dashboard/billing",
      status: canUseWhatsappSms ? messagingConfigured ? "connected" : "env_required" : "gated",
      statusLabel: canUseWhatsappSms
        ? messagingConfigured
          ? "Configured"
          : "Env required"
        : `${planDisplayName(minimumPlanForFeature("whatsappSms"))} required`,
      updatedAt: null,
    },
    {
      accountName: voice?.providerName ?? null,
      actionLabel: voiceStatus.actionLabel,
      category: "voice",
      description: "Managed phone agent for questions and appointment booking.",
      detailId: voice?.id ?? null,
      id: "ai-voice-receptionist",
      kind: "voice",
      name: "AI Voice Receptionist",
      provider: voice?.providerName ?? "Peak Agents",
      setupPath: voiceSetupPath,
      status: voiceStatus.status,
      statusLabel: voiceStatus.statusLabel,
      updatedAt: voice?.updatedAt.toISOString() ?? null,
    },
    {
      accountName: null,
      actionLabel: canUseWebhooks ? "Manage keys" : "Upgrade",
      category: "developer",
      description: "Scoped API access for custom integrations and /api/v1 routes.",
      detailId: null,
      id: "api-keys",
      kind: "developer",
      name: "API keys",
      provider: "api_keys",
      setupPath: canUseWebhooks ? "/dashboard/settings/api-keys" : "/dashboard/billing",
      status: canUseWebhooks ? Number(apiKeyCount) > 0 ? "connected" : "available" : "gated",
      statusLabel: canUseWebhooks
        ? Number(apiKeyCount) > 0
          ? `${apiKeyCount} key${Number(apiKeyCount) === 1 ? "" : "s"}`
          : "Available"
        : `${planDisplayName(minimumPlanForFeature("webhooks"))} required`,
      updatedAt: null,
    },
    {
      accountName: business?.customDomain ?? null,
      actionLabel: canUseCustomDomain ? "Manage domain" : "Upgrade",
      category: "domain",
      description: "Use a verified custom domain for the booking page.",
      detailId: null,
      id: "custom-domain",
      kind: "domain",
      name: "Custom domain",
      provider: "vercel",
      setupPath: canUseCustomDomain ? "/dashboard/settings/integrations" : "/dashboard/billing",
      status: canUseCustomDomain ? business?.customDomainVerified ? "connected" : "action_required" : "gated",
      statusLabel: canUseCustomDomain
        ? business?.customDomainVerified
          ? "Verified"
          : business?.customDomain
            ? "Needs verification"
            : "Not connected"
        : `${planDisplayName(minimumPlanForFeature("publicBookingPageCustomization"))} required`,
      updatedAt: null,
    },
  ] as const;

  const query = options.q?.trim().toLowerCase() ?? "";
  const status = options.status ?? "all";
  const limit = normalizeIntegrationLimit(options.limit);
  const filteredRows = rows.filter((row) => {
    const statusMatch = status === "all" || row.status === status;
    const queryMatch = !query || [
      row.accountName ?? "",
      row.category,
      row.description,
      row.name,
      row.provider,
      row.statusLabel,
    ].some((value) => value.toLowerCase().includes(query));
    return statusMatch && queryMatch;
  });

  return {
    domain: {
      customDomain: business?.customDomain ?? null,
      customDomainConfig: business?.customDomainConfig ?? null,
      customDomainError: business?.customDomainError ?? null,
      customDomainStatus: business?.customDomainStatus ?? "none",
      customDomainVerification: business?.customDomainVerification ?? null,
      customDomainVerificationToken: business?.customDomainVerificationToken ?? null,
      customDomainVerified: Boolean(business?.customDomainVerified),
    },
    filters: {
      limit,
      q: query,
      status,
    },
    rows: filteredRows.slice(0, limit),
    summary: {
      actionRequiredIntegrations: rows.filter((row) => row.status === "action_required").length,
      availableIntegrations: rows.filter((row) => row.status === "available").length,
      connectedIntegrations: rows.filter((row) => row.status === "connected").length,
      envRequiredIntegrations: rows.filter((row) => row.status === "env_required").length,
      gatedIntegrations: rows.filter((row) => row.status === "gated").length,
      totalIntegrations: rows.length,
    },
  };
}

export async function getIntegrationDashboardDetail(businessId: string, integrationId: string) {
  const [social] = await db
    .select({
      accountId: socialConnections.accountId,
      accountName: socialConnections.accountName,
      createdAt: socialConnections.createdAt,
      id: socialConnections.id,
      isActive: socialConnections.isActive,
      meta: socialConnections.meta,
      provider: socialConnections.provider,
      updatedAt: socialConnections.updatedAt,
    })
    .from(socialConnections)
    .where(and(eq(socialConnections.id, integrationId), eq(socialConnections.businessId, businessId)))
    .limit(1);

  if (social) {
    return {
      integration: {
        accountId: social.accountId,
        accountName: social.accountName,
        createdAt: social.createdAt.toISOString(),
        id: social.id,
        isActive: social.isActive,
        kind: "social" as const,
        meta: social.meta,
        provider: social.provider,
        setupPath: "/dashboard/settings/integrations",
        status: social.isActive ? "active" : "inactive",
        statusLabel: social.isActive ? "Active" : "Inactive",
        updatedAt: social.updatedAt.toISOString(),
      },
    };
  }

  const [voice] = await db
    .select({
      activatedAt: voiceIntegrations.activatedAt,
      aiPhoneNumber: voiceIntegrations.aiPhoneNumber,
      bookingRules: voiceIntegrations.bookingRules,
      businessPhone: voiceIntegrations.businessPhone,
      createdAt: voiceIntegrations.createdAt,
      fallbackMessage: voiceIntegrations.fallbackMessage,
      faqNotes: voiceIntegrations.faqNotes,
      handoffPhone: voiceIntegrations.handoffPhone,
      id: voiceIntegrations.id,
      languages: voiceIntegrations.languages,
      lastTestedAt: voiceIntegrations.lastTestedAt,
      openingRules: voiceIntegrations.openingRules,
      providerName: voiceIntegrations.providerName,
      requestedAt: voiceIntegrations.requestedAt,
      serviceRules: voiceIntegrations.serviceRules,
      setupNotes: voiceIntegrations.setupNotes,
      status: voiceIntegrations.status,
      updatedAt: voiceIntegrations.updatedAt,
      welcomeMessage: voiceIntegrations.welcomeMessage,
    })
    .from(voiceIntegrations)
    .where(and(eq(voiceIntegrations.id, integrationId), eq(voiceIntegrations.businessId, businessId)))
    .limit(1);

  if (!voice) return null;

  return {
    integration: {
      activatedAt: voice.activatedAt?.toISOString() ?? null,
      aiPhoneNumber: voice.aiPhoneNumber,
      bookingRules: voice.bookingRules,
      businessPhone: voice.businessPhone,
      createdAt: voice.createdAt.toISOString(),
      fallbackMessage: voice.fallbackMessage,
      faqNotes: voice.faqNotes,
      handoffPhone: voice.handoffPhone,
      id: voice.id,
      kind: "voice" as const,
      languages: voice.languages,
      lastTestedAt: voice.lastTestedAt?.toISOString() ?? null,
      openingRules: voice.openingRules,
      provider: voice.providerName,
      requestedAt: voice.requestedAt?.toISOString() ?? null,
      serviceRules: voice.serviceRules,
      setupNotes: voice.setupNotes,
      setupPath: "/dashboard/settings/voice-receptionist",
      status: voice.status,
      statusLabel: voiceStatusLabel(voice.status),
      updatedAt: voice.updatedAt.toISOString(),
      welcomeMessage: voice.welcomeMessage,
    },
  };
}
