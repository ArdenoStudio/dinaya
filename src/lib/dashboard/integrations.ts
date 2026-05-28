import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { socialConnections, voiceIntegrations } from "@/db/schema";
import { voiceStatusLabel } from "@/lib/voice-receptionist";

export type DashboardIntegrationDetail = Awaited<ReturnType<typeof getIntegrationDashboardDetail>>;

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
