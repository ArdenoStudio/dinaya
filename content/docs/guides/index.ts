import type { DocsGuide } from "../types";
import { setupBookingPageGuide } from "./setup-booking-page";
import { manageAvailabilityGuide } from "./manage-availability";
import { connectPayhereGuide } from "./connect-payhere";
import { manageBookingsGuide } from "./manage-bookings";
import { shareBookingLinkGuide } from "./share-booking-link";
import { clientBooksOnlineGuide } from "./client-books-online";
import { addServicesGuide } from "./add-services";
import { addStaffAvailabilityGuide } from "./add-staff-availability";
import { collectReviewsGuide } from "./collect-reviews";
import { aiHubOverviewGuide } from "./ai-hub-overview";
import { automationsGuide } from "./automations";
import { upgradePlanGuide } from "./upgrade-plan";
import { dashboardCalendarGuide } from "./dashboard-calendar";
import { dashboardClientsGuide } from "./dashboard-clients";
import { manageLocationsGuide } from "./manage-locations";
import { dashboardPaymentsGuide } from "./dashboard-payments";
import { dashboardSettingsGuide } from "./dashboard-settings";
import { googleCalendarSyncGuide } from "./google-calendar-sync";
import { apiKeysWebhooksGuide } from "./api-keys-webhooks";
import { clientManageBookingGuide } from "./client-manage-booking";
import { acceptStaffInviteGuide } from "./accept-staff-invite";
import { discoverDirectoryGuide } from "./discover-directory";
import { dashboardReportsGuide } from "./dashboard-reports";

export const allGuides: DocsGuide[] = [
  setupBookingPageGuide,
  manageAvailabilityGuide,
  connectPayhereGuide,
  manageBookingsGuide,
  shareBookingLinkGuide,
  clientBooksOnlineGuide,
  addServicesGuide,
  addStaffAvailabilityGuide,
  collectReviewsGuide,
  aiHubOverviewGuide,
  automationsGuide,
  upgradePlanGuide,
  dashboardCalendarGuide,
  dashboardClientsGuide,
  manageLocationsGuide,
  dashboardPaymentsGuide,
  dashboardSettingsGuide,
  googleCalendarSyncGuide,
  apiKeysWebhooksGuide,
  clientManageBookingGuide,
  acceptStaffInviteGuide,
  discoverDirectoryGuide,
  dashboardReportsGuide,
];

export const guidesBySlug = Object.fromEntries(
  allGuides.map((g) => [g.slug, g]),
) as Record<string, DocsGuide>;

export const featuredGuideSlugs = [
  "setup-booking-page",
  "connect-payhere",
  "client-books-online",
  "share-booking-link",
  "manage-bookings",
  "manage-availability",
];

export function getGuidesByCategory(category: string): DocsGuide[] {
  return allGuides.filter((g) => g.category === category);
}

export function searchGuides(query: string): DocsGuide[] {
  const q = query.toLowerCase().trim();
  if (!q) return allGuides;
  return allGuides.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.steps.some(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.body.toLowerCase().includes(q),
      ),
  );
}
