import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  dashboardRouteGroups,
  findDashboardRoute,
  type DashboardNavLabelKey,
  type DashboardRoute,
} from "../../../src/lib/dashboard-route-map";
import { buildDesktopApiPath, desktopApiRequest } from "./desktop-api";
import "./styles.css";

type Business = {
  customDomain: string | null;
  id: string;
  name: string;
  plan: string;
  slug: string;
  timezone: string;
};

type StaffMember = {
  id: string;
  isActive: boolean;
  name: string;
};

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
type PaymentStatus = "pending" | "success" | "failed" | "refunded";
type PaymentStatusFilter = PaymentStatus | "all";
type DealDisplayStatus = "active" | "upcoming" | "expired" | "cancelled" | "sold_out";
type BroadcastStatus = "draft" | "sending" | "sent" | "failed";
type BroadcastChannel = "email" | "whatsapp" | "sms";
type Tab = "today" | "upcoming" | "past";
type View = DashboardNavLabelKey;

type BookingRow = {
  clientEmail: string | null;
  clientName: string;
  clientPhone: string;
  endsAt: string;
  id: string;
  revisionTs: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  startsAt: string;
  status: BookingStatus;
};

type BookingDetail = BookingRow & {
  clientId: string | null;
  clientStage: string | null;
  createdAt: string;
  notes: string | null;
  staffNotes: string | null;
};

type BootstrapPayload = {
  business: Business;
  staff: StaffMember[];
  serverTime: string;
};

type BookingsPayload = {
  limit: number;
  nextCursor: string | null;
  rows: BookingRow[];
  serverTime: string;
  tab: Tab;
};

type CalendarMode = "day" | "week";

type CalendarDay = {
  date: string;
  label: string;
};

type CalendarBooking = BookingRow & {
  locationName: string | null;
};

type CalendarPayload = {
  date: string;
  days: CalendarDay[];
  rangeEnd: string;
  rangeStart: string;
  rows: CalendarBooking[];
  serverTime: string;
  staff: StaffMember[];
  timezone: string;
  view: CalendarMode;
};

type LoginPayload = {
  business: Business;
  user: {
    email: string;
    id: string;
    name: string;
    role: "owner" | "staff";
  };
};

type DashboardMetrics = {
  activeToday: number;
  confirmedToday: number;
  pendingToday: number;
  staffOnDeck: number;
};

type CommandAction =
  | "copy-booking-link"
  | "export-current-csv"
  | "log-out"
  | "open-current-web"
  | "open-web-dashboard"
  | "print-current-view"
  | "refresh";

type CommandPaletteItem = {
  action?: CommandAction;
  group: string;
  id: string;
  keywords: string[];
  route?: DashboardRoute;
  subtitle: string;
  title: string;
};

type DesktopLogLevel = "debug" | "error" | "info" | "warn";

type ModuleMetric = {
  detail?: string;
  label: string;
  tone?: "amber" | "cobalt" | "emerald" | "slate";
  value: string | number;
};

type ModuleItem = {
  id: string;
  meta?: string;
  status?: string;
  subtitle?: string;
  title: string;
};

type DesktopModulePayload = {
  emptyState: string;
  items: ModuleItem[];
  metrics: ModuleMetric[];
  module: string;
  refreshedAt: string;
  summary: string;
  title: string;
  webPath: string;
};

type ClientStage = "lead" | "prospect" | "active" | "churned";
type ClientStageFilter = ClientStage | "all";

type ClientRow = {
  bookingCount: number;
  communicationOptOut: boolean;
  completedBookings: number;
  createdAt: string;
  email: string | null;
  id: string;
  lastAiContactAt: string | null;
  lastBookingAt: string | null;
  loyaltyTier: string | null;
  name: string;
  phone: string;
  source: string | null;
  stage: ClientStage;
  tags: string[] | null;
};

type DesktopClientsPayload = {
  filters: {
    limit: number;
    q: string;
    stage: ClientStageFilter;
  };
  rows: ClientRow[];
  serverTime: string;
  summary: {
    activeClients: number;
    churnedClients: number;
    leads: number;
    optedOutClients: number;
    prospects: number;
    totalClients: number;
    withEmail: number;
  };
  webUrl: string;
};

type ClientDetailPayload = {
  bookings: Array<{
    id: string;
    serviceName: string;
    staffName: string;
    startsAt: string;
    status: BookingStatus;
  }>;
  client: {
    communicationOptOut: boolean;
    createdAt: string;
    email: string | null;
    id: string;
    internalNotes: string | null;
    lastAiContactAt: string | null;
    loyaltyTier: string | null;
    name: string;
    phone: string;
    source: string | null;
    stage: ClientStage;
    tags: string[] | null;
  };
  notes: Array<{
    body: string;
    createdAt: string;
    id: string;
  }>;
  serverTime: string;
  webUrl: string;
};

type ClientEditDraft = {
  communicationOptOut: boolean;
  email: string;
  internalNotes: string;
  name: string;
  phone: string;
  source: string;
  stage: ClientStage;
  tags: string;
};

type ServiceStatusFilter = "active" | "all" | "inactive";

type ServiceRow = {
  afterBuffer: number;
  assignedStaffCount: number;
  beforeBuffer: number;
  bookingCount: number;
  createdAt: string;
  dailyCapacity: number | null;
  depositPercent: number;
  description: string | null;
  durationMinutes: number;
  futureBookingCount: number;
  id: string;
  isActive: boolean;
  lastBookingAt: string | null;
  minimumNoticeHours: number;
  name: string;
  priceLkr: number;
  requiresPayment: boolean;
};

type DesktopServicesPayload = {
  filters: {
    limit: number;
    q: string;
    status: ServiceStatusFilter;
  };
  rows: ServiceRow[];
  serverTime: string;
  summary: {
    activeServices: number;
    averageDurationMinutes: number;
    averagePriceLkr: number;
    inactiveServices: number;
    paymentRequiredServices: number;
    totalServices: number;
  };
  webUrl: string;
};

type ServiceDetailPayload = {
  assignedStaff: Array<{
    id: string;
    isActive: boolean;
    name: string;
    priceOverrideLkr: number | null;
  }>;
  recentBookings: Array<{
    clientName: string;
    id: string;
    staffName: string;
    startsAt: string;
    status: BookingStatus;
  }>;
  serverTime: string;
  service: {
    afterBuffer: number;
    beforeBuffer: number;
    createdAt: string;
    dailyCapacity: number | null;
    depositPercent: number;
    description: string | null;
    durationMinutes: number;
    id: string;
    isActive: boolean;
    minimumNoticeHours: number;
    name: string;
    priceLkr: number;
    requiresPayment: boolean;
  };
  webUrl: string;
};

type ServiceEditDraft = {
  afterBuffer: string;
  beforeBuffer: string;
  dailyCapacity: string;
  depositPercent: string;
  description: string;
  durationMinutes: string;
  isActive: boolean;
  minimumNoticeHours: string;
  name: string;
  priceLkr: string;
  requiresPayment: boolean;
};

type StaffStatusFilter = "active" | "all" | "inactive";

type StaffRow = {
  assignedLocationsCount: number;
  assignedServicesCount: number;
  availabilityWindowCount: number;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  futureBookingCount: number;
  id: string;
  isActive: boolean;
  lastBookingAt: string | null;
  locationIds: string[];
  name: string;
  primaryLocationName: string | null;
  todayBookingCount: number;
};

type DesktopStaffPayload = {
  filters: {
    limit: number;
    q: string;
    status: StaffStatusFilter;
  };
  rows: StaffRow[];
  serverTime: string;
  summary: {
    activeStaff: number;
    inactiveStaff: number;
    totalStaff: number;
    withBio: number;
  };
  webUrl: string;
};

type StaffDetailPayload = {
  assignedLocations: Array<{
    id: string;
    isActive: boolean;
    isPrimary: boolean;
    name: string;
    timezone: string;
  }>;
  assignedServices: Array<{
    durationMinutes: number;
    id: string;
    isActive: boolean;
    name: string;
    priceLkr: number;
    priceOverrideLkr: number | null;
  }>;
  availability: Array<{
    dayOfWeek: number;
    endTime: string;
    id: string;
    startTime: string;
  }>;
  availableLocations: Array<{
    id: string;
    isActive: boolean;
    name: string;
    timezone: string;
  }>;
  availableServices: Array<{
    durationMinutes: number;
    id: string;
    isActive: boolean;
    name: string;
    priceLkr: number;
  }>;
  recentBookings: Array<{
    clientName: string;
    id: string;
    serviceName: string;
    startsAt: string;
    status: BookingStatus;
  }>;
  serverTime: string;
  staff: {
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
    id: string;
    isActive: boolean;
    name: string;
  };
  webUrl: string;
};

type StaffEditDraft = {
  avatarUrl: string;
  bio: string;
  isActive: boolean;
  locationIds: string[];
  name: string;
  serviceIds: string[];
};

type LocationDetailPayload = {
  assignedStaff: Array<{
    id: string;
    isActive: boolean;
    isPrimary: boolean;
    name: string;
  }>;
  location: {
    address: string | null;
    createdAt: string;
    id: string;
    isActive: boolean;
    isDefault: boolean;
    name: string;
    phone: string | null;
    slug: string | null;
    sortOrder: number;
    timezone: string;
  };
  recentBookings: Array<{
    clientName: string;
    id: string;
    serviceName: string;
    staffName: string;
    startsAt: string;
    status: BookingStatus;
  }>;
  serverTime: string;
  webUrl: string;
};

type LocationEditDraft = {
  address: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  phone: string;
  slug: string;
  sortOrder: string;
  timezone: string;
};

type LocationStatusFilter = "active" | "all" | "inactive";

type LocationRow = {
  address: string | null;
  bookingCount: number;
  createdAt: string;
  futureBookingCount: number;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  lastBookingAt: string | null;
  name: string;
  phone: string | null;
  primaryStaffCount: number;
  slug: string | null;
  sortOrder: number;
  staffCount: number;
  timezone: string;
};

type DesktopLocationsPayload = {
  filters: {
    limit: number;
    q: string;
    status: LocationStatusFilter;
  };
  rows: LocationRow[];
  serverTime: string;
  summary: {
    activeLocations: number;
    defaultLocations: number;
    inactiveLocations: number;
    totalLocations: number;
    withAddress: number;
  };
  webUrl: string;
};

type AvailabilityMember = {
  assignedLocations: Array<{
    id: string;
    isActive: boolean;
    isPrimary: boolean;
    name: string;
    timezone: string;
  }>;
  overrides: Array<{
    date: string;
    endTime: string | null;
    id: string;
    isBlocked: boolean;
    reason: string | null;
    startTime: string | null;
  }>;
  staff: {
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
    id: string;
    isActive: boolean;
    name: string;
  };
  windows: Array<{
    dayOfWeek: number;
    endTime: string;
    id: string;
    startTime: string;
  }>;
};

type AvailabilityWindowDraft = {
  dayOfWeek: number;
  endTime: string;
  localId: string;
  startTime: string;
};

type AvailabilityOverrideDraft = {
  date: string;
  endTime: string;
  isBlocked: boolean;
  reason: string;
  startTime: string;
};

type AvailabilityPayload = {
  members: AvailabilityMember[];
  serverTime: string;
  webUrl: string;
};

type PaymentDetailPayload = {
  booking: {
    clientEmail: string | null;
    clientName: string;
    clientPhone: string;
    endsAt: string;
    id: string;
    locationName: string | null;
    serviceName: string;
    staffName: string;
    startsAt: string;
    status: BookingStatus;
  };
  payment: {
    amountLkr: number;
    createdAt: string;
    id: string;
    orderId: string | null;
    receiptSentAt: string | null;
    status: PaymentStatus;
  };
  serverTime: string;
  webUrl: string;
};

type PaymentRow = {
  amountLkr: number;
  bookingId: string;
  bookingStatus: BookingStatus;
  clientName: string;
  clientPhone: string;
  createdAt: string;
  id: string;
  locationName: string | null;
  orderId: string | null;
  receiptSentAt: string | null;
  serviceName: string;
  staffName: string;
  startsAt: string;
  status: PaymentStatus;
  webUrl: string;
};

type DesktopPaymentsPayload = {
  filters: {
    limit: number;
    q: string;
    status: PaymentStatusFilter;
  };
  rows: PaymentRow[];
  serverTime: string;
  summary: {
    failedPayments: number;
    pendingPayments: number;
    refundedPayments: number;
    successfulPayments: number;
    successfulRevenueLkr: number;
    totalPayments: number;
  };
  webUrl: string;
};

type ReviewDetailPayload = {
  booking: {
    id: string | null;
    locationName: string | null;
    serviceName: string | null;
    staffName: string | null;
    startsAt: string | null;
    status: BookingStatus | null;
  } | null;
  review: {
    clientName: string;
    comment: string | null;
    createdAt: string;
    id: string;
    isPublished: boolean;
    ownerRepliedAt: string | null;
    ownerReply: string | null;
    ownerReplySource: string | null;
    rating: number;
  };
  serverTime: string;
  webUrl: string;
};

type ReviewStatusFilter = "all" | "hidden" | "needs_reply" | "published" | "replied";
type ReviewRatingFilter = "all" | "1" | "2" | "3" | "4" | "5";

type ReviewRow = {
  booking: {
    id: string | null;
    locationName: string | null;
    serviceName: string | null;
    staffName: string | null;
    startsAt: string | null;
    status: BookingStatus | null;
  } | null;
  clientName: string;
  comment: string | null;
  createdAt: string;
  id: string;
  isPublished: boolean;
  ownerRepliedAt: string | null;
  ownerReply: string | null;
  ownerReplySource: string | null;
  rating: number;
};

type DesktopReviewsPayload = {
  filters: {
    limit: number;
    q: string;
    rating: number | null;
    status: ReviewStatusFilter;
  };
  rows: ReviewRow[];
  serverTime: string;
  summary: {
    averageRating: number;
    fiveStarReviews: number;
    hiddenReviews: number;
    needsReplyReviews: number;
    publishedReviews: number;
    repliedReviews: number;
    totalReviews: number;
  };
  webUrl: string;
};

type DealDetailPayload = {
  deal: {
    apptWindowEnd: string;
    apptWindowStart: string;
    conversionPercent: number | null;
    createdAt: string;
    dealWindowEnd: string;
    dealWindowStart: string;
    discountPercent: number;
    discountedPriceLkr: number;
    displayStatus: DealDisplayStatus;
    id: string;
    impressionCount: number;
    slotsRedeemed: number;
    slotsRemaining: number;
    slotsTotal: number;
    status: string;
  };
  location: {
    id: string;
    name: string;
    timezone: string;
  };
  recentBookings: Array<{
    amountLkr: number | null;
    clientName: string;
    discountedPriceLkr: number | null;
    id: string;
    paymentStatus: PaymentStatus | null;
    startsAt: string;
    status: BookingStatus;
  }>;
  service: {
    depositPercent: number;
    durationMinutes: number;
    id: string;
    name: string;
    priceLkr: number;
    requiresPayment: boolean;
  };
  staff: {
    id: string;
    name: string | null;
  } | null;
  serverTime: string;
  webUrl: string;
};

type DealStatusFilter = DealDisplayStatus | "all";

type DealRow = {
  apptWindowEnd: string;
  apptWindowStart: string;
  conversionPercent: number | null;
  createdAt: string;
  dealWindowEnd: string;
  dealWindowStart: string;
  discountPercent: number;
  discountedPriceLkr: number;
  displayStatus: DealDisplayStatus;
  id: string;
  impressionCount: number;
  locationId: string;
  locationName: string;
  serviceId: string;
  serviceName: string;
  servicePriceLkr: number;
  slotsRedeemed: number;
  slotsRemaining: number;
  slotsTotal: number;
  staffId: string | null;
  staffName: string | null;
  status: string;
};

type DesktopDealsPayload = {
  filters: {
    limit: number;
    q: string;
    status: DealStatusFilter;
  };
  rows: DealRow[];
  serverTime: string;
  summary: {
    activeDeals: number;
    cancelledDeals: number;
    expiredDeals: number;
    impressions: number;
    redeemedSlots: number;
    soldOutDeals: number;
    totalDeals: number;
    upcomingDeals: number;
  };
  webUrl: string;
};

type BroadcastDetailPayload = {
  audience: {
    cappedRecipientCount: number;
    eligibleRecipientCount: number;
    filter: unknown;
    label: string;
    sampleRecipients: Array<{
      email: string | null;
      id: string;
      name: string;
      phone: string;
      tags: string[] | null;
    }>;
    type: string;
  };
  broadcast: {
    audienceFilter: unknown;
    audienceType: string;
    body: string;
    channel: BroadcastChannel;
    createdAt: string;
    failedCount: number;
    id: string;
    name: string;
    recipientCount: number;
    sentAt: string | null;
    sentCount: number;
    skippedCount: number;
    status: BroadcastStatus;
    subject: string | null;
    updatedAt: string;
  };
  results: {
    deliveryRatePercent: number | null;
    failureRatePercent: number | null;
    remainingCount: number;
  };
  serverTime: string;
  webUrl: string;
};

type BroadcastStatusFilter = BroadcastStatus | "all";
type BroadcastChannelFilter = BroadcastChannel | "all";

type BroadcastRow = {
  audienceFilter: unknown;
  audienceLabel: string;
  audienceType: string;
  body: string;
  channel: BroadcastChannel;
  createdAt: string;
  deliveryRatePercent: number | null;
  failedCount: number;
  failureRatePercent: number | null;
  id: string;
  name: string;
  recipientCount: number;
  remainingCount: number;
  sentAt: string | null;
  sentCount: number;
  skippedCount: number;
  status: BroadcastStatus;
  subject: string | null;
  updatedAt: string;
};

type DesktopBroadcastsPayload = {
  filters: {
    channel: BroadcastChannelFilter;
    limit: number;
    q: string;
    status: BroadcastStatusFilter;
  };
  rows: BroadcastRow[];
  serverTime: string;
  summary: {
    draftBroadcasts: number;
    emailBroadcasts: number;
    failedBroadcasts: number;
    failedMessages: number;
    sentBroadcasts: number;
    sentMessages: number;
    sendingBroadcasts: number;
    skippedMessages: number;
    smsBroadcasts: number;
    totalBroadcasts: number;
    totalRecipients: number;
    whatsappBroadcasts: number;
  };
  webUrl: string;
};

type MarketingShareContext = {
  business: {
    customDomain?: string | null;
    customDomainVerified?: boolean | null;
    id: string;
    name: string;
    slug: string;
  };
  directory: {
    category: string | null;
    city: string | null;
    district: string | null;
    listed: boolean;
  };
  referral: {
    bookings: number;
    code: string;
  };
  share: {
    bookingUrl: string;
    embedSnippet: string;
    instagramSnippet: string;
    qrPng: string;
    qrSvg: string;
    reviewsEmbedSnippet: string;
    reviewsEmbedUrl: string;
    whatsappSnippet: string;
  };
  socialConnections: Array<{
    accountName: string | null;
    id: string;
    isActive: boolean;
    provider: string;
  }>;
};

type MarketingDetailPayload = MarketingShareContext & {
  serverTime: string;
  webUrl: string;
} & (
  | {
      kind: "share_tool";
      tool: {
        description: string;
        id: string;
        title: string;
      };
    }
  | {
      kind: "content";
      content: {
        approvedAt: string | null;
        caption: string;
        channel: string;
        contentDate: string;
        createdAt: string;
        error: string | null;
        id: string;
        meta: unknown;
        provider: string | null;
        providerMessageId: string | null;
        publishedAt: string | null;
        status: string;
        title: string;
        updatedAt: string;
      };
      location: {
        id: string;
        name: string;
        timezone: string;
      };
      workflow: {
        canApprove: boolean;
        canPublish: boolean;
      };
    }
);

type MarketingStatusFilter = "all" | "approved" | "draft" | "failed" | "published" | "tools";

type MarketingRow = {
  channel: string;
  contentDate: string | null;
  id: string;
  kind: "content" | "share_tool";
  locationName: string | null;
  status: string;
  statusLabel: string;
  subtitle: string;
  title: string;
  updatedAt: string | null;
};

type DesktopMarketingPayload = MarketingShareContext & {
  filters: {
    limit: number;
    q: string;
    status: MarketingStatusFilter;
  };
  rows: MarketingRow[];
  serverTime: string;
  summary: {
    approvedContent: number;
    draftContent: number;
    failedContent: number;
    publishedContent: number;
    socialConnections: number;
    tools: number;
    totalContent: number;
  };
  webUrl: string;
};

type AiWorkflowRunDetailPayload = {
  location: {
    id: string;
    name: string | null;
  } | null;
  run: {
    body: string | null;
    channel: string | null;
    createdAt: string;
    entityId: string | null;
    entityType: string | null;
    error: string | null;
    executedAt: string | null;
    feature: string;
    id: string;
    idempotencyKey: string;
    meta: unknown;
    provider: string | null;
    scheduledFor: string | null;
    status: string;
    subject: string | null;
    workflowKey: string;
  };
  serverTime: string;
  webUrl: string;
};

type AiWorkflowRunStatusFilter = "all" | "completed" | "duplicate" | "failed" | "queued" | "sent" | "skipped";
type AiFeatureKey =
  | "aiBookingAutopilot"
  | "aiContentMachine"
  | "aiDealSuggestions"
  | "aiUpsellAssistant"
  | "clientReactivationCampaign"
  | "reviewEngine"
  | "smartReminderSystem"
  | "vipLoyaltySequence";

type AiFeatureMeta = {
  description: string;
  key: AiFeatureKey;
  label: string;
};

type AiHubLocation = {
  address: string | null;
  aiConfig: Record<AiFeatureKey, boolean>;
  id: string;
  isDefault: boolean;
  name: string;
};

type AiHubContentItem = {
  approvedAt?: string | null;
  caption: string;
  channel: string;
  contentDate: string;
  createdAt: string;
  error: string | null;
  id: string;
  locationId: string;
  provider?: string | null;
  publishedAt?: string | null;
  status: string;
  title: string;
  updatedAt: string;
};

type AiReactivationResult = {
  previews: Array<{
    body?: string;
    clientName: string;
    error?: string;
    status: string;
    subject?: string;
  }>;
  stats: {
    checked: number;
    duplicate?: number;
    failed: number;
    sent: number;
    skipped: number;
  };
};

type AiWorkflowRunRow = {
  body: string | null;
  channel: string | null;
  createdAt: string;
  entityId: string | null;
  entityType: string | null;
  error: string | null;
  executedAt: string | null;
  feature: string;
  id: string;
  locationId: string | null;
  locationName: string | null;
  provider: string | null;
  scheduledFor: string | null;
  status: string;
  subject: string | null;
  workflowKey: string;
};

type DesktopAiWorkflowRunsPayload = {
  content: AiHubContentItem[];
  features: AiFeatureMeta[];
  filters: {
    limit: number;
    q: string;
    status: AiWorkflowRunStatusFilter;
  };
  locations: AiHubLocation[];
  rows: AiWorkflowRunRow[];
  serverTime: string;
  summary: {
    completedRuns: number;
    duplicateRuns: number;
    failedRuns: number;
    queuedRuns: number;
    sentRuns: number;
    skippedRuns: number;
    totalRuns: number;
    workflows: number;
  };
  webUrl: string;
};

type AutomationDetailPayload = {
  recentRuns: Array<{
    createdAt: string;
    entityId: string;
    error: string | null;
    id: string;
    status: string;
    triggerVersion: string;
  }>;
  rule: {
    actions: unknown;
    conditions: unknown;
    createdAt: string;
    delayMinutes: number;
    id: string;
    isActive: boolean;
    name: string;
    trigger: string;
    updatedAt: string;
  };
  summary: {
    failed: number;
    pending: number;
    sent: number;
    skipped: number;
    total: number;
  };
  serverTime: string;
  webUrl: string;
};

type AutomationStatusFilter = "active" | "all" | "paused";

type AutomationRunSummary = {
  failed: number;
  pending: number;
  sent: number;
  skipped: number;
  total: number;
};

type AutomationRow = {
  actions: unknown;
  conditions: unknown;
  createdAt: string;
  delayMinutes: number;
  id: string;
  isActive: boolean;
  name: string;
  runSummary: AutomationRunSummary;
  trigger: string;
  updatedAt: string;
};

type DesktopAutomationsPayload = {
  filters: {
    limit: number;
    q: string;
    status: AutomationStatusFilter;
  };
  rows: AutomationRow[];
  serverTime: string;
  summary: {
    activeRules: number;
    delayedRules: number;
    failedRuns: number;
    instantRules: number;
    pausedRules: number;
    pendingRuns: number;
    sentRuns: number;
    skippedRuns: number;
    totalRules: number;
    totalRuns: number;
  };
  webUrl: string;
};

type IntegrationDetailPayload = {
  integration:
    | {
        accountId: string | null;
        accountName: string | null;
        createdAt: string;
        id: string;
        isActive: boolean;
        kind: "social";
        meta: unknown;
        provider: string;
        setupPath: string;
        status: string;
        statusLabel: string;
        updatedAt: string;
      }
    | {
        activatedAt: string | null;
        aiPhoneNumber: string | null;
        bookingRules: string | null;
        businessPhone: string | null;
        createdAt: string;
        fallbackMessage: string | null;
        faqNotes: string | null;
        handoffPhone: string | null;
        id: string;
        kind: "voice";
        languages: string[];
        lastTestedAt: string | null;
        openingRules: string | null;
        provider: string;
        requestedAt: string | null;
        serviceRules: string | null;
        setupNotes: string | null;
        setupPath: string;
        status: string;
        statusLabel: string;
        updatedAt: string;
        welcomeMessage: string | null;
      };
  serverTime: string;
  webUrl: string;
};

type IntegrationStatusFilter = "action_required" | "all" | "available" | "connected" | "env_required" | "gated";

type IntegrationRow = {
  accountName: string | null;
  actionLabel: string;
  category: string;
  description: string;
  detailId: string | null;
  id: string;
  kind: string;
  name: string;
  provider: string;
  setupPath: string;
  status: Exclude<IntegrationStatusFilter, "all">;
  statusLabel: string;
  updatedAt: string | null;
};

type DesktopIntegrationsPayload = {
  domain: {
    customDomain: string | null;
    customDomainError: string | null;
    customDomainStatus: string;
    customDomainVerified: boolean;
  };
  filters: {
    limit: number;
    q: string;
    status: IntegrationStatusFilter;
  };
  rows: IntegrationRow[];
  serverTime: string;
  summary: {
    actionRequiredIntegrations: number;
    availableIntegrations: number;
    connectedIntegrations: number;
    envRequiredIntegrations: number;
    gatedIntegrations: number;
    totalIntegrations: number;
  };
  webUrl: string;
};

type DesktopSettingsPayload = {
  business: Business & {
    address: string | null;
    bankTransferInstructions?: string | null;
    businessType?: string | null;
    cancellationPolicy?: string | null;
    customDomainVerified?: boolean | null;
    depositPolicy?: string | null;
    description?: string | null;
    directoryListed: boolean;
    email: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    language?: "en" | "si" | "ta";
    payhereEnabled: boolean;
    phone: string | null;
    websiteUrl?: string | null;
  };
  currentKeyId: string;
  devices: Array<{
    createdAt: string;
    deviceId: string | null;
    deviceName: string | null;
    expiresAt: string | null;
    id: string;
    isCurrent: boolean;
    lastUsedAt: string | null;
    name: string;
    revokedAt: string | null;
    scopes: string[];
  }>;
  serverTime: string;
  summary: {
    activeDevices: number;
    currentDeviceRevoked: boolean;
    revokedDevices: number;
    totalDevices: number;
  };
  webUrl: string;
};

type SettingsEditDraft = {
  address: string;
  bankTransferInstructions: string;
  businessType: string;
  cancellationPolicy: string;
  depositPolicy: string;
  description: string;
  directoryListed: boolean;
  facebookUrl: string;
  instagramUrl: string;
  language: "en" | "si" | "ta";
  name: string;
  phone: string;
  timezone: string;
  websiteUrl: string;
};

type BillingSubscription = {
  amountLkr: number;
  billingInterval: "monthly" | "annual";
  cancelledAt: string | null;
  createdAt: string;
  currentPeriodEnd: string | null;
  id: string;
  payhereOrderId: string;
  payhereSubscriptionId: string | null;
  plan: "trial" | "starter" | "pro" | "max" | "expired";
  status: "pending" | "active" | "past_due" | "cancelled" | "ended";
};

type DesktopPlan = "trial" | "starter" | "pro" | "max" | "expired";
type DesktopPaidPlan = "starter" | "pro" | "max";

type DesktopBillingPayload = {
  actions: {
    billingPath: string;
    contactPath: string;
    managePath: string;
    upgradeMaxPath: string;
    upgradeProPath: string;
    upgradeStarterPath: string;
  };
  business: {
    effectivePlan: DesktopPlan;
    id: string;
    name: string;
    planExpiresAt: string | null;
    planLabel: string;
    slug: string | null;
    storedPlan: DesktopPlan;
  };
  currentSubscription: BillingSubscription | null;
  features: Record<string, boolean>;
  pricing: Record<DesktopPaidPlan, {
    annualLkr: number;
    annualSavingsPercent: number;
    available: boolean;
    monthlyLkr: number;
  }>;
  serverTime: string;
  subscriptions: BillingSubscription[];
  usage: Array<{
    key: string;
    label: string;
    limit: number | null;
    percent: number | null;
    remaining: number | null;
    used: number;
  }>;
  webUrl: string;
};

type ReportBreakdownItem = {
  label: string;
  value: number;
};

type DesktopReportsPayload = {
  breakdowns: {
    bookingsBySource: ReportBreakdownItem[];
    bookingsByStatus: ReportBreakdownItem[];
    revenueByDay: ReportBreakdownItem[];
    revenueByService: ReportBreakdownItem[];
    staffLoad: ReportBreakdownItem[];
    topClients: ReportBreakdownItem[];
  };
  business: {
    id: string;
    name: string;
    timezone: string;
  };
  export: {
    csv: string;
    filename: string;
    generatedAt: string;
  };
  metrics: {
    averageRating: number;
    cancellationRate: number;
    cancelledBookings: number;
    completedBookings: number;
    newClients: number;
    noShowRate: number;
    noShows: number;
    totalBookings: number;
    totalRevenueLabel: string;
    totalRevenueLkr: number;
  };
  range: {
    from: string;
    to: string;
  };
  serverTime: string;
  webUrl: string;
};

const statusLabels: Record<BookingStatus, string> = {
  cancelled: "Cancelled",
  completed: "Completed",
  confirmed: "Confirmed",
  no_show: "No-show",
  pending: "Pending",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  failed: "Failed",
  pending: "Pending",
  refunded: "Refunded",
  success: "Success",
};

const dealStatusLabels: Record<DealDisplayStatus, string> = {
  active: "Active",
  cancelled: "Cancelled",
  expired: "Expired",
  sold_out: "Sold out",
  upcoming: "Upcoming",
};

const broadcastStatusLabels: Record<BroadcastStatus, string> = {
  draft: "Draft",
  failed: "Failed",
  sending: "Sending",
  sent: "Sent",
};

const broadcastChannelLabels: Record<BroadcastChannel, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const aiWorkflowStatusLabels: Record<string, string> = {
  completed: "Completed",
  duplicate: "Duplicate",
  failed: "Failed",
  queued: "Queued",
  sent: "Sent",
  skipped: "Skipped",
};

const automationRunStatusLabels: Record<string, string> = {
  failed: "Failed",
  pending: "Pending",
  sent: "Sent",
  skipped: "Skipped",
};

const integrationStatusClass: Record<string, string> = {
  active: "integration-active",
  configuring: "integration-pending",
  inactive: "integration-inactive",
  live: "integration-active",
  not_requested: "integration-inactive",
  paused: "integration-inactive",
  requested: "integration-pending",
  testing: "integration-pending",
};

const integrationListStatusClass: Record<Exclude<IntegrationStatusFilter, "all">, string> = {
  action_required: "integration-pending",
  available: "integration-pending",
  connected: "integration-active",
  env_required: "integration-pending",
  gated: "integration-inactive",
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const knownBookingStorageKey = "dinaya.desktop.knownBookings";
const reminderStorageKey = "dinaya.desktop.remindedBookings";
const offlineCachePrefix = "dinaya.desktop.offline.v1";

type OfflineCacheEntry<T> = {
  cachedAt: string;
  payload: T;
};

function offlineCacheKey(...parts: Array<boolean | number | string | null | undefined>): string {
  return [
    offlineCachePrefix,
    ...parts.map((part) => String(part ?? "all").replace(/[^a-zA-Z0-9_.-]/g, "_")),
  ].join(":");
}

function truncateLogValue(value: string, maxLength = 1600): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function errorStack(error: unknown): string | null {
  return error instanceof Error && error.stack ? truncateLogValue(error.stack, 4000) : null;
}

function logDesktopRuntimeEvent(
  level: DesktopLogLevel,
  category: string,
  message: string,
  meta: Record<string, unknown> = {},
) {
  const payload = {
    category,
    level,
    message: truncateLogValue(message),
    meta,
  };

  void invoke("desktop_log_event", { payload }).catch((logError) => {
    console.warn("[dinaya-desktop] desktop_log_event failed", logError);
  });
}

function logFrontendError(category: string, error: unknown, meta: Record<string, unknown> = {}) {
  logDesktopRuntimeEvent("error", category, errorMessage(error), {
    ...meta,
    stack: errorStack(error),
    userAgent: window.navigator.userAgent,
  });
}

function installFrontendErrorLogging() {
  window.addEventListener("error", (event) => {
    logFrontendError("frontend.window_error", event.error ?? event.message, {
      column: event.colno,
      line: event.lineno,
      source: event.filename,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logFrontendError("frontend.unhandled_rejection", event.reason);
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeCsvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text.trim())) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function csvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(",");
}

function safeFilenameSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "dinaya";
}

function bookingExportFilename(business: Business | null, scope: string, extension: "csv" | "html" = "csv"): string {
  const owner = business?.slug || business?.name || "dinaya";
  return `${safeFilenameSegment(owner)}-${safeFilenameSegment(scope)}-${dateInputValue()}.${extension}`;
}

function bookingRowsCsv(rows: BookingRow[]): string {
  return [
    csvRow(["Date", "Start", "End", "Client", "Phone", "Email", "Service", "Staff", "Status", "Booking ID"]),
    ...rows.map((row) => csvRow([
      formatDate(row.startsAt),
      formatTime(row.startsAt),
      formatTime(row.endsAt),
      row.clientName,
      row.clientPhone,
      row.clientEmail,
      row.serviceName,
      row.staffName,
      statusLabels[row.status],
      row.id,
    ])),
  ].join("\r\n");
}

function nextBookingForRows(rows: BookingRow[], clock = new Date()): BookingRow | null {
  const clockTime = clock.getTime();
  return rows.find((row) => new Date(row.startsAt).getTime() >= clockTime) ?? rows[0] ?? null;
}

function daySheetCsv({
  business,
  clock,
  lastSync,
  metrics,
  nextBooking,
  rows,
  staff,
}: {
  business: Business | null;
  clock: Date;
  lastSync: string | null;
  metrics: DashboardMetrics;
  nextBooking: BookingRow | null;
  rows: BookingRow[];
  staff: StaffMember[];
}): string {
  return [
    csvRow(["Dinaya Living Day Sheet"]),
    csvRow(["Business", business?.name ?? "Dinaya"]),
    csvRow(["Generated", formatDateTime(clock.toISOString())]),
    csvRow(["Last sync", lastSync ? formatDateTime(lastSync) : "Not synced"]),
    csvRow(["Next booking", nextBooking ? `${formatTime(nextBooking.startsAt)} - ${nextBooking.clientName} - ${nextBooking.serviceName}` : "No active booking"]),
    csvRow(["Pending", metrics.pendingToday]),
    csvRow(["Confirmed", metrics.confirmedToday]),
    csvRow(["Staff on deck", `${metrics.staffOnDeck}/${staff.length || 0}`]),
    "",
    csvRow(["Bookings"]),
    bookingRowsCsv(rows),
  ].join("\r\n");
}

function printableBookingsTable(rows: BookingRow[]): string {
  if (!rows.length) {
    return "<p class=\"empty\">No bookings in this view.</p>";
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Client</th>
          <th>Service</th>
          <th>Staff</th>
          <th>Status</th>
          <th>Contact</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${escapeHtml(formatTime(row.startsAt))} - ${escapeHtml(formatTime(row.endsAt))}</td>
            <td>${escapeHtml(row.clientName)}</td>
            <td>${escapeHtml(row.serviceName)}</td>
            <td>${escapeHtml(row.staffName)}</td>
            <td>${escapeHtml(statusLabels[row.status])}</td>
            <td>${escapeHtml(row.clientPhone || row.clientEmail || "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function printableDocument(title: string, body: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 18mm; }
    * { box-sizing: border-box; }
    body { color: #172033; font-family: Inter, Segoe UI, Arial, sans-serif; margin: 0; }
    header { border-bottom: 2px solid #1f64e0; margin-bottom: 18px; padding-bottom: 12px; }
    h1 { font-size: 24px; margin: 0 0 6px; }
    h2 { font-size: 16px; margin: 24px 0 10px; }
    p { color: #526071; margin: 0 0 8px; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
    .summary div { border: 1px solid #d7e0ec; border-radius: 8px; padding: 10px; }
    .summary span { color: #526071; display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .summary strong { display: block; font-size: 18px; margin-top: 4px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid #d7e0ec; font-size: 12px; padding: 8px 6px; text-align: left; vertical-align: top; }
    th { color: #526071; font-size: 11px; text-transform: uppercase; }
    .empty { border: 1px dashed #c8d2df; border-radius: 8px; padding: 18px; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

function printHtmlDocument(title: string, body: string) {
  const html = printableDocument(title, body);
  const printWindow = window.open("", "_blank", "width=980,height=720");
  if (!printWindow) {
    downloadTextFile(`${safeFilenameSegment(title)}.html`, html, "text/html;charset=utf-8");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 250);
}

function printBookingsDocument(title: string, rows: BookingRow[], subtitle: string) {
  printHtmlDocument(title, `
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
    </header>
    ${printableBookingsTable(rows)}
  `);
}

function printDaySheetDocument({
  business,
  clock,
  lastSync,
  metrics,
  nextBooking,
  rows,
  staff,
}: {
  business: Business | null;
  clock: Date;
  lastSync: string | null;
  metrics: DashboardMetrics;
  nextBooking: BookingRow | null;
  rows: BookingRow[];
  staff: StaffMember[];
}) {
  printHtmlDocument("Dinaya Living Day Sheet", `
    <header>
      <h1>${escapeHtml(business?.name ?? "Dinaya")} - Living Day Sheet</h1>
      <p>${escapeHtml(formatDate(clock.toISOString()))} - Generated ${escapeHtml(formatDateTime(clock.toISOString()))}</p>
      <p>${lastSync ? `Synced ${escapeHtml(formatDateTime(lastSync))}` : "Waiting for first sync"}</p>
    </header>
    <section>
      <h2>Day focus</h2>
      <p>${nextBooking
        ? `${escapeHtml(formatTime(nextBooking.startsAt))} - ${escapeHtml(nextBooking.clientName)} - ${escapeHtml(nextBooking.serviceName)}`
        : "No active booking"}</p>
      <div class="summary">
        <div><span>Pending</span><strong>${metrics.pendingToday}</strong></div>
        <div><span>Confirmed</span><strong>${metrics.confirmedToday}</strong></div>
        <div><span>Staff</span><strong>${metrics.staffOnDeck}/${staff.length || 0}</strong></div>
        <div><span>Bookings</span><strong>${rows.length}</strong></div>
      </div>
    </section>
    <section>
      <h2>Bookings</h2>
      ${printableBookingsTable(rows)}
    </section>
  `);
}

function readOfflineCache<T>(key: string): OfflineCacheEntry<T> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfflineCacheEntry<T>>;
    if (!parsed.cachedAt || !parsed.payload) return null;
    return parsed as OfflineCacheEntry<T>;
  } catch {
    return null;
  }
}

function writeOfflineCache<T>(key: string, payload: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify({
      cachedAt: new Date().toISOString(),
      payload,
    }));
  } catch {
    // Offline cache is best-effort and must never block live dashboard reads.
  }
}

function clearOfflineReadCache() {
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(offlineCachePrefix)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage cleanup failures; logout still clears secure desktop auth.
  }
}

function isAuthFailureMessage(message: string): boolean {
  const lowered = message.toLowerCase();
  return lowered.includes("unauthorized") || lowered.includes("desktop key not configured");
}

// The Rust desktop bridge surfaces upstream HTTP failures as "<message> (HTTP <code>)".
// A 402 means the workspace is gated behind a higher Dinaya plan, so we render an
// upgrade prompt instead of a red error banner.
function isPlanGateMessage(message: string): boolean {
  return /\(HTTP 402\)/.test(message);
}

function planGateMessage(message: string): string {
  return (
    message.replace(/\s*\(HTTP \d{3}\)\s*$/, "").trim() ||
    "This workspace is on a higher plan."
  );
}

function commandMatches(item: CommandPaletteItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const haystack = [
    item.group,
    item.title,
    item.subtitle,
    ...item.keywords,
  ].join(" ").toLowerCase();
  return normalized.split(/\s+/).every((part) => haystack.includes(part));
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatClock(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { day: "numeric", month: "short", weekday: "short" });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

function formatMoneyLkr(value: number | null | undefined): string {
  return `LKR ${Number(value ?? 0).toLocaleString("en-LK")}`;
}

function clientDraftFromDetail(detail: ClientDetailPayload): ClientEditDraft {
  return {
    communicationOptOut: detail.client.communicationOptOut,
    email: detail.client.email ?? "",
    internalNotes: detail.client.internalNotes ?? "",
    name: detail.client.name,
    phone: detail.client.phone,
    source: detail.client.source ?? "",
    stage: detail.client.stage,
    tags: detail.client.tags?.join(", ") ?? "",
  };
}

function clientDraftToPayload(draft: ClientEditDraft) {
  return {
    communicationOptOut: draft.communicationOptOut,
    email: draft.email.trim() || null,
    internalNotes: draft.internalNotes.trim() || null,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    source: draft.source.trim() || null,
    stage: draft.stage,
    tags: draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

function serviceDraftFromDetail(detail: ServiceDetailPayload): ServiceEditDraft {
  return {
    afterBuffer: String(detail.service.afterBuffer),
    beforeBuffer: String(detail.service.beforeBuffer),
    dailyCapacity: detail.service.dailyCapacity === null ? "" : String(detail.service.dailyCapacity),
    depositPercent: String(detail.service.depositPercent),
    description: detail.service.description ?? "",
    durationMinutes: String(detail.service.durationMinutes),
    isActive: detail.service.isActive,
    minimumNoticeHours: String(detail.service.minimumNoticeHours),
    name: detail.service.name,
    priceLkr: String(detail.service.priceLkr),
    requiresPayment: detail.service.requiresPayment,
  };
}

function numberDraft(value: string): number {
  return Number(value.trim() || "0");
}

function serviceDraftToPayload(draft: ServiceEditDraft, forceDeactivate: boolean) {
  return {
    afterBuffer: numberDraft(draft.afterBuffer),
    beforeBuffer: numberDraft(draft.beforeBuffer),
    dailyCapacity: draft.dailyCapacity.trim() ? numberDraft(draft.dailyCapacity) : null,
    depositPercent: numberDraft(draft.depositPercent),
    description: draft.description.trim() || null,
    durationMinutes: numberDraft(draft.durationMinutes),
    forceDeactivate,
    isActive: draft.isActive,
    minimumNoticeHours: numberDraft(draft.minimumNoticeHours),
    name: draft.name.trim(),
    priceLkr: numberDraft(draft.priceLkr),
    requiresPayment: draft.requiresPayment,
  };
}

function staffDraftFromDetail(detail: StaffDetailPayload): StaffEditDraft {
  return {
    avatarUrl: detail.staff.avatarUrl ?? "",
    bio: detail.staff.bio ?? "",
    isActive: detail.staff.isActive,
    locationIds: detail.assignedLocations.map((location) => location.id),
    name: detail.staff.name,
    serviceIds: detail.assignedServices.map((service) => service.id),
  };
}

function locationDraftFromDetail(detail: LocationDetailPayload): LocationEditDraft {
  return {
    address: detail.location.address ?? "",
    isActive: detail.location.isActive,
    isDefault: detail.location.isDefault,
    name: detail.location.name,
    phone: detail.location.phone ?? "",
    slug: detail.location.slug ?? "",
    sortOrder: String(detail.location.sortOrder),
    timezone: detail.location.timezone,
  };
}

function locationDraftToPayload(draft: LocationEditDraft) {
  return {
    address: draft.address.trim() || null,
    isActive: draft.isActive,
    isDefault: draft.isDefault,
    name: draft.name.trim(),
    phone: draft.phone.trim() || null,
    slug: draft.slug.trim() || null,
    sortOrder: Number(draft.sortOrder.trim() || "0"),
    timezone: draft.timezone.trim(),
  };
}

function availabilityDraftFromMember(member: AvailabilityMember | null): AvailabilityWindowDraft[] {
  return (member?.windows ?? []).map((window) => ({
    dayOfWeek: window.dayOfWeek,
    endTime: formatClock(window.endTime),
    localId: window.id,
    startTime: formatClock(window.startTime),
  }));
}

function transitionsFor(status: BookingStatus): BookingStatus[] {
  if (status === "pending") return ["confirmed", "cancelled"];
  if (status === "confirmed") return ["completed", "no_show", "cancelled"];
  return [];
}

function readStoredSet(key: string): Set<string> {
  try {
    return new Set(JSON.parse(window.sessionStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}

function writeStoredSet(key: string, values: Set<string>) {
  const trimmed = Array.from(values).slice(-250);
  window.sessionStorage.setItem(key, JSON.stringify(trimmed));
}

function isActiveDailyStatus(status: BookingStatus): boolean {
  return status === "pending" || status === "confirmed";
}

function routeStateLabel(route: DashboardRoute): string {
  if (route.nativeStatus === "native") return "Native";
  if (route.nativeStatus === "foundation") return "Base";
  return `P${route.desktopPhase}`;
}

function publicBookingUrl(business: Business | null): string {
  if (!business) return "https://dinaya.lk";
  if (business.customDomain) return `https://${business.customDomain}`;
  return `https://${business.slug}.dinaya.lk`;
}

function dateInputValue(value = new Date()): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(value: string, days: number): string {
  const current = new Date(`${value}T12:00:00`);
  current.setDate(current.getDate() + days);
  return dateInputValue(current);
}

function defaultAvailabilityOverrideDraft(): AvailabilityOverrideDraft {
  return {
    date: dateInputValue(),
    endTime: "17:00",
    isBlocked: true,
    reason: "",
    startTime: "09:00",
  };
}

function settingsDraftFromData(data: DesktopSettingsPayload | null, business: Business | null): SettingsEditDraft {
  const source = data?.business;
  return {
    address: source?.address ?? "",
    bankTransferInstructions: source?.bankTransferInstructions ?? "",
    businessType: source?.businessType ?? "",
    cancellationPolicy: source?.cancellationPolicy ?? "",
    depositPolicy: source?.depositPolicy ?? "",
    description: source?.description ?? "",
    directoryListed: Boolean(source?.directoryListed),
    facebookUrl: source?.facebookUrl ?? "",
    instagramUrl: source?.instagramUrl ?? "",
    language: source?.language ?? "en",
    name: source?.name ?? business?.name ?? "",
    phone: source?.phone ?? "",
    timezone: source?.timezone ?? business?.timezone ?? "Asia/Colombo",
    websiteUrl: source?.websiteUrl ?? "",
  };
}

function settingsDraftToPayload(draft: SettingsEditDraft) {
  return {
    address: draft.address.trim() || null,
    bankTransferInstructions: draft.bankTransferInstructions.trim() || null,
    businessType: draft.businessType.trim() || null,
    cancellationPolicy: draft.cancellationPolicy.trim() || null,
    depositPolicy: draft.depositPolicy.trim() || null,
    description: draft.description.trim() || null,
    directoryListed: draft.directoryListed,
    facebookUrl: draft.facebookUrl.trim() || null,
    instagramUrl: draft.instagramUrl.trim() || null,
    language: draft.language,
    name: draft.name.trim(),
    phone: draft.phone.trim() || null,
    timezone: draft.timezone.trim() || "Asia/Colombo",
    websiteUrl: draft.websiteUrl.trim() || null,
  };
}

const calendarStartHour = 6;
const calendarEndHour = 22;
const calendarVisibleMinutes = (calendarEndHour - calendarStartHour) * 60;

function minutesOfDay(value: string): number {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return calendarStartHour * 60;
  return date.getHours() * 60 + date.getMinutes();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dayKey(value: string): string {
  return dateInputValue(new Date(value));
}

function calendarBlockStyle(row: CalendarBooking): React.CSSProperties {
  const start = minutesOfDay(row.startsAt);
  const end = Math.max(start + 30, minutesOfDay(row.endsAt));
  const top = clamp(start - calendarStartHour * 60, 0, calendarVisibleMinutes);
  const height = clamp(end - start, 28, calendarVisibleMinutes);
  return {
    top: `${(top / calendarVisibleMinutes) * 100}%`,
    minHeight: 34,
    height: `${(height / calendarVisibleMinutes) * 100}%`,
  };
}

function currentTimeTop(): string {
  const now = new Date();
  const top = clamp(minutesOfDay(now.toISOString()) - calendarStartHour * 60, 0, calendarVisibleMinutes);
  return `${(top / calendarVisibleMinutes) * 100}%`;
}

class DesktopErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null; errorId: string | null }
> {
  state: { error: Error | null; errorId: string | null } = {
    error: null,
    errorId: null,
  };

  static getDerivedStateFromError(error: Error) {
    return {
      error,
      errorId: `DNY-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logFrontendError("frontend.react_boundary", error, {
      componentStack: truncateLogValue(info.componentStack ?? "", 4000),
      errorId: this.state.errorId,
    });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="fatal-error-shell">
        <section className="fatal-error-panel glass-surface">
          <p className="eyebrow">Desktop recovery</p>
          <h1>Dinaya needs to reload this screen</h1>
          <p>
            The desktop UI hit an unexpected error. The local app logged the failure, and your
            secure desktop key remains in OS storage.
          </p>
          <dl>
            <dt>Error ID</dt>
            <dd>{this.state.errorId}</dd>
            <dt>Message</dt>
            <dd>{this.state.error.message || this.state.error.name}</dd>
          </dl>
          <div className="actions">
            <button className="primary" type="button" onClick={() => window.location.reload()}>
              Reload desktop
            </button>
            <button type="button" onClick={() => void invoke("desktop_open_dashboard")}>
              Open web dashboard
            </button>
          </div>
        </section>
      </main>
    );
  }
}

function App() {
  const [booting, setBooting] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [view, setView] = useState<View>("overview");
  const [tab, setTab] = useState<Tab>("today");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("day");
  const [calendarDate, setCalendarDate] = useState(() => dateInputValue());
  const [calendarStaffFilter, setCalendarStaffFilter] = useState("");
  const [calendarData, setCalendarData] = useState<CalendarPayload | null>(null);
  const [calendarError, setCalendarError] = useState("");
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [moduleData, setModuleData] = useState<Partial<Record<View, DesktopModulePayload>>>({});
  const [moduleError, setModuleError] = useState("");
  const [moduleLoading, setModuleLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientsData, setClientsData] = useState<DesktopClientsPayload | null>(null);
  const [clientsError, setClientsError] = useState("");
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsQuery, setClientsQuery] = useState("");
  const [clientsStageFilter, setClientsStageFilter] = useState<ClientStageFilter>("all");
  const [clientDetail, setClientDetail] = useState<ClientDetailPayload | null>(null);
  const [clientDetailError, setClientDetailError] = useState("");
  const [clientDetailLoading, setClientDetailLoading] = useState(false);
  const [clientEditDraft, setClientEditDraft] = useState<ClientEditDraft | null>(null);
  const [clientDetailSaving, setClientDetailSaving] = useState(false);
  const [clientNoteDraft, setClientNoteDraft] = useState("");
  const [clientNoteSaving, setClientNoteSaving] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [servicesData, setServicesData] = useState<DesktopServicesPayload | null>(null);
  const [servicesError, setServicesError] = useState("");
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesQuery, setServicesQuery] = useState("");
  const [servicesStatusFilter, setServicesStatusFilter] = useState<ServiceStatusFilter>("all");
  const [serviceDetail, setServiceDetail] = useState<ServiceDetailPayload | null>(null);
  const [serviceEditDraft, setServiceEditDraft] = useState<ServiceEditDraft | null>(null);
  const [serviceDetailError, setServiceDetailError] = useState("");
  const [serviceDetailLoading, setServiceDetailLoading] = useState(false);
  const [serviceDetailSaving, setServiceDetailSaving] = useState(false);
  const [serviceForceDeactivate, setServiceForceDeactivate] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffData, setStaffData] = useState<DesktopStaffPayload | null>(null);
  const [staffError, setStaffError] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffQuery, setStaffQuery] = useState("");
  const [staffStatusFilter, setStaffStatusFilter] = useState<StaffStatusFilter>("all");
  const [staffDetail, setStaffDetail] = useState<StaffDetailPayload | null>(null);
  const [staffEditDraft, setStaffEditDraft] = useState<StaffEditDraft | null>(null);
  const [staffDetailError, setStaffDetailError] = useState("");
  const [staffDetailLoading, setStaffDetailLoading] = useState(false);
  const [staffDetailSaving, setStaffDetailSaving] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [locationsData, setLocationsData] = useState<DesktopLocationsPayload | null>(null);
  const [locationsError, setLocationsError] = useState("");
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsQuery, setLocationsQuery] = useState("");
  const [locationsStatusFilter, setLocationsStatusFilter] = useState<LocationStatusFilter>("all");
  const [locationDetail, setLocationDetail] = useState<LocationDetailPayload | null>(null);
  const [locationEditDraft, setLocationEditDraft] = useState<LocationEditDraft | null>(null);
  const [locationDetailError, setLocationDetailError] = useState("");
  const [locationDetailLoading, setLocationDetailLoading] = useState(false);
  const [locationDetailSaving, setLocationDetailSaving] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityPayload | null>(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [selectedAvailabilityStaffId, setSelectedAvailabilityStaffId] = useState<string | null>(null);
  const [availabilityDraft, setAvailabilityDraft] = useState<AvailabilityWindowDraft[]>([]);
  const [availabilityOverrideDraft, setAvailabilityOverrideDraft] = useState<AvailabilityOverrideDraft>(() => defaultAvailabilityOverrideDraft());
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [paymentsData, setPaymentsData] = useState<DesktopPaymentsPayload | null>(null);
  const [paymentsError, setPaymentsError] = useState("");
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsQuery, setPaymentsQuery] = useState("");
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState<PaymentStatusFilter>("all");
  const [paymentDetail, setPaymentDetail] = useState<PaymentDetailPayload | null>(null);
  const [paymentDetailError, setPaymentDetailError] = useState("");
  const [paymentDetailLoading, setPaymentDetailLoading] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [reviewsData, setReviewsData] = useState<DesktopReviewsPayload | null>(null);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsQuery, setReviewsQuery] = useState("");
  const [reviewsRatingFilter, setReviewsRatingFilter] = useState<ReviewRatingFilter>("all");
  const [reviewsStatusFilter, setReviewsStatusFilter] = useState<ReviewStatusFilter>("all");
  const [reviewDetail, setReviewDetail] = useState<ReviewDetailPayload | null>(null);
  const [reviewDetailError, setReviewDetailError] = useState("");
  const [reviewDetailLoading, setReviewDetailLoading] = useState(false);
  const [reviewReplyDraft, setReviewReplyDraft] = useState("");
  const [reviewDetailSaving, setReviewDetailSaving] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [dealsData, setDealsData] = useState<DesktopDealsPayload | null>(null);
  const [dealsError, setDealsError] = useState("");
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsQuery, setDealsQuery] = useState("");
  const [dealsStatusFilter, setDealsStatusFilter] = useState<DealStatusFilter>("all");
  const [dealDetail, setDealDetail] = useState<DealDetailPayload | null>(null);
  const [dealDetailError, setDealDetailError] = useState("");
  const [dealDetailLoading, setDealDetailLoading] = useState(false);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null);
  const [broadcastsData, setBroadcastsData] = useState<DesktopBroadcastsPayload | null>(null);
  const [broadcastsError, setBroadcastsError] = useState("");
  const [broadcastsLoading, setBroadcastsLoading] = useState(false);
  const [broadcastsQuery, setBroadcastsQuery] = useState("");
  const [broadcastsStatusFilter, setBroadcastsStatusFilter] = useState<BroadcastStatusFilter>("all");
  const [broadcastsChannelFilter, setBroadcastsChannelFilter] = useState<BroadcastChannelFilter>("all");
  const [broadcastDetail, setBroadcastDetail] = useState<BroadcastDetailPayload | null>(null);
  const [broadcastDetailError, setBroadcastDetailError] = useState("");
  const [broadcastDetailLoading, setBroadcastDetailLoading] = useState(false);
  const [selectedMarketingId, setSelectedMarketingId] = useState<string | null>(null);
  const [marketingData, setMarketingData] = useState<DesktopMarketingPayload | null>(null);
  const [marketingError, setMarketingError] = useState("");
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [marketingQuery, setMarketingQuery] = useState("");
  const [marketingStatusFilter, setMarketingStatusFilter] = useState<MarketingStatusFilter>("all");
  const [marketingDetail, setMarketingDetail] = useState<MarketingDetailPayload | null>(null);
  const [marketingDetailError, setMarketingDetailError] = useState("");
  const [marketingDetailLoading, setMarketingDetailLoading] = useState(false);
  const [marketingDetailSaving, setMarketingDetailSaving] = useState(false);
  const [selectedAiRunId, setSelectedAiRunId] = useState<string | null>(null);
  const [aiRunsData, setAiRunsData] = useState<DesktopAiWorkflowRunsPayload | null>(null);
  const [aiRunsError, setAiRunsError] = useState("");
  const [aiRunsLoading, setAiRunsLoading] = useState(false);
  const [aiRunsQuery, setAiRunsQuery] = useState("");
  const [aiRunsStatusFilter, setAiRunsStatusFilter] = useState<AiWorkflowRunStatusFilter>("all");
  const [aiRunDetail, setAiRunDetail] = useState<AiWorkflowRunDetailPayload | null>(null);
  const [aiRunDetailError, setAiRunDetailError] = useState("");
  const [aiRunDetailLoading, setAiRunDetailLoading] = useState(false);
  const [aiActionSaving, setAiActionSaving] = useState<string | null>(null);
  const [aiReactivationResult, setAiReactivationResult] = useState<AiReactivationResult | null>(null);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [automationsData, setAutomationsData] = useState<DesktopAutomationsPayload | null>(null);
  const [automationsError, setAutomationsError] = useState("");
  const [automationsLoading, setAutomationsLoading] = useState(false);
  const [automationsQuery, setAutomationsQuery] = useState("");
  const [automationsStatusFilter, setAutomationsStatusFilter] = useState<AutomationStatusFilter>("all");
  const [automationDetail, setAutomationDetail] = useState<AutomationDetailPayload | null>(null);
  const [automationDetailError, setAutomationDetailError] = useState("");
  const [automationDetailLoading, setAutomationDetailLoading] = useState(false);
  const [automationDetailSaving, setAutomationDetailSaving] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [integrationsData, setIntegrationsData] = useState<DesktopIntegrationsPayload | null>(null);
  const [integrationsError, setIntegrationsError] = useState("");
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [integrationsQuery, setIntegrationsQuery] = useState("");
  const [integrationsStatusFilter, setIntegrationsStatusFilter] = useState<IntegrationStatusFilter>("all");
  const [integrationDetail, setIntegrationDetail] = useState<IntegrationDetailPayload | null>(null);
  const [integrationDetailError, setIntegrationDetailError] = useState("");
  const [integrationDetailLoading, setIntegrationDetailLoading] = useState(false);
  const [settingsData, setSettingsData] = useState<DesktopSettingsPayload | null>(null);
  const [settingsError, setSettingsError] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<SettingsEditDraft | null>(null);
  const [billingData, setBillingData] = useState<DesktopBillingPayload | null>(null);
  const [billingError, setBillingError] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const [reportsData, setReportsData] = useState<DesktopReportsPayload | null>(null);
  const [reportsError, setReportsError] = useState("");
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsFrom, setReportsFrom] = useState(() => shiftDate(dateInputValue(), -29));
  const [reportsTo, setReportsTo] = useState(() => dateInputValue());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [offlineNotice, setOfflineNotice] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [commandIndex, setCommandIndex] = useState(0);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const initialNotificationSync = useRef(true);

  const route = findDashboardRoute(view) ?? findDashboardRoute("overview")!;

  const visibleRows = useMemo(() => {
    if (view === "overview") return rows.filter((row) => isActiveDailyStatus(row.status));
    return rows;
  }, [rows, view]);

  const metrics = useMemo<DashboardMetrics>(() => {
    const activeToday = rows.filter((row) => isActiveDailyStatus(row.status)).length;
    return {
      activeToday,
      confirmedToday: rows.filter((row) => row.status === "confirmed").length,
      pendingToday: rows.filter((row) => row.status === "pending").length,
      staffOnDeck: new Set(rows.map((row) => row.staffId)).size,
    };
  }, [rows]);

  function bookingsCacheKey(nextTab = tab) {
    return offlineCacheKey("bookings", nextTab, query || "all", staffFilter || "all", statusFilter || "all");
  }

  function calendarCacheKey(nextMode = calendarMode, nextDate = calendarDate, nextStaffFilter = calendarStaffFilter) {
    return offlineCacheKey("calendar", nextMode, nextDate, nextStaffFilter || "all");
  }

  function clientsCacheKey(nextStage = clientsStageFilter, nextQuery = clientsQuery) {
    return offlineCacheKey("clients", nextStage, nextQuery || "all");
  }

  function servicesCacheKey(nextStatus = servicesStatusFilter, nextQuery = servicesQuery) {
    return offlineCacheKey("services", nextStatus, nextQuery || "all");
  }

  function staffCacheKey(nextStatus = staffStatusFilter, nextQuery = staffQuery) {
    return offlineCacheKey("staff", nextStatus, nextQuery || "all");
  }

  function locationsCacheKey(nextStatus = locationsStatusFilter, nextQuery = locationsQuery) {
    return offlineCacheKey("locations", nextStatus, nextQuery || "all");
  }

  function reportsCacheKey(nextFrom = reportsFrom, nextTo = reportsTo) {
    return offlineCacheKey("reports", nextFrom, nextTo);
  }

  function paymentsCacheKey(nextStatus = paymentsStatusFilter, nextQuery = paymentsQuery) {
    return offlineCacheKey("payments", nextStatus, nextQuery || "all");
  }

  function reviewsCacheKey(
    nextStatus = reviewsStatusFilter,
    nextRating = reviewsRatingFilter,
    nextQuery = reviewsQuery,
  ) {
    return offlineCacheKey("reviews", nextStatus, nextRating, nextQuery || "all");
  }

  function dealsCacheKey(nextStatus = dealsStatusFilter, nextQuery = dealsQuery) {
    return offlineCacheKey("deals", nextStatus, nextQuery || "all");
  }

  function broadcastsCacheKey(
    nextStatus = broadcastsStatusFilter,
    nextChannel = broadcastsChannelFilter,
    nextQuery = broadcastsQuery,
  ) {
    return offlineCacheKey("broadcasts", nextStatus, nextChannel, nextQuery || "all");
  }

  function marketingCacheKey(nextStatus = marketingStatusFilter, nextQuery = marketingQuery) {
    return offlineCacheKey("marketing", nextStatus, nextQuery || "all");
  }

  function aiRunsCacheKey(nextStatus = aiRunsStatusFilter, nextQuery = aiRunsQuery) {
    return offlineCacheKey("ai-runs", nextStatus, nextQuery || "all");
  }

  function automationsCacheKey(nextStatus = automationsStatusFilter, nextQuery = automationsQuery) {
    return offlineCacheKey("automations", nextStatus, nextQuery || "all");
  }

  function integrationsCacheKey(nextStatus = integrationsStatusFilter, nextQuery = integrationsQuery) {
    return offlineCacheKey("integrations", nextStatus, nextQuery || "all");
  }

  function restoreCachedRead<T>(
    key: string,
    label: string,
    loadError: unknown,
    apply: (payload: T, cachedAt: string) => void,
    setLocalError: (message: string) => void,
  ): boolean {
    const message = String(loadError);
    if (isPlanGateMessage(message)) {
      // Don't fall back to a cached (higher-plan) copy — surface the upgrade prompt.
      setLocalError(message);
      return false;
    }
    if (isAuthFailureMessage(message)) {
      setLocalError(message);
      return false;
    }

    const cached = readOfflineCache<T>(key);
    if (!cached) {
      setLocalError(message);
      return false;
    }

    apply(cached.payload, cached.cachedAt);
    const notice = `Offline cache: showing ${label} from ${formatDateTime(cached.cachedAt)} while reconnecting.`;
    setOfflineNotice(notice);
    setLocalError("");
    return true;
  }

  async function fetchBootstrap(): Promise<BootstrapPayload> {
    return desktopApiRequest<BootstrapPayload>({
      method: "GET",
      path: "/api/v1/desktop/bootstrap",
    });
  }

  async function fetchBookings(nextTab = tab): Promise<BookingsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/bookings", {
      limit: 80,
      q: query || undefined,
      staffId: staffFilter || undefined,
      status: statusFilter || undefined,
      tab: nextTab,
    });
    return desktopApiRequest<BookingsPayload>({ method: "GET", path });
  }

  async function fetchCalendar(
    nextMode = calendarMode,
    nextDate = calendarDate,
    nextStaffFilter = calendarStaffFilter,
  ): Promise<CalendarPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/calendar", {
      date: nextDate,
      staffId: nextStaffFilter || undefined,
      view: nextMode,
    });
    return desktopApiRequest<CalendarPayload>({ method: "GET", path });
  }

  async function fetchAvailability(): Promise<AvailabilityPayload> {
    return desktopApiRequest<AvailabilityPayload>({
      method: "GET",
      path: "/api/v1/desktop/availability",
    });
  }

  async function fetchClients(
    nextStage = clientsStageFilter,
    nextQuery = clientsQuery,
  ): Promise<DesktopClientsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/clients", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      stage: nextStage === "all" ? undefined : nextStage,
    });
    return desktopApiRequest<DesktopClientsPayload>({ method: "GET", path });
  }

  async function loadClients(
    nextStage = clientsStageFilter,
    nextQuery = clientsQuery,
  ) {
    setClientsLoading(true);
    setClientsError("");
    try {
      const next = await fetchClients(nextStage, nextQuery);
      setClientsData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(clientsCacheKey(nextStage, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopClientsPayload>(
        clientsCacheKey(nextStage, nextQuery),
        "clients",
        loadError,
        (cached) => {
          setClientsData(cached);
          setLastSync(cached.serverTime);
        },
        setClientsError,
      );
    } finally {
      setClientsLoading(false);
    }
  }

  async function fetchServices(
    nextStatus = servicesStatusFilter,
    nextQuery = servicesQuery,
  ): Promise<DesktopServicesPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/services", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopServicesPayload>({ method: "GET", path });
  }

  async function loadServices(
    nextStatus = servicesStatusFilter,
    nextQuery = servicesQuery,
  ) {
    setServicesLoading(true);
    setServicesError("");
    try {
      const next = await fetchServices(nextStatus, nextQuery);
      setServicesData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(servicesCacheKey(nextStatus, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopServicesPayload>(
        servicesCacheKey(nextStatus, nextQuery),
        "services",
        loadError,
        (cached) => {
          setServicesData(cached);
          setLastSync(cached.serverTime);
        },
        setServicesError,
      );
    } finally {
      setServicesLoading(false);
    }
  }

  async function fetchStaff(
    nextStatus = staffStatusFilter,
    nextQuery = staffQuery,
  ): Promise<DesktopStaffPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/staff", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopStaffPayload>({ method: "GET", path });
  }

  async function loadStaff(
    nextStatus = staffStatusFilter,
    nextQuery = staffQuery,
  ) {
    setStaffLoading(true);
    setStaffError("");
    try {
      const next = await fetchStaff(nextStatus, nextQuery);
      setStaffData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(staffCacheKey(nextStatus, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopStaffPayload>(
        staffCacheKey(nextStatus, nextQuery),
        "staff",
        loadError,
        (cached) => {
          setStaffData(cached);
          setLastSync(cached.serverTime);
        },
        setStaffError,
      );
    } finally {
      setStaffLoading(false);
    }
  }

  async function fetchLocations(
    nextStatus = locationsStatusFilter,
    nextQuery = locationsQuery,
  ): Promise<DesktopLocationsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/locations", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopLocationsPayload>({ method: "GET", path });
  }

  async function loadLocations(
    nextStatus = locationsStatusFilter,
    nextQuery = locationsQuery,
  ) {
    setLocationsLoading(true);
    setLocationsError("");
    try {
      const next = await fetchLocations(nextStatus, nextQuery);
      setLocationsData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(locationsCacheKey(nextStatus, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopLocationsPayload>(
        locationsCacheKey(nextStatus, nextQuery),
        "locations",
        loadError,
        (cached) => {
          setLocationsData(cached);
          setLastSync(cached.serverTime);
        },
        setLocationsError,
      );
    } finally {
      setLocationsLoading(false);
    }
  }

  async function fetchPayments(
    nextStatus = paymentsStatusFilter,
    nextQuery = paymentsQuery,
  ): Promise<DesktopPaymentsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/payments", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopPaymentsPayload>({ method: "GET", path });
  }

  async function loadPayments(
    nextStatus = paymentsStatusFilter,
    nextQuery = paymentsQuery,
  ) {
    setPaymentsLoading(true);
    setPaymentsError("");
    try {
      const next = await fetchPayments(nextStatus, nextQuery);
      setPaymentsData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(paymentsCacheKey(nextStatus, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopPaymentsPayload>(
        paymentsCacheKey(nextStatus, nextQuery),
        "payments",
        loadError,
        (cached) => {
          setPaymentsData(cached);
          setLastSync(cached.serverTime);
        },
        setPaymentsError,
      );
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function fetchReviews(
    nextStatus = reviewsStatusFilter,
    nextRating = reviewsRatingFilter,
    nextQuery = reviewsQuery,
  ): Promise<DesktopReviewsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/reviews", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      rating: nextRating === "all" ? undefined : nextRating,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopReviewsPayload>({ method: "GET", path });
  }

  async function loadReviews(
    nextStatus = reviewsStatusFilter,
    nextRating = reviewsRatingFilter,
    nextQuery = reviewsQuery,
  ) {
    setReviewsLoading(true);
    setReviewsError("");
    try {
      const next = await fetchReviews(nextStatus, nextRating, nextQuery);
      setReviewsData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(reviewsCacheKey(nextStatus, nextRating, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopReviewsPayload>(
        reviewsCacheKey(nextStatus, nextRating, nextQuery),
        "reviews",
        loadError,
        (cached) => {
          setReviewsData(cached);
          setLastSync(cached.serverTime);
        },
        setReviewsError,
      );
    } finally {
      setReviewsLoading(false);
    }
  }

  async function fetchDeals(
    nextStatus = dealsStatusFilter,
    nextQuery = dealsQuery,
  ): Promise<DesktopDealsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/deals", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopDealsPayload>({ method: "GET", path });
  }

  async function loadDeals(
    nextStatus = dealsStatusFilter,
    nextQuery = dealsQuery,
  ) {
    setDealsLoading(true);
    setDealsError("");
    try {
      const next = await fetchDeals(nextStatus, nextQuery);
      setDealsData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(dealsCacheKey(nextStatus, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopDealsPayload>(
        dealsCacheKey(nextStatus, nextQuery),
        "deals",
        loadError,
        (cached) => {
          setDealsData(cached);
          setLastSync(cached.serverTime);
        },
        setDealsError,
      );
    } finally {
      setDealsLoading(false);
    }
  }

  async function fetchBroadcasts(
    nextStatus = broadcastsStatusFilter,
    nextChannel = broadcastsChannelFilter,
    nextQuery = broadcastsQuery,
  ): Promise<DesktopBroadcastsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/broadcasts", {
      channel: nextChannel === "all" ? undefined : nextChannel,
      limit: 80,
      q: nextQuery.trim() || undefined,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopBroadcastsPayload>({ method: "GET", path });
  }

  async function loadBroadcasts(
    nextStatus = broadcastsStatusFilter,
    nextChannel = broadcastsChannelFilter,
    nextQuery = broadcastsQuery,
  ) {
    setBroadcastsLoading(true);
    setBroadcastsError("");
    try {
      const next = await fetchBroadcasts(nextStatus, nextChannel, nextQuery);
      setBroadcastsData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(broadcastsCacheKey(nextStatus, nextChannel, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopBroadcastsPayload>(
        broadcastsCacheKey(nextStatus, nextChannel, nextQuery),
        "broadcasts",
        loadError,
        (cached) => {
          setBroadcastsData(cached);
          setLastSync(cached.serverTime);
        },
        setBroadcastsError,
      );
    } finally {
      setBroadcastsLoading(false);
    }
  }

  async function fetchMarketing(
    nextStatus = marketingStatusFilter,
    nextQuery = marketingQuery,
  ): Promise<DesktopMarketingPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/marketing", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopMarketingPayload>({ method: "GET", path });
  }

  async function loadMarketing(
    nextStatus = marketingStatusFilter,
    nextQuery = marketingQuery,
  ) {
    setMarketingLoading(true);
    setMarketingError("");
    try {
      const next = await fetchMarketing(nextStatus, nextQuery);
      setMarketingData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(marketingCacheKey(nextStatus, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopMarketingPayload>(
        marketingCacheKey(nextStatus, nextQuery),
        "marketing",
        loadError,
        (cached) => {
          setMarketingData(cached);
          setLastSync(cached.serverTime);
        },
        setMarketingError,
      );
    } finally {
      setMarketingLoading(false);
    }
  }

  async function fetchAiRuns(
    nextStatus = aiRunsStatusFilter,
    nextQuery = aiRunsQuery,
  ): Promise<DesktopAiWorkflowRunsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/ai", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopAiWorkflowRunsPayload>({ method: "GET", path });
  }

  async function loadAiRuns(
    nextStatus = aiRunsStatusFilter,
    nextQuery = aiRunsQuery,
  ) {
    setAiRunsLoading(true);
    setAiRunsError("");
    try {
      const next = await fetchAiRuns(nextStatus, nextQuery);
      setAiRunsData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(aiRunsCacheKey(nextStatus, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopAiWorkflowRunsPayload>(
        aiRunsCacheKey(nextStatus, nextQuery),
        "AI workflow runs",
        loadError,
        (cached) => {
          setAiRunsData(cached);
          setLastSync(cached.serverTime);
        },
        setAiRunsError,
      );
    } finally {
      setAiRunsLoading(false);
    }
  }

  async function fetchAutomations(
    nextStatus = automationsStatusFilter,
    nextQuery = automationsQuery,
  ): Promise<DesktopAutomationsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/automations", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopAutomationsPayload>({ method: "GET", path });
  }

  async function loadAutomations(
    nextStatus = automationsStatusFilter,
    nextQuery = automationsQuery,
  ) {
    setAutomationsLoading(true);
    setAutomationsError("");
    try {
      const next = await fetchAutomations(nextStatus, nextQuery);
      setAutomationsData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(automationsCacheKey(nextStatus, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopAutomationsPayload>(
        automationsCacheKey(nextStatus, nextQuery),
        "automations",
        loadError,
        (cached) => {
          setAutomationsData(cached);
          setLastSync(cached.serverTime);
        },
        setAutomationsError,
      );
    } finally {
      setAutomationsLoading(false);
    }
  }

  async function fetchIntegrations(
    nextStatus = integrationsStatusFilter,
    nextQuery = integrationsQuery,
  ): Promise<DesktopIntegrationsPayload> {
    const path = buildDesktopApiPath("/api/v1/desktop/integrations", {
      limit: 80,
      q: nextQuery.trim() || undefined,
      status: nextStatus === "all" ? undefined : nextStatus,
    });
    return desktopApiRequest<DesktopIntegrationsPayload>({ method: "GET", path });
  }

  async function loadIntegrations(
    nextStatus = integrationsStatusFilter,
    nextQuery = integrationsQuery,
  ) {
    setIntegrationsLoading(true);
    setIntegrationsError("");
    try {
      const next = await fetchIntegrations(nextStatus, nextQuery);
      setIntegrationsData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(integrationsCacheKey(nextStatus, nextQuery), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopIntegrationsPayload>(
        integrationsCacheKey(nextStatus, nextQuery),
        "integrations",
        loadError,
        (cached) => {
          setIntegrationsData(cached);
          setLastSync(cached.serverTime);
        },
        setIntegrationsError,
      );
    } finally {
      setIntegrationsLoading(false);
    }
  }

  async function loadAvailability() {
    setAvailabilityLoading(true);
    setAvailabilityError("");
    try {
      const next = await fetchAvailability();
      setAvailabilityData(next);
      setLastSync(next.serverTime);
      const nextStaffId = selectedAvailabilityStaffId ?? next.members[0]?.staff.id ?? null;
      setSelectedAvailabilityStaffId(nextStaffId);
      setAvailabilityDraft(availabilityDraftFromMember(next.members.find((member) => member.staff.id === nextStaffId) ?? next.members[0] ?? null));
      writeOfflineCache(offlineCacheKey("availability"), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<AvailabilityPayload>(
        offlineCacheKey("availability"),
        "availability",
        loadError,
        (cached) => {
          setAvailabilityData(cached);
          setLastSync(cached.serverTime);
          const nextStaffId = selectedAvailabilityStaffId ?? cached.members[0]?.staff.id ?? null;
          setSelectedAvailabilityStaffId(nextStaffId);
          setAvailabilityDraft(availabilityDraftFromMember(cached.members.find((member) => member.staff.id === nextStaffId) ?? cached.members[0] ?? null));
        },
        setAvailabilityError,
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }

  function selectAvailabilityStaff(id: string) {
    setSelectedAvailabilityStaffId(id);
    setAvailabilityDraft(availabilityDraftFromMember(availabilityData?.members.find((member) => member.staff.id === id) ?? null));
    setAvailabilityOverrideDraft(defaultAvailabilityOverrideDraft());
  }

  async function updateAvailabilityWindows(staffId: string) {
    setAvailabilitySaving(true);
    setAvailabilityError("");
    try {
      const rows = availabilityDraft
        .filter((window) => window.startTime.trim() && window.endTime.trim())
        .map((window) => ({
          dayOfWeek: window.dayOfWeek,
          endTime: window.endTime,
          startTime: window.startTime,
        }));
      const next = await desktopApiRequest<AvailabilityPayload>({
        body: { rows, staffId },
        method: "PATCH",
        path: "/api/v1/desktop/availability",
      });
      setAvailabilityData(next);
      setSelectedAvailabilityStaffId(staffId);
      setAvailabilityDraft(availabilityDraftFromMember(next.members.find((member) => member.staff.id === staffId) ?? null));
      setLastSync(next.serverTime);
      writeOfflineCache(offlineCacheKey("availability"), next);
      setOfflineNotice("");
    } catch (loadError) {
      setAvailabilityError(String(loadError));
    } finally {
      setAvailabilitySaving(false);
    }
  }

  async function upsertAvailabilityOverride(staffId: string) {
    setAvailabilitySaving(true);
    setAvailabilityError("");
    try {
      const next = await desktopApiRequest<AvailabilityPayload>({
        body: {
          date: availabilityOverrideDraft.date,
          endTime: availabilityOverrideDraft.isBlocked ? null : availabilityOverrideDraft.endTime,
          isBlocked: availabilityOverrideDraft.isBlocked,
          reason: availabilityOverrideDraft.reason.trim() || null,
          staffId,
          startTime: availabilityOverrideDraft.isBlocked ? null : availabilityOverrideDraft.startTime,
        },
        method: "POST",
        path: "/api/v1/desktop/availability/overrides",
      });
      setAvailabilityData(next);
      setSelectedAvailabilityStaffId(staffId);
      setAvailabilityDraft(availabilityDraftFromMember(next.members.find((member) => member.staff.id === staffId) ?? null));
      setAvailabilityOverrideDraft(defaultAvailabilityOverrideDraft());
      setLastSync(next.serverTime);
      writeOfflineCache(offlineCacheKey("availability"), next);
      setOfflineNotice("");
    } catch (loadError) {
      setAvailabilityError(String(loadError));
    } finally {
      setAvailabilitySaving(false);
    }
  }

  async function deleteAvailabilityOverride(staffId: string, overrideId: string) {
    setAvailabilitySaving(true);
    setAvailabilityError("");
    try {
      const next = await desktopApiRequest<AvailabilityPayload>({
        method: "DELETE",
        path: buildDesktopApiPath("/api/v1/desktop/availability/overrides", {
          id: overrideId,
          staffId,
        }),
      });
      setAvailabilityData(next);
      setSelectedAvailabilityStaffId(staffId);
      setAvailabilityDraft(availabilityDraftFromMember(next.members.find((member) => member.staff.id === staffId) ?? null));
      setLastSync(next.serverTime);
      writeOfflineCache(offlineCacheKey("availability"), next);
      setOfflineNotice("");
    } catch (loadError) {
      setAvailabilityError(String(loadError));
    } finally {
      setAvailabilitySaving(false);
    }
  }

  async function loadCalendar(
    nextMode = calendarMode,
    nextDate = calendarDate,
    nextStaffFilter = calendarStaffFilter,
  ) {
    setCalendarLoading(true);
    setCalendarError("");
    try {
      const next = await fetchCalendar(nextMode, nextDate, nextStaffFilter);
      setCalendarData(next);
      setStaff(next.staff);
      setLastSync(next.serverTime);
      writeOfflineCache(calendarCacheKey(nextMode, nextDate, nextStaffFilter), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<CalendarPayload>(
        calendarCacheKey(nextMode, nextDate, nextStaffFilter),
        "calendar",
        loadError,
        (cached) => {
          setCalendarData(cached);
          setStaff(cached.staff);
          setLastSync(cached.serverTime);
        },
        setCalendarError,
      );
    } finally {
      setCalendarLoading(false);
    }
  }

  async function runSync(nextTab = tab) {
    setSyncing(true);
    setError("");
    try {
      const [bootstrap, bookings] = await Promise.all([
        fetchBootstrap(),
        fetchBookings(nextTab),
      ]);
      setAuthReady(true);
      setBusiness(bootstrap.business);
      setStaff(bootstrap.staff);
      setRows(bookings.rows);
      setLastSync(bookings.serverTime);
      writeOfflineCache(offlineCacheKey("bootstrap"), bootstrap);
      writeOfflineCache(bookingsCacheKey(nextTab), bookings);
      setOfflineNotice("");
      if (bookings.tab === "today") {
        void invoke("updateTrayCount", { count: bookings.rows.length, offline: false });
      }
      notifyFromRows(bookings.rows);
      if (selectedId) {
        await openDetail(selectedId, false);
      }
    } catch (syncError) {
      const message = String(syncError);
      void invoke("updateTrayCount", { count: rows.length, offline: true });
      if (isAuthFailureMessage(message)) {
        setError(message);
        setAuthReady(false);
        setBusiness(null);
      } else {
        const cachedBootstrap = readOfflineCache<BootstrapPayload>(offlineCacheKey("bootstrap"));
        const cachedBookings = readOfflineCache<BookingsPayload>(bookingsCacheKey(nextTab));
        if (cachedBootstrap && cachedBookings) {
          setAuthReady(true);
          setBusiness(cachedBootstrap.payload.business);
          setStaff(cachedBootstrap.payload.staff);
          setRows(cachedBookings.payload.rows);
          setLastSync(cachedBookings.payload.serverTime);
          const notice = `Offline cache: showing ${nextTab} bookings from ${formatDateTime(cachedBookings.cachedAt)} while reconnecting.`;
          setOfflineNotice(notice);
          setError("");
        } else {
          setError(message);
        }
      }
    } finally {
      setBooting(false);
      setSyncing(false);
    }
  }

  function notifyFromRows(nextRows: BookingRow[]) {
    const knownBookings = readStoredSet(knownBookingStorageKey);
    const remindedBookings = readStoredSet(reminderStorageKey);
    const now = Date.now();

    for (const row of nextRows) {
      if (!initialNotificationSync.current && !knownBookings.has(row.id)) {
        void invoke("notifyNewBooking", {
          payload: {
            bookingId: row.id,
            clientName: row.clientName,
            serviceName: row.serviceName,
            startsAt: formatDateTime(row.startsAt),
          },
        });
      }

      knownBookings.add(row.id);

      const startsAt = new Date(row.startsAt).getTime();
      const minutesUntilStart = (startsAt - now) / 60_000;
      if (
        row.status === "confirmed" &&
        minutesUntilStart >= 0 &&
        minutesUntilStart <= 15 &&
        !remindedBookings.has(row.id)
      ) {
        remindedBookings.add(row.id);
        void invoke("notifyUpcoming", {
          payload: {
            bookingId: row.id,
            clientName: row.clientName,
            serviceName: row.serviceName,
            startsAt: formatDateTime(row.startsAt),
          },
        });
      }
    }

    initialNotificationSync.current = false;
    writeStoredSet(knownBookingStorageKey, knownBookings);
    writeStoredSet(reminderStorageKey, remindedBookings);
  }

  async function openDetail(id: string, showLoading = true) {
    setSelectedId(id);
    if (showLoading) setDetail(null);
    try {
      const next = await desktopApiRequest<BookingDetail>({
        method: "GET",
        path: `/api/v1/desktop/bookings/${id}`,
      });
      setDetail(next);
    } catch (detailError) {
      setError(String(detailError));
    }
  }

  async function updateStatus(id: string, status: BookingStatus) {
    const previousRows = rows;
    const previousDetail = detail;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    if (detail?.id === id) setDetail({ ...detail, status });
    try {
      await desktopApiRequest({
        body: { status },
        method: "PATCH",
        path: `/api/v1/desktop/bookings/${id}/status`,
      });
      await runSync(tab);
      await openDetail(id, false);
    } catch (mutationError) {
      setRows(previousRows);
      setDetail(previousDetail);
      setError(String(mutationError));
    }
  }

  async function loadModule(nextRoute: DashboardRoute) {
    if (!nextRoute.desktopApiPath) return;
    setModuleLoading(true);
    setModuleError("");
    try {
      const next = await desktopApiRequest<DesktopModulePayload>({
        method: "GET",
        path: nextRoute.desktopApiPath,
      });
      setModuleData((current) => ({
        ...current,
        [nextRoute.id]: next,
      }));
      writeOfflineCache(offlineCacheKey("module", nextRoute.id), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopModulePayload>(
        offlineCacheKey("module", nextRoute.id),
        nextRoute.label.toLowerCase(),
        loadError,
        (cached) => setModuleData((current) => ({
          ...current,
          [nextRoute.id]: cached,
        })),
        setModuleError,
      );
    } finally {
      setModuleLoading(false);
    }
  }

  async function openClientDetail(id: string) {
    setSelectedClientId(id);
    setClientDetail(null);
    setClientDetailError("");
    setClientEditDraft(null);
    setClientNoteDraft("");
    setClientDetailLoading(true);
    try {
      const next = await desktopApiRequest<ClientDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/clients/${id}`,
      });
      setClientDetail(next);
      setClientEditDraft(clientDraftFromDetail(next));
      setLastSync(next.serverTime);
    } catch (loadError) {
      setClientDetailError(String(loadError));
    } finally {
      setClientDetailLoading(false);
    }
  }

  async function addClientNote(id: string) {
    const body = clientNoteDraft.trim();
    if (!body) {
      setClientDetailError("Note body is required.");
      return;
    }

    setClientNoteSaving(true);
    setClientDetailError("");
    try {
      const next = await desktopApiRequest<ClientDetailPayload>({
        body: { body },
        method: "POST",
        path: `/api/v1/desktop/clients/${id}/notes`,
      });
      setClientDetail(next);
      setClientEditDraft(clientDraftFromDetail(next));
      setClientNoteDraft("");
      setLastSync(next.serverTime);
    } catch (loadError) {
      setClientDetailError(String(loadError));
    } finally {
      setClientNoteSaving(false);
    }
  }

  async function updateClientDetail(id: string) {
    if (!clientEditDraft) return;
    setClientDetailSaving(true);
    setClientDetailError("");
    try {
      const next = await desktopApiRequest<ClientDetailPayload>({
        body: clientDraftToPayload(clientEditDraft),
        method: "PATCH",
        path: `/api/v1/desktop/clients/${id}`,
      });
      setClientDetail(next);
      setClientEditDraft(clientDraftFromDetail(next));
      setLastSync(next.serverTime);
      if (view === "clients") {
        await loadClients();
      } else {
        await loadModule(route);
      }
    } catch (loadError) {
      setClientDetailError(String(loadError));
    } finally {
      setClientDetailSaving(false);
    }
  }

  async function openServiceDetail(id: string) {
    setSelectedServiceId(id);
    setServiceDetail(null);
    setServiceDetailError("");
    setServiceDetailLoading(true);
    try {
      const next = await desktopApiRequest<ServiceDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/services/${id}`,
      });
      setServiceDetail(next);
      setServiceEditDraft(serviceDraftFromDetail(next));
      setServiceForceDeactivate(false);
      setLastSync(next.serverTime);
    } catch (loadError) {
      setServiceDetailError(String(loadError));
    } finally {
      setServiceDetailLoading(false);
    }
  }

  async function updateServiceDetail(id: string) {
    if (!serviceEditDraft) return;
    setServiceDetailSaving(true);
    setServiceDetailError("");
    try {
      const next = await desktopApiRequest<ServiceDetailPayload>({
        body: serviceDraftToPayload(serviceEditDraft, serviceForceDeactivate),
        method: "PATCH",
        path: `/api/v1/desktop/services/${id}`,
      });
      setServiceDetail(next);
      setServiceEditDraft(serviceDraftFromDetail(next));
      setServiceForceDeactivate(false);
      setLastSync(next.serverTime);
      if (view === "services") {
        await loadServices();
      } else {
        await loadModule(route);
      }
    } catch (loadError) {
      setServiceDetailError(String(loadError));
    } finally {
      setServiceDetailSaving(false);
    }
  }

  async function openStaffDetail(id: string) {
    setSelectedStaffId(id);
    setStaffDetail(null);
    setStaffEditDraft(null);
    setStaffDetailError("");
    setStaffDetailLoading(true);
    try {
      const next = await desktopApiRequest<StaffDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/staff/${id}`,
      });
      setStaffDetail(next);
      setStaffEditDraft(staffDraftFromDetail(next));
      setLastSync(next.serverTime);
    } catch (loadError) {
      setStaffDetailError(String(loadError));
    } finally {
      setStaffDetailLoading(false);
    }
  }

  async function updateStaffDetail(id: string) {
    if (!staffEditDraft) return;
    setStaffDetailSaving(true);
    setStaffDetailError("");
    try {
      const next = await desktopApiRequest<StaffDetailPayload>({
        body: {
          avatarUrl: staffEditDraft.avatarUrl.trim() || null,
          bio: staffEditDraft.bio.trim() || null,
          isActive: staffEditDraft.isActive,
          locationIds: staffEditDraft.locationIds,
          name: staffEditDraft.name.trim(),
          serviceIds: staffEditDraft.serviceIds,
        },
        method: "PATCH",
        path: `/api/v1/desktop/staff/${id}`,
      });
      setStaffDetail(next);
      setStaffEditDraft(staffDraftFromDetail(next));
      setLastSync(next.serverTime);
      if (view === "staff") {
        await loadStaff();
      } else {
        await loadModule(route);
      }
    } catch (loadError) {
      setStaffDetailError(String(loadError));
    } finally {
      setStaffDetailSaving(false);
    }
  }

  async function openLocationDetail(id: string) {
    setSelectedLocationId(id);
    setLocationDetail(null);
    setLocationEditDraft(null);
    setLocationDetailError("");
    setLocationDetailLoading(true);
    try {
      const next = await desktopApiRequest<LocationDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/locations/${id}`,
      });
      setLocationDetail(next);
      setLocationEditDraft(locationDraftFromDetail(next));
      setLastSync(next.serverTime);
    } catch (loadError) {
      setLocationDetailError(String(loadError));
    } finally {
      setLocationDetailLoading(false);
    }
  }

  async function updateLocationDetail(id: string) {
    if (!locationEditDraft) return;
    setLocationDetailSaving(true);
    setLocationDetailError("");
    try {
      const next = await desktopApiRequest<LocationDetailPayload>({
        body: locationDraftToPayload(locationEditDraft),
        method: "PATCH",
        path: `/api/v1/desktop/locations/${id}`,
      });
      setLocationDetail(next);
      setLocationEditDraft(locationDraftFromDetail(next));
      setLastSync(next.serverTime);
      if (view === "locations") {
        await loadLocations();
      } else {
        await loadModule(route);
      }
    } catch (loadError) {
      setLocationDetailError(String(loadError));
    } finally {
      setLocationDetailSaving(false);
    }
  }

  async function openPaymentDetail(id: string) {
    setSelectedPaymentId(id);
    setPaymentDetail(null);
    setPaymentDetailError("");
    setPaymentDetailLoading(true);
    try {
      const next = await desktopApiRequest<PaymentDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/payments/${id}`,
      });
      setPaymentDetail(next);
      setLastSync(next.serverTime);
    } catch (loadError) {
      setPaymentDetailError(String(loadError));
    } finally {
      setPaymentDetailLoading(false);
    }
  }

  async function openReviewDetail(id: string) {
    setSelectedReviewId(id);
    setReviewDetail(null);
    setReviewDetailError("");
    setReviewDetailLoading(true);
    try {
      const next = await desktopApiRequest<ReviewDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/reviews/${id}`,
      });
      setReviewDetail(next);
      setReviewReplyDraft(next.review.ownerReply ?? "");
      setLastSync(next.serverTime);
    } catch (loadError) {
      setReviewDetailError(String(loadError));
    } finally {
      setReviewDetailLoading(false);
    }
  }

  async function openDealDetail(id: string) {
    setSelectedDealId(id);
    setDealDetail(null);
    setDealDetailError("");
    setDealDetailLoading(true);
    try {
      const next = await desktopApiRequest<DealDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/deals/${id}`,
      });
      setDealDetail(next);
      setLastSync(next.serverTime);
    } catch (loadError) {
      setDealDetailError(String(loadError));
    } finally {
      setDealDetailLoading(false);
    }
  }

  async function openBroadcastDetail(id: string) {
    setSelectedBroadcastId(id);
    setBroadcastDetail(null);
    setBroadcastDetailError("");
    setBroadcastDetailLoading(true);
    try {
      const next = await desktopApiRequest<BroadcastDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/broadcasts/${id}`,
      });
      setBroadcastDetail(next);
      setLastSync(next.serverTime);
    } catch (loadError) {
      setBroadcastDetailError(String(loadError));
    } finally {
      setBroadcastDetailLoading(false);
    }
  }

  async function openMarketingDetail(id: string) {
    setSelectedMarketingId(id);
    setMarketingDetail(null);
    setMarketingDetailError("");
    setMarketingDetailLoading(true);
    try {
      const next = await desktopApiRequest<MarketingDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/marketing/${id}`,
      });
      setMarketingDetail(next);
      setLastSync(next.serverTime);
    } catch (loadError) {
      setMarketingDetailError(String(loadError));
    } finally {
      setMarketingDetailLoading(false);
    }
  }

  async function updateMarketingContentDetail(id: string, action: "approve" | "publish") {
    setMarketingDetailSaving(true);
    setMarketingDetailError("");
    try {
      const next = await desktopApiRequest<MarketingDetailPayload>({
        body: { action },
        method: "PATCH",
        path: `/api/v1/desktop/marketing/${id}`,
      });
      setMarketingDetail(next);
      setLastSync(next.serverTime);
      if (view === "marketing") {
        await loadMarketing();
      } else {
        await loadModule(route);
      }
    } catch (loadError) {
      setMarketingDetailError(String(loadError));
    } finally {
      setMarketingDetailSaving(false);
    }
  }

  async function openAiRunDetail(id: string) {
    setSelectedAiRunId(id);
    setAiRunDetail(null);
    setAiRunDetailError("");
    setAiRunDetailLoading(true);
    try {
      const next = await desktopApiRequest<AiWorkflowRunDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/ai/${id}`,
      });
      setAiRunDetail(next);
      setLastSync(next.serverTime);
    } catch (loadError) {
      setAiRunDetailError(String(loadError));
    } finally {
      setAiRunDetailLoading(false);
    }
  }

  async function updateAiLocationFeature(locationId: string, feature: AiFeatureKey, enabled: boolean) {
    setAiActionSaving(`location:${locationId}:${feature}`);
    setAiRunsError("");
    try {
      const next = await desktopApiRequest<{
        aiConfig: Record<AiFeatureKey, boolean>;
        locationId: string;
        serverTime: string;
      }>({
        body: { [feature]: enabled },
        method: "PATCH",
        path: `/api/v1/desktop/ai/locations/${locationId}`,
      });
      setAiRunsData((current) => current
        ? {
            ...current,
            locations: current.locations.map((location) =>
              location.id === next.locationId ? { ...location, aiConfig: next.aiConfig } : location
            ),
            serverTime: next.serverTime,
          }
        : current);
      setLastSync(next.serverTime);
    } catch (loadError) {
      setAiRunsError(String(loadError));
    } finally {
      setAiActionSaving(null);
    }
  }

  async function generateAiContent(locationId?: string) {
    setAiActionSaving("content:generate");
    setAiRunsError("");
    try {
      const next = await desktopApiRequest<{
        items: AiHubContentItem[];
        serverTime: string;
      }>({
        body: locationId ? { locationId } : {},
        method: "POST",
        path: "/api/v1/desktop/ai/content",
      });
      setAiRunsData((current) => current ? { ...current, content: next.items, serverTime: next.serverTime } : current);
      setLastSync(next.serverTime);
      await loadAiRuns();
    } catch (loadError) {
      setAiRunsError(String(loadError));
    } finally {
      setAiActionSaving(null);
    }
  }

  async function updateAiContent(id: string, action: "approve" | "publish") {
    setAiActionSaving(`content:${id}:${action}`);
    setAiRunsError("");
    try {
      const next = await desktopApiRequest<{
        item: AiHubContentItem;
        serverTime: string;
      }>({
        body: { action },
        method: "PATCH",
        path: `/api/v1/desktop/ai/content/${id}`,
      });
      setAiRunsData((current) => current
        ? {
            ...current,
            content: current.content.map((item) => item.id === next.item.id ? next.item : item),
            serverTime: next.serverTime,
          }
        : current);
      setLastSync(next.serverTime);
      if (marketingData?.rows.some((row) => row.id === id)) {
        await loadMarketing();
      }
    } catch (loadError) {
      setAiRunsError(String(loadError));
    } finally {
      setAiActionSaving(null);
    }
  }

  async function runAiReactivation() {
    setAiActionSaving("reactivation:run");
    setAiRunsError("");
    setAiReactivationResult(null);
    try {
      const next = await desktopApiRequest<AiReactivationResult & { serverTime: string }>({
        body: {},
        method: "POST",
        path: "/api/v1/desktop/ai/reactivate",
      });
      setAiReactivationResult(next);
      setLastSync(next.serverTime);
      await loadAiRuns();
    } catch (loadError) {
      setAiRunsError(String(loadError));
    } finally {
      setAiActionSaving(null);
    }
  }

  async function openAutomationDetail(id: string) {
    setSelectedAutomationId(id);
    setAutomationDetail(null);
    setAutomationDetailError("");
    setAutomationDetailLoading(true);
    try {
      const next = await desktopApiRequest<AutomationDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/automations/${id}`,
      });
      setAutomationDetail(next);
      setLastSync(next.serverTime);
    } catch (loadError) {
      setAutomationDetailError(String(loadError));
    } finally {
      setAutomationDetailLoading(false);
    }
  }

  async function updateAutomationDetail(id: string, body: { isActive?: boolean }) {
    setAutomationDetailSaving(true);
    setAutomationDetailError("");
    try {
      const next = await desktopApiRequest<AutomationDetailPayload>({
        body,
        method: "PATCH",
        path: `/api/v1/desktop/automations/${id}`,
      });
      setAutomationDetail(next);
      setLastSync(next.serverTime);
      if (view === "automations") {
        await loadAutomations();
      } else {
        await loadModule(route);
      }
    } catch (loadError) {
      setAutomationDetailError(String(loadError));
    } finally {
      setAutomationDetailSaving(false);
    }
  }

  async function openIntegrationDetail(id: string) {
    setSelectedIntegrationId(id);
    setIntegrationDetail(null);
    setIntegrationDetailError("");
    setIntegrationDetailLoading(true);
    try {
      const next = await desktopApiRequest<IntegrationDetailPayload>({
        method: "GET",
        path: `/api/v1/desktop/integrations/${id}`,
      });
      setIntegrationDetail(next);
      setLastSync(next.serverTime);
    } catch (loadError) {
      setIntegrationDetailError(String(loadError));
    } finally {
      setIntegrationDetailLoading(false);
    }
  }

  async function loadSettings() {
    setSettingsLoading(true);
    setSettingsError("");
    try {
      const next = await desktopApiRequest<DesktopSettingsPayload>({
        method: "GET",
        path: "/api/v1/desktop/settings",
      });
      setSettingsData(next);
      setSettingsDraft(settingsDraftFromData(next, business));
      setLastSync(next.serverTime);
      writeOfflineCache(offlineCacheKey("settings"), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopSettingsPayload>(
        offlineCacheKey("settings"),
        "settings",
        loadError,
        (cached) => {
          setSettingsData(cached);
          setSettingsDraft(settingsDraftFromData(cached, business));
          setLastSync(cached.serverTime);
        },
        setSettingsError,
      );
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadBilling() {
    setBillingLoading(true);
    setBillingError("");
    try {
      const next = await desktopApiRequest<DesktopBillingPayload>({
        method: "GET",
        path: "/api/v1/desktop/billing",
      });
      setBillingData(next);
      setLastSync(next.serverTime);
      writeOfflineCache(offlineCacheKey("billing"), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopBillingPayload>(
        offlineCacheKey("billing"),
        "billing",
        loadError,
        (cached) => {
          setBillingData(cached);
          setLastSync(cached.serverTime);
        },
        setBillingError,
      );
    } finally {
      setBillingLoading(false);
    }
  }

  async function loadReports(nextFrom = reportsFrom, nextTo = reportsTo) {
    setReportsLoading(true);
    setReportsError("");
    try {
      const path = buildDesktopApiPath("/api/v1/desktop/reports", {
        from: nextFrom,
        to: nextTo,
      });
      const next = await desktopApiRequest<DesktopReportsPayload>({
        method: "GET",
        path,
      });
      setReportsData(next);
      setReportsFrom(next.range.from);
      setReportsTo(next.range.to);
      setLastSync(next.serverTime);
      writeOfflineCache(reportsCacheKey(nextFrom, nextTo), next);
      setOfflineNotice("");
    } catch (loadError) {
      restoreCachedRead<DesktopReportsPayload>(
        reportsCacheKey(nextFrom, nextTo),
        "reports",
        loadError,
        (cached) => {
          setReportsData(cached);
          setReportsFrom(cached.range.from);
          setReportsTo(cached.range.to);
          setLastSync(cached.serverTime);
        },
        setReportsError,
      );
    } finally {
      setReportsLoading(false);
    }
  }

  async function saveSettingsDraft() {
    if (!settingsDraft) return;
    setSettingsSaving(true);
    setSettingsError("");
    try {
      const next = await desktopApiRequest<DesktopSettingsPayload>({
        body: { business: settingsDraftToPayload(settingsDraft) },
        method: "PATCH",
        path: "/api/v1/desktop/settings",
      });
      setSettingsData(next);
      setSettingsDraft(settingsDraftFromData(next, business));
      setLastSync(next.serverTime);
      writeOfflineCache(offlineCacheKey("settings"), next);
      setOfflineNotice("");
    } catch (loadError) {
      setSettingsError(String(loadError));
    } finally {
      setSettingsSaving(false);
    }
  }

  async function revokeCurrentDevice() {
    setSettingsSaving(true);
    setSettingsError("");
    try {
      await desktopApiRequest<{ revoked: boolean; revokedKeyId: string; serverTime: string }>({
        body: { revokeCurrentDevice: true },
        method: "PATCH",
        path: "/api/v1/desktop/settings",
      });
      await logout();
    } catch (loadError) {
      setSettingsError(String(loadError));
    } finally {
      setSettingsSaving(false);
    }
  }

  async function updateReviewDetail(id: string, body: { isPublished?: boolean; ownerReply?: string | null }) {
    setReviewDetailSaving(true);
    setReviewDetailError("");
    try {
      const next = await desktopApiRequest<ReviewDetailPayload>({
        body,
        method: "PATCH",
        path: `/api/v1/desktop/reviews/${id}`,
      });
      setReviewDetail(next);
      setReviewReplyDraft(next.review.ownerReply ?? "");
      setLastSync(next.serverTime);
      await loadReviews();
    } catch (loadError) {
      setReviewDetailError(String(loadError));
    } finally {
      setReviewDetailSaving(false);
    }
  }

  async function login(email: string, password: string) {
    setError("");
    const payload = await invoke<LoginPayload>("desktop_auth_login", {
      payload: {
        deviceName: navigator.userAgent.includes("Windows") ? "Windows PC" : "Desktop",
        email,
        password,
      },
    });
    setBusiness(payload.business);
    setAuthReady(true);
    setView("overview");
    setTab("today");
    await runSync("today");
  }

  async function logout() {
    await invoke("desktop_logout").catch(() => undefined);
    clearOfflineReadCache();
    setAuthReady(false);
    setBusiness(null);
    setRows([]);
    setDetail(null);
    setSelectedId(null);
    setClientsData(null);
    setClientsError("");
    setClientsQuery("");
    setClientsStageFilter("all");
    setClientDetail(null);
    setClientDetailError("");
    setClientEditDraft(null);
    setClientDetailSaving(false);
    setClientNoteDraft("");
    setSelectedClientId(null);
    setServicesData(null);
    setServicesError("");
    setServicesQuery("");
    setServicesStatusFilter("all");
    setServiceDetail(null);
    setServiceEditDraft(null);
    setServiceDetailError("");
    setSelectedServiceId(null);
    setStaffData(null);
    setStaffError("");
    setStaffQuery("");
    setStaffStatusFilter("all");
    setStaffDetail(null);
    setStaffEditDraft(null);
    setStaffDetailError("");
    setSelectedStaffId(null);
    setLocationsData(null);
    setLocationsError("");
    setLocationsQuery("");
    setLocationsStatusFilter("all");
    setLocationDetail(null);
    setLocationEditDraft(null);
    setLocationDetailError("");
    setSelectedLocationId(null);
    setAvailabilityData(null);
    setAvailabilityError("");
    setSelectedAvailabilityStaffId(null);
    setPaymentsData(null);
    setPaymentsError("");
    setPaymentsQuery("");
    setPaymentsStatusFilter("all");
    setPaymentDetail(null);
    setPaymentDetailError("");
    setSelectedPaymentId(null);
    setReviewsData(null);
    setReviewsError("");
    setReviewsQuery("");
    setReviewsRatingFilter("all");
    setReviewsStatusFilter("all");
    setReviewDetail(null);
    setReviewDetailError("");
    setReviewReplyDraft("");
    setSelectedReviewId(null);
    setDealsData(null);
    setDealsError("");
    setDealsQuery("");
    setDealsStatusFilter("all");
    setDealDetail(null);
    setDealDetailError("");
    setSelectedDealId(null);
    setBroadcastsData(null);
    setBroadcastsError("");
    setBroadcastsQuery("");
    setBroadcastsStatusFilter("all");
    setBroadcastsChannelFilter("all");
    setBroadcastDetail(null);
    setBroadcastDetailError("");
    setSelectedBroadcastId(null);
    setMarketingData(null);
    setMarketingError("");
    setMarketingQuery("");
    setMarketingStatusFilter("all");
    setMarketingDetail(null);
    setMarketingDetailError("");
    setSelectedMarketingId(null);
    setAiRunsData(null);
    setAiRunsError("");
    setAiRunsQuery("");
    setAiRunsStatusFilter("all");
    setAiRunDetail(null);
    setAiRunDetailError("");
    setSelectedAiRunId(null);
    setAiActionSaving(null);
    setAiReactivationResult(null);
    setAutomationsData(null);
    setAutomationsError("");
    setAutomationsQuery("");
    setAutomationsStatusFilter("all");
    setAutomationDetail(null);
    setAutomationDetailError("");
    setSelectedAutomationId(null);
    setIntegrationsData(null);
    setIntegrationsError("");
    setIntegrationsQuery("");
    setIntegrationsStatusFilter("all");
    setIntegrationDetail(null);
    setIntegrationDetailError("");
    setSelectedIntegrationId(null);
    setSettingsData(null);
    setSettingsError("");
    setSettingsDraft(null);
    setBillingData(null);
    setBillingError("");
    setReportsData(null);
    setReportsError("");
    setOfflineNotice("");
  }

  function openRoute(nextRoute: DashboardRoute) {
    setView(nextRoute.id);
    if (nextRoute.id !== "clients") {
      setClientsError("");
      setClientDetail(null);
      setClientDetailError("");
      setClientEditDraft(null);
      setClientDetailSaving(false);
      setClientNoteDraft("");
      setSelectedClientId(null);
    }
    if (nextRoute.id !== "services") {
      setServicesError("");
      setServiceDetail(null);
      setServiceEditDraft(null);
      setServiceDetailError("");
      setSelectedServiceId(null);
    }
    if (nextRoute.id !== "staff") {
      setStaffError("");
      setStaffDetail(null);
      setStaffEditDraft(null);
      setStaffDetailError("");
      setSelectedStaffId(null);
    }
    if (nextRoute.id !== "locations") {
      setLocationsError("");
      setLocationDetail(null);
      setLocationEditDraft(null);
      setLocationDetailError("");
      setSelectedLocationId(null);
    }
    if (nextRoute.id !== "availability") {
      setAvailabilityError("");
      setSelectedAvailabilityStaffId(null);
    }
    if (nextRoute.id !== "payments") {
      setPaymentsError("");
      setPaymentDetail(null);
      setPaymentDetailError("");
      setSelectedPaymentId(null);
    }
    if (nextRoute.id !== "reviews") {
      setReviewsError("");
      setReviewDetail(null);
      setReviewDetailError("");
      setReviewReplyDraft("");
      setSelectedReviewId(null);
    }
    if (nextRoute.id !== "deals") {
      setDealsError("");
      setDealDetail(null);
      setDealDetailError("");
      setSelectedDealId(null);
    }
    if (nextRoute.id !== "broadcasts") {
      setBroadcastsError("");
      setBroadcastDetail(null);
      setBroadcastDetailError("");
      setSelectedBroadcastId(null);
    }
    if (nextRoute.id !== "marketing") {
      setMarketingError("");
      setMarketingDetail(null);
      setMarketingDetailError("");
      setSelectedMarketingId(null);
    }
    if (nextRoute.id !== "aiHub") {
      setAiRunsError("");
      setAiRunDetail(null);
      setAiRunDetailError("");
      setSelectedAiRunId(null);
      setAiActionSaving(null);
    }
    if (nextRoute.id !== "automations") {
      setAutomationsError("");
      setAutomationDetail(null);
      setAutomationDetailError("");
      setSelectedAutomationId(null);
    }
    if (nextRoute.id !== "integrations") {
      setIntegrationsError("");
      setIntegrationDetail(null);
      setIntegrationDetailError("");
      setSelectedIntegrationId(null);
    }
    if (nextRoute.id === "overview") {
      setTab("today");
      void runSync("today");
    } else if (nextRoute.id === "calendar") {
      void loadCalendar();
    } else if (nextRoute.id === "bookings") {
      void runSync(tab);
    } else if (nextRoute.id === "clients") {
      void loadClients();
    } else if (nextRoute.id === "services") {
      void loadServices();
    } else if (nextRoute.id === "staff") {
      void loadStaff();
    } else if (nextRoute.id === "locations") {
      void loadLocations();
    } else if (nextRoute.id === "availability") {
      void loadAvailability();
    } else if (nextRoute.id === "billing") {
      void loadBilling();
    } else if (nextRoute.id === "reports") {
      void loadReports();
    } else if (nextRoute.id === "settings") {
      void loadSettings();
    } else if (nextRoute.id === "payments") {
      void loadPayments();
    } else if (nextRoute.id === "reviews") {
      void loadReviews();
    } else if (nextRoute.id === "deals") {
      void loadDeals();
    } else if (nextRoute.id === "broadcasts") {
      void loadBroadcasts();
    } else if (nextRoute.id === "marketing") {
      void loadMarketing();
    } else if (nextRoute.id === "aiHub") {
      void loadAiRuns();
    } else if (nextRoute.id === "automations") {
      void loadAutomations();
    } else if (nextRoute.id === "integrations") {
      void loadIntegrations();
    } else {
      void loadModule(nextRoute);
    }
  }

  function refreshCurrentView() {
    if (view === "calendar") {
      void loadCalendar();
      return;
    }
    if (view === "availability") {
      void loadAvailability();
      return;
    }
    if (view === "settings") {
      void loadSettings();
      return;
    }
    if (view === "billing") {
      void loadBilling();
      return;
    }
    if (view === "reports") {
      void loadReports();
      return;
    }
    if (view === "payments") {
      void loadPayments();
      return;
    }
    if (view === "clients") {
      void loadClients();
      return;
    }
    if (view === "services") {
      void loadServices();
      return;
    }
    if (view === "staff") {
      void loadStaff();
      return;
    }
    if (view === "locations") {
      void loadLocations();
      return;
    }
    if (view === "reviews") {
      void loadReviews();
      return;
    }
    if (view === "deals") {
      void loadDeals();
      return;
    }
    if (view === "broadcasts") {
      void loadBroadcasts();
      return;
    }
    if (view === "marketing") {
      void loadMarketing();
      return;
    }
    if (view === "aiHub") {
      void loadAiRuns();
      return;
    }
    if (view === "automations") {
      void loadAutomations();
      return;
    }
    if (view === "integrations") {
      void loadIntegrations();
      return;
    }
    if (view === "overview" || view === "bookings") {
      void runSync(tab);
      return;
    }
    void loadModule(route);
  }

  async function copyBookingLink() {
    const url = publicBookingUrl(business);
    await navigator.clipboard?.writeText(url);
  }

  function exportDaySheet() {
    const dayRows = view === "overview" ? visibleRows : rows.filter((row) => isActiveDailyStatus(row.status));
    const clock = new Date();
    const nextBooking = nextBookingForRows(dayRows, clock);
    downloadTextFile(
      bookingExportFilename(business, "living-day-sheet"),
      daySheetCsv({
        business,
        clock,
        lastSync,
        metrics,
        nextBooking,
        rows: dayRows,
        staff,
      }),
    );
    logDesktopRuntimeEvent("info", "frontend.export", "Exported living day sheet CSV", {
      count: dayRows.length,
    });
  }

  function printDaySheet() {
    const dayRows = view === "overview" ? visibleRows : rows.filter((row) => isActiveDailyStatus(row.status));
    const clock = new Date();
    printDaySheetDocument({
      business,
      clock,
      lastSync,
      metrics,
      nextBooking: nextBookingForRows(dayRows, clock),
      rows: dayRows,
      staff,
    });
    logDesktopRuntimeEvent("info", "frontend.print", "Opened living day sheet print view", {
      count: dayRows.length,
    });
  }

  function exportBookingsList() {
    downloadTextFile(
      bookingExportFilename(business, `${tab}-bookings`),
      bookingRowsCsv(visibleRows),
    );
    logDesktopRuntimeEvent("info", "frontend.export", "Exported bookings CSV", {
      count: visibleRows.length,
      tab,
    });
  }

  function printBookingsList() {
    printBookingsDocument(
      `${tab[0].toUpperCase() + tab.slice(1)} bookings`,
      visibleRows,
      `${business?.name ?? "Dinaya"} - ${visibleRows.length} bookings - generated ${formatDateTime(new Date().toISOString())}`,
    );
    logDesktopRuntimeEvent("info", "frontend.print", "Opened bookings print view", {
      count: visibleRows.length,
      tab,
    });
  }

  function exportCurrentView() {
    if (view === "overview") {
      exportDaySheet();
      return;
    }
    exportBookingsList();
  }

  function printCurrentView() {
    if (view === "overview") {
      printDaySheet();
      return;
    }
    printBookingsList();
  }

  const openCommandPalette = useCallback(() => {
    setCommandOpen(true);
    setCommandQuery("");
    setCommandIndex(0);
  }, []);

  function runCommand(item: CommandPaletteItem) {
    setCommandOpen(false);
    setCommandQuery("");
    setCommandIndex(0);

    if (item.route) {
      openRoute(item.route);
      return;
    }

    if (item.action === "copy-booking-link") {
      void copyBookingLink();
      return;
    }

    if (item.action === "refresh") {
      refreshCurrentView();
      return;
    }

    if (item.action === "export-current-csv") {
      exportCurrentView();
      return;
    }

    if (item.action === "print-current-view") {
      printCurrentView();
      return;
    }

    if (item.action === "open-current-web") {
      void invoke("desktop_open_dashboard_path", { path: route.href });
      return;
    }

    if (item.action === "open-web-dashboard") {
      void invoke("desktop_open_dashboard");
      return;
    }

    if (item.action === "log-out") {
      void logout();
    }
  }

  function applyGlobalSearch() {
    if (view !== "overview" && view !== "bookings") {
      setView("bookings");
    }
    void runSync(tab);
  }

  const commandItems = useMemo<CommandPaletteItem[]>(() => {
    const routeItems = dashboardRouteGroups.flatMap((group) => (
      group.routes.map((routeItem) => ({
        group: group.label,
        id: `route:${routeItem.id}`,
        keywords: [routeItem.href, routeItem.nativeStatus, `phase ${routeItem.desktopPhase}`],
        route: routeItem,
        subtitle: routeItem.summary,
        title: routeItem.label,
      }))
    ));

    return [
      ...routeItems,
      {
        action: "refresh",
        group: "Actions",
        id: "action:refresh",
        keywords: ["sync", "reload", route.label],
        subtitle: `Refresh ${route.label}`,
        title: "Refresh current view",
      },
      {
        action: "export-current-csv",
        group: "Actions",
        id: "action:export-current-csv",
        keywords: ["csv", "download", "export", route.label, tab],
        subtitle: view === "overview" ? "Download the Living Day Sheet CSV" : "Download the current bookings CSV",
        title: "Export CSV",
      },
      {
        action: "print-current-view",
        group: "Actions",
        id: "action:print-current-view",
        keywords: ["print", "pdf", "day sheet", "bookings", route.label, tab],
        subtitle: view === "overview" ? "Print the Living Day Sheet" : "Print the current bookings list",
        title: "Print current view",
      },
      {
        action: "copy-booking-link",
        group: "Actions",
        id: "action:copy-link",
        keywords: ["share", "public", "booking", business?.slug ?? ""],
        subtitle: publicBookingUrl(business),
        title: "Copy booking link",
      },
      {
        action: "open-current-web",
        group: "Fallbacks",
        id: "action:open-current-web",
        keywords: ["browser", "web", route.href],
        subtitle: route.href,
        title: "Open current web page",
      },
      {
        action: "open-web-dashboard",
        group: "Fallbacks",
        id: "action:open-dashboard",
        keywords: ["browser", "web", "dashboard"],
        subtitle: "Open the web dashboard in your browser",
        title: "Open web dashboard",
      },
      {
        action: "log-out",
        group: "Account",
        id: "action:log-out",
        keywords: ["sign out", "device", "session"],
        subtitle: "Clear local desktop auth and cached reads",
        title: "Log out",
      },
    ];
  }, [business, route, tab, view]);

  const filteredCommands = useMemo(
    () => commandItems.filter((item) => commandMatches(item, commandQuery)).slice(0, 18),
    [commandItems, commandQuery],
  );

  useEffect(() => {
    logDesktopRuntimeEvent("info", "startup", "frontend render ready", {
      initialView: "overview",
      routeCount: dashboardRouteGroups.reduce((count, group) => count + group.routes.length, 0),
    });
  }, []);

  useEffect(() => {
    setCommandIndex(0);
  }, [commandOpen, commandQuery]);

  useEffect(() => {
    if (!commandOpen) return;
    const timer = window.setTimeout(() => commandInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [commandOpen]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette();
      }
      if (event.key === "Escape" && commandOpen) {
        event.preventDefault();
        setCommandOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [commandOpen, openCommandPalette]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listen("desktop-open-command-palette", () => {
      openCommandPalette();
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten?.();
    };
  }, [openCommandPalette]);

  useEffect(() => {
    async function boot() {
      const hasKey = await invoke<boolean>("desktop_auth_has_key").catch(() => false);
      if (!hasKey) {
        setBooting(false);
        setAuthReady(false);
        return;
      }
      await runSync("today");
      const pending = await invoke<string | null>("desktop_take_pending_booking").catch(() => null);
      if (pending) await openDetail(pending);
    }
    void boot();
    // Boot must run once; subsequent syncs are handled by the interval below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (authReady && !syncing && (view === "overview" || view === "bookings")) {
        void runSync(tab);
      } else if (authReady && !calendarLoading && view === "calendar") {
        void loadCalendar();
      } else if (authReady && !availabilityLoading && view === "availability") {
        void loadAvailability();
      } else if (authReady && !clientsLoading && view === "clients") {
        void loadClients();
      } else if (authReady && !servicesLoading && view === "services") {
        void loadServices();
      } else if (authReady && !staffLoading && view === "staff") {
        void loadStaff();
      } else if (authReady && !locationsLoading && view === "locations") {
        void loadLocations();
      } else if (authReady && !paymentsLoading && view === "payments") {
        void loadPayments();
      } else if (authReady && !reviewsLoading && view === "reviews") {
        void loadReviews();
      } else if (authReady && !dealsLoading && view === "deals") {
        void loadDeals();
      } else if (authReady && !broadcastsLoading && view === "broadcasts") {
        void loadBroadcasts();
      } else if (authReady && !marketingLoading && view === "marketing") {
        void loadMarketing();
      } else if (authReady && !aiRunsLoading && view === "aiHub") {
        void loadAiRuns();
      } else if (authReady && !automationsLoading && view === "automations") {
        void loadAutomations();
      } else if (authReady && !integrationsLoading && view === "integrations") {
        void loadIntegrations();
      }
    }, 45_000);
    return () => window.clearInterval(timer);
    // Recreate the polling timer only when user-controlled sync inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiRunsLoading, aiRunsQuery, aiRunsStatusFilter, authReady, automationsLoading, automationsQuery, automationsStatusFilter, availabilityLoading, broadcastsChannelFilter, broadcastsLoading, broadcastsQuery, broadcastsStatusFilter, calendarDate, calendarLoading, calendarMode, calendarStaffFilter, clientsLoading, clientsQuery, clientsStageFilter, dealsLoading, dealsQuery, dealsStatusFilter, integrationsLoading, integrationsQuery, integrationsStatusFilter, locationsLoading, locationsQuery, locationsStatusFilter, marketingLoading, marketingQuery, marketingStatusFilter, paymentsLoading, paymentsQuery, paymentsStatusFilter, reviewsLoading, reviewsQuery, reviewsRatingFilter, reviewsStatusFilter, servicesLoading, servicesQuery, servicesStatusFilter, staffLoading, staffQuery, staffStatusFilter, syncing, tab, query, staffFilter, statusFilter, view]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listen<{ id?: string }>("desktop-open-booking", (event) => {
      const id = event.payload?.id;
      if (id) {
        setView("bookings");
        void openDetail(id);
      }
    }).then((handler) => {
      unlisten = handler;
    });
    return () => unlisten?.();
  }, []);

  useEffect(() => {
    if (authReady && view === "calendar" && !calendarData && !calendarLoading) {
      void loadCalendar();
      return;
    }

    if (authReady && view === "availability" && !availabilityData && !availabilityLoading) {
      void loadAvailability();
      return;
    }

    if (authReady && view === "settings" && !settingsData && !settingsLoading) {
      void loadSettings();
      return;
    }

    if (authReady && view === "billing" && !billingData && !billingLoading) {
      void loadBilling();
      return;
    }

    if (authReady && view === "reports" && !reportsData && !reportsLoading) {
      void loadReports();
      return;
    }

    if (authReady && view === "payments" && !paymentsData && !paymentsLoading) {
      void loadPayments();
      return;
    }

    if (authReady && view === "clients" && !clientsData && !clientsLoading) {
      void loadClients();
      return;
    }

    if (authReady && view === "services" && !servicesData && !servicesLoading) {
      void loadServices();
      return;
    }

    if (authReady && view === "staff" && !staffData && !staffLoading) {
      void loadStaff();
      return;
    }

    if (authReady && view === "locations" && !locationsData && !locationsLoading) {
      void loadLocations();
      return;
    }

    if (authReady && view === "reviews" && !reviewsData && !reviewsLoading) {
      void loadReviews();
      return;
    }

    if (authReady && view === "deals" && !dealsData && !dealsLoading) {
      void loadDeals();
      return;
    }

    if (authReady && view === "broadcasts" && !broadcastsData && !broadcastsLoading) {
      void loadBroadcasts();
      return;
    }

    if (authReady && view === "marketing" && !marketingData && !marketingLoading) {
      void loadMarketing();
      return;
    }

    if (authReady && view === "aiHub" && !aiRunsData && !aiRunsLoading) {
      void loadAiRuns();
      return;
    }

    if (authReady && view === "automations" && !automationsData && !automationsLoading) {
      void loadAutomations();
      return;
    }

    if (authReady && view === "integrations" && !integrationsData && !integrationsLoading) {
      void loadIntegrations();
      return;
    }

    if (
      authReady &&
      view !== "overview" &&
      view !== "calendar" &&
      view !== "availability" &&
      view !== "bookings" &&
      view !== "billing" &&
      view !== "clients" &&
      view !== "services" &&
      view !== "staff" &&
      view !== "locations" &&
      view !== "payments" &&
      view !== "reviews" &&
      view !== "deals" &&
      view !== "broadcasts" &&
      view !== "marketing" &&
      view !== "aiHub" &&
      view !== "automations" &&
      view !== "integrations" &&
      view !== "reports" &&
      view !== "settings" &&
      !moduleData[view] &&
      !moduleLoading
    ) {
      void loadModule(route);
    }
    // Module data is loaded on route entry; filters/search do not affect these summaries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, view]);

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="app-mark">D</div>
        <p>Starting Dinaya Desktop...</p>
      </div>
    );
  }

  if (!authReady) {
    return <LoginScreen error={error} onLogin={login} />;
  }

  return (
    <div className="desktop-shell">
      <a className="skip-link" href="#desktop-main">
        Skip to dashboard content
      </a>
      <DashboardSidebar
        business={business}
        currentView={view}
        onRoute={openRoute}
      />

      <main id="desktop-main" className="main-pane" tabIndex={-1}>
        <header className="topbar glass-surface" aria-busy={syncing || moduleLoading || calendarLoading || availabilityLoading || clientsLoading || servicesLoading || staffLoading || locationsLoading || billingLoading || paymentsLoading || reviewsLoading || dealsLoading || broadcastsLoading || marketingLoading || aiRunsLoading || automationsLoading || integrationsLoading || reportsLoading}>
          <div className="topbar-title">
            <p className="eyebrow">{business?.name ?? "Dinaya"}</p>
            <h1>{route.label}</h1>
          </div>
          <div className="command-bar">
            <input
              aria-label="Search dashboard"
              placeholder="Search bookings, clients, services"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyGlobalSearch();
              }}
            />
            <button className="small" aria-haspopup="dialog" onClick={openCommandPalette}>
              Command
            </button>
            <button className="primary small" disabled={syncing || moduleLoading || calendarLoading || availabilityLoading || clientsLoading || servicesLoading || staffLoading || locationsLoading || billingLoading || paymentsLoading || reviewsLoading || dealsLoading || broadcastsLoading || marketingLoading || aiRunsLoading || automationsLoading || integrationsLoading || reportsLoading} onClick={refreshCurrentView}>
              {syncing || moduleLoading || calendarLoading || availabilityLoading || clientsLoading || servicesLoading || staffLoading || locationsLoading || billingLoading || paymentsLoading || reviewsLoading || dealsLoading || broadcastsLoading || marketingLoading || aiRunsLoading || automationsLoading || integrationsLoading || reportsLoading ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </header>

        {error && <div className="error-banner" aria-live="assertive" role="alert">{error}</div>}
        {offlineNotice && <div className="offline-banner" aria-live="polite" role="status">{offlineNotice}</div>}

        {view === "overview" ? (
          <OverviewView
            business={business}
            lastSync={lastSync}
            metrics={metrics}
            rows={visibleRows}
            staff={staff}
            onCopyBookingLink={() => void copyBookingLink()}
            onExportDaySheet={exportDaySheet}
            onOpenBooking={(id) => void openDetail(id)}
            onOpenBookings={() => setView("bookings")}
            onPrintDaySheet={printDaySheet}
          />
        ) : view === "calendar" ? (
          <CalendarWorkspace
            data={calendarData}
            date={calendarDate}
            detail={detail}
            error={calendarError}
            loading={calendarLoading}
            mode={calendarMode}
            selectedId={selectedId}
            staff={staff}
            staffFilter={calendarStaffFilter}
            onDate={(nextDate) => {
              setCalendarDate(nextDate);
              void loadCalendar(calendarMode, nextDate, calendarStaffFilter);
            }}
            onMode={(nextMode) => {
              setCalendarMode(nextMode);
              void loadCalendar(nextMode, calendarDate, calendarStaffFilter);
            }}
            onNext={() => {
              const nextDate = shiftDate(calendarDate, calendarMode === "week" ? 7 : 1);
              setCalendarDate(nextDate);
              void loadCalendar(calendarMode, nextDate, calendarStaffFilter);
            }}
            onOpenBooking={(id) => void openDetail(id)}
            onOpenWeb={(id) => void invoke("desktop_open_booking_web", { id })}
            onPrevious={() => {
              const nextDate = shiftDate(calendarDate, calendarMode === "week" ? -7 : -1);
              setCalendarDate(nextDate);
              void loadCalendar(calendarMode, nextDate, calendarStaffFilter);
            }}
            onRefresh={() => void loadCalendar()}
            onStaffFilter={(nextStaff) => {
              setCalendarStaffFilter(nextStaff);
              void loadCalendar(calendarMode, calendarDate, nextStaff);
            }}
            onStatus={(id, status) => void updateStatus(id, status)}
            onToday={() => {
              const today = dateInputValue();
              setCalendarDate(today);
              void loadCalendar(calendarMode, today, calendarStaffFilter);
            }}
          />
        ) : view === "availability" ? (
          <AvailabilityWorkspace
            data={availabilityData}
            draft={availabilityDraft}
            error={availabilityError}
            loading={availabilityLoading}
            overrideDraft={availabilityOverrideDraft}
            saving={availabilitySaving}
            selectedStaffId={selectedAvailabilityStaffId}
            onDraft={setAvailabilityDraft}
            onOverrideDelete={(staffId, overrideId) => void deleteAvailabilityOverride(staffId, overrideId)}
            onOverrideDraft={setAvailabilityOverrideDraft}
            onOverrideSave={(staffId) => void upsertAvailabilityOverride(staffId)}
            onOpenWeb={() => void invoke("desktop_open_dashboard_path", { path: "/dashboard/availability" })}
            onRefresh={() => void loadAvailability()}
            onSave={(staffId) => void updateAvailabilityWindows(staffId)}
            onSelectStaff={selectAvailabilityStaff}
          />
        ) : view === "bookings" ? (
          <BookingsWorkspace
            detail={detail}
            rows={visibleRows}
            selectedId={selectedId}
            staff={staff}
            staffFilter={staffFilter}
            statusFilter={statusFilter}
            tab={tab}
            onApply={() => void runSync(tab)}
            onExport={exportBookingsList}
            onOpenBooking={(id) => void openDetail(id)}
            onOpenWeb={(id) => void invoke("desktop_open_booking_web", { id })}
            onPrint={printBookingsList}
            onStaffFilter={setStaffFilter}
            onStatus={(id, status) => void updateStatus(id, status)}
            onStatusFilter={setStatusFilter}
            onTab={(next) => {
              setTab(next);
              void runSync(next);
            }}
          />
        ) : view === "clients" ? (
          <ClientsWorkspace
            data={clientsData}
            detail={clientDetail}
            detailError={clientDetailError}
            detailLoading={clientDetailLoading}
            editDraft={clientEditDraft}
            error={clientsError}
            loading={clientsLoading}
            noteDraft={clientNoteDraft}
            savingDetail={clientDetailSaving}
            noteSaving={clientNoteSaving}
            query={clientsQuery}
            selectedId={selectedClientId}
            stageFilter={clientsStageFilter}
            onApply={() => void loadClients()}
            onEditDraft={setClientEditDraft}
            onEditSave={(id) => void updateClientDetail(id)}
            onNoteDraft={setClientNoteDraft}
            onNoteSave={(id) => void addClientNote(id)}
            onOpenClient={(id) => void openClientDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setClientsQuery}
            onRefresh={() => void loadClients()}
            onStageFilter={(stage) => {
              setClientsStageFilter(stage);
              void loadClients(stage, clientsQuery);
            }}
          />
        ) : view === "services" ? (
          <ServicesWorkspace
            data={servicesData}
            detail={serviceDetail}
            detailError={serviceDetailError}
            detailLoading={serviceDetailLoading}
            draft={serviceEditDraft}
            error={servicesError}
            forceDeactivate={serviceForceDeactivate}
            loading={servicesLoading}
            query={servicesQuery}
            saving={serviceDetailSaving}
            selectedId={selectedServiceId}
            statusFilter={servicesStatusFilter}
            onApply={() => void loadServices()}
            onDraft={setServiceEditDraft}
            onForceDeactivate={setServiceForceDeactivate}
            onOpenService={(id) => void openServiceDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setServicesQuery}
            onRefresh={() => void loadServices()}
            onSave={(id) => void updateServiceDetail(id)}
            onStatusFilter={(status) => {
              setServicesStatusFilter(status);
              void loadServices(status, servicesQuery);
            }}
          />
        ) : view === "staff" ? (
          <StaffWorkspace
            data={staffData}
            detail={staffDetail}
            detailError={staffDetailError}
            detailLoading={staffDetailLoading}
            draft={staffEditDraft}
            error={staffError}
            loading={staffLoading}
            query={staffQuery}
            saving={staffDetailSaving}
            selectedId={selectedStaffId}
            statusFilter={staffStatusFilter}
            onApply={() => void loadStaff()}
            onDraft={setStaffEditDraft}
            onOpenStaff={(id) => void openStaffDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setStaffQuery}
            onRefresh={() => void loadStaff()}
            onSave={(id) => void updateStaffDetail(id)}
            onStatusFilter={(status) => {
              setStaffStatusFilter(status);
              void loadStaff(status, staffQuery);
            }}
          />
        ) : view === "locations" ? (
          <LocationsWorkspace
            data={locationsData}
            detail={locationDetail}
            detailError={locationDetailError}
            detailLoading={locationDetailLoading}
            draft={locationEditDraft}
            error={locationsError}
            loading={locationsLoading}
            query={locationsQuery}
            saving={locationDetailSaving}
            selectedId={selectedLocationId}
            statusFilter={locationsStatusFilter}
            onApply={() => void loadLocations()}
            onDraft={setLocationEditDraft}
            onOpenLocation={(id) => void openLocationDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setLocationsQuery}
            onRefresh={() => void loadLocations()}
            onSave={(id) => void updateLocationDetail(id)}
            onStatusFilter={(status) => {
              setLocationsStatusFilter(status);
              void loadLocations(status, locationsQuery);
            }}
          />
        ) : view === "billing" ? (
          <BillingView
            data={billingData}
            error={billingError}
            loading={billingLoading}
            onOpenPath={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onRefresh={() => void loadBilling()}
          />
        ) : view === "payments" ? (
          <PaymentsWorkspace
            data={paymentsData}
            detail={paymentDetail}
            detailError={paymentDetailError}
            detailLoading={paymentDetailLoading}
            error={paymentsError}
            loading={paymentsLoading}
            query={paymentsQuery}
            selectedId={selectedPaymentId}
            statusFilter={paymentsStatusFilter}
            onApply={() => void loadPayments()}
            onOpenPayment={(id) => void openPaymentDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setPaymentsQuery}
            onRefresh={() => void loadPayments()}
            onStatusFilter={(status) => {
              setPaymentsStatusFilter(status);
              void loadPayments(status, paymentsQuery);
            }}
          />
        ) : view === "reviews" ? (
          <ReviewsWorkspace
            data={reviewsData}
            detail={reviewDetail}
            detailError={reviewDetailError}
            detailLoading={reviewDetailLoading}
            error={reviewsError}
            loading={reviewsLoading}
            query={reviewsQuery}
            ratingFilter={reviewsRatingFilter}
            replyDraft={reviewReplyDraft}
            saving={reviewDetailSaving}
            selectedId={selectedReviewId}
            statusFilter={reviewsStatusFilter}
            onApply={() => void loadReviews()}
            onOpenReview={(id) => void openReviewDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setReviewsQuery}
            onRatingFilter={(rating) => {
              setReviewsRatingFilter(rating);
              void loadReviews(reviewsStatusFilter, rating, reviewsQuery);
            }}
            onRefresh={() => void loadReviews()}
            onReplyDraft={setReviewReplyDraft}
            onReplySave={(id) => void updateReviewDetail(id, { ownerReply: reviewReplyDraft })}
            onStatusFilter={(status) => {
              setReviewsStatusFilter(status);
              void loadReviews(status, reviewsRatingFilter, reviewsQuery);
            }}
            onTogglePublished={(id, isPublished) => void updateReviewDetail(id, { isPublished })}
          />
        ) : view === "reports" ? (
          <ReportsView
            data={reportsData}
            error={reportsError}
            from={reportsFrom}
            loading={reportsLoading}
            to={reportsTo}
            onExportCopy={(csv) => void navigator.clipboard?.writeText(csv)}
            onFrom={setReportsFrom}
            onOpenPath={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onRefresh={() => void loadReports()}
            onTo={setReportsTo}
          />
        ) : view === "deals" ? (
          <DealsWorkspace
            data={dealsData}
            detail={dealDetail}
            detailError={dealDetailError}
            detailLoading={dealDetailLoading}
            error={dealsError}
            loading={dealsLoading}
            query={dealsQuery}
            selectedId={selectedDealId}
            statusFilter={dealsStatusFilter}
            onApply={() => void loadDeals()}
            onOpenDeal={(id) => void openDealDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setDealsQuery}
            onRefresh={() => void loadDeals()}
            onStatusFilter={(status) => {
              setDealsStatusFilter(status);
              void loadDeals(status, dealsQuery);
            }}
          />
        ) : view === "broadcasts" ? (
          <BroadcastsWorkspace
            channelFilter={broadcastsChannelFilter}
            data={broadcastsData}
            detail={broadcastDetail}
            detailError={broadcastDetailError}
            detailLoading={broadcastDetailLoading}
            error={broadcastsError}
            loading={broadcastsLoading}
            query={broadcastsQuery}
            selectedId={selectedBroadcastId}
            statusFilter={broadcastsStatusFilter}
            onApply={() => void loadBroadcasts()}
            onChannelFilter={(channel) => {
              setBroadcastsChannelFilter(channel);
              void loadBroadcasts(broadcastsStatusFilter, channel, broadcastsQuery);
            }}
            onOpenBroadcast={(id) => void openBroadcastDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setBroadcastsQuery}
            onRefresh={() => void loadBroadcasts()}
            onStatusFilter={(status) => {
              setBroadcastsStatusFilter(status);
              void loadBroadcasts(status, broadcastsChannelFilter, broadcastsQuery);
            }}
          />
        ) : view === "marketing" ? (
          <MarketingWorkspace
            data={marketingData}
            detail={marketingDetail}
            detailError={marketingDetailError}
            detailLoading={marketingDetailLoading}
            error={marketingError}
            loading={marketingLoading}
            query={marketingQuery}
            saving={marketingDetailSaving}
            selectedId={selectedMarketingId}
            statusFilter={marketingStatusFilter}
            onApply={() => void loadMarketing()}
            onContentAction={(id, action) => void updateMarketingContentDetail(id, action)}
            onOpenMarketing={(id) => void openMarketingDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setMarketingQuery}
            onRefresh={() => void loadMarketing()}
            onStatusFilter={(status) => {
              setMarketingStatusFilter(status);
              void loadMarketing(status, marketingQuery);
            }}
          />
        ) : view === "aiHub" ? (
          <AiHubWorkspace
            data={aiRunsData}
            detail={aiRunDetail}
            detailError={aiRunDetailError}
            detailLoading={aiRunDetailLoading}
            error={aiRunsError}
            loading={aiRunsLoading}
            query={aiRunsQuery}
            reactivationResult={aiReactivationResult}
            savingAction={aiActionSaving}
            selectedId={selectedAiRunId}
            statusFilter={aiRunsStatusFilter}
            onApply={() => void loadAiRuns()}
            onContentAction={(id, action) => void updateAiContent(id, action)}
            onGenerateContent={(locationId) => void generateAiContent(locationId)}
            onOpenRun={(id) => void openAiRunDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setAiRunsQuery}
            onRefresh={() => void loadAiRuns()}
            onRunReactivation={() => void runAiReactivation()}
            onStatusFilter={(status) => {
              setAiRunsStatusFilter(status);
              void loadAiRuns(status, aiRunsQuery);
            }}
            onToggleFeature={(locationId, feature, enabled) => void updateAiLocationFeature(locationId, feature, enabled)}
          />
        ) : view === "automations" ? (
          <AutomationsWorkspace
            data={automationsData}
            detail={automationDetail}
            detailError={automationDetailError}
            detailLoading={automationDetailLoading}
            error={automationsError}
            loading={automationsLoading}
            query={automationsQuery}
            saving={automationDetailSaving}
            selectedId={selectedAutomationId}
            statusFilter={automationsStatusFilter}
            onApply={() => void loadAutomations()}
            onOpenAutomation={(id) => void openAutomationDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setAutomationsQuery}
            onRefresh={() => void loadAutomations()}
            onStatusFilter={(status) => {
              setAutomationsStatusFilter(status);
              void loadAutomations(status, automationsQuery);
            }}
            onToggle={(id, isActive) => void updateAutomationDetail(id, { isActive })}
          />
        ) : view === "integrations" ? (
          <IntegrationsWorkspace
            data={integrationsData}
            detail={integrationDetail}
            detailError={integrationDetailError}
            detailLoading={integrationDetailLoading}
            error={integrationsError}
            loading={integrationsLoading}
            query={integrationsQuery}
            selectedId={selectedIntegrationId}
            statusFilter={integrationsStatusFilter}
            onApply={() => void loadIntegrations()}
            onOpenDetail={(id) => void openIntegrationDetail(id)}
            onOpenWeb={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onQuery={setIntegrationsQuery}
            onRefresh={() => void loadIntegrations()}
            onStatusFilter={(status) => {
              setIntegrationsStatusFilter(status);
              void loadIntegrations(status, integrationsQuery);
            }}
          />
        ) : view === "settings" ? (
          <SettingsView
            business={business}
            data={settingsData}
            draft={settingsDraft}
            error={settingsError}
            lastSync={lastSync}
            loading={settingsLoading}
            publicUrl={publicBookingUrl(business)}
            saving={settingsSaving}
            onDraft={setSettingsDraft}
            onLogout={logout}
            onRefresh={() => void loadSettings()}
            onRevokeCurrentDevice={() => void revokeCurrentDevice()}
            onSave={() => void saveSettingsDraft()}
          />
        ) : (
          <ModuleWorkspace
            aiRunDetail={aiRunDetail}
            aiRunDetailError={aiRunDetailError}
            aiRunDetailLoading={aiRunDetailLoading}
            automationDetail={automationDetail}
            automationDetailError={automationDetailError}
            automationDetailLoading={automationDetailLoading}
            automationDetailSaving={automationDetailSaving}
            broadcastDetail={broadcastDetail}
            broadcastDetailError={broadcastDetailError}
            broadcastDetailLoading={broadcastDetailLoading}
            clientDetail={clientDetail}
            clientDetailError={clientDetailError}
            clientDetailLoading={clientDetailLoading}
            clientDetailSaving={clientDetailSaving}
            clientEditDraft={clientEditDraft}
            clientNoteDraft={clientNoteDraft}
            clientNoteSaving={clientNoteSaving}
            data={moduleData[view]}
            dealDetail={dealDetail}
            dealDetailError={dealDetailError}
            dealDetailLoading={dealDetailLoading}
            error={moduleError}
            locationDetail={locationDetail}
            locationDetailError={locationDetailError}
            locationDetailLoading={locationDetailLoading}
            locationDetailSaving={locationDetailSaving}
            locationEditDraft={locationEditDraft}
            integrationDetail={integrationDetail}
            integrationDetailError={integrationDetailError}
            integrationDetailLoading={integrationDetailLoading}
            loading={moduleLoading}
            marketingDetail={marketingDetail}
            marketingDetailError={marketingDetailError}
            marketingDetailLoading={marketingDetailLoading}
            marketingDetailSaving={marketingDetailSaving}
            paymentDetail={paymentDetail}
            paymentDetailError={paymentDetailError}
            paymentDetailLoading={paymentDetailLoading}
            reviewDetail={reviewDetail}
            reviewDetailError={reviewDetailError}
            reviewDetailLoading={reviewDetailLoading}
            reviewDetailSaving={reviewDetailSaving}
            reviewReplyDraft={reviewReplyDraft}
            route={route}
            selectedItemId={
              route.id === "clients"
                ? selectedClientId
                : route.id === "services"
                  ? selectedServiceId
                  : route.id === "staff"
                    ? selectedStaffId
                    : route.id === "locations"
                      ? selectedLocationId
                      : route.id === "payments"
                        ? selectedPaymentId
                        : route.id === "reviews"
                          ? selectedReviewId
                          : route.id === "deals"
                            ? selectedDealId
                            : route.id === "broadcasts"
                              ? selectedBroadcastId
                              : route.id === "marketing"
                                ? selectedMarketingId
                                : route.id === "aiHub"
                                  ? selectedAiRunId
                                  : route.id === "automations"
                                    ? selectedAutomationId
                                    : route.id === "integrations"
                                      ? selectedIntegrationId
                                      : null
            }
            serviceEditDraft={serviceEditDraft}
            serviceDetail={serviceDetail}
            serviceDetailError={serviceDetailError}
            serviceDetailLoading={serviceDetailLoading}
            serviceDetailSaving={serviceDetailSaving}
            serviceForceDeactivate={serviceForceDeactivate}
            staffEditDraft={staffEditDraft}
            staffDetail={staffDetail}
            staffDetailError={staffDetailError}
            staffDetailLoading={staffDetailLoading}
            staffDetailSaving={staffDetailSaving}
            onOpenBrowser={() => void invoke("desktop_open_dashboard_path", { path: route.href })}
            onOpenItem={
              route.id === "clients"
                ? (id) => void openClientDetail(id)
                : route.id === "services"
                  ? (id) => void openServiceDetail(id)
                  : route.id === "staff"
                    ? (id) => void openStaffDetail(id)
                    : route.id === "locations"
                      ? (id) => void openLocationDetail(id)
                      : route.id === "payments"
                        ? (id) => void openPaymentDetail(id)
                        : route.id === "reviews"
                          ? (id) => void openReviewDetail(id)
                          : route.id === "deals"
                            ? (id) => void openDealDetail(id)
                            : route.id === "broadcasts"
                              ? (id) => void openBroadcastDetail(id)
                              : route.id === "marketing"
                                ? (id) => void openMarketingDetail(id)
                                : route.id === "aiHub"
                                  ? (id) => void openAiRunDetail(id)
                                  : route.id === "automations"
                                    ? (id) => void openAutomationDetail(id)
                                    : route.id === "integrations"
                                      ? (id) => void openIntegrationDetail(id)
                                      : undefined
            }
            onOpenItemBrowser={(path) => void invoke("desktop_open_dashboard_path", { path })}
            onRefresh={() => void loadModule(route)}
            onClientNoteDraft={setClientNoteDraft}
            onClientNoteSave={(id) => void addClientNote(id)}
            onClientDraft={setClientEditDraft}
            onClientSave={(id) => void updateClientDetail(id)}
            onReviewDraft={setReviewReplyDraft}
            onReviewSave={(id) => void updateReviewDetail(id, { ownerReply: reviewReplyDraft })}
            onReviewTogglePublished={(id, isPublished) => void updateReviewDetail(id, { isPublished })}
            onAutomationToggle={(id, isActive) => void updateAutomationDetail(id, { isActive })}
            onMarketingContentAction={(id, action) => void updateMarketingContentDetail(id, action)}
            onServiceDraft={setServiceEditDraft}
            onServiceForceDeactivate={setServiceForceDeactivate}
            onServiceSave={(id) => void updateServiceDetail(id)}
            onStaffDraft={setStaffEditDraft}
            onStaffSave={(id) => void updateStaffDetail(id)}
            onLocationDraft={setLocationEditDraft}
            onLocationSave={(id) => void updateLocationDetail(id)}
          />
        )}

        {commandOpen && (
          <CommandPalette
            commands={filteredCommands}
            inputRef={commandInputRef}
            query={commandQuery}
            selectedIndex={commandIndex}
            onClose={() => setCommandOpen(false)}
            onQuery={setCommandQuery}
            onRun={runCommand}
            onSelectIndex={setCommandIndex}
          />
        )}
      </main>
    </div>
  );
}

function CommandPalette({
  commands,
  inputRef,
  query,
  selectedIndex,
  onClose,
  onQuery,
  onRun,
  onSelectIndex,
}: {
  commands: CommandPaletteItem[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  selectedIndex: number;
  onClose: () => void;
  onQuery: (value: string) => void;
  onRun: (item: CommandPaletteItem) => void;
  onSelectIndex: (index: number) => void;
}) {
  const safeIndex = commands.length ? clamp(selectedIndex, 0, commands.length - 1) : 0;

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onSelectIndex(commands.length ? (safeIndex + 1) % commands.length : 0);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      onSelectIndex(commands.length ? (safeIndex - 1 + commands.length) % commands.length : 0);
      return;
    }

    if (event.key === "Enter" && commands[safeIndex]) {
      event.preventDefault();
      onRun(commands[safeIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="command-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-label="Command palette"
        aria-labelledby="command-palette-title"
        aria-modal="true"
        className="command-palette glass-surface"
        role="dialog"
        onKeyDown={handleKeyDown}
      >
        <h2 id="command-palette-title" className="sr-only">Command palette</h2>
        <div className="command-search">
          <input
            ref={inputRef}
            aria-label="Search commands"
            placeholder="Search routes and actions"
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
          />
        </div>

        {commands.length ? (
          <ul className="command-list">
            {commands.map((command, index) => (
              <li key={command.id}>
                <button
                  className={index === safeIndex ? "command-item selected" : "command-item"}
                  type="button"
                  onMouseEnter={() => onSelectIndex(index)}
                  onClick={() => onRun(command)}
                >
                  <div>
                    <strong>{command.title}</strong>
                    <span>{command.subtitle}</span>
                  </div>
                  <span className="command-kind">
                    {command.route ? routeStateLabel(command.route) : command.group}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="command-empty">No matching command.</div>
        )}
      </section>
    </div>
  );
}

function DashboardSidebar({
  business,
  currentView,
  onRoute,
}: {
  business: Business | null;
  currentView: View;
  onRoute: (route: DashboardRoute) => void;
}) {
  return (
    <aside className="sidebar glass-surface">
      <div className="brand">
        <div className="app-mark">D</div>
        <div>
          <strong>Dinaya</strong>
          <span>{business?.plan ?? "Desktop"} dashboard</span>
        </div>
      </div>

      <nav className="nav-groups" aria-label="Desktop dashboard">
        {dashboardRouteGroups.map((group) => (
          <section key={group.id} className="nav-group">
            <p>{group.label}</p>
            {group.routes.map((routeItem) => (
              <button
                key={routeItem.id}
                aria-current={currentView === routeItem.id ? "page" : undefined}
                aria-label={`${routeItem.label}. ${routeStateLabel(routeItem)} desktop screen.`}
                className={currentView === routeItem.id ? "active" : ""}
                onClick={() => onRoute(routeItem)}
              >
                <span>{routeItem.label}</span>
                <span className={`route-state ${routeItem.nativeStatus}`}>
                  {routeStateLabel(routeItem)}
                </span>
              </button>
            ))}
          </section>
        ))}
      </nav>
    </aside>
  );
}

function LoginScreen({
  error,
  onLogin,
}: {
  error: string;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setLocalError("");
    try {
      await onLogin(email, password);
    } catch (loginError) {
      setLocalError(String(loginError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <section className="login-story" aria-label="Dinaya">
        <DinayaBrand />

        <div className="login-story-copy">
          <h1>
            Your calendar,
            <span>always full.</span>
          </h1>
          <p>Thousands of appointments managed. Zero phone calls needed.</p>

          <ul>
            <li><span className="story-icon calendar-icon" />Clients book 24/7 without calling you</li>
            <li><span className="story-icon card-icon" />Accept online payments via PayHere</li>
            <li><span className="story-icon grid-icon" />Manage everything from one dashboard</li>
          </ul>

          <div className="login-quote">
            <p>&quot;I used to miss bookings because of WhatsApp messages I forgot to reply to. Now everything&apos;s in Dinaya and I haven&apos;t missed one since.&quot;</p>
            <span>Kavinda Jayasuriya - Owner, The Barber Room - Kandy</span>
          </div>
        </div>

        <p className="login-copyright">© {new Date().getFullYear()} Dinaya by Ardeno Studio</p>
      </section>

      <section className="login-form-panel">
        <form className="login-card" onSubmit={submit}>
          <div>
            <h2>Welcome back</h2>
            <p>Sign in to your dashboard</p>
          </div>

          <label>
            Email
            <input
              ref={emailRef}
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            <span className="label-row">
              Password
              <button type="button" onClick={() => void invoke("desktop_open_app_path", { path: "/forgot-password" })}>
                Forgot password?
              </button>
            </span>
            <span className="password-field">
              <input
                autoComplete="current-password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          {(localError || error) && <div className="error-banner inline">{localError || error}</div>}
          <button className="primary login-submit" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="secure-line">Secure sign-in · Your data is encrypted</div>
        </form>

        <p className="register-line">
          No account?{" "}
          <button type="button" onClick={() => void invoke("desktop_open_app_path", { path: "/register" })}>
            Create one free
          </button>
        </p>
      </section>
    </div>
  );
}

function DinayaBrand() {
  return (
    <div className="login-brand">
      <svg
        aria-hidden="true"
        fill="currentColor"
        height="30"
        viewBox="318 319 875 866"
        width="30"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 819.949219 499.695312 L 563.980469 755.773438 C 513.210938 806.554688 513.210938 889.15625 563.980469 939.941406 C 614.75 990.777344 697.378906 990.726562 748.09375 939.941406 L 966.117188 721.851562 C 982.484375 705.480469 982.484375 678.953125 966.117188 662.582031 C 949.75 646.207031 923.230469 646.207031 906.863281 662.582031 L 688.84375 880.671875 C 670.753906 898.707031 641.375 898.761719 623.234375 880.671875 C 605.144531 862.578125 605.144531 833.132812 623.234375 815.042969 L 879.203125 558.96875 C 931.742188 506.464844 1017.1875 506.464844 1069.671875 558.96875 C 1095.097656 584.425781 1109.117188 618.265625 1109.117188 654.257812 C 1109.117188 690.226562 1095.097656 724.0625 1069.671875 749.523438 L 782.496094 1036.789062 C 740.375 1078.921875 684.367188 1102.117188 624.816406 1102.117188 C 565.261719 1102.117188 509.285156 1078.921875 467.164062 1036.789062 C 380.222656 949.820312 380.222656 808.328125 467.164062 721.359375 L 797.144531 391.253906 C 813.511719 374.878906 813.511719 348.355469 797.144531 331.980469 C 780.773438 315.609375 754.257812 315.609375 737.890625 331.980469 L 407.910156 662.089844 C 288.285156 781.722656 288.285156 976.425781 407.910156 1096.058594 C 465.828125 1154.019531 542.867188 1185.945312 624.816406 1185.945312 C 706.765625 1185.945312 783.804688 1154.019531 841.746094 1096.058594 L 1128.925781 808.792969 C 1214.121094 723.570312 1214.121094 584.917969 1128.925781 499.695312 C 1043.78125 414.558594 905.144531 414.445312 819.949219 499.695312 Z" />
      </svg>
      <strong>Dinaya.lk</strong>
    </div>
  );
}

function OverviewView({
  business,
  lastSync,
  metrics,
  rows,
  staff,
  onCopyBookingLink,
  onExportDaySheet,
  onOpenBooking,
  onOpenBookings,
  onPrintDaySheet,
}: {
  business: Business | null;
  lastSync: string | null;
  metrics: DashboardMetrics;
  rows: BookingRow[];
  staff: StaffMember[];
  onCopyBookingLink: () => void;
  onExportDaySheet: () => void;
  onOpenBooking: (id: string) => void;
  onOpenBookings: () => void;
  onPrintDaySheet: () => void;
}) {
  const [clock, setClock] = useState(() => new Date());
  const nextBooking = nextBookingForRows(rows, clock);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="overview-layout">
      <LivingDaySheet
        business={business}
        clock={clock}
        lastSync={lastSync}
        metrics={metrics}
        nextBooking={nextBooking}
        staff={staff}
        onCopyBookingLink={onCopyBookingLink}
        onExportDaySheet={onExportDaySheet}
        onOpenBookings={onOpenBookings}
        onPrintDaySheet={onPrintDaySheet}
      />

      <div className="overview-main">
        <div className="metric-grid">
          <MetricCard label="Active today" tone="cobalt" value={metrics.activeToday} />
          <MetricCard label="Pending" tone="amber" value={metrics.pendingToday} />
          <MetricCard label="Confirmed" tone="emerald" value={metrics.confirmedToday} />
          <MetricCard label="Staff load" tone="slate" value={`${metrics.staffOnDeck}/${staff.length || 0}`} />
        </div>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Bookings</p>
              <h2>Today queue</h2>
            </div>
            <div className="panel-actions">
              <button onClick={onPrintDaySheet}>Print</button>
              <button onClick={onExportDaySheet}>Export CSV</button>
              <button onClick={onOpenBookings}>Open inbox</button>
            </div>
          </div>
          <BookingList rows={rows.slice(0, 8)} selectedId={null} onOpen={onOpenBooking} />
        </section>
      </div>
    </section>
  );
}

function LivingDaySheet({
  business,
  clock,
  lastSync,
  metrics,
  nextBooking,
  staff,
  onCopyBookingLink,
  onExportDaySheet,
  onOpenBookings,
  onPrintDaySheet,
}: {
  business: Business | null;
  clock: Date;
  lastSync: string | null;
  metrics: DashboardMetrics;
  nextBooking: BookingRow | null;
  staff: StaffMember[];
  onCopyBookingLink: () => void;
  onExportDaySheet: () => void;
  onOpenBookings: () => void;
  onPrintDaySheet: () => void;
}) {
  return (
    <aside className="living-day glass-surface">
      <div>
        <p className="eyebrow">Living Day Sheet</p>
        <h2>{formatDate(clock.toISOString())}</h2>
        <p>{clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>

      <div className="day-focus">
        <span>Next</span>
        {nextBooking ? (
          <div>
            <strong>{nextBooking.clientName}</strong>
            <p>{formatTime(nextBooking.startsAt)} - {nextBooking.serviceName}</p>
          </div>
        ) : (
          <div>
            <strong>No active booking</strong>
            <p>{business?.name ?? "Dinaya"} is clear for now.</p>
          </div>
        )}
      </div>

      <div className="day-stack">
        <div>
          <span>Pending</span>
          <strong>{metrics.pendingToday}</strong>
        </div>
        <div>
          <span>Confirmed</span>
          <strong>{metrics.confirmedToday}</strong>
        </div>
        <div>
          <span>Staff</span>
          <strong>{metrics.staffOnDeck}/{staff.length || 0}</strong>
        </div>
      </div>

      <div className="day-actions">
        <button className="primary" onClick={onOpenBookings}>Review today</button>
        <button onClick={onCopyBookingLink}>Copy booking link</button>
        <button onClick={onPrintDaySheet}>Print</button>
        <button onClick={onExportDaySheet}>Export CSV</button>
      </div>

      <p className="sync-line">{lastSync ? `Synced ${formatTime(lastSync)}` : "Waiting for first sync"}</p>
    </aside>
  );
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "amber" | "cobalt" | "emerald" | "slate";
  value: React.ReactNode;
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CalendarWorkspace(props: {
  data: CalendarPayload | null;
  date: string;
  detail: BookingDetail | null;
  error: string;
  loading: boolean;
  mode: CalendarMode;
  selectedId: string | null;
  staff: StaffMember[];
  staffFilter: string;
  onDate: (date: string) => void;
  onMode: (mode: CalendarMode) => void;
  onNext: () => void;
  onOpenBooking: (id: string) => void;
  onOpenWeb: (id: string) => void;
  onPrevious: () => void;
  onRefresh: () => void;
  onStaffFilter: (value: string) => void;
  onStatus: (id: string, status: BookingStatus) => void;
  onToday: () => void;
}) {
  const days = props.data?.days ?? [{ date: props.date, label: formatDate(`${props.date}T12:00:00`) }];
  const rowsByDay = new Map<string, CalendarBooking[]>();
  for (const day of days) rowsByDay.set(day.date, []);
  for (const row of props.data?.rows ?? []) {
    const key = dayKey(row.startsAt);
    rowsByDay.set(key, [...(rowsByDay.get(key) ?? []), row]);
  }

  const today = dateInputValue();
  const hours = Array.from({ length: calendarEndHour - calendarStartHour + 1 }, (_, index) => calendarStartHour + index);

  return (
    <section className="calendar-workspace">
      <div className="calendar-pane">
        <div className="calendar-toolbar">
          <div className="tabs">
            {(["day", "week"] as CalendarMode[]).map((mode) => (
              <button key={mode} className={props.mode === mode ? "active" : ""} onClick={() => props.onMode(mode)}>
                {mode === "day" ? "Day" : "Week"}
              </button>
            ))}
          </div>
          <div className="calendar-controls">
            <button onClick={props.onPrevious}>Previous</button>
            <input type="date" value={props.date} onChange={(event) => props.onDate(event.target.value)} />
            <button onClick={props.onToday}>Today</button>
            <button onClick={props.onNext}>Next</button>
          </div>
          <div className="calendar-controls">
            <select value={props.staffFilter} onChange={(event) => props.onStaffFilter(event.target.value)}>
              <option value="">All staff</option>
              {props.staff.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
            <button className="primary small" disabled={props.loading} onClick={props.onRefresh}>
              {props.loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {props.error && <div className="error-banner inline">{props.error}</div>}

        <div className="calendar-summary">
          <MetricCard label="Bookings" tone="cobalt" value={props.data?.rows.length ?? 0} />
          <MetricCard label="Pending" tone="amber" value={props.data?.rows.filter((row) => row.status === "pending").length ?? 0} />
          <MetricCard label="Confirmed" tone="emerald" value={props.data?.rows.filter((row) => row.status === "confirmed").length ?? 0} />
          <MetricCard label="Staff" tone="slate" value={new Set((props.data?.rows ?? []).map((row) => row.staffId)).size} />
        </div>

        <div className="calendar-grid-shell">
          <div className="calendar-hour-labels">
            {hours.map((hour) => (
              <span key={hour}>{`${hour.toString().padStart(2, "0")}:00`}</span>
            ))}
          </div>
          <div className="calendar-grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(180px, 1fr))` }}>
            {days.map((day) => (
              <div key={day.date} className="calendar-day">
                <div className="calendar-day-head">
                  <strong>{day.label}</strong>
                  <span>{rowsByDay.get(day.date)?.length ?? 0} bookings</span>
                </div>
                <div className="calendar-day-body">
                  {day.date === today && <span className="calendar-now-line" style={{ top: currentTimeTop() }} />}
                  {(rowsByDay.get(day.date) ?? []).map((row) => (
                    <button
                      key={row.id}
                      className={props.selectedId === row.id ? `calendar-booking selected ${row.status}` : `calendar-booking ${row.status}`}
                      style={calendarBlockStyle(row)}
                      onClick={() => props.onOpenBooking(row.id)}
                    >
                      <strong>{formatTime(row.startsAt)} {row.clientName}</strong>
                      <span>{row.serviceName}</span>
                      <span>{row.staffName}{row.locationName ? ` · ${row.locationName}` : ""}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BookingDetailPanel
        detail={props.detail}
        selectedId={props.selectedId}
        onOpenWeb={props.onOpenWeb}
        onStatus={props.onStatus}
      />
    </section>
  );
}

function AvailabilityWorkspace(props: {
  data: AvailabilityPayload | null;
  draft: AvailabilityWindowDraft[];
  error: string;
  loading: boolean;
  overrideDraft: AvailabilityOverrideDraft;
  saving: boolean;
  selectedStaffId: string | null;
  onDraft: (draft: AvailabilityWindowDraft[]) => void;
  onOverrideDelete: (staffId: string, overrideId: string) => void;
  onOverrideDraft: (draft: AvailabilityOverrideDraft) => void;
  onOverrideSave: (staffId: string) => void;
  onOpenWeb: () => void;
  onRefresh: () => void;
  onSave: (staffId: string) => void;
  onSelectStaff: (id: string) => void;
}) {
  const members = props.data?.members ?? [];
  const selected = members.find((member) => member.staff.id === props.selectedStaffId) ?? members[0] ?? null;
  const totalWindows = members.reduce((sum, member) => sum + member.windows.length, 0);
  const totalOverrides = members.reduce((sum, member) => sum + member.overrides.length, 0);
  const activeMembers = members.filter((member) => member.staff.isActive).length;

  return (
    <section className="availability-workspace">
      <div className="availability-list-pane glass-surface">
        <div className="module-head">
          <div>
            <p className="eyebrow">Native dashboard</p>
            <h2>Availability</h2>
            <p>Weekly hours, branch coverage, and upcoming date overrides.</p>
          </div>
          <div className="module-actions">
            <button className="primary small" disabled={props.loading} onClick={props.onRefresh}>
              {props.loading ? "Loading..." : "Refresh"}
            </button>
            <button onClick={props.onOpenWeb}>Open web editor</button>
          </div>
        </div>

        {props.error && <div className="error-banner inline">{props.error}</div>}

        <div className="metric-grid module-metrics">
          <MetricCard label="Staff" tone="cobalt" value={members.length} />
          <MetricCard label="Active" tone="emerald" value={activeMembers} />
          <MetricCard label="Windows" tone="slate" value={totalWindows} />
          <MetricCard label="Overrides" tone="amber" value={totalOverrides} />
        </div>

        {props.loading && !props.data ? (
          <div className="empty-state">Loading availability...</div>
        ) : members.length ? (
          <ul className="availability-member-list">
            {members.map((member) => {
              const workingDays = new Set(member.windows.map((window) => window.dayOfWeek)).size;
              const primaryLocation = member.assignedLocations.find((location) => location.isPrimary);
              return (
                <li key={member.staff.id}>
                  <button
                    className={selected?.staff.id === member.staff.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => props.onSelectStaff(member.staff.id)}
                  >
                    <div>
                      <strong>{member.staff.name}</strong>
                      <span>{primaryLocation?.name ?? member.assignedLocations[0]?.name ?? "No branch assigned"}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className="module-status">{workingDays} days</span>
                      <span>{member.overrides.length} overrides</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-state">No staff members configured yet.</div>
        )}
      </div>

      <AvailabilityDetailPanel
        draft={props.draft}
        member={selected}
        overrideDraft={props.overrideDraft}
        saving={props.saving}
        onDraft={props.onDraft}
        onOverrideDelete={props.onOverrideDelete}
        onOverrideDraft={props.onOverrideDraft}
        onOverrideSave={props.onOverrideSave}
        onSave={props.onSave}
      />
    </section>
  );
}

function AvailabilityDetailPanel({
  draft,
  member,
  overrideDraft,
  saving,
  onDraft,
  onOverrideDelete,
  onOverrideDraft,
  onOverrideSave,
  onSave,
}: {
  draft: AvailabilityWindowDraft[];
  member: AvailabilityMember | null;
  overrideDraft: AvailabilityOverrideDraft;
  saving: boolean;
  onDraft: (draft: AvailabilityWindowDraft[]) => void;
  onOverrideDelete: (staffId: string, overrideId: string) => void;
  onOverrideDraft: (draft: AvailabilityOverrideDraft) => void;
  onOverrideSave: (staffId: string) => void;
  onSave: (staffId: string) => void;
}) {
  if (!member) {
    return <aside className="detail-pane empty glass-surface">Select a team member to inspect availability.</aside>;
  }

  const windowsByDay = new Map<number, AvailabilityMember["windows"]>();
  for (const day of [0, 1, 2, 3, 4, 5, 6]) windowsByDay.set(day, []);
  for (const window of member.windows) {
    windowsByDay.set(window.dayOfWeek, [...(windowsByDay.get(window.dayOfWeek) ?? []), window]);
  }

  const activeDays = new Set(member.windows.map((window) => window.dayOfWeek)).size;
  const primaryLocation = member.assignedLocations.find((location) => location.isPrimary);
  const sortedDraft = [...draft].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  const updateDraftWindow = (localId: string, patch: Partial<AvailabilityWindowDraft>) => {
    onDraft(draft.map((window) => (window.localId === localId ? { ...window, ...patch } : window)));
  };
  const updateOverrideDraft = (patch: Partial<AvailabilityOverrideDraft>) => {
    onOverrideDraft({ ...overrideDraft, ...patch });
  };
  const removeDraftWindow = (localId: string) => {
    onDraft(draft.filter((window) => window.localId !== localId));
  };
  const addDraftWindow = () => {
    onDraft([
      ...draft,
      {
        dayOfWeek: 1,
        endTime: "17:00",
        localId: `new-${Date.now()}`,
        startTime: "09:00",
      },
    ]);
  };

  return (
    <aside className="detail-pane availability-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{member.staff.name}</h2>
          <p>{primaryLocation?.name ?? member.assignedLocations[0]?.name ?? "No branch assigned"}</p>
        </div>
        <span className={`module-status ${member.staff.isActive ? "stage-active" : "stage-churned"}`}>
          {member.staff.isActive ? "active" : "inactive"}
        </span>
      </div>

      <div className="client-mini-grid">
        <MetricCard label="Working days" tone="cobalt" value={activeDays} />
        <MetricCard label="Overrides" tone="amber" value={member.overrides.length} />
      </div>

      <section className="client-section">
        <h3>Edit weekly windows</h3>
        <div className="availability-edit-form">
          {sortedDraft.length ? (
            sortedDraft.map((window) => (
              <div className="availability-edit-row" key={window.localId}>
                <select
                  aria-label="Day"
                  value={window.dayOfWeek}
                  onChange={(event) => updateDraftWindow(window.localId, { dayOfWeek: Number(event.target.value) })}
                >
                  {weekdayLabels.map((label, day) => (
                    <option key={label} value={day}>{label}</option>
                  ))}
                </select>
                <input
                  aria-label="Start time"
                  type="time"
                  value={window.startTime}
                  onChange={(event) => updateDraftWindow(window.localId, { startTime: event.target.value })}
                />
                <input
                  aria-label="End time"
                  type="time"
                  value={window.endTime}
                  onChange={(event) => updateDraftWindow(window.localId, { endTime: event.target.value })}
                />
                <button type="button" onClick={() => removeDraftWindow(window.localId)}>Remove</button>
              </div>
            ))
          ) : (
            <p>No weekly windows. Add a window to start accepting bookings.</p>
          )}
          <div className="actions">
            <button type="button" onClick={addDraftWindow}>Add window</button>
            <button className="primary" disabled={saving} type="button" onClick={() => onSave(member.staff.id)}>
              {saving ? "Saving..." : "Save weekly hours"}
            </button>
          </div>
        </div>
      </section>

      <section className="client-section">
        <h3>Weekly schedule</h3>
        <ul className="availability-week-list">
          {weekdayLabels.map((label, day) => {
            const windows = windowsByDay.get(day) ?? [];
            return (
              <li key={label} className={windows.length ? "" : "muted"}>
                <strong>{label}</strong>
                <span>
                  {windows.length
                    ? windows.map((window) => `${formatClock(window.startTime)} - ${formatClock(window.endTime)}`).join(", ")
                    : "Closed"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="client-section">
        <h3>Branches</h3>
        {member.assignedLocations.length ? (
          <ul className="staff-availability-list">
            {member.assignedLocations.map((location) => (
              <li key={location.id}>
                <strong>{location.name}</strong>
                <span>{location.timezone}{location.isPrimary ? " - primary" : ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No locations assigned.</p>
        )}
      </section>

      <section className="client-section">
        <h3>Date overrides</h3>
        <div className="availability-override-form">
          <div className="availability-override-grid">
            <label>
              <span>Date</span>
              <input
                type="date"
                value={overrideDraft.date}
                onChange={(event) => updateOverrideDraft({ date: event.target.value })}
              />
            </label>
            <label>
              <span>Type</span>
              <select
                value={overrideDraft.isBlocked ? "blocked" : "custom"}
                onChange={(event) => updateOverrideDraft({ isBlocked: event.target.value === "blocked" })}
              >
                <option value="blocked">Closed day</option>
                <option value="custom">Custom hours</option>
              </select>
            </label>
          </div>
          {!overrideDraft.isBlocked && (
            <div className="availability-override-grid">
              <label>
                <span>Start</span>
                <input
                  type="time"
                  value={overrideDraft.startTime}
                  onChange={(event) => updateOverrideDraft({ startTime: event.target.value })}
                />
              </label>
              <label>
                <span>End</span>
                <input
                  type="time"
                  value={overrideDraft.endTime}
                  onChange={(event) => updateOverrideDraft({ endTime: event.target.value })}
                />
              </label>
            </div>
          )}
          <label>
            <span>Reason</span>
            <input
              maxLength={200}
              placeholder="Holiday, training, short day"
              value={overrideDraft.reason}
              onChange={(event) => updateOverrideDraft({ reason: event.target.value })}
            />
          </label>
          <div className="actions">
            <button
              className="primary"
              disabled={saving || !overrideDraft.date}
              type="button"
              onClick={() => onOverrideSave(member.staff.id)}
            >
              {saving ? "Saving..." : "Save override"}
            </button>
          </div>
        </div>
        {member.overrides.length ? (
          <ul className="staff-availability-list">
            {member.overrides.map((override) => (
              <li key={override.id}>
                <strong>{formatDate(`${override.date}T12:00:00`)}</strong>
                <span>
                  {override.isBlocked
                    ? "Full day off"
                    : `${formatClock(override.startTime)} - ${formatClock(override.endTime)}`}
                </span>
                {override.reason && <span>{override.reason}</span>}
                <button
                  className="small danger"
                  disabled={saving}
                  type="button"
                  onClick={() => onOverrideDelete(member.staff.id, override.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming date overrides.</p>
        )}
      </section>
    </aside>
  );
}

function BookingsWorkspace(props: {
  detail: BookingDetail | null;
  rows: BookingRow[];
  selectedId: string | null;
  staff: StaffMember[];
  staffFilter: string;
  statusFilter: string;
  tab: Tab;
  onApply: () => void;
  onExport: () => void;
  onOpenBooking: (id: string) => void;
  onOpenWeb: (id: string) => void;
  onPrint: () => void;
  onStaffFilter: (value: string) => void;
  onStatus: (id: string, status: BookingStatus) => void;
  onStatusFilter: (value: string) => void;
  onTab: (tab: Tab) => void;
}) {
  return (
    <section className="workspace">
      <div className="list-pane">
        <Filters
          staff={props.staff}
          staffFilter={props.staffFilter}
          statusFilter={props.statusFilter}
          tab={props.tab}
          onApply={props.onApply}
          onStaffFilter={props.onStaffFilter}
          onStatusFilter={props.onStatusFilter}
          onTab={props.onTab}
        />
        <div className="export-row">
          <span>{props.rows.length} bookings in this view</span>
          <div>
            <button onClick={props.onPrint}>Print</button>
            <button onClick={props.onExport}>Export CSV</button>
          </div>
        </div>
        <BookingList
          rows={props.rows}
          selectedId={props.selectedId}
          onOpen={props.onOpenBooking}
        />
      </div>
      <BookingDetailPanel
        detail={props.detail}
        selectedId={props.selectedId}
        onOpenWeb={props.onOpenWeb}
        onStatus={props.onStatus}
      />
    </section>
  );
}

function Filters(props: {
  staff: StaffMember[];
  staffFilter: string;
  statusFilter: string;
  tab: Tab;
  onApply: () => void;
  onStaffFilter: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onTab: (tab: Tab) => void;
}) {
  return (
    <div className="filters">
      <div className="tabs">
        {(["today", "upcoming", "past"] as Tab[]).map((item) => (
          <button key={item} className={props.tab === item ? "active" : ""} onClick={() => props.onTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <div className="filter-row">
        <select value={props.staffFilter} onChange={(event) => props.onStaffFilter(event.target.value)}>
          <option value="">All staff</option>
          {props.staff.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
        <select value={props.statusFilter} onChange={(event) => props.onStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button onClick={props.onApply}>Apply</button>
      </div>
    </div>
  );
}

function BookingList({
  rows,
  selectedId,
  onOpen,
}: {
  rows: BookingRow[];
  selectedId: string | null;
  onOpen: (id: string) => void;
}) {
  if (rows.length === 0) {
    return <div className="empty-state">No bookings in this view.</div>;
  }

  return (
    <ul className="booking-list">
      {rows.map((row) => (
        <li key={row.id}>
          <button className={selectedId === row.id ? "booking-row selected" : "booking-row"} onClick={() => onOpen(row.id)}>
            <span className="time">{formatTime(row.startsAt)}</span>
            <span className="booking-copy">
              <strong>{row.clientName}</strong>
              <span>{row.serviceName} with {row.staffName}</span>
            </span>
            <span className={`badge ${row.status}`}>{statusLabels[row.status]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function BookingDetailPanel(props: {
  detail: BookingDetail | null;
  selectedId: string | null;
  onOpenWeb: (id: string) => void;
  onStatus: (id: string, status: BookingStatus) => void;
}) {
  if (!props.selectedId) {
    return <aside className="detail-pane glass-surface empty">Select a booking to see details.</aside>;
  }

  if (!props.detail) {
    return <aside className="detail-pane glass-surface empty">Loading booking...</aside>;
  }

  const actions = transitionsFor(props.detail.status);

  return (
    <aside className="detail-pane glass-surface">
      <div className="detail-head">
        <div>
          <h2>{props.detail.clientName}</h2>
          <p>{props.detail.serviceName}</p>
        </div>
        <span className={`badge ${props.detail.status}`}>{statusLabels[props.detail.status]}</span>
      </div>
      <dl>
        <dt>When</dt>
        <dd>{formatDateTime(props.detail.startsAt)} - {formatTime(props.detail.endsAt)}</dd>
        <dt>Staff</dt>
        <dd>{props.detail.staffName}</dd>
        <dt>Phone</dt>
        <dd>{props.detail.clientPhone || "Not provided"}</dd>
        <dt>Email</dt>
        <dd>{props.detail.clientEmail || "Not provided"}</dd>
        <dt>Notes</dt>
        <dd>{props.detail.notes || "No notes"}</dd>
      </dl>
      <div className="actions">
        {actions.map((status) => (
          <button key={status} className="primary subtle" onClick={() => props.onStatus(props.detail!.id, status)}>
            {statusLabels[status]}
          </button>
        ))}
        <button onClick={() => props.onOpenWeb(props.detail!.id)}>Open in browser</button>
      </div>
    </aside>
  );
}

function ClientsWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  editDraft,
  error,
  loading,
  noteDraft,
  savingDetail,
  noteSaving,
  query,
  selectedId,
  stageFilter,
  onApply,
  onEditDraft,
  onEditSave,
  onNoteDraft,
  onNoteSave,
  onOpenClient,
  onOpenWeb,
  onQuery,
  onRefresh,
  onStageFilter,
}: {
  data: DesktopClientsPayload | null;
  detail: ClientDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  editDraft: ClientEditDraft | null;
  error: string;
  loading: boolean;
  noteDraft: string;
  savingDetail: boolean;
  noteSaving: boolean;
  query: string;
  selectedId: string | null;
  stageFilter: ClientStageFilter;
  onApply: () => void;
  onEditDraft: (draft: ClientEditDraft) => void;
  onEditSave: (id: string) => void;
  onNoteDraft: (value: string) => void;
  onNoteSave: (id: string) => void;
  onOpenClient: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onStageFilter: (stage: ClientStageFilter) => void;
}) {
  const summary = data?.summary;
  const stageOptions: Array<{ count: number; label: string; value: ClientStageFilter }> = [
    { count: summary?.totalClients ?? 0, label: "All", value: "all" },
    { count: summary?.leads ?? 0, label: "Leads", value: "lead" },
    { count: summary?.prospects ?? 0, label: "Prospects", value: "prospect" },
    { count: summary?.activeClients ?? 0, label: "Active", value: "active" },
    { count: summary?.churnedClients ?? 0, label: "Churned", value: "churned" },
  ];

  return (
    <section className="module-view has-detail clients-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native Clients</p>
              <h2>Customer CRM</h2>
              <p>Search customers, filter by stage, inspect history, and keep private notes.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/clients")}>
                Open clients in browser
              </button>
            </div>
          </div>

          {error && <div className="error-banner inline">{error}</div>}

          <div className="metric-grid module-metrics">
            <MetricCard label="Clients" tone="cobalt" value={summary?.totalClients ?? 0} />
            <MetricCard label="Active" tone="emerald" value={summary?.activeClients ?? 0} />
            <MetricCard label="Leads" tone="amber" value={summary?.leads ?? 0} />
            <MetricCard label="Opt-outs" tone="slate" value={summary?.optedOutClients ?? 0} />
          </div>

          <div className="filters client-filter-row">
            <div className="tabs">
              {stageOptions.map((option) => (
                <button
                  key={option.value}
                  className={stageFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStageFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search name, phone, email, or source"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} clients loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/clients"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading clients...</div>
          ) : data?.rows.length ? (
            <ul className="module-list client-list">
              {data.rows.map((client) => (
                <li key={client.id}>
                  <button
                    className={selectedId === client.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenClient(client.id)}
                  >
                    <div>
                      <strong>{client.name}</strong>
                      <span>{client.phone}{client.email ? ` - ${client.email}` : ""}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status stage-${client.stage}`}>{client.stage}</span>
                      <span>
                        {client.bookingCount} bookings - {client.lastBookingAt ? formatModuleMeta(client.lastBookingAt) : client.source?.replaceAll("_", " ") ?? "No source"}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No clients match this filter.
            </div>
          )}
        </div>

        <ClientDetailPanel
          detail={detail}
          draft={editDraft}
          error={detailError}
          loading={detailLoading}
          noteDraft={noteDraft}
          savingDetail={savingDetail}
          savingNote={noteSaving}
          onDraft={onEditDraft}
          onSave={onEditSave}
          onNoteDraft={onNoteDraft}
          onNoteSave={onNoteSave}
          onOpenWeb={onOpenWeb}
        />
      </div>
    </section>
  );
}

function ServicesWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  draft,
  error,
  forceDeactivate,
  loading,
  query,
  saving,
  selectedId,
  statusFilter,
  onApply,
  onDraft,
  onForceDeactivate,
  onOpenService,
  onOpenWeb,
  onQuery,
  onRefresh,
  onSave,
  onStatusFilter,
}: {
  data: DesktopServicesPayload | null;
  detail: ServiceDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  draft: ServiceEditDraft | null;
  error: string;
  forceDeactivate: boolean;
  loading: boolean;
  query: string;
  saving: boolean;
  selectedId: string | null;
  statusFilter: ServiceStatusFilter;
  onApply: () => void;
  onDraft: (draft: ServiceEditDraft) => void;
  onForceDeactivate: (value: boolean) => void;
  onOpenService: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onSave: (id: string) => void;
  onStatusFilter: (status: ServiceStatusFilter) => void;
}) {
  const summary = data?.summary;
  const statusOptions: Array<{ count: number; label: string; value: ServiceStatusFilter }> = [
    { count: summary?.totalServices ?? 0, label: "All", value: "all" },
    { count: summary?.activeServices ?? 0, label: "Active", value: "active" },
    { count: summary?.inactiveServices ?? 0, label: "Inactive", value: "inactive" },
  ];

  return (
    <section className="module-view has-detail services-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native Services</p>
              <h2>Service catalog</h2>
              <p>Filter bookable services, inspect demand, and edit price, duration, payment, and status.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/services")}>
                Open services in browser
              </button>
            </div>
          </div>

          {error && <div className="error-banner inline">{error}</div>}

          <div className="metric-grid module-metrics">
            <MetricCard label="Services" tone="cobalt" value={summary?.totalServices ?? 0} />
            <MetricCard label="Active" tone="emerald" value={summary?.activeServices ?? 0} />
            <MetricCard label="Deposits" tone="amber" value={summary?.paymentRequiredServices ?? 0} />
            <MetricCard label="Avg duration" tone="slate" value={`${summary?.averageDurationMinutes ?? 0}m`} />
          </div>

          <div className="filters service-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search service name or description"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} services loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/services"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading services...</div>
          ) : data?.rows.length ? (
            <ul className="module-list service-list">
              {data.rows.map((service) => (
                <li key={service.id}>
                  <button
                    className={selectedId === service.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenService(service.id)}
                  >
                    <div>
                      <strong>{service.name}</strong>
                      <span>{service.description ?? `${service.durationMinutes} min service`}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status ${service.isActive ? "stage-active" : "stage-churned"}`}>
                        {service.isActive ? "active" : "inactive"}
                      </span>
                      <span>
                        {formatMoneyLkr(service.priceLkr)} - {service.durationMinutes}m - {service.assignedStaffCount} staff
                      </span>
                      <span>
                        {service.futureBookingCount} upcoming - {service.lastBookingAt ? formatModuleMeta(service.lastBookingAt) : `${service.bookingCount} all-time`}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No services match this filter.
            </div>
          )}
        </div>

        <ServiceDetailPanel
          detail={detail}
          draft={draft}
          error={detailError}
          forceDeactivate={forceDeactivate}
          loading={detailLoading}
          saving={saving}
          onDraft={onDraft}
          onForceDeactivate={onForceDeactivate}
          onOpenWeb={onOpenWeb}
          onSave={onSave}
        />
      </div>
    </section>
  );
}

function StaffWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  draft,
  error,
  loading,
  query,
  saving,
  selectedId,
  statusFilter,
  onApply,
  onDraft,
  onOpenStaff,
  onOpenWeb,
  onQuery,
  onRefresh,
  onSave,
  onStatusFilter,
}: {
  data: DesktopStaffPayload | null;
  detail: StaffDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  draft: StaffEditDraft | null;
  error: string;
  loading: boolean;
  query: string;
  saving: boolean;
  selectedId: string | null;
  statusFilter: StaffStatusFilter;
  onApply: () => void;
  onDraft: (draft: StaffEditDraft) => void;
  onOpenStaff: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onSave: (id: string) => void;
  onStatusFilter: (status: StaffStatusFilter) => void;
}) {
  const summary = data?.summary;
  const statusOptions: Array<{ count: number; label: string; value: StaffStatusFilter }> = [
    { count: summary?.totalStaff ?? 0, label: "All", value: "all" },
    { count: summary?.activeStaff ?? 0, label: "Active", value: "active" },
    { count: summary?.inactiveStaff ?? 0, label: "Inactive", value: "inactive" },
  ];

  return (
    <section className="module-view has-detail staff-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native Staff</p>
              <h2>Team schedule load</h2>
              <p>Filter team members, inspect assignments, and edit profile, services, locations, and active status.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/staff")}>
                Open staff in browser
              </button>
            </div>
          </div>

          {error && <div className="error-banner inline">{error}</div>}

          <div className="metric-grid module-metrics">
            <MetricCard label="Staff" tone="cobalt" value={summary?.totalStaff ?? 0} />
            <MetricCard label="Active" tone="emerald" value={summary?.activeStaff ?? 0} />
            <MetricCard label="Inactive" tone="amber" value={summary?.inactiveStaff ?? 0} />
            <MetricCard label="Profiles" tone="slate" value={summary?.withBio ?? 0} />
          </div>

          <div className="filters staff-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search staff name or bio"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} staff loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/staff"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading staff...</div>
          ) : data?.rows.length ? (
            <ul className="module-list staff-list">
              {data.rows.map((member) => (
                <li key={member.id}>
                  <button
                    className={selectedId === member.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenStaff(member.id)}
                  >
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.bio ?? member.primaryLocationName ?? "No profile bio yet"}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status ${member.isActive ? "stage-active" : "stage-churned"}`}>
                        {member.isActive ? "active" : "inactive"}
                      </span>
                      <span>
                        {member.assignedServicesCount} services - {member.assignedLocationsCount} locations - {member.availabilityWindowCount} windows
                      </span>
                      <span>
                        {member.todayBookingCount} today - {member.futureBookingCount} upcoming
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No staff match this filter.
            </div>
          )}
        </div>

        <StaffDetailPanel
          detail={detail}
          draft={draft}
          error={detailError}
          loading={detailLoading}
          saving={saving}
          onDraft={onDraft}
          onOpenWeb={onOpenWeb}
          onSave={onSave}
        />
      </div>
    </section>
  );
}

function LocationsWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  draft,
  error,
  loading,
  query,
  saving,
  selectedId,
  statusFilter,
  onApply,
  onDraft,
  onOpenLocation,
  onOpenWeb,
  onQuery,
  onRefresh,
  onSave,
  onStatusFilter,
}: {
  data: DesktopLocationsPayload | null;
  detail: LocationDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  draft: LocationEditDraft | null;
  error: string;
  loading: boolean;
  query: string;
  saving: boolean;
  selectedId: string | null;
  statusFilter: LocationStatusFilter;
  onApply: () => void;
  onDraft: (draft: LocationEditDraft) => void;
  onOpenLocation: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onSave: (id: string) => void;
  onStatusFilter: (status: LocationStatusFilter) => void;
}) {
  const summary = data?.summary;
  const statusOptions: Array<{ count: number; label: string; value: LocationStatusFilter }> = [
    { count: summary?.totalLocations ?? 0, label: "All", value: "all" },
    { count: summary?.activeLocations ?? 0, label: "Active", value: "active" },
    { count: summary?.inactiveLocations ?? 0, label: "Inactive", value: "inactive" },
  ];

  return (
    <section className="module-view has-detail locations-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native Locations</p>
              <h2>Branch coverage</h2>
              <p>Filter branches, inspect staff coverage and booking load, and edit address, slug, timezone, and default status.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/locations")}>
                Open locations in browser
              </button>
            </div>
          </div>

          {error && <div className="error-banner inline">{error}</div>}

          <div className="metric-grid module-metrics">
            <MetricCard label="Locations" tone="cobalt" value={summary?.totalLocations ?? 0} />
            <MetricCard label="Active" tone="emerald" value={summary?.activeLocations ?? 0} />
            <MetricCard label="Default" tone="amber" value={summary?.defaultLocations ?? 0} />
            <MetricCard label="Addresses" tone="slate" value={summary?.withAddress ?? 0} />
          </div>

          <div className="filters location-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search branch, address, phone, slug, or timezone"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} locations loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/locations"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading locations...</div>
          ) : data?.rows.length ? (
            <ul className="module-list location-list">
              {data.rows.map((location) => (
                <li key={location.id}>
                  <button
                    className={selectedId === location.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenLocation(location.id)}
                  >
                    <div>
                      <strong>{location.name}</strong>
                      <span>{location.address ?? location.phone ?? location.slug ?? location.timezone}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status ${location.isActive ? "stage-active" : "stage-churned"}`}>
                        {location.isDefault ? "default" : location.isActive ? "active" : "inactive"}
                      </span>
                      <span>
                        {location.staffCount} staff - {location.futureBookingCount} upcoming - {location.timezone}
                      </span>
                      <span>
                        {location.lastBookingAt ? formatModuleMeta(location.lastBookingAt) : `${location.bookingCount} all-time bookings`}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No locations match this filter.
            </div>
          )}
        </div>

        <LocationDetailPanel
          detail={detail}
          draft={draft}
          error={detailError}
          loading={detailLoading}
          saving={saving}
          onDraft={onDraft}
          onOpenWeb={onOpenWeb}
          onSave={onSave}
        />
      </div>
    </section>
  );
}

function ModuleWorkspace({
  aiRunDetail,
  aiRunDetailError,
  aiRunDetailLoading,
  automationDetail,
  automationDetailError,
  automationDetailLoading,
  automationDetailSaving,
  broadcastDetail,
  broadcastDetailError,
  broadcastDetailLoading,
  clientDetail,
  clientDetailError,
  clientDetailLoading,
  clientDetailSaving,
  clientEditDraft,
  clientNoteDraft,
  clientNoteSaving,
  data,
  dealDetail,
  dealDetailError,
  dealDetailLoading,
  error,
  locationDetail,
  locationDetailError,
  locationDetailLoading,
  locationDetailSaving,
  locationEditDraft,
  integrationDetail,
  integrationDetailError,
  integrationDetailLoading,
  loading,
  marketingDetail,
  marketingDetailError,
  marketingDetailLoading,
  marketingDetailSaving,
  paymentDetail,
  paymentDetailError,
  paymentDetailLoading,
  reviewDetail,
  reviewDetailError,
  reviewDetailLoading,
  reviewDetailSaving,
  reviewReplyDraft,
  route,
  selectedItemId,
  serviceEditDraft,
  serviceDetail,
  serviceDetailError,
  serviceDetailLoading,
  serviceDetailSaving,
  serviceForceDeactivate,
  staffEditDraft,
  staffDetail,
  staffDetailError,
  staffDetailLoading,
  staffDetailSaving,
  onOpenBrowser,
  onClientDraft,
  onClientNoteDraft,
  onClientNoteSave,
  onClientSave,
  onOpenItem,
  onOpenItemBrowser,
  onRefresh,
  onServiceDraft,
  onServiceForceDeactivate,
  onServiceSave,
  onStaffDraft,
  onStaffSave,
  onLocationDraft,
  onLocationSave,
  onReviewDraft,
  onReviewSave,
  onReviewTogglePublished,
  onAutomationToggle,
  onMarketingContentAction,
}: {
  aiRunDetail?: AiWorkflowRunDetailPayload | null;
  aiRunDetailError?: string;
  aiRunDetailLoading?: boolean;
  automationDetail?: AutomationDetailPayload | null;
  automationDetailError?: string;
  automationDetailLoading?: boolean;
  automationDetailSaving?: boolean;
  broadcastDetail?: BroadcastDetailPayload | null;
  broadcastDetailError?: string;
  broadcastDetailLoading?: boolean;
  clientDetail?: ClientDetailPayload | null;
  clientDetailError?: string;
  clientDetailLoading?: boolean;
  clientDetailSaving?: boolean;
  clientEditDraft?: ClientEditDraft | null;
  clientNoteDraft?: string;
  clientNoteSaving?: boolean;
  data: DesktopModulePayload | undefined;
  dealDetail?: DealDetailPayload | null;
  dealDetailError?: string;
  dealDetailLoading?: boolean;
  error: string;
  locationDetail?: LocationDetailPayload | null;
  locationDetailError?: string;
  locationDetailLoading?: boolean;
  locationDetailSaving?: boolean;
  locationEditDraft?: LocationEditDraft | null;
  integrationDetail?: IntegrationDetailPayload | null;
  integrationDetailError?: string;
  integrationDetailLoading?: boolean;
  loading: boolean;
  marketingDetail?: MarketingDetailPayload | null;
  marketingDetailError?: string;
  marketingDetailLoading?: boolean;
  marketingDetailSaving?: boolean;
  paymentDetail?: PaymentDetailPayload | null;
  paymentDetailError?: string;
  paymentDetailLoading?: boolean;
  reviewDetail?: ReviewDetailPayload | null;
  reviewDetailError?: string;
  reviewDetailLoading?: boolean;
  reviewDetailSaving?: boolean;
  reviewReplyDraft?: string;
  route: DashboardRoute;
  selectedItemId?: string | null;
  serviceEditDraft?: ServiceEditDraft | null;
  serviceDetail?: ServiceDetailPayload | null;
  serviceDetailError?: string;
  serviceDetailLoading?: boolean;
  serviceDetailSaving?: boolean;
  serviceForceDeactivate?: boolean;
  staffEditDraft?: StaffEditDraft | null;
  staffDetail?: StaffDetailPayload | null;
  staffDetailError?: string;
  staffDetailLoading?: boolean;
  staffDetailSaving?: boolean;
  onOpenBrowser: () => void;
  onClientDraft?: (draft: ClientEditDraft) => void;
  onClientNoteDraft?: (value: string) => void;
  onClientNoteSave?: (id: string) => void;
  onClientSave?: (id: string) => void;
  onOpenItem?: (id: string) => void;
  onOpenItemBrowser: (path: string) => void;
  onRefresh: () => void;
  onServiceDraft?: (draft: ServiceEditDraft) => void;
  onServiceForceDeactivate?: (value: boolean) => void;
  onServiceSave?: (id: string) => void;
  onStaffDraft?: (draft: StaffEditDraft) => void;
  onStaffSave?: (id: string) => void;
  onLocationDraft?: (draft: LocationEditDraft) => void;
  onLocationSave?: (id: string) => void;
  onReviewDraft?: (value: string) => void;
  onReviewSave?: (id: string) => void;
  onReviewTogglePublished?: (id: string, isPublished: boolean) => void;
  onAutomationToggle?: (id: string, isActive: boolean) => void;
  onMarketingContentAction?: (id: string, action: "approve" | "publish") => void;
}) {
  const isClientModule = route.id === "clients";
  const isServiceModule = route.id === "services";
  const isStaffModule = route.id === "staff";
  const isLocationModule = route.id === "locations";
  const isPaymentModule = route.id === "payments";
  const isReviewModule = route.id === "reviews";
  const isDealModule = route.id === "deals";
  const isBroadcastModule = route.id === "broadcasts";
  const isMarketingModule = route.id === "marketing";
  const isAiModule = route.id === "aiHub";
  const isAutomationModule = route.id === "automations";
  const isIntegrationModule = route.id === "integrations";
  const hasDetailPanel = isClientModule || isServiceModule || isStaffModule || isLocationModule || isPaymentModule || isReviewModule || isDealModule || isBroadcastModule || isMarketingModule || isAiModule || isAutomationModule || isIntegrationModule;

  return (
    <section className={hasDetailPanel ? "module-view has-detail" : "module-view"}>
      <div className={hasDetailPanel ? "module-split" : "module-single"}>
      <div className="module-panel glass-surface">
        <div className="module-head">
          <div>
            <p className="eyebrow">Native dashboard</p>
            <h2>{data?.title ?? route.label}</h2>
            <p>{data?.summary ?? route.summary}</p>
          </div>
          <div className="module-actions">
            <button className="primary small" disabled={loading} onClick={onRefresh}>
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button onClick={onOpenBrowser}>Open full web page in browser</button>
          </div>
        </div>

        {error && <div className="error-banner inline">{error}</div>}

        <div className="metric-grid module-metrics">
          {(data?.metrics ?? [
            { label: "Status", value: loading ? "Loading" : "Ready", detail: route.desktopApiPath ?? "Desktop API", tone: "cobalt" as const },
            { label: "Phase", value: `P${route.desktopPhase}`, detail: "Native rollout", tone: "slate" as const },
          ]).map((metricItem) => (
            <MetricCard
              key={metricItem.label}
              label={metricItem.label}
              tone={metricItem.tone ?? "slate"}
              value={metricItem.value}
            />
          ))}
        </div>

        <div className="module-meta">
          <span>{route.desktopApiPath ?? "Desktop API"}</span>
          <span>{data ? `Synced ${formatTime(data.refreshedAt)}` : loading ? "Loading live data" : "Ready to load"}</span>
        </div>

        {loading && !data ? (
          <div className="empty-state">Loading {route.label.toLowerCase()}...</div>
        ) : data?.items.length ? (
          <ul className="module-list">
            {data.items.map((moduleItem) => (
              <li key={moduleItem.id}>
                <button
                  className={selectedItemId === moduleItem.id ? "module-list-item selected" : "module-list-item"}
                  disabled={!onOpenItem}
                  type="button"
                  onClick={() => onOpenItem?.(moduleItem.id)}
                >
                  <div>
                    <strong>{moduleItem.title}</strong>
                    {moduleItem.subtitle && <span>{moduleItem.subtitle}</span>}
                  </div>
                  <div className="module-list-meta">
                    {moduleItem.status && <span className="module-status">{moduleItem.status}</span>}
                    {moduleItem.meta && <span>{formatModuleMeta(moduleItem.meta)}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">{data?.emptyState ?? "No data loaded yet."}</div>
        )}
      </div>

      {isClientModule && (
        <ClientDetailPanel
          detail={clientDetail ?? null}
          draft={clientEditDraft ?? null}
          error={clientDetailError ?? ""}
          loading={clientDetailLoading ?? false}
          noteDraft={clientNoteDraft ?? ""}
          savingDetail={clientDetailSaving ?? false}
          savingNote={clientNoteSaving ?? false}
          onDraft={onClientDraft ?? (() => undefined)}
          onNoteDraft={onClientNoteDraft ?? (() => undefined)}
          onNoteSave={onClientNoteSave ?? (() => undefined)}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
          onSave={onClientSave ?? (() => undefined)}
        />
      )}
      {isServiceModule && (
        <ServiceDetailPanel
          detail={serviceDetail ?? null}
          draft={serviceEditDraft ?? null}
          error={serviceDetailError ?? ""}
          forceDeactivate={serviceForceDeactivate ?? false}
          loading={serviceDetailLoading ?? false}
          saving={serviceDetailSaving ?? false}
          onDraft={onServiceDraft ?? (() => undefined)}
          onForceDeactivate={onServiceForceDeactivate ?? (() => undefined)}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
          onSave={onServiceSave ?? (() => undefined)}
        />
      )}
      {isStaffModule && (
        <StaffDetailPanel
          detail={staffDetail ?? null}
          draft={staffEditDraft ?? null}
          error={staffDetailError ?? ""}
          loading={staffDetailLoading ?? false}
          saving={staffDetailSaving ?? false}
          onDraft={onStaffDraft ?? (() => undefined)}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
          onSave={onStaffSave ?? (() => undefined)}
        />
      )}
      {isLocationModule && (
        <LocationDetailPanel
          detail={locationDetail ?? null}
          draft={locationEditDraft ?? null}
          error={locationDetailError ?? ""}
          loading={locationDetailLoading ?? false}
          saving={locationDetailSaving ?? false}
          onDraft={onLocationDraft ?? (() => undefined)}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
          onSave={onLocationSave ?? (() => undefined)}
        />
      )}
      {isPaymentModule && (
        <PaymentDetailPanel
          detail={paymentDetail ?? null}
          error={paymentDetailError ?? ""}
          loading={paymentDetailLoading ?? false}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
        />
      )}
      {isReviewModule && (
        <ReviewDetailPanel
          detail={reviewDetail ?? null}
          draft={reviewReplyDraft ?? ""}
          error={reviewDetailError ?? ""}
          loading={reviewDetailLoading ?? false}
          saving={reviewDetailSaving ?? false}
          onDraft={onReviewDraft ?? (() => undefined)}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
          onSave={onReviewSave ?? (() => undefined)}
          onTogglePublished={onReviewTogglePublished ?? (() => undefined)}
        />
      )}
      {isDealModule && (
        <DealDetailPanel
          detail={dealDetail ?? null}
          error={dealDetailError ?? ""}
          loading={dealDetailLoading ?? false}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
        />
      )}
      {isBroadcastModule && (
        <BroadcastDetailPanel
          detail={broadcastDetail ?? null}
          error={broadcastDetailError ?? ""}
          loading={broadcastDetailLoading ?? false}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
        />
      )}
      {isMarketingModule && (
        <MarketingDetailPanel
          detail={marketingDetail ?? null}
          error={marketingDetailError ?? ""}
          loading={marketingDetailLoading ?? false}
          saving={marketingDetailSaving ?? false}
          onContentAction={onMarketingContentAction ?? (() => undefined)}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
        />
      )}
      {isAiModule && (
        <AiRunDetailPanel
          detail={aiRunDetail ?? null}
          error={aiRunDetailError ?? ""}
          loading={aiRunDetailLoading ?? false}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
        />
      )}
      {isAutomationModule && (
        <AutomationDetailPanel
          detail={automationDetail ?? null}
          error={automationDetailError ?? ""}
          loading={automationDetailLoading ?? false}
          saving={automationDetailSaving ?? false}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
          onToggle={onAutomationToggle ?? (() => undefined)}
        />
      )}
      {isIntegrationModule && (
        <IntegrationDetailPanel
          detail={integrationDetail ?? null}
          error={integrationDetailError ?? ""}
          loading={integrationDetailLoading ?? false}
          onOpenWeb={(path) => onOpenItemBrowser(path)}
        />
      )}
      </div>
    </section>
  );
}

function ClientDetailPanel({
  detail,
  draft,
  error,
  loading,
  noteDraft,
  savingDetail,
  savingNote,
  onDraft,
  onNoteDraft,
  onNoteSave,
  onOpenWeb,
  onSave,
}: {
  detail: ClientDetailPayload | null;
  draft: ClientEditDraft | null;
  error: string;
  loading: boolean;
  noteDraft: string;
  savingDetail: boolean;
  savingNote: boolean;
  onDraft: (draft: ClientEditDraft) => void;
  onNoteDraft: (value: string) => void;
  onNoteSave: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onSave: (id: string) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading client...</aside>;
  }

  if (error) {
    return <aside className="detail-pane empty glass-surface">{error}</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select a client to view CRM details.</aside>;
  }

  const completedBookings = detail.bookings.filter((booking) => booking.status === "completed").length;
  const activeDraft = draft ?? clientDraftFromDetail(detail);
  const updateDraft = (patch: Partial<ClientEditDraft>) => onDraft({ ...activeDraft, ...patch });

  return (
    <aside className="detail-pane client-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{detail.client.name}</h2>
          <p>{detail.client.phone}</p>
        </div>
        <span className={`module-status stage-${detail.client.stage}`}>{detail.client.stage}</span>
      </div>

      <dl>
        <dt>Email</dt>
        <dd>{detail.client.email ?? "Not provided"}</dd>
        <dt>Source</dt>
        <dd>{detail.client.source?.replaceAll("_", " ") ?? "Not set"}</dd>
        <dt>Since</dt>
        <dd>{formatDateTime(detail.client.createdAt)}</dd>
        <dt>Loyalty</dt>
        <dd>{detail.client.loyaltyTier ?? "None"}</dd>
      </dl>

      <div className="client-mini-grid">
        <MetricCard label="Bookings" tone="cobalt" value={detail.bookings.length} />
        <MetricCard label="Completed" tone="emerald" value={completedBookings} />
      </div>

      <div className="actions">
        <button type="button" onClick={() => void navigator.clipboard?.writeText(detail.client.phone)}>
          Copy phone
        </button>
        {detail.client.email && (
          <button type="button" onClick={() => void navigator.clipboard?.writeText(detail.client.email ?? "")}>
            Copy email
          </button>
        )}
      </div>

      <section className="client-section">
        <h3>Edit profile</h3>
        <div className="client-edit-form">
          <label>
            <span>Name</span>
            <input value={activeDraft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
          </label>
          <label>
            <span>Phone</span>
            <input value={activeDraft.phone} onChange={(event) => updateDraft({ phone: event.target.value })} />
          </label>
          <label>
            <span>Email</span>
            <input value={activeDraft.email} onChange={(event) => updateDraft({ email: event.target.value })} />
          </label>
          <label>
            <span>Stage</span>
            <select
              value={activeDraft.stage}
              onChange={(event) => updateDraft({ stage: event.target.value as ClientStage })}
            >
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="churned">Churned</option>
            </select>
          </label>
          <label>
            <span>Source</span>
            <input value={activeDraft.source} onChange={(event) => updateDraft({ source: event.target.value })} />
          </label>
          <label>
            <span>Tags</span>
            <input value={activeDraft.tags} onChange={(event) => updateDraft({ tags: event.target.value })} />
          </label>
          <label className="wide">
            <span>Internal notes</span>
            <textarea
              maxLength={5000}
              value={activeDraft.internalNotes}
              onChange={(event) => updateDraft({ internalNotes: event.target.value })}
            />
          </label>
          <label className="checkbox-row wide">
            <input
              checked={activeDraft.communicationOptOut}
              type="checkbox"
              onChange={(event) => updateDraft({ communicationOptOut: event.target.checked })}
            />
            <span>Communication opt-out</span>
          </label>
          <div className="actions wide">
            <button
              className="primary"
              disabled={savingDetail || !activeDraft.name.trim() || !activeDraft.phone.trim()}
              type="button"
              onClick={() => onSave(detail.client.id)}
            >
              {savingDetail ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </section>

      <section className="client-section">
        <h3>Booking history</h3>
        {detail.bookings.length ? (
          <ul className="client-history">
            {detail.bookings.slice(0, 6).map((booking) => (
              <li key={booking.id}>
                <strong>{booking.serviceName}</strong>
                <span>{formatDateTime(booking.startsAt)} with {booking.staffName}</span>
                <span className={`badge ${booking.status}`}>{statusLabels[booking.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No bookings yet.</p>
        )}
      </section>

      <section className="client-section">
        <h3>Notes</h3>
        <div className="client-note-form">
          <textarea
            maxLength={2000}
            placeholder="Add a private note"
            value={noteDraft}
            onChange={(event) => onNoteDraft(event.target.value)}
          />
          <div className="actions">
            <button
              className="primary"
              disabled={savingNote || !noteDraft.trim()}
              type="button"
              onClick={() => onNoteSave(detail.client.id)}
            >
              {savingNote ? "Saving..." : "Add note"}
            </button>
          </div>
        </div>
        {detail.client.internalNotes && <p>{detail.client.internalNotes}</p>}
        {detail.notes.length ? (
          <ul className="client-notes">
            {detail.notes.slice(0, 4).map((note) => (
              <li key={note.id}>
                <span>{formatModuleMeta(note.createdAt)}</span>
                <p>{note.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No notes yet.</p>
        )}
      </section>

      <div className="actions">
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open full profile in browser</button>
      </div>
    </aside>
  );
}

function ServiceDetailPanel({
  detail,
  draft,
  error,
  forceDeactivate,
  loading,
  saving,
  onDraft,
  onForceDeactivate,
  onOpenWeb,
  onSave,
}: {
  detail: ServiceDetailPayload | null;
  draft: ServiceEditDraft | null;
  error: string;
  forceDeactivate: boolean;
  loading: boolean;
  saving: boolean;
  onDraft: (draft: ServiceEditDraft) => void;
  onForceDeactivate: (value: boolean) => void;
  onOpenWeb: (path: string) => void;
  onSave: (id: string) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading service...</aside>;
  }

  if (error) {
    return <aside className="detail-pane empty glass-surface">{error}</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select a service to view catalog details.</aside>;
  }

  const activeStaff = detail.assignedStaff.filter((member) => member.isActive).length;
  const activeDraft = draft ?? serviceDraftFromDetail(detail);
  const updateDraft = (patch: Partial<ServiceEditDraft>) => onDraft({ ...activeDraft, ...patch });

  return (
    <aside className="detail-pane service-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{detail.service.name}</h2>
          <p>{detail.service.description ?? "No description set"}</p>
        </div>
        <span className={`module-status ${detail.service.isActive ? "stage-active" : "stage-churned"}`}>
          {detail.service.isActive ? "active" : "inactive"}
        </span>
      </div>

      <div className="client-mini-grid">
        <MetricCard label="Price" tone="cobalt" value={formatMoneyLkr(detail.service.priceLkr)} />
        <MetricCard label="Duration" tone="slate" value={`${detail.service.durationMinutes}m`} />
      </div>

      <section className="client-section">
        <h3>Edit basics</h3>
        <div className="service-edit-form">
          <label>
            <span>Name</span>
            <input value={activeDraft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
          </label>
          <label>
            <span>Description</span>
            <textarea
              value={activeDraft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
            />
          </label>
          <div className="service-edit-grid">
            <label>
              <span>Price LKR</span>
              <input
                min="0"
                type="number"
                value={activeDraft.priceLkr}
                onChange={(event) => updateDraft({ priceLkr: event.target.value })}
              />
            </label>
            <label>
              <span>Duration min</span>
              <input
                min="5"
                type="number"
                value={activeDraft.durationMinutes}
                onChange={(event) => updateDraft({ durationMinutes: event.target.value })}
              />
            </label>
            <label>
              <span>Deposit %</span>
              <input
                max="100"
                min="0"
                type="number"
                value={activeDraft.depositPercent}
                onChange={(event) => updateDraft({ depositPercent: event.target.value })}
              />
            </label>
            <label>
              <span>Daily cap</span>
              <input
                min="1"
                placeholder="Unlimited"
                type="number"
                value={activeDraft.dailyCapacity}
                onChange={(event) => updateDraft({ dailyCapacity: event.target.value })}
              />
            </label>
            <label>
              <span>Before buffer</span>
              <input
                min="0"
                type="number"
                value={activeDraft.beforeBuffer}
                onChange={(event) => updateDraft({ beforeBuffer: event.target.value })}
              />
            </label>
            <label>
              <span>After buffer</span>
              <input
                min="0"
                type="number"
                value={activeDraft.afterBuffer}
                onChange={(event) => updateDraft({ afterBuffer: event.target.value })}
              />
            </label>
          </div>
          <label>
            <span>Minimum notice hours</span>
            <input
              min="0"
              type="number"
              value={activeDraft.minimumNoticeHours}
              onChange={(event) => updateDraft({ minimumNoticeHours: event.target.value })}
            />
          </label>
          <div className="service-switches">
            <label>
              <input
                checked={activeDraft.requiresPayment}
                type="checkbox"
                onChange={(event) => updateDraft({ requiresPayment: event.target.checked })}
              />
              <span>Require payment</span>
            </label>
            <label>
              <input
                checked={activeDraft.isActive}
                type="checkbox"
                onChange={(event) => updateDraft({ isActive: event.target.checked })}
              />
              <span>Active on booking page</span>
            </label>
          </div>
          {!activeDraft.isActive && (
            <label className="service-force">
              <input
                checked={forceDeactivate}
                type="checkbox"
                onChange={(event) => onForceDeactivate(event.target.checked)}
              />
              <span>Keep existing future bookings and hide this service from public booking</span>
            </label>
          )}
        </div>
      </section>

      <dl>
        <dt>Payment</dt>
        <dd>
          {detail.service.requiresPayment
            ? detail.service.depositPercent > 0
              ? `${detail.service.depositPercent}% deposit`
              : "Full payment required"
            : "No payment required"}
        </dd>
        <dt>Buffer</dt>
        <dd>{detail.service.beforeBuffer}m before, {detail.service.afterBuffer}m after</dd>
        <dt>Notice</dt>
        <dd>{detail.service.minimumNoticeHours ? `${detail.service.minimumNoticeHours}h minimum` : "No minimum"}</dd>
        <dt>Capacity</dt>
        <dd>{detail.service.dailyCapacity ? `${detail.service.dailyCapacity} per staff/day` : "Unlimited"}</dd>
      </dl>

      <section className="client-section">
        <h3>Assigned staff ({activeStaff}/{detail.assignedStaff.length} active)</h3>
        {detail.assignedStaff.length ? (
          <ul className="service-staff-list">
            {detail.assignedStaff.map((member) => (
              <li key={member.id}>
                <strong>{member.name}</strong>
                <span>{member.priceOverrideLkr ? `${formatMoneyLkr(member.priceOverrideLkr)} override` : "Default price"}</span>
                <span className={`module-status ${member.isActive ? "stage-active" : "stage-churned"}`}>
                  {member.isActive ? "active" : "inactive"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No staff assigned yet.</p>
        )}
      </section>

      <section className="client-section">
        <h3>Recent bookings</h3>
        {detail.recentBookings.length ? (
          <ul className="client-history">
            {detail.recentBookings.slice(0, 6).map((booking) => (
              <li key={booking.id}>
                <strong>{booking.clientName}</strong>
                <span>{formatDateTime(booking.startsAt)} with {booking.staffName}</span>
                <span className={`badge ${booking.status}`}>{statusLabels[booking.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No bookings for this service yet.</p>
        )}
      </section>

      <div className="actions">
        <button className="primary" disabled={saving} onClick={() => onSave(detail.service.id)}>
          {saving ? "Saving..." : "Save service"}
        </button>
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open full service in browser</button>
      </div>
    </aside>
  );
}

function StaffDetailPanel({
  detail,
  draft,
  error,
  loading,
  saving,
  onDraft,
  onOpenWeb,
  onSave,
}: {
  detail: StaffDetailPayload | null;
  draft: StaffEditDraft | null;
  error: string;
  loading: boolean;
  saving: boolean;
  onDraft: (draft: StaffEditDraft) => void;
  onOpenWeb: (path: string) => void;
  onSave: (id: string) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading staff profile...</aside>;
  }

  if (error) {
    return <aside className="detail-pane empty glass-surface">{error}</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select a staff member to view team details.</aside>;
  }

  const activeServices = detail.assignedServices.filter((service) => service.isActive).length;
  const activeLocations = detail.assignedLocations.filter((location) => location.isActive).length;
  const primaryLocation = detail.assignedLocations.find((location) => location.isPrimary);
  const activeDraft = draft ?? staffDraftFromDetail(detail);
  const availableServices = detail.availableServices.length ? detail.availableServices : detail.assignedServices;
  const availableLocations = detail.availableLocations.length ? detail.availableLocations : detail.assignedLocations;
  const updateDraft = (patch: Partial<StaffEditDraft>) => onDraft({ ...activeDraft, ...patch });
  const toggleDraftId = (field: "locationIds" | "serviceIds", id: string, checked: boolean) => {
    const values = new Set(activeDraft[field]);
    if (checked) values.add(id);
    else values.delete(id);
    if (field === "serviceIds") updateDraft({ serviceIds: Array.from(values) });
    else updateDraft({ locationIds: Array.from(values) });
  };

  return (
    <aside className="detail-pane staff-detail glass-surface">
      <div className="detail-head staff-profile-head">
        <div className="staff-profile">
          {detail.staff.avatarUrl ? (
            <span
              aria-hidden="true"
              className="staff-avatar-image"
              style={{ backgroundImage: `url("${detail.staff.avatarUrl}")` }}
            />
          ) : (
            <span>{detail.staff.name.slice(0, 1).toUpperCase()}</span>
          )}
          <div>
            <h2>{detail.staff.name}</h2>
            <p>{detail.staff.bio ?? "No bio set"}</p>
          </div>
        </div>
        <span className={`module-status ${detail.staff.isActive ? "stage-active" : "stage-churned"}`}>
          {detail.staff.isActive ? "active" : "inactive"}
        </span>
      </div>

      <div className="client-mini-grid">
        <MetricCard label="Services" tone="cobalt" value={`${activeServices}/${detail.assignedServices.length}`} />
        <MetricCard label="Locations" tone="emerald" value={`${activeLocations}/${detail.assignedLocations.length}`} />
      </div>

      <section className="client-section">
        <h3>Edit profile</h3>
        <div className="staff-edit-form">
          <label>
            <span>Name</span>
            <input value={activeDraft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
          </label>
          <label>
            <span>Bio</span>
            <textarea value={activeDraft.bio} onChange={(event) => updateDraft({ bio: event.target.value })} />
          </label>
          <label>
            <span>Avatar URL</span>
            <input
              placeholder="https://..."
              value={activeDraft.avatarUrl}
              onChange={(event) => updateDraft({ avatarUrl: event.target.value })}
            />
          </label>
          <div className="service-switches">
            <label>
              <input
                checked={activeDraft.isActive}
                type="checkbox"
                onChange={(event) => updateDraft({ isActive: event.target.checked })}
              />
              <span>Accept bookings</span>
            </label>
          </div>
          <div className="staff-assignment-grid">
            <div>
              <strong>Services</strong>
              {availableServices.length ? (
                availableServices.map((service) => (
                  <label key={service.id}>
                    <input
                      checked={activeDraft.serviceIds.includes(service.id)}
                      type="checkbox"
                      onChange={(event) => toggleDraftId("serviceIds", service.id, event.target.checked)}
                    />
                    <span>{service.name}{service.isActive ? "" : " (inactive)"}</span>
                  </label>
                ))
              ) : (
                <p>No services configured.</p>
              )}
            </div>
            <div>
              <strong>Locations</strong>
              {availableLocations.length ? (
                availableLocations.map((location) => (
                  <label key={location.id}>
                    <input
                      checked={activeDraft.locationIds.includes(location.id)}
                      disabled={!location.isActive && !activeDraft.locationIds.includes(location.id)}
                      type="checkbox"
                      onChange={(event) => toggleDraftId("locationIds", location.id, event.target.checked)}
                    />
                    <span>{location.name}{location.isActive ? "" : " (inactive)"}</span>
                  </label>
                ))
              ) : (
                <p>No locations configured.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <dl>
        <dt>Since</dt>
        <dd>{formatDateTime(detail.staff.createdAt)}</dd>
        <dt>Primary</dt>
        <dd>{primaryLocation?.name ?? "Not assigned"}</dd>
        <dt>Schedule</dt>
        <dd>{detail.availability.length ? `${detail.availability.length} weekly windows` : "No windows"}</dd>
      </dl>

      <section className="client-section">
        <h3>Can perform</h3>
        {detail.assignedServices.length ? (
          <ul className="service-staff-list">
            {detail.assignedServices.map((service) => (
              <li key={service.id}>
                <strong>{service.name}</strong>
                <span>{service.durationMinutes}m · {formatMoneyLkr(service.priceOverrideLkr ?? service.priceLkr)}</span>
                <span className={`module-status ${service.isActive ? "stage-active" : "stage-churned"}`}>
                  {service.isActive ? "active" : "inactive"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No services assigned yet.</p>
        )}
      </section>

      <section className="client-section">
        <h3>Availability</h3>
        {detail.availability.length ? (
          <ul className="staff-availability-list">
            {detail.availability.map((window) => (
              <li key={window.id}>
                <strong>{weekdayLabels[window.dayOfWeek] ?? `Day ${window.dayOfWeek}`}</strong>
                <span>{window.startTime} - {window.endTime}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No weekly availability set.</p>
        )}
      </section>

      <section className="client-section">
        <h3>Locations</h3>
        {detail.assignedLocations.length ? (
          <ul className="staff-availability-list">
            {detail.assignedLocations.map((location) => (
              <li key={location.id}>
                <strong>{location.name}</strong>
                <span>{location.timezone}{location.isPrimary ? " · primary" : ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No locations assigned.</p>
        )}
      </section>

      <section className="client-section">
        <h3>Recent bookings</h3>
        {detail.recentBookings.length ? (
          <ul className="client-history">
            {detail.recentBookings.slice(0, 6).map((booking) => (
              <li key={booking.id}>
                <strong>{booking.clientName}</strong>
                <span>{booking.serviceName} · {formatDateTime(booking.startsAt)}</span>
                <span className={`badge ${booking.status}`}>{statusLabels[booking.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No bookings for this staff member yet.</p>
        )}
      </section>

      <div className="actions">
        <button className="primary" disabled={saving || !activeDraft.name.trim()} onClick={() => onSave(detail.staff.id)}>
          {saving ? "Saving..." : "Save staff"}
        </button>
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open full staff profile in browser</button>
      </div>
    </aside>
  );
}

function LocationDetailPanel({
  detail,
  draft,
  error,
  loading,
  saving,
  onDraft,
  onOpenWeb,
  onSave,
}: {
  detail: LocationDetailPayload | null;
  draft: LocationEditDraft | null;
  error: string;
  loading: boolean;
  saving: boolean;
  onDraft: (draft: LocationEditDraft) => void;
  onOpenWeb: (path: string) => void;
  onSave: (id: string) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading location...</aside>;
  }

  if (error) {
    return <aside className="detail-pane empty glass-surface">{error}</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select a branch to view location details.</aside>;
  }

  const activeStaff = detail.assignedStaff.filter((member) => member.isActive).length;
  const activeDraft = draft ?? locationDraftFromDetail(detail);
  const updateDraft = (patch: Partial<LocationEditDraft>) => onDraft({ ...activeDraft, ...patch });

  return (
    <aside className="detail-pane location-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{detail.location.name}</h2>
          <p>{detail.location.address ?? detail.location.phone ?? "No address set"}</p>
        </div>
        <span className={`module-status ${detail.location.isActive ? "stage-active" : "stage-churned"}`}>
          {detail.location.isDefault ? "default" : detail.location.isActive ? "active" : "inactive"}
        </span>
      </div>

      <div className="client-mini-grid">
        <MetricCard label="Staff" tone="cobalt" value={`${activeStaff}/${detail.assignedStaff.length}`} />
        <MetricCard label="Bookings" tone="slate" value={detail.recentBookings.length} />
      </div>

      <section className="client-section">
        <h3>Edit branch</h3>
        <div className="location-edit-form">
          <label>
            <span>Name</span>
            <input value={activeDraft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
          </label>
          <label>
            <span>Address</span>
            <textarea value={activeDraft.address} onChange={(event) => updateDraft({ address: event.target.value })} />
          </label>
          <div className="location-edit-grid">
            <label>
              <span>Slug</span>
              <input value={activeDraft.slug} onChange={(event) => updateDraft({ slug: event.target.value })} />
            </label>
            <label>
              <span>Phone</span>
              <input value={activeDraft.phone} onChange={(event) => updateDraft({ phone: event.target.value })} />
            </label>
            <label>
              <span>Timezone</span>
              <input value={activeDraft.timezone} onChange={(event) => updateDraft({ timezone: event.target.value })} />
            </label>
            <label>
              <span>Sort order</span>
              <input
                min="0"
                type="number"
                value={activeDraft.sortOrder}
                onChange={(event) => updateDraft({ sortOrder: event.target.value })}
              />
            </label>
          </div>
          <div className="service-switches">
            <label>
              <input
                checked={activeDraft.isActive}
                type="checkbox"
                onChange={(event) => updateDraft({ isActive: event.target.checked })}
              />
              <span>Active branch</span>
            </label>
            <label>
              <input
                checked={activeDraft.isDefault}
                disabled={detail.location.isDefault}
                type="checkbox"
                onChange={(event) => updateDraft({ isDefault: event.target.checked })}
              />
              <span>Default branch</span>
            </label>
          </div>
        </div>
      </section>

      <dl>
        <dt>Slug</dt>
        <dd>{detail.location.slug ?? "Not set"}</dd>
        <dt>Phone</dt>
        <dd>{detail.location.phone ?? "Not provided"}</dd>
        <dt>Timezone</dt>
        <dd>{detail.location.timezone}</dd>
        <dt>Created</dt>
        <dd>{formatDateTime(detail.location.createdAt)}</dd>
      </dl>

      <section className="client-section">
        <h3>Assigned staff</h3>
        {detail.assignedStaff.length ? (
          <ul className="service-staff-list">
            {detail.assignedStaff.map((member) => (
              <li key={member.id}>
                <strong>{member.name}</strong>
                <span>{member.isPrimary ? "Primary branch" : "Assigned branch"}</span>
                <span className={`module-status ${member.isActive ? "stage-active" : "stage-churned"}`}>
                  {member.isActive ? "active" : "inactive"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No staff assigned to this branch.</p>
        )}
      </section>

      <section className="client-section">
        <h3>Recent bookings</h3>
        {detail.recentBookings.length ? (
          <ul className="client-history">
            {detail.recentBookings.slice(0, 6).map((booking) => (
              <li key={booking.id}>
                <strong>{booking.clientName}</strong>
                <span>{booking.serviceName} with {booking.staffName} · {formatDateTime(booking.startsAt)}</span>
                <span className={`badge ${booking.status}`}>{statusLabels[booking.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No bookings for this branch yet.</p>
        )}
      </section>

      <div className="actions">
        <button
          className="primary"
          disabled={saving || !activeDraft.name.trim() || !activeDraft.timezone.trim()}
          onClick={() => onSave(detail.location.id)}
        >
          {saving ? "Saving..." : "Save location"}
        </button>
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open locations in browser</button>
      </div>
    </aside>
  );
}

function PaymentsWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  error,
  loading,
  query,
  selectedId,
  statusFilter,
  onApply,
  onOpenPayment,
  onOpenWeb,
  onQuery,
  onRefresh,
  onStatusFilter,
}: {
  data: DesktopPaymentsPayload | null;
  detail: PaymentDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  error: string;
  loading: boolean;
  query: string;
  selectedId: string | null;
  statusFilter: PaymentStatusFilter;
  onApply: () => void;
  onOpenPayment: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onStatusFilter: (status: PaymentStatusFilter) => void;
}) {
  const summary = data?.summary;
  const statusOptions: Array<{ count: number; label: string; value: PaymentStatusFilter }> = [
    { count: summary?.totalPayments ?? 0, label: "All", value: "all" },
    { count: summary?.successfulPayments ?? 0, label: "Success", value: "success" },
    { count: summary?.pendingPayments ?? 0, label: "Pending", value: "pending" },
    { count: summary?.failedPayments ?? 0, label: "Failed", value: "failed" },
    { count: summary?.refundedPayments ?? 0, label: "Refunded", value: "refunded" },
  ];

  return (
    <section className="module-view has-detail payments-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native payments</p>
              <h2>Payments</h2>
              <p>PayHere attempts, revenue status, and booking context.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/payments")}>
                Open full payments in browser
              </button>
            </div>
          </div>

          {error && <div className="error-banner inline">{error}</div>}

          <div className="metric-grid module-metrics">
            <MetricCard label="Payments" tone="cobalt" value={summary?.totalPayments ?? 0} />
            <MetricCard label="Revenue" tone="emerald" value={formatMoneyLkr(summary?.successfulRevenueLkr ?? 0)} />
            <MetricCard label="Pending" tone="amber" value={summary?.pendingPayments ?? 0} />
            <MetricCard label="Failed" tone="slate" value={summary?.failedPayments ?? 0} />
          </div>

          <div className="filters payment-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search client, phone, service, or order"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} payments loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/payments"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading payments...</div>
          ) : data?.rows.length ? (
            <ul className="module-list payment-list">
              {data.rows.map((payment) => (
                <li key={payment.id}>
                  <button
                    className={selectedId === payment.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenPayment(payment.id)}
                  >
                    <div>
                      <strong>{formatMoneyLkr(payment.amountLkr)}</strong>
                      <span>{payment.clientName} · {payment.serviceName}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status payment-${payment.status}`}>{paymentStatusLabels[payment.status]}</span>
                      <span>{formatModuleMeta(payment.createdAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No payments match this filter.
            </div>
          )}
        </div>

        <PaymentDetailPanel
          detail={detail}
          error={detailError}
          loading={detailLoading}
          onOpenWeb={onOpenWeb}
        />
      </div>
    </section>
  );
}

function PaymentDetailPanel({
  detail,
  error,
  loading,
  onOpenWeb,
}: {
  detail: PaymentDetailPayload | null;
  error: string;
  loading: boolean;
  onOpenWeb: (path: string) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading payment...</aside>;
  }

  if (error) {
    return <aside className="detail-pane empty glass-surface">{error}</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select a payment to view revenue details.</aside>;
  }

  return (
    <aside className="detail-pane payment-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{formatMoneyLkr(detail.payment.amountLkr)}</h2>
          <p>{detail.booking.clientName} · {detail.booking.serviceName}</p>
        </div>
        <span className={`module-status payment-${detail.payment.status}`}>
          {paymentStatusLabels[detail.payment.status]}
        </span>
      </div>

      <dl>
        <dt>Order</dt>
        <dd>{detail.payment.orderId ?? "No PayHere order"}</dd>
        <dt>Created</dt>
        <dd>{formatDateTime(detail.payment.createdAt)}</dd>
        <dt>Receipt</dt>
        <dd>{detail.payment.receiptSentAt ? formatDateTime(detail.payment.receiptSentAt) : "Not sent"}</dd>
        <dt>Booking</dt>
        <dd>{statusLabels[detail.booking.status]}</dd>
      </dl>

      <section className="client-section">
        <h3>Booking context</h3>
        <ul className="payment-context-list">
          <li>
            <strong>{detail.booking.serviceName}</strong>
            <span>{formatDateTime(detail.booking.startsAt)} with {detail.booking.staffName}</span>
            <span>{detail.booking.locationName ?? "No branch"}</span>
          </li>
        </ul>
      </section>

      <section className="client-section">
        <h3>Client</h3>
        <dl>
          <dt>Name</dt>
          <dd>{detail.booking.clientName}</dd>
          <dt>Phone</dt>
          <dd>{detail.booking.clientPhone}</dd>
          <dt>Email</dt>
          <dd>{detail.booking.clientEmail ?? "Not provided"}</dd>
        </dl>
      </section>

      <div className="actions">
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open booking in browser</button>
      </div>
    </aside>
  );
}

function ReviewsWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  error,
  loading,
  query,
  ratingFilter,
  replyDraft,
  saving,
  selectedId,
  statusFilter,
  onApply,
  onOpenReview,
  onOpenWeb,
  onQuery,
  onRatingFilter,
  onRefresh,
  onReplyDraft,
  onReplySave,
  onStatusFilter,
  onTogglePublished,
}: {
  data: DesktopReviewsPayload | null;
  detail: ReviewDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  error: string;
  loading: boolean;
  query: string;
  ratingFilter: ReviewRatingFilter;
  replyDraft: string;
  saving: boolean;
  selectedId: string | null;
  statusFilter: ReviewStatusFilter;
  onApply: () => void;
  onOpenReview: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRatingFilter: (rating: ReviewRatingFilter) => void;
  onRefresh: () => void;
  onReplyDraft: (value: string) => void;
  onReplySave: (id: string) => void;
  onStatusFilter: (status: ReviewStatusFilter) => void;
  onTogglePublished: (id: string, isPublished: boolean) => void;
}) {
  const summary = data?.summary;
  const statusOptions: Array<{ count: number; label: string; value: ReviewStatusFilter }> = [
    { count: summary?.totalReviews ?? 0, label: "All", value: "all" },
    { count: summary?.publishedReviews ?? 0, label: "Published", value: "published" },
    { count: summary?.hiddenReviews ?? 0, label: "Hidden", value: "hidden" },
    { count: summary?.needsReplyReviews ?? 0, label: "Needs reply", value: "needs_reply" },
    { count: summary?.repliedReviews ?? 0, label: "Replied", value: "replied" },
  ];
  const ratingOptions: Array<{ label: string; value: ReviewRatingFilter }> = [
    { label: "All ratings", value: "all" },
    { label: "5 star", value: "5" },
    { label: "4 star", value: "4" },
    { label: "3 star", value: "3" },
    { label: "2 star", value: "2" },
    { label: "1 star", value: "1" },
  ];

  return (
    <section className="module-view has-detail reviews-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native reviews</p>
              <h2>Reviews</h2>
              <p>Ratings, visibility, owner replies, and booking context.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/reviews")}>
                Open full reviews in browser
              </button>
            </div>
          </div>

          {error && <div className="error-banner inline">{error}</div>}

          <div className="metric-grid module-metrics">
            <MetricCard label="Reviews" tone="cobalt" value={summary?.totalReviews ?? 0} />
            <MetricCard label="Average" tone="emerald" value={summary ? summary.averageRating.toFixed(1) : "0.0"} />
            <MetricCard label="Need reply" tone="amber" value={summary?.needsReplyReviews ?? 0} />
            <MetricCard label="5-star" tone="slate" value={summary?.fiveStarReviews ?? 0} />
          </div>

          <div className="filters review-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search client, comment, or reply"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <select value={ratingFilter} onChange={(event) => onRatingFilter(event.target.value as ReviewRatingFilter)}>
                {ratingOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} reviews loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/reviews"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading reviews...</div>
          ) : data?.rows.length ? (
            <ul className="module-list review-list">
              {data.rows.map((review) => (
                <li key={review.id}>
                  <button
                    className={selectedId === review.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenReview(review.id)}
                  >
                    <div>
                      <strong>{review.clientName}</strong>
                      <span>{review.comment ?? "No written comment"}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status ${review.isPublished ? "stage-active" : "stage-churned"}`}>
                        {review.isPublished ? "published" : "hidden"}
                      </span>
                      <span>{review.rating}/5 · {review.ownerReply ? "replied" : "needs reply"}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No reviews match this filter.
            </div>
          )}
        </div>

        <ReviewDetailPanel
          detail={detail}
          draft={replyDraft}
          error={detailError}
          loading={detailLoading}
          saving={saving}
          onDraft={onReplyDraft}
          onOpenWeb={onOpenWeb}
          onSave={onReplySave}
          onTogglePublished={onTogglePublished}
        />
      </div>
    </section>
  );
}

function ReviewDetailPanel({
  detail,
  draft,
  error,
  loading,
  saving,
  onDraft,
  onOpenWeb,
  onSave,
  onTogglePublished,
}: {
  detail: ReviewDetailPayload | null;
  draft: string;
  error: string;
  loading: boolean;
  saving: boolean;
  onDraft: (value: string) => void;
  onOpenWeb: (path: string) => void;
  onSave: (id: string) => void;
  onTogglePublished: (id: string, isPublished: boolean) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading review...</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select a review to reply natively.</aside>;
  }

  return (
    <aside className="detail-pane review-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{detail.review.clientName}</h2>
          <p>{detail.review.rating}/5 rating · {formatDateTime(detail.review.createdAt)}</p>
        </div>
        <span className={`module-status ${detail.review.isPublished ? "stage-active" : "stage-churned"}`}>
          {detail.review.isPublished ? "published" : "hidden"}
        </span>
      </div>

      {error && <div className="error-banner inline">{error}</div>}

      <section className="client-section">
        <h3>Review</h3>
        <p>{detail.review.comment ?? "No written comment."}</p>
      </section>

      {detail.booking && (
        <section className="client-section">
          <h3>Booking context</h3>
          <ul className="payment-context-list">
            <li>
              <strong>{detail.booking.serviceName ?? "Booking"}</strong>
              <span>
                {detail.booking.startsAt ? formatDateTime(detail.booking.startsAt) : "No date"}
                {detail.booking.staffName ? ` with ${detail.booking.staffName}` : ""}
              </span>
              <span>{detail.booking.locationName ?? "No branch"}</span>
            </li>
          </ul>
        </section>
      )}

      <section className="client-section">
        <h3>Owner reply</h3>
        <textarea
          rows={5}
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          placeholder="Write a clear, helpful reply..."
        />
        {detail.review.ownerRepliedAt && (
          <p>Last replied {formatDateTime(detail.review.ownerRepliedAt)} via {detail.review.ownerReplySource ?? "manual"}</p>
        )}
      </section>

      <div className="actions">
        <button className="primary" disabled={saving} onClick={() => onSave(detail.review.id)}>
          {saving ? "Saving..." : "Save reply"}
        </button>
        <button
          disabled={saving}
          onClick={() => onTogglePublished(detail.review.id, !detail.review.isPublished)}
        >
          {detail.review.isPublished ? "Hide review" : "Publish review"}
        </button>
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open reviews in browser</button>
      </div>
    </aside>
  );
}

function PlanGateNotice({
  message,
  onUpgrade,
}: {
  message: string;
  onUpgrade: () => void;
}) {
  return (
    <div className="plan-gate-notice">
      <div className="plan-gate-spark" aria-hidden="true">★</div>
      <div className="plan-gate-copy">
        <strong>{message || "This workspace is on a higher plan."}</strong>
        <p>Upgrade your Dinaya plan to unlock this workspace. Your existing data stays safe.</p>
      </div>
      <button className="primary small" type="button" onClick={onUpgrade}>
        View upgrade options
      </button>
    </div>
  );
}

// Gated workspaces (Pro/Growth) return HTTP 402 when the current plan can't access
// them. Show a friendly upgrade prompt instead of the generic red error banner.
function renderModuleError(error: string, onOpenWeb: (path: string) => void) {
  if (!error) return null;
  if (isPlanGateMessage(error)) {
    return (
      <PlanGateNotice
        message={planGateMessage(error)}
        onUpgrade={() => onOpenWeb("/dashboard/billing")}
      />
    );
  }
  return <div className="error-banner inline">{error}</div>;
}

function DealsWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  error,
  loading,
  query,
  selectedId,
  statusFilter,
  onApply,
  onOpenDeal,
  onOpenWeb,
  onQuery,
  onRefresh,
  onStatusFilter,
}: {
  data: DesktopDealsPayload | null;
  detail: DealDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  error: string;
  loading: boolean;
  query: string;
  selectedId: string | null;
  statusFilter: DealStatusFilter;
  onApply: () => void;
  onOpenDeal: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onStatusFilter: (status: DealStatusFilter) => void;
}) {
  const summary = data?.summary;
  const statusOptions: Array<{ count: number; label: string; value: DealStatusFilter }> = [
    { count: summary?.totalDeals ?? 0, label: "All", value: "all" },
    { count: summary?.activeDeals ?? 0, label: "Active", value: "active" },
    { count: summary?.upcomingDeals ?? 0, label: "Upcoming", value: "upcoming" },
    { count: summary?.soldOutDeals ?? 0, label: "Sold out", value: "sold_out" },
    { count: summary?.expiredDeals ?? 0, label: "Expired", value: "expired" },
    { count: summary?.cancelledDeals ?? 0, label: "Cancelled", value: "cancelled" },
  ];

  return (
    <section className="module-view has-detail deals-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native deals</p>
              <h2>Deals</h2>
              <p>Flash discounts, expiry windows, slot redemption, and demand signals.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/deals")}>
                Open full deals in browser
              </button>
            </div>
          </div>

          {renderModuleError(error, onOpenWeb)}

          <div className="metric-grid module-metrics">
            <MetricCard label="Deals" tone="cobalt" value={summary?.totalDeals ?? 0} />
            <MetricCard label="Active" tone="emerald" value={summary?.activeDeals ?? 0} />
            <MetricCard label="Redeemed" tone="amber" value={summary?.redeemedSlots ?? 0} />
            <MetricCard label="Views" tone="slate" value={summary?.impressions ?? 0} />
          </div>

          <div className="filters deal-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search service, branch, staff, or status"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} deals loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/deals"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading deals...</div>
          ) : data?.rows.length ? (
            <ul className="module-list deal-list">
              {data.rows.map((deal) => (
                <li key={deal.id}>
                  <button
                    className={selectedId === deal.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenDeal(deal.id)}
                  >
                    <div>
                      <strong>{deal.serviceName}</strong>
                      <span>{deal.discountPercent}% off · {formatMoneyLkr(deal.discountedPriceLkr)} · {deal.locationName}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status deal-${deal.displayStatus}`}>
                        {dealStatusLabels[deal.displayStatus]}
                      </span>
                      <span>{deal.slotsRedeemed}/{deal.slotsTotal} redeemed · ends {formatModuleMeta(deal.dealWindowEnd)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No deals match this filter.
            </div>
          )}
        </div>

        <DealDetailPanel
          detail={detail}
          error={detailError}
          loading={detailLoading}
          onOpenWeb={onOpenWeb}
        />
      </div>
    </section>
  );
}

function DealDetailPanel({
  detail,
  error,
  loading,
  onOpenWeb,
}: {
  detail: DealDetailPayload | null;
  error: string;
  loading: boolean;
  onOpenWeb: (path: string) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading deal...</aside>;
  }

  if (error) {
    return <aside className="detail-pane empty glass-surface">{error}</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select a deal to view campaign performance.</aside>;
  }

  const redemptionText = `${detail.deal.slotsRedeemed}/${detail.deal.slotsTotal}`;

  return (
    <aside className="detail-pane deal-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{detail.service.name}</h2>
          <p>{detail.deal.discountPercent}% off · {formatMoneyLkr(detail.deal.discountedPriceLkr)}</p>
        </div>
        <span className={`module-status deal-${detail.deal.displayStatus}`}>
          {dealStatusLabels[detail.deal.displayStatus]}
        </span>
      </div>

      <div className="client-mini-grid">
        <MetricCard label="Redeemed" tone="amber" value={redemptionText} />
        <MetricCard label="Views" tone="slate" value={detail.deal.impressionCount} />
      </div>

      <dl>
        <dt>Original</dt>
        <dd>{formatMoneyLkr(detail.service.priceLkr)}</dd>
        <dt>Remaining</dt>
        <dd>{detail.deal.slotsRemaining} slots</dd>
        <dt>Conversion</dt>
        <dd>{detail.deal.conversionPercent === null ? "No views yet" : `${detail.deal.conversionPercent}%`}</dd>
        <dt>Payment</dt>
        <dd>
          {detail.service.requiresPayment
            ? detail.service.depositPercent > 0
              ? `${detail.service.depositPercent}% deposit`
              : "Payment required"
            : "No payment required"}
        </dd>
      </dl>

      <section className="client-section">
        <h3>Windows</h3>
        <ul className="payment-context-list">
          <li>
            <strong>Claim window</strong>
            <span>{formatDateTime(detail.deal.dealWindowStart)} - {formatDateTime(detail.deal.dealWindowEnd)}</span>
          </li>
          <li>
            <strong>Appointment window</strong>
            <span>{formatDateTime(detail.deal.apptWindowStart)} - {formatDateTime(detail.deal.apptWindowEnd)}</span>
          </li>
        </ul>
      </section>

      <section className="client-section">
        <h3>Coverage</h3>
        <ul className="payment-context-list">
          <li>
            <strong>{detail.location.name}</strong>
            <span>{detail.location.timezone}</span>
          </li>
          <li>
            <strong>{detail.staff?.name ?? "Any assigned staff"}</strong>
            <span>{detail.service.durationMinutes}m service</span>
          </li>
        </ul>
      </section>

      <section className="client-section">
        <h3>Redeemed bookings</h3>
        {detail.recentBookings.length ? (
          <ul className="client-history">
            {detail.recentBookings.slice(0, 6).map((booking) => (
              <li key={booking.id}>
                <strong>{booking.clientName}</strong>
                <span>{formatDateTime(booking.startsAt)} · {formatMoneyLkr(booking.discountedPriceLkr)}</span>
                <span className={`badge ${booking.status}`}>{statusLabels[booking.status]}</span>
                {booking.paymentStatus && (
                  <span className={`module-status payment-${booking.paymentStatus}`}>
                    {paymentStatusLabels[booking.paymentStatus]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No redeemed bookings yet.</p>
        )}
      </section>

      <div className="actions">
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open deals in browser</button>
      </div>
    </aside>
  );
}

function BroadcastsWorkspace({
  channelFilter,
  data,
  detail,
  detailError,
  detailLoading,
  error,
  loading,
  query,
  selectedId,
  statusFilter,
  onApply,
  onChannelFilter,
  onOpenBroadcast,
  onOpenWeb,
  onQuery,
  onRefresh,
  onStatusFilter,
}: {
  channelFilter: BroadcastChannelFilter;
  data: DesktopBroadcastsPayload | null;
  detail: BroadcastDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  error: string;
  loading: boolean;
  query: string;
  selectedId: string | null;
  statusFilter: BroadcastStatusFilter;
  onApply: () => void;
  onChannelFilter: (channel: BroadcastChannelFilter) => void;
  onOpenBroadcast: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onStatusFilter: (status: BroadcastStatusFilter) => void;
}) {
  const summary = data?.summary;
  const statusOptions: Array<{ count: number; label: string; value: BroadcastStatusFilter }> = [
    { count: summary?.totalBroadcasts ?? 0, label: "All", value: "all" },
    { count: summary?.sentBroadcasts ?? 0, label: "Sent", value: "sent" },
    { count: summary?.sendingBroadcasts ?? 0, label: "Sending", value: "sending" },
    { count: summary?.draftBroadcasts ?? 0, label: "Draft", value: "draft" },
    { count: summary?.failedBroadcasts ?? 0, label: "Failed", value: "failed" },
  ];
  const channelOptions: Array<{ count: number; label: string; value: BroadcastChannelFilter }> = [
    { count: summary?.totalBroadcasts ?? 0, label: "All channels", value: "all" },
    { count: summary?.emailBroadcasts ?? 0, label: "Email", value: "email" },
    { count: summary?.whatsappBroadcasts ?? 0, label: "WhatsApp", value: "whatsapp" },
    { count: summary?.smsBroadcasts ?? 0, label: "SMS", value: "sms" },
  ];

  return (
    <section className="module-view has-detail broadcasts-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native broadcasts</p>
              <h2>Broadcasts</h2>
              <p>One-time campaigns, audience targeting, and delivery results.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/broadcasts")}>
                Open full broadcasts in browser
              </button>
            </div>
          </div>

          {renderModuleError(error, onOpenWeb)}

          <div className="metric-grid module-metrics">
            <MetricCard label="Broadcasts" tone="cobalt" value={summary?.totalBroadcasts ?? 0} />
            <MetricCard label="Sent" tone="emerald" value={summary?.sentMessages ?? 0} />
            <MetricCard label="Recipients" tone="amber" value={summary?.totalRecipients ?? 0} />
            <MetricCard label="Failed" tone="slate" value={summary?.failedMessages ?? 0} />
          </div>

          <div className="filters broadcast-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <select
                aria-label="Broadcast channel filter"
                value={channelFilter}
                onChange={(event) => onChannelFilter(event.target.value as BroadcastChannelFilter)}
              >
                {channelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
              <input
                placeholder="Search campaign, audience, subject, or message"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} broadcasts loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/broadcasts"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading broadcasts...</div>
          ) : data?.rows.length ? (
            <ul className="module-list broadcast-list">
              {data.rows.map((broadcast) => (
                <li key={broadcast.id}>
                  <button
                    className={selectedId === broadcast.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenBroadcast(broadcast.id)}
                  >
                    <div>
                      <strong>{broadcast.name}</strong>
                      <span>{broadcastChannelLabels[broadcast.channel]} - {broadcast.audienceLabel}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status broadcast-${broadcast.status}`}>
                        {broadcastStatusLabels[broadcast.status]}
                      </span>
                      <span>
                        {broadcast.sentCount}/{broadcast.recipientCount} sent - {broadcast.sentAt ? formatModuleMeta(broadcast.sentAt) : formatModuleMeta(broadcast.createdAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No broadcasts match this filter.
            </div>
          )}
        </div>

        <BroadcastDetailPanel
          detail={detail}
          error={detailError}
          loading={detailLoading}
          onOpenWeb={onOpenWeb}
        />
      </div>
    </section>
  );
}

function BroadcastDetailPanel({
  detail,
  error,
  loading,
  onOpenWeb,
}: {
  detail: BroadcastDetailPayload | null;
  error: string;
  loading: boolean;
  onOpenWeb: (path: string) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading broadcast...</aside>;
  }

  if (error) {
    return <aside className="detail-pane empty glass-surface">{error}</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select a broadcast to view delivery results.</aside>;
  }

  const deliveryRate = detail.results.deliveryRatePercent === null
    ? "No recipients"
    : `${detail.results.deliveryRatePercent}%`;
  const failureRate = detail.results.failureRatePercent === null
    ? "No recipients"
    : `${detail.results.failureRatePercent}%`;

  return (
    <aside className="detail-pane broadcast-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{detail.broadcast.name}</h2>
          <p>{broadcastChannelLabels[detail.broadcast.channel]} · {detail.audience.label}</p>
        </div>
        <span className={`module-status broadcast-${detail.broadcast.status}`}>
          {broadcastStatusLabels[detail.broadcast.status]}
        </span>
      </div>

      <div className="client-mini-grid">
        <MetricCard label="Sent" tone="emerald" value={detail.broadcast.sentCount} />
        <MetricCard label="Failed" tone="amber" value={detail.broadcast.failedCount} />
      </div>

      <dl>
        <dt>Recipients</dt>
        <dd>{detail.broadcast.recipientCount} targeted</dd>
        <dt>Eligible</dt>
        <dd>{detail.audience.eligibleRecipientCount} clients</dd>
        <dt>Delivery rate</dt>
        <dd>{deliveryRate}</dd>
        <dt>Failure rate</dt>
        <dd>{failureRate}</dd>
        <dt>Sent at</dt>
        <dd>{detail.broadcast.sentAt ? formatDateTime(detail.broadcast.sentAt) : "Not sent yet"}</dd>
      </dl>

      <section className="client-section">
        <h3>Message</h3>
        <div className="broadcast-body-preview">
          {detail.broadcast.subject && <strong>{detail.broadcast.subject}</strong>}
          <p>{detail.broadcast.body}</p>
        </div>
      </section>

      <section className="client-section">
        <h3>Results</h3>
        <ul className="payment-context-list">
          <li>
            <strong>{detail.broadcast.sentCount} sent</strong>
            <span>{detail.broadcast.skippedCount} skipped · {detail.results.remainingCount} remaining</span>
          </li>
          <li>
            <strong>{detail.broadcast.failedCount} failed</strong>
            <span>{detail.audience.cappedRecipientCount} max recipients for this send</span>
          </li>
        </ul>
      </section>

      <section className="client-section">
        <h3>Audience sample</h3>
        {detail.audience.sampleRecipients.length ? (
          <ul className="client-history">
            {detail.audience.sampleRecipients.map((recipient) => (
              <li key={recipient.id}>
                <strong>{recipient.name}</strong>
                <span>{recipient.phone}</span>
                <span>{recipient.email ?? "No email"}{recipient.tags?.length ? ` · ${recipient.tags.join(", ")}` : ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No matching recipients.</p>
        )}
      </section>

      <div className="actions">
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open broadcasts in browser</button>
      </div>
    </aside>
  );
}

function MarketingWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  error,
  loading,
  query,
  saving,
  selectedId,
  statusFilter,
  onApply,
  onContentAction,
  onOpenMarketing,
  onOpenWeb,
  onQuery,
  onRefresh,
  onStatusFilter,
}: {
  data: DesktopMarketingPayload | null;
  detail: MarketingDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  error: string;
  loading: boolean;
  query: string;
  saving: boolean;
  selectedId: string | null;
  statusFilter: MarketingStatusFilter;
  onApply: () => void;
  onContentAction: (id: string, action: "approve" | "publish") => void;
  onOpenMarketing: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onStatusFilter: (status: MarketingStatusFilter) => void;
}) {
  const summary = data?.summary;
  const statusOptions: Array<{ count: number; label: string; value: MarketingStatusFilter }> = [
    { count: (summary?.tools ?? 0) + (summary?.totalContent ?? 0), label: "All", value: "all" },
    { count: summary?.tools ?? 0, label: "Tools", value: "tools" },
    { count: summary?.draftContent ?? 0, label: "Drafts", value: "draft" },
    { count: summary?.approvedContent ?? 0, label: "Approved", value: "approved" },
    { count: summary?.publishedContent ?? 0, label: "Published", value: "published" },
    { count: summary?.failedContent ?? 0, label: "Failed", value: "failed" },
  ];

  return (
    <section className="module-view has-detail marketing-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native marketing</p>
              <h2>Growth tools and content</h2>
              <p>Share tools, directory state, social connections, and AI content calendar actions.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/marketing")}>
                Open full marketing in browser
              </button>
            </div>
          </div>

          {error && <div className="error-banner inline">{error}</div>}

          <div className="metric-grid module-metrics">
            <MetricCard label="Directory" tone={data?.directory.listed ? "emerald" : "amber"} value={data?.directory.listed ? "Listed" : "Hidden"} />
            <MetricCard label="Content" tone="cobalt" value={summary?.totalContent ?? 0} />
            <MetricCard label="Drafts" tone="amber" value={summary?.draftContent ?? 0} />
            <MetricCard label="Social" tone="slate" value={summary?.socialConnections ?? 0} />
          </div>

          <div className="filters marketing-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search tool, content, channel, branch, or status"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} marketing rows loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/marketing"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading marketing...</div>
          ) : data?.rows.length ? (
            <ul className="module-list marketing-list">
              {data.rows.map((row) => (
                <li key={row.id}>
                  <button
                    className={selectedId === row.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenMarketing(row.id)}
                  >
                    <div>
                      <strong>{row.title}</strong>
                      <span>{row.subtitle}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status ${row.kind === "share_tool" ? "integration-active" : `content-${row.status}`}`}>
                        {row.statusLabel}
                      </span>
                      <span>{row.contentDate ? formatModuleMeta(row.contentDate) : row.channel}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No marketing rows match this filter.
            </div>
          )}
        </div>

        <MarketingDetailPanel
          detail={detail}
          error={detailError}
          loading={detailLoading}
          saving={saving}
          onContentAction={onContentAction}
          onOpenWeb={onOpenWeb}
        />
      </div>
    </section>
  );
}

function MarketingDetailPanel({
  detail,
  error,
  loading,
  saving,
  onContentAction,
  onOpenWeb,
}: {
  detail: MarketingDetailPayload | null;
  error: string;
  loading: boolean;
  saving: boolean;
  onContentAction: (id: string, action: "approve" | "publish") => void;
  onOpenWeb: (path: string) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading marketing detail...</aside>;
  }

  if (error) {
    return <aside className="detail-pane empty glass-surface">{error}</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select a marketing tool or content item.</aside>;
  }

  if (detail.kind === "share_tool") {
    return (
      <aside className="detail-pane marketing-detail glass-surface">
        <div className="detail-head">
          <div>
            <h2>{detail.tool.title}</h2>
            <p>{detail.tool.description}</p>
          </div>
          <span className={`module-status ${detail.directory.listed ? "integration-active" : "integration-pending"}`}>
            {detail.directory.listed ? "Listed" : "Hidden"}
          </span>
        </div>

        <div className="client-mini-grid">
          <MetricCard label="Referral bookings" tone="amber" value={detail.referral.bookings} />
          <MetricCard label="Social accounts" tone="cobalt" value={detail.socialConnections.length} />
        </div>

        <dl>
          <dt>Booking URL</dt>
          <dd>{detail.share.bookingUrl}</dd>
          <dt>Referral code</dt>
          <dd>{detail.referral.code}</dd>
          <dt>Directory</dt>
          <dd>
            {[detail.directory.category, detail.directory.city, detail.directory.district]
              .filter(Boolean)
              .join(" · ") || "Not configured"}
          </dd>
          <dt>Reviews widget</dt>
          <dd>{detail.share.reviewsEmbedUrl}</dd>
        </dl>

        <section className="client-section">
          <h3>Ready snippets</h3>
          <div className="broadcast-body-preview">
            <strong>WhatsApp / Facebook</strong>
            <p>{detail.share.whatsappSnippet}</p>
          </div>
          <div className="broadcast-body-preview">
            <strong>Instagram bio</strong>
            <p>{detail.share.instagramSnippet}</p>
          </div>
        </section>

        <section className="client-section">
          <h3>Embed snippets</h3>
          <pre className="ai-meta-preview">{detail.share.embedSnippet}</pre>
          <pre className="ai-meta-preview">{detail.share.reviewsEmbedSnippet}</pre>
        </section>

        <section className="client-section">
          <h3>Channels</h3>
          {detail.socialConnections.length ? (
            <ul className="payment-context-list">
              {detail.socialConnections.map((connection) => (
                <li key={connection.id}>
                  <strong>{connection.provider}</strong>
                  <span>{connection.accountName ?? "No account name"} · {connection.isActive ? "active" : "inactive"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No social accounts connected yet.</p>
          )}
        </section>

        <div className="actions">
          <button className="primary" onClick={() => void navigator.clipboard?.writeText(detail.share.bookingUrl)}>
            Copy booking link
          </button>
          <button onClick={() => void navigator.clipboard?.writeText(detail.share.whatsappSnippet)}>
            Copy WhatsApp text
          </button>
          <button onClick={() => void navigator.clipboard?.writeText(detail.share.embedSnippet)}>
            Copy embed
          </button>
          <button onClick={() => onOpenWeb(detail.webUrl)}>Open marketing in browser</button>
        </div>
      </aside>
    );
  }

  const metaText = detail.content.meta ? JSON.stringify(detail.content.meta, null, 2) : "";

  return (
    <aside className="detail-pane marketing-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{detail.content.title}</h2>
          <p>{detail.content.channel} · {detail.location.name}</p>
        </div>
        <span className={`module-status content-${detail.content.status}`}>{detail.content.status}</span>
      </div>

      <div className="client-mini-grid">
        <MetricCard label="Date" tone="cobalt" value={formatModuleMeta(detail.content.contentDate)} />
        <MetricCard label="Channels" tone="slate" value={detail.socialConnections.length} />
      </div>

      <dl>
        <dt>Location</dt>
        <dd>{detail.location.name} · {detail.location.timezone}</dd>
        <dt>Created</dt>
        <dd>{formatDateTime(detail.content.createdAt)}</dd>
        <dt>Approved</dt>
        <dd>{detail.content.approvedAt ? formatDateTime(detail.content.approvedAt) : "Not approved"}</dd>
        <dt>Published</dt>
        <dd>{detail.content.publishedAt ? formatDateTime(detail.content.publishedAt) : "Not published"}</dd>
        <dt>Provider</dt>
        <dd>{detail.content.provider ?? "Not sent to provider"}</dd>
      </dl>

      <section className="client-section">
        <h3>Caption</h3>
        <div className="broadcast-body-preview">
          <p>{detail.content.caption}</p>
        </div>
      </section>

      {detail.content.error && (
        <section className="client-section">
          <h3>Error</h3>
          <p>{detail.content.error}</p>
        </section>
      )}

      {metaText && (
        <section className="client-section">
          <h3>Metadata</h3>
          <pre className="ai-meta-preview">{metaText}</pre>
        </section>
      )}

      <section className="client-section">
        <h3>Publishing context</h3>
        <ul className="payment-context-list">
          <li>
            <strong>Booking URL</strong>
            <span>{detail.share.bookingUrl}</span>
          </li>
          <li>
            <strong>Connected social</strong>
            <span>{detail.socialConnections.filter((connection) => connection.isActive).length} active accounts</span>
          </li>
        </ul>
      </section>

      <div className="actions">
        {detail.workflow.canApprove && (
          <button
            className="primary"
            disabled={saving}
            onClick={() => onContentAction(detail.content.id, "approve")}
          >
            {saving ? "Saving..." : "Approve"}
          </button>
        )}
        {detail.workflow.canPublish && (
          <button
            className="primary"
            disabled={saving || detail.content.status === "published"}
            onClick={() => onContentAction(detail.content.id, "publish")}
          >
            {saving ? "Saving..." : detail.content.status === "published" ? "Published" : "Publish"}
          </button>
        )}
        <button onClick={() => void navigator.clipboard?.writeText(detail.content.caption)}>
          Copy caption
        </button>
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open marketing in browser</button>
      </div>
    </aside>
  );
}

function AiRunDetailPanel({
  detail,
  error,
  loading,
  onOpenWeb,
}: {
  detail: AiWorkflowRunDetailPayload | null;
  error: string;
  loading: boolean;
  onOpenWeb: (path: string) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading AI run...</aside>;
  }

  if (error) {
    return <aside className="detail-pane empty glass-surface">{error}</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select an AI workflow run to inspect delivery context.</aside>;
  }

  const metaText = detail.run.meta ? JSON.stringify(detail.run.meta, null, 2) : "";

  return (
    <aside className="detail-pane ai-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{detail.run.workflowKey.replaceAll("-", " ")}</h2>
          <p>{detail.run.feature} · {detail.location?.name ?? "All branches"}</p>
        </div>
        <span className={`module-status ai-status-${detail.run.status}`}>
          {aiWorkflowStatusLabels[detail.run.status] ?? detail.run.status}
        </span>
      </div>

      <dl>
        <dt>Provider</dt>
        <dd>{detail.run.provider ?? "Not set"}</dd>
        <dt>Channel</dt>
        <dd>{detail.run.channel ?? "Not set"}</dd>
        <dt>Created</dt>
        <dd>{formatDateTime(detail.run.createdAt)}</dd>
        <dt>Executed</dt>
        <dd>{detail.run.executedAt ? formatDateTime(detail.run.executedAt) : "Not executed"}</dd>
        <dt>Scheduled</dt>
        <dd>{detail.run.scheduledFor ? formatDateTime(detail.run.scheduledFor) : "Not scheduled"}</dd>
      </dl>

      <section className="client-section">
        <h3>Generated copy</h3>
        <div className="broadcast-body-preview">
          {detail.run.subject && <strong>{detail.run.subject}</strong>}
          <p>{detail.run.body ?? "No generated body recorded."}</p>
        </div>
      </section>

      {detail.run.error && (
        <section className="client-section">
          <h3>Error</h3>
          <p>{detail.run.error}</p>
        </section>
      )}

      <section className="client-section">
        <h3>Entity</h3>
        <dl>
          <dt>Type</dt>
          <dd>{detail.run.entityType ?? "Business"}</dd>
          <dt>ID</dt>
          <dd>{detail.run.entityId ?? detail.run.idempotencyKey}</dd>
        </dl>
      </section>

      {metaText && (
        <section className="client-section">
          <h3>Metadata</h3>
          <pre className="ai-meta-preview">{metaText}</pre>
        </section>
      )}

      <div className="actions">
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open AI Hub in browser</button>
      </div>
    </aside>
  );
}

function AiHubWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  error,
  loading,
  query,
  reactivationResult,
  savingAction,
  selectedId,
  statusFilter,
  onApply,
  onContentAction,
  onGenerateContent,
  onOpenRun,
  onOpenWeb,
  onQuery,
  onRefresh,
  onRunReactivation,
  onStatusFilter,
  onToggleFeature,
}: {
  data: DesktopAiWorkflowRunsPayload | null;
  detail: AiWorkflowRunDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  error: string;
  loading: boolean;
  query: string;
  reactivationResult: AiReactivationResult | null;
  savingAction: string | null;
  selectedId: string | null;
  statusFilter: AiWorkflowRunStatusFilter;
  onApply: () => void;
  onContentAction: (id: string, action: "approve" | "publish") => void;
  onGenerateContent: (locationId?: string) => void;
  onOpenRun: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onRunReactivation: () => void;
  onStatusFilter: (status: AiWorkflowRunStatusFilter) => void;
  onToggleFeature: (locationId: string, feature: AiFeatureKey, enabled: boolean) => void;
}) {
  const summary = data?.summary;
  const defaultLocationId = data?.locations.find((location) => location.isDefault)?.id ?? data?.locations[0]?.id;
  const statusOptions: Array<{ count: number; label: string; value: AiWorkflowRunStatusFilter }> = [
    { count: summary?.totalRuns ?? 0, label: "All", value: "all" },
    { count: summary?.queuedRuns ?? 0, label: "Queued", value: "queued" },
    { count: summary?.sentRuns ?? 0, label: "Sent", value: "sent" },
    { count: summary?.failedRuns ?? 0, label: "Failed", value: "failed" },
    { count: summary?.skippedRuns ?? 0, label: "Skipped", value: "skipped" },
    { count: summary?.duplicateRuns ?? 0, label: "Duplicate", value: "duplicate" },
    { count: summary?.completedRuns ?? 0, label: "Completed", value: "completed" },
  ];

  return (
    <section className="module-view has-detail ai-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native AI Hub</p>
              <h2>AI workflow history</h2>
              <p>Generated copy, delivery status, provider context, and branch-level workflow activity.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/ai")}>
                Open full AI Hub in browser
              </button>
            </div>
          </div>

          {renderModuleError(error, onOpenWeb)}

          <div className="metric-grid module-metrics">
            <MetricCard label="Runs" tone="cobalt" value={summary?.totalRuns ?? 0} />
            <MetricCard label="Sent" tone="emerald" value={summary?.sentRuns ?? 0} />
            <MetricCard label="Failed" tone="amber" value={summary?.failedRuns ?? 0} />
            <MetricCard label="Workflows" tone="slate" value={summary?.workflows ?? 0} />
          </div>

          <section className="native-action-panel ai-launcher">
            <div>
              <p className="eyebrow">Launcher</p>
              <h3>Run supported AI workflows</h3>
              <p>Generate content drafts or run a one-off client reactivation pass from the native app.</p>
            </div>
            <div className="actions">
              <button
                className="primary"
                disabled={savingAction === "reactivation:run"}
                onClick={onRunReactivation}
              >
                {savingAction === "reactivation:run" ? "Running..." : "Run reactivation"}
              </button>
              <button
                disabled={!defaultLocationId || savingAction === "content:generate"}
                onClick={() => onGenerateContent(defaultLocationId)}
              >
                {savingAction === "content:generate" ? "Generating..." : "Generate 30 days"}
              </button>
            </div>
            {reactivationResult && (
              <div className="reactivation-summary">
                <strong>
                  Checked {reactivationResult.stats.checked} - Sent {reactivationResult.stats.sent} - Failed {reactivationResult.stats.failed}
                </strong>
                {reactivationResult.previews.slice(0, 3).map((preview) => (
                  <span key={`${preview.clientName}-${preview.status}`}>
                    {preview.clientName}: {preview.status}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="native-action-panel">
            <div>
              <p className="eyebrow">Branch controls</p>
              <h3>AI features per branch</h3>
            </div>
            {data?.locations.length ? (
              <ul className="ai-location-list">
                {data.locations.map((location) => (
                  <li key={location.id}>
                    <div>
                      <strong>{location.name}</strong>
                      <span>{location.address ?? "No branch address"}{location.isDefault ? " - Default" : ""}</span>
                    </div>
                    <div className="ai-toggle-grid">
                      {data.features.map((feature) => {
                        const checked = Boolean(location.aiConfig[feature.key]);
                        const saving = savingAction === `location:${location.id}:${feature.key}`;
                        return (
                          <label key={feature.key} title={feature.description}>
                            <input
                              checked={checked}
                              disabled={saving}
                              type="checkbox"
                              onChange={(event) => onToggleFeature(location.id, feature.key, event.target.checked)}
                            />
                            <span>{feature.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">Add a branch before enabling AI workflows.</div>
            )}
          </section>

          <section className="native-action-panel">
            <div>
              <p className="eyebrow">Content machine</p>
              <h3>Generated copy drafts</h3>
            </div>
            {data?.content.length ? (
              <ul className="ai-content-list">
                {data.content.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.contentDate} - {item.status}</span>
                      <p>{item.caption}</p>
                      {item.error && <span className="danger-text">{item.error}</span>}
                    </div>
                    <div className="actions">
                      <button onClick={() => navigator.clipboard?.writeText(item.caption)}>Copy</button>
                      <button
                        disabled={item.status === "approved" || item.status === "published" || savingAction === `content:${item.id}:approve`}
                        onClick={() => onContentAction(item.id, "approve")}
                      >
                        {savingAction === `content:${item.id}:approve` ? "Approving..." : "Approve"}
                      </button>
                      <button
                        className="primary"
                        disabled={item.status !== "approved" || savingAction === `content:${item.id}:publish`}
                        onClick={() => onContentAction(item.id, "publish")}
                      >
                        {savingAction === `content:${item.id}:publish` ? "Publishing..." : "Publish"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">No content drafts yet.</div>
            )}
          </section>

          <div className="filters ai-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search workflow, provider, branch, copy, or error"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} workflow runs loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/ai"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading AI workflow runs...</div>
          ) : data?.rows.length ? (
            <ul className="module-list ai-run-list">
              {data.rows.map((run) => (
                <li key={run.id}>
                  <button
                    className={selectedId === run.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenRun(run.id)}
                  >
                    <div>
                      <strong>{run.workflowKey.replaceAll("-", " ")}</strong>
                      <span>{run.feature} - {run.locationName ?? "All branches"}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status ai-status-${run.status}`}>
                        {aiWorkflowStatusLabels[run.status] ?? run.status}
                      </span>
                      <span>
                        {run.provider ?? "No provider"} - {run.channel ?? "No channel"} - {formatModuleMeta(run.executedAt ?? run.createdAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No AI workflow runs match this filter.
            </div>
          )}
        </div>

        <AiRunDetailPanel
          detail={detail}
          error={detailError}
          loading={detailLoading}
          onOpenWeb={onOpenWeb}
        />
      </div>
    </section>
  );
}

function AutomationsWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  error,
  loading,
  query,
  saving,
  selectedId,
  statusFilter,
  onApply,
  onOpenAutomation,
  onOpenWeb,
  onQuery,
  onRefresh,
  onStatusFilter,
  onToggle,
}: {
  data: DesktopAutomationsPayload | null;
  detail: AutomationDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  error: string;
  loading: boolean;
  query: string;
  saving: boolean;
  selectedId: string | null;
  statusFilter: AutomationStatusFilter;
  onApply: () => void;
  onOpenAutomation: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onStatusFilter: (status: AutomationStatusFilter) => void;
  onToggle: (id: string, isActive: boolean) => void;
}) {
  const summary = data?.summary;
  const statusOptions: Array<{ count: number; label: string; value: AutomationStatusFilter }> = [
    { count: summary?.totalRules ?? 0, label: "All", value: "all" },
    { count: summary?.activeRules ?? 0, label: "Active", value: "active" },
    { count: summary?.pausedRules ?? 0, label: "Paused", value: "paused" },
  ];

  return (
    <section className="module-view has-detail automations-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native Automations</p>
              <h2>Rules and run health</h2>
              <p>Booking-triggered follow-ups, delays, active state, and delivery run summaries.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/automations")}>
                Open full automations in browser
              </button>
            </div>
          </div>

          {renderModuleError(error, onOpenWeb)}

          <div className="metric-grid module-metrics">
            <MetricCard label="Rules" tone="cobalt" value={summary?.totalRules ?? 0} />
            <MetricCard label="Active" tone="emerald" value={summary?.activeRules ?? 0} />
            <MetricCard label="Delayed" tone="slate" value={summary?.delayedRules ?? 0} />
            <MetricCard label="Failed runs" tone="amber" value={summary?.failedRuns ?? 0} />
          </div>

          <div className="filters automation-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search name, trigger, delay, or status"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} automation rules loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/automations"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading automation rules...</div>
          ) : data?.rows.length ? (
            <ul className="module-list automation-run-list">
              {data.rows.map((rule) => (
                <li key={rule.id}>
                  <button
                    className={selectedId === rule.id ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => onOpenAutomation(rule.id)}
                  >
                    <div>
                      <strong>{rule.name}</strong>
                      <span>{rule.trigger} - {rule.delayMinutes ? `${rule.delayMinutes} min delay` : "Instant"}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status automation-${rule.isActive ? "active" : "paused"}`}>
                        {rule.isActive ? "Active" : "Paused"}
                      </span>
                      <span>
                        {rule.runSummary.sent} sent - {rule.runSummary.failed} failed - {formatModuleMeta(rule.updatedAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No automation rules match this filter.
            </div>
          )}
        </div>

        <AutomationDetailPanel
          detail={detail}
          error={detailError}
          loading={detailLoading}
          saving={saving}
          onOpenWeb={onOpenWeb}
          onToggle={onToggle}
        />
      </div>
    </section>
  );
}

function AutomationDetailPanel({
  detail,
  error,
  loading,
  saving,
  onOpenWeb,
  onToggle,
}: {
  detail: AutomationDetailPayload | null;
  error: string;
  loading: boolean;
  saving: boolean;
  onOpenWeb: (path: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading automation...</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select an automation to view run history.</aside>;
  }

  const actionsText = JSON.stringify(detail.rule.actions, null, 2);
  const conditionsText = detail.rule.conditions ? JSON.stringify(detail.rule.conditions, null, 2) : "";

  return (
    <aside className="detail-pane automation-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{detail.rule.name}</h2>
          <p>{detail.rule.trigger} · {detail.rule.delayMinutes} min delay</p>
        </div>
        <span className={`module-status automation-${detail.rule.isActive ? "active" : "paused"}`}>
          {detail.rule.isActive ? "Active" : "Paused"}
        </span>
      </div>

      {error && <div className="error-banner inline">{error}</div>}

      <div className="client-mini-grid">
        <MetricCard label="Runs" tone="cobalt" value={detail.summary.total} />
        <MetricCard label="Sent" tone="emerald" value={detail.summary.sent} />
      </div>

      <dl>
        <dt>Failed</dt>
        <dd>{detail.summary.failed}</dd>
        <dt>Pending</dt>
        <dd>{detail.summary.pending}</dd>
        <dt>Skipped</dt>
        <dd>{detail.summary.skipped}</dd>
        <dt>Updated</dt>
        <dd>{formatDateTime(detail.rule.updatedAt)}</dd>
      </dl>

      <section className="client-section">
        <h3>Actions</h3>
        <pre className="ai-meta-preview">{actionsText}</pre>
      </section>

      {conditionsText && (
        <section className="client-section">
          <h3>Conditions</h3>
          <pre className="ai-meta-preview">{conditionsText}</pre>
        </section>
      )}

      <section className="client-section">
        <h3>Recent runs</h3>
        {detail.recentRuns.length ? (
          <ul className="client-history">
            {detail.recentRuns.map((run) => (
              <li key={run.id}>
                <strong>{automationRunStatusLabels[run.status] ?? run.status}</strong>
                <span>{formatDateTime(run.createdAt)} · {run.triggerVersion}</span>
                <span>{run.error ?? run.entityId}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No runs recorded yet.</p>
        )}
      </section>

      <div className="actions">
        <button
          className={detail.rule.isActive ? "danger" : "primary"}
          disabled={saving}
          onClick={() => onToggle(detail.rule.id, !detail.rule.isActive)}
        >
          {saving ? "Saving..." : detail.rule.isActive ? "Pause automation" : "Enable automation"}
        </button>
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open automations in browser</button>
      </div>
    </aside>
  );
}

function IntegrationsWorkspace({
  data,
  detail,
  detailError,
  detailLoading,
  error,
  loading,
  query,
  selectedId,
  statusFilter,
  onApply,
  onOpenDetail,
  onOpenWeb,
  onQuery,
  onRefresh,
  onStatusFilter,
}: {
  data: DesktopIntegrationsPayload | null;
  detail: IntegrationDetailPayload | null;
  detailError: string;
  detailLoading: boolean;
  error: string;
  loading: boolean;
  query: string;
  selectedId: string | null;
  statusFilter: IntegrationStatusFilter;
  onApply: () => void;
  onOpenDetail: (id: string) => void;
  onOpenWeb: (path: string) => void;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  onStatusFilter: (status: IntegrationStatusFilter) => void;
}) {
  const summary = data?.summary;
  const statusOptions: Array<{ count: number; label: string; value: IntegrationStatusFilter }> = [
    { count: summary?.totalIntegrations ?? 0, label: "All", value: "all" },
    { count: summary?.connectedIntegrations ?? 0, label: "Connected", value: "connected" },
    { count: summary?.availableIntegrations ?? 0, label: "Available", value: "available" },
    { count: summary?.actionRequiredIntegrations ?? 0, label: "Needs setup", value: "action_required" },
    { count: summary?.envRequiredIntegrations ?? 0, label: "Env", value: "env_required" },
    { count: summary?.gatedIntegrations ?? 0, label: "Gated", value: "gated" },
  ];

  function handleOpen(row: IntegrationRow) {
    if (row.detailId) {
      onOpenDetail(row.detailId);
      return;
    }
    onOpenWeb(row.setupPath);
  }

  return (
    <section className="module-view has-detail integrations-workspace">
      <div className="module-split">
        <div className="module-panel glass-surface">
          <div className="module-head">
            <div>
              <p className="eyebrow">Native Integrations</p>
              <h2>Setup and connection status</h2>
              <p>Payments, calendar, messaging, voice, domain, webhooks, and API access.</p>
            </div>
            <div className="module-actions">
              <button className="primary small" disabled={loading} onClick={onRefresh}>
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={() => onOpenWeb(data?.webUrl ?? "/dashboard/settings/integrations")}>
                Open integrations in browser
              </button>
            </div>
          </div>

          {error && <div className="error-banner inline">{error}</div>}

          <div className="metric-grid module-metrics">
            <MetricCard label="Integrations" tone="cobalt" value={summary?.totalIntegrations ?? 0} />
            <MetricCard label="Connected" tone="emerald" value={summary?.connectedIntegrations ?? 0} />
            <MetricCard label="Needs setup" tone="amber" value={(summary?.actionRequiredIntegrations ?? 0) + (summary?.envRequiredIntegrations ?? 0)} />
            <MetricCard label="Gated" tone="slate" value={summary?.gatedIntegrations ?? 0} />
          </div>

          <div className="filters integration-filter-row">
            <div className="tabs">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={statusFilter === option.value ? "active" : ""}
                  type="button"
                  onClick={() => onStatusFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="filter-row">
              <input
                placeholder="Search provider, category, account, or status"
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApply();
                }}
              />
              <button className="primary" disabled={loading} onClick={onApply}>
                Apply
              </button>
            </div>
          </div>

          <div className="module-meta">
            <span>{data ? `${data.rows.length} integration rows loaded` : loading ? "Loading live data" : "Ready to load"}</span>
            <span>{data ? `Synced ${formatTime(data.serverTime)}` : "/api/v1/desktop/integrations"}</span>
          </div>

          {loading && !data ? (
            <div className="empty-state">Loading integrations...</div>
          ) : data?.rows.length ? (
            <ul className="module-list integration-list">
              {data.rows.map((row) => (
                <li key={row.id}>
                  <button
                    className={selectedId === row.detailId ? "module-list-item selected" : "module-list-item"}
                    type="button"
                    onClick={() => handleOpen(row)}
                  >
                    <div>
                      <strong>{row.name}</strong>
                      <span>{row.description}</span>
                    </div>
                    <div className="module-list-meta">
                      <span className={`module-status ${integrationListStatusClass[row.status]}`}>
                        {row.statusLabel}
                      </span>
                      <span>
                        {row.accountName ?? row.category} - {row.detailId ? "Native detail" : row.actionLabel}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No integrations match this filter.
            </div>
          )}
        </div>

        <IntegrationDetailPanel
          detail={detail}
          error={detailError}
          loading={detailLoading}
          onOpenWeb={onOpenWeb}
        />
      </div>
    </section>
  );
}

function IntegrationDetailPanel({
  detail,
  error,
  loading,
  onOpenWeb,
}: {
  detail: IntegrationDetailPayload | null;
  error: string;
  loading: boolean;
  onOpenWeb: (path: string) => void;
}) {
  if (loading && !detail) {
    return <aside className="detail-pane empty glass-surface">Loading integration...</aside>;
  }

  if (error) {
    return <aside className="detail-pane empty glass-surface">{error}</aside>;
  }

  if (!detail) {
    return <aside className="detail-pane empty glass-surface">Select an integration to view setup status.</aside>;
  }

  const integration = detail.integration;
  const statusClass = integrationStatusClass[integration.status] ?? "integration-pending";

  if (integration.kind === "social") {
    const metaText = integration.meta ? JSON.stringify(integration.meta, null, 2) : "";
    return (
      <aside className="detail-pane integration-detail glass-surface">
        <div className="detail-head">
          <div>
            <h2>{integration.provider}</h2>
            <p>{integration.accountName ?? "No account name"}</p>
          </div>
          <span className={`module-status ${statusClass}`}>{integration.statusLabel}</span>
        </div>

        <dl>
          <dt>Account ID</dt>
          <dd>{integration.accountId ?? "Not provided"}</dd>
          <dt>Created</dt>
          <dd>{formatDateTime(integration.createdAt)}</dd>
          <dt>Updated</dt>
          <dd>{formatDateTime(integration.updatedAt)}</dd>
          <dt>Setup</dt>
          <dd>{integration.isActive ? "Ready for sync" : "Reconnect required"}</dd>
        </dl>

        {metaText && (
          <section className="client-section">
            <h3>Metadata</h3>
            <pre className="ai-meta-preview">{metaText}</pre>
          </section>
        )}

        <div className="actions">
          <button onClick={() => onOpenWeb(detail.webUrl)}>Open integration setup</button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="detail-pane integration-detail glass-surface">
      <div className="detail-head">
        <div>
          <h2>{integration.provider}</h2>
          <p>{integration.languages.join(", ").toUpperCase()} · voice receptionist</p>
        </div>
        <span className={`module-status ${statusClass}`}>{integration.statusLabel}</span>
      </div>

      <dl>
        <dt>Business phone</dt>
        <dd>{integration.businessPhone ?? "Not set"}</dd>
        <dt>AI phone</dt>
        <dd>{integration.aiPhoneNumber ?? "Not assigned"}</dd>
        <dt>Handoff</dt>
        <dd>{integration.handoffPhone ?? "Not set"}</dd>
        <dt>Requested</dt>
        <dd>{integration.requestedAt ? formatDateTime(integration.requestedAt) : "Not requested"}</dd>
        <dt>Last tested</dt>
        <dd>{integration.lastTestedAt ? formatDateTime(integration.lastTestedAt) : "Not tested"}</dd>
      </dl>

      <section className="client-section">
        <h3>Call behavior</h3>
        <ul className="payment-context-list">
          <li>
            <strong>Welcome</strong>
            <span>{integration.welcomeMessage ?? "Default greeting"}</span>
          </li>
          <li>
            <strong>Opening rules</strong>
            <span>{integration.openingRules ?? "Use business availability"}</span>
          </li>
          <li>
            <strong>Booking rules</strong>
            <span>{integration.bookingRules ?? "Use Dinaya booking settings"}</span>
          </li>
        </ul>
      </section>

      {(integration.serviceRules || integration.faqNotes || integration.setupNotes) && (
        <section className="client-section">
          <h3>Notes</h3>
          <p>{[integration.serviceRules, integration.faqNotes, integration.setupNotes].filter(Boolean).join(" ")}</p>
        </section>
      )}

      <div className="actions">
        <button onClick={() => onOpenWeb(detail.webUrl)}>Open voice setup</button>
      </div>
    </aside>
  );
}

function formatUsageLimit(limit: number | null): string {
  return limit === null ? "Unlimited" : `${limit.toLocaleString("en-LK")} limit`;
}

function featureName(key: string): string {
  const labels: Record<string, string> = {
    automations: "Automations",
    broadcasts: "Broadcasts",
    deals: "Deals",
    googleCalendarSync: "Google Calendar",
    payments: "Payments",
    reports: "Reports",
    reviewReplies: "Review replies",
    voiceReceptionist: "Voice receptionist",
    webhooks: "Webhooks",
  };
  return labels[key] ?? key;
}

function reportStatusLabel(value: string): string {
  return statusLabels[value as BookingStatus] ?? value.replace(/_/g, " ");
}

function downloadTextFile(filename: string, content: string, contentType = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ReportsView({
  data,
  error,
  from,
  loading,
  to,
  onExportCopy,
  onFrom,
  onOpenPath,
  onRefresh,
  onTo,
}: {
  data: DesktopReportsPayload | null;
  error: string;
  from: string;
  loading: boolean;
  to: string;
  onExportCopy: (csv: string) => void;
  onFrom: (value: string) => void;
  onOpenPath: (path: string) => void;
  onRefresh: () => void;
  onTo: (value: string) => void;
}) {
  const [exportCopied, setExportCopied] = useState(false);
  const maxBreakdown = Math.max(
    1,
    ...[
      ...(data?.breakdowns.bookingsBySource ?? []),
      ...(data?.breakdowns.bookingsByStatus ?? []),
      ...(data?.breakdowns.revenueByService ?? []),
      ...(data?.breakdowns.staffLoad ?? []),
      ...(data?.breakdowns.topClients ?? []),
    ].map((item) => item.value),
  );

  function copyExport() {
    if (!data) return;
    onExportCopy(data.export.csv);
    setExportCopied(true);
    window.setTimeout(() => setExportCopied(false), 1500);
  }

  return (
    <section className="reports-view">
      <div className="reports-card reports-hero glass-surface">
        <div>
          <p className="eyebrow">Native reports</p>
          <h2>{data?.business.name ?? "Analytics & reports"}</h2>
          <p>
            {data
              ? `${data.range.from} to ${data.range.to} - ${data.business.timezone}`
              : loading
                ? "Loading report range"
                : "Choose a date range to load reports"}
          </p>
        </div>

        <div className="report-range-controls">
          <label>
            From
            <input type="date" value={from} onChange={(event) => onFrom(event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={to} onChange={(event) => onTo(event.target.value)} />
          </label>
          <button className="primary" disabled={loading} onClick={onRefresh}>
            {loading ? "Loading..." : "Apply range"}
          </button>
        </div>

        {error && <div className="error-banner inline">{error}</div>}
      </div>

      <div className="metric-grid report-metrics">
        <MetricCard label="Revenue" tone="emerald" value={data?.metrics.totalRevenueLabel ?? "LKR 0"} />
        <MetricCard label="Bookings" tone="cobalt" value={data?.metrics.totalBookings ?? 0} />
        <MetricCard label="Clients" tone="slate" value={data?.metrics.newClients ?? 0} />
        <MetricCard label="Avg rating" tone="amber" value={data ? data.metrics.averageRating.toFixed(1) : "0.0"} />
      </div>

      <div className="reports-grid">
        <section className="reports-card glass-surface">
          <div>
            <p className="eyebrow">Health</p>
            <h2>Booking outcomes</h2>
            <p>Completion, cancellation, and no-show signals for the selected range.</p>
          </div>
          <div className="report-health-grid">
            <div>
              <strong>{data?.metrics.completedBookings ?? 0}</strong>
              <span>Completed</span>
            </div>
            <div>
              <strong>{data?.metrics.cancellationRate ?? 0}%</strong>
              <span>Cancelled</span>
            </div>
            <div>
              <strong>{data?.metrics.noShowRate ?? 0}%</strong>
              <span>No-show</span>
            </div>
          </div>
          <ReportBars
            currency={false}
            items={(data?.breakdowns.bookingsByStatus ?? []).map((item) => ({
              ...item,
              label: reportStatusLabel(item.label),
            }))}
            max={maxBreakdown}
          />
        </section>

        <section className="reports-card glass-surface">
          <div>
            <p className="eyebrow">Revenue</p>
            <h2>Service revenue</h2>
            <p>Top earning services from successful payments.</p>
          </div>
          <ReportBars currency items={data?.breakdowns.revenueByService ?? []} max={maxBreakdown} />
        </section>
      </div>

      <div className="reports-grid">
        <section className="reports-card glass-surface">
          <div>
            <p className="eyebrow">Demand</p>
            <h2>Staff workload</h2>
            <p>Bookings assigned by staff member.</p>
          </div>
          <ReportBars currency={false} items={data?.breakdowns.staffLoad ?? []} max={maxBreakdown} />
        </section>

        <section className="reports-card glass-surface">
          <div>
            <p className="eyebrow">Clients</p>
            <h2>Top spend</h2>
            <p>Client revenue from successful payments.</p>
          </div>
          <ReportBars currency items={data?.breakdowns.topClients ?? []} max={maxBreakdown} />
        </section>
      </div>

      <section className="reports-card glass-surface">
        <div>
          <p className="eyebrow">Export</p>
          <h2>Report file</h2>
          <p>{data ? `${data.export.filename} - generated ${formatDateTime(data.export.generatedAt)}` : "Load report data to export CSV."}</p>
        </div>
        <div className="actions">
          <button disabled={!data} onClick={copyExport}>
            {exportCopied ? "Copied CSV" : "Copy CSV"}
          </button>
          <button disabled={!data} onClick={() => data && downloadTextFile(data.export.filename, data.export.csv)}>
            Download CSV
          </button>
          <button onClick={() => onOpenPath(data?.webUrl ?? "/dashboard/reports")}>
            Open full reports in browser
          </button>
        </div>
      </section>
    </section>
  );
}

function ReportBars({
  currency,
  items,
  max,
}: {
  currency: boolean;
  items: ReportBreakdownItem[];
  max: number;
}) {
  if (!items.length) {
    return <div className="empty-state compact">No data in this range.</div>;
  }

  return (
    <ul className="report-bar-list">
      {items.map((item) => (
        <li key={item.label}>
          <div>
            <strong>{item.label}</strong>
            <span>{currency ? formatMoneyLkr(item.value) : item.value.toLocaleString("en-LK")}</span>
          </div>
          <div className="usage-meter" aria-hidden="true">
            <span style={{ width: `${Math.max(4, Math.round((item.value / max) * 100))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function BillingView({
  data,
  error,
  loading,
  onOpenPath,
  onRefresh,
}: {
  data: DesktopBillingPayload | null;
  error: string;
  loading: boolean;
  onOpenPath: (path: string) => void;
  onRefresh: () => void;
}) {
  const current = data?.currentSubscription ?? null;
  const currentPlan = data?.business.effectivePlan ?? "trial";
  const recommendedPlan: DesktopPaidPlan | null =
    currentPlan === "pro" ? "max" : currentPlan === "max" ? null : "pro";
  const planLabels: Record<DesktopPaidPlan, string> = {
    starter: "Starter",
    pro: "Pro",
    max: "Growth",
  };
  const planDescriptions: Record<DesktopPaidPlan, string> = {
    starter: "Public booking page, PayHere payments, 1 branch, 2 staff, and 10 services.",
    pro: "Reviews, reports, reminders, Google Calendar, automations, and team controls.",
    max: "AI growth workflows, custom domain, branding removal, and 3-branch scale.",
  };

  return (
    <section className="billing-view">
      <div className="billing-card billing-hero glass-surface">
        <div>
          <p className="eyebrow">Native billing</p>
          <h2>{data?.business.planLabel ?? "Plan & billing"}</h2>
          <p>
            {current
              ? `${current.status.replace(/_/g, " ")} - billed ${current.billingInterval}`
              : loading
                ? "Loading billing state"
                : "No active subscription record"}
          </p>
        </div>

        <dl>
          <dt>Period end</dt>
          <dd>{current?.currentPeriodEnd ? formatDateTime(current.currentPeriodEnd) : data?.business.planExpiresAt ? formatDateTime(data.business.planExpiresAt) : "Not set"}</dd>
          <dt>Order</dt>
          <dd>{current?.payhereOrderId ?? "No PayHere order"}</dd>
          <dt>Subscription</dt>
          <dd>{current?.payhereSubscriptionId ?? "Not assigned"}</dd>
          <dt>Source</dt>
          <dd>Desktop API with secure key auth</dd>
        </dl>

        {error && <div className="error-banner inline">{error}</div>}

        <div className="actions">
          <button className="primary" disabled={loading} onClick={onRefresh}>
            {loading ? "Refreshing..." : "Refresh billing"}
          </button>
          <button onClick={() => onOpenPath(data?.actions.managePath ?? "/dashboard/billing")}>
            Manage billing in browser
          </button>
          <button onClick={() => onOpenPath(data?.actions.contactPath ?? "/contact")}>
            Contact support
          </button>
        </div>
      </div>

      <div className="billing-grid">
        <section className="billing-card glass-surface">
          <div>
            <p className="eyebrow">Usage</p>
            <h2>Plan limits</h2>
            <p>Current business usage against the active plan.</p>
          </div>
          {data?.usage.length ? (
            <ul className="usage-list">
              {data.usage.map((usage) => (
                <li key={usage.key}>
                  <div>
                    <strong>{usage.label}</strong>
                    <span>{usage.used.toLocaleString("en-LK")} used - {formatUsageLimit(usage.limit)}</span>
                  </div>
                  <div className="usage-meter" aria-hidden="true">
                    <span style={{ width: `${usage.percent ?? 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">{loading ? "Loading usage..." : "Usage is not available yet."}</div>
          )}
        </section>

        <section className="billing-card glass-surface">
          <div>
            <p className="eyebrow">Entitlements</p>
            <h2>Included features</h2>
            <p>Native visibility for what this desktop can rely on.</p>
          </div>
          {data ? (
            <div className="feature-chip-grid">
              {Object.entries(data.features).map(([key, enabled]) => (
                <span key={key} className={enabled ? "feature-on" : "feature-off"}>
                  {featureName(key)}
                </span>
              ))}
            </div>
          ) : (
            <div className="empty-state">{loading ? "Loading features..." : "No entitlement data loaded."}</div>
          )}
        </section>
      </div>

      <div className="billing-grid">
        {(["starter", "pro", "max"] as const).map((planKey) => {
          const pricing = data?.pricing[planKey];
          const isCurrent = currentPlan === planKey;
          const isRecommended = recommendedPlan === planKey;
          return (
            <section key={planKey} className={isRecommended ? "billing-card plan-card recommended glass-surface" : "billing-card plan-card glass-surface"}>
              <div>
                <p className="eyebrow">{isCurrent ? "Current plan" : isRecommended ? "Recommended" : "Available plan"}</p>
                <h2>{planLabels[planKey]}</h2>
                <p>{planDescriptions[planKey]}</p>
              </div>
              <div className="plan-price">
                <strong>{pricing ? formatMoneyLkr(pricing.monthlyLkr) : "-"}</strong>
                <span>per month</span>
              </div>
              <p>
                Annual {pricing ? formatMoneyLkr(pricing.annualLkr) : "-"}
                {pricing && pricing.annualSavingsPercent > 0 ? ` - save ${pricing.annualSavingsPercent}%` : ""}
              </p>
              <button
                className={isRecommended ? "primary" : ""}
                disabled={!pricing?.available}
                onClick={() => onOpenPath(planKey === "starter" ? data?.actions.upgradeStarterPath ?? "/dashboard/billing" : planKey === "pro" ? data?.actions.upgradeProPath ?? "/dashboard/billing" : data?.actions.upgradeMaxPath ?? "/dashboard/billing")}
              >
                {isCurrent ? "Manage current plan" : pricing?.available ? `Open ${planLabels[planKey]} checkout` : "Contact support"}
              </button>
            </section>
          );
        })}
      </div>

      <section className="billing-card glass-surface">
        <div>
          <p className="eyebrow">History</p>
          <h2>Subscription records</h2>
          <p>Recent PayHere subscription records synced from the server.</p>
        </div>
        {data?.subscriptions.length ? (
          <ul className="subscription-list">
            {data.subscriptions.map((subscription) => (
              <li key={subscription.id}>
                <div>
                  <strong>{subscription.plan.toUpperCase()} - {subscription.billingInterval}</strong>
                  <span>{formatMoneyLkr(subscription.amountLkr)} - {subscription.payhereOrderId}</span>
                </div>
                <div>
                  <span className={`module-status subscription-${subscription.status}`}>{subscription.status.replace(/_/g, " ")}</span>
                  <span>{subscription.currentPeriodEnd ? formatDateTime(subscription.currentPeriodEnd) : formatDateTime(subscription.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">{loading ? "Loading subscription records..." : "No subscription records found."}</div>
        )}
      </section>
    </section>
  );
}

function formatModuleMeta(value: string): string {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && value.includes("T")) {
    return formatDateTime(value);
  }
  return value;
}

function SettingsView({
  business,
  data,
  draft,
  error,
  lastSync,
  loading,
  publicUrl,
  saving,
  onDraft,
  onLogout,
  onRefresh,
  onRevokeCurrentDevice,
  onSave,
}: {
  business: Business | null;
  data: DesktopSettingsPayload | null;
  draft: SettingsEditDraft | null;
  error: string;
  lastSync: string | null;
  loading: boolean;
  publicUrl: string;
  saving: boolean;
  onDraft: (draft: SettingsEditDraft) => void;
  onLogout: () => Promise<void>;
  onRefresh: () => void;
  onRevokeCurrentDevice: () => void;
  onSave: () => void;
}) {
  const currentDevice = data?.devices.find((device) => device.isCurrent) ?? null;
  const form = draft ?? settingsDraftFromData(data, business);
  const updateForm = (patch: Partial<SettingsEditDraft>) => onDraft({ ...form, ...patch });

  return (
    <section className="settings-view">
      <div className="settings-card glass-surface">
        <div>
          <p className="eyebrow">Device</p>
          <h2>{business?.name ?? "Dinaya"}</h2>
          <p>{business?.plan ?? "Business"} plan - {business?.timezone ?? "Asia/Colombo"}</p>
        </div>
        <dl>
          <dt>Booking page</dt>
          <dd>{publicUrl}</dd>
          <dt>Sync</dt>
          <dd>{lastSync ? formatDateTime(lastSync) : "Not synced yet"}</dd>
          <dt>Storage</dt>
          <dd>OS secure keyring</dd>
          <dt>Server devices</dt>
          <dd>
            {data
              ? `${data.summary.activeDevices} active · ${data.summary.revokedDevices} revoked`
              : loading
                ? "Loading..."
                : "Not loaded"}
          </dd>
        </dl>
        {error && <div className="error-banner inline">{error}</div>}
        <div className="actions">
          <button disabled={loading} onClick={onRefresh}>
            {loading ? "Refreshing..." : "Refresh device status"}
          </button>
          <button onClick={() => void invoke("desktop_open_dashboard")}>Open web dashboard in browser</button>
          <button className="danger" onClick={() => void onLogout()}>Log out</button>
        </div>
      </div>

      <div className="settings-card glass-surface settings-editor">
        <div>
          <p className="eyebrow">Native settings</p>
          <h2>Business profile</h2>
          <p>Profile, booking policy, and public page fields synced through the desktop API.</p>
        </div>

        <div className="settings-form-grid">
          <label>
            <span>Business name</span>
            <input
              value={form.name}
              onChange={(event) => updateForm({ name: event.target.value })}
            />
          </label>
          <label>
            <span>Phone</span>
            <input
              value={form.phone}
              onChange={(event) => updateForm({ phone: event.target.value })}
            />
          </label>
          <label>
            <span>Timezone</span>
            <select
              value={form.timezone}
              onChange={(event) => updateForm({ timezone: event.target.value })}
            >
              <option value="Asia/Colombo">Asia/Colombo</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
          <label>
            <span>Language</span>
            <select
              value={form.language}
              onChange={(event) => updateForm({ language: event.target.value as SettingsEditDraft["language"] })}
            >
              <option value="en">English</option>
              <option value="si">Sinhala</option>
              <option value="ta">Tamil</option>
            </select>
          </label>
          <label>
            <span>Business type</span>
            <input
              value={form.businessType}
              onChange={(event) => updateForm({ businessType: event.target.value })}
            />
          </label>
          <label>
            <span>Website</span>
            <input
              value={form.websiteUrl}
              onChange={(event) => updateForm({ websiteUrl: event.target.value })}
            />
          </label>
          <label className="settings-wide">
            <span>Address</span>
            <input
              value={form.address}
              onChange={(event) => updateForm({ address: event.target.value })}
            />
          </label>
          <label className="settings-wide">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => updateForm({ description: event.target.value })}
            />
          </label>
          <label className="settings-wide">
            <span>Cancellation policy</span>
            <textarea
              rows={3}
              value={form.cancellationPolicy}
              onChange={(event) => updateForm({ cancellationPolicy: event.target.value })}
            />
          </label>
          <label className="settings-wide">
            <span>Deposit policy</span>
            <textarea
              rows={3}
              value={form.depositPolicy}
              onChange={(event) => updateForm({ depositPolicy: event.target.value })}
            />
          </label>
          <label>
            <span>Instagram</span>
            <input
              value={form.instagramUrl}
              onChange={(event) => updateForm({ instagramUrl: event.target.value })}
            />
          </label>
          <label>
            <span>Facebook</span>
            <input
              value={form.facebookUrl}
              onChange={(event) => updateForm({ facebookUrl: event.target.value })}
            />
          </label>
          <label className="settings-wide">
            <span>Bank transfer instructions</span>
            <textarea
              rows={3}
              value={form.bankTransferInstructions}
              onChange={(event) => updateForm({ bankTransferInstructions: event.target.value })}
            />
          </label>
          <label className="settings-check">
            <input
              checked={form.directoryListed}
              type="checkbox"
              onChange={(event) => updateForm({ directoryListed: event.target.checked })}
            />
            <span>Show in Dinaya discover directory</span>
          </label>
        </div>

        <div className="actions">
          <button className="primary" disabled={saving || !form.name.trim()} onClick={onSave}>
            {saving ? "Saving..." : "Save native settings"}
          </button>
          <button onClick={() => void invoke("desktop_open_dashboard_path", { path: "/dashboard/settings" })}>
            Open full settings
          </button>
        </div>
      </div>

      <div className="settings-card glass-surface">
        <div>
          <p className="eyebrow">Desktop devices</p>
          <h2>{currentDevice?.deviceName ?? currentDevice?.name ?? "Current device"}</h2>
          <p>
            {currentDevice
              ? currentDevice.revokedAt
                ? `Revoked ${formatDateTime(currentDevice.revokedAt)}`
                : "Authenticated with a server-side desktop key"
              : loading
                ? "Loading this device"
                : "No current device record found"}
          </p>
        </div>

        {data?.devices.length ? (
          <ul className="settings-device-list">
            {data.devices.map((device) => (
              <li key={device.id}>
                <div>
                  <strong>{device.deviceName ?? device.name}</strong>
                  <span>{device.isCurrent ? "This device" : device.deviceId ?? "Desktop device"}</span>
                </div>
                <div>
                  <span className={`module-status ${device.revokedAt ? "integration-inactive" : "integration-active"}`}>
                    {device.revokedAt ? "Revoked" : "Active"}
                  </span>
                  <span>{device.lastUsedAt ? `Last used ${formatDateTime(device.lastUsedAt)}` : `Created ${formatDateTime(device.createdAt)}`}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">{loading ? "Loading desktop devices..." : "No desktop devices found."}</div>
        )}

        <div className="actions">
          <button
            className="danger"
            disabled={saving || !currentDevice || Boolean(currentDevice.revokedAt)}
            onClick={onRevokeCurrentDevice}
          >
            {saving ? "Revoking..." : "Revoke this device"}
          </button>
          <button onClick={() => void invoke("desktop_open_dashboard_path", { path: "/dashboard/settings/api-keys" })}>
            Manage all API keys
          </button>
        </div>
      </div>
    </section>
  );
}

installFrontendErrorLogging();

createRoot(document.getElementById("root")!).render(
  <DesktopErrorBoundary>
    <App />
  </DesktopErrorBoundary>,
);
