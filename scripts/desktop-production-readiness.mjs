import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const routeMapPath = "src/lib/dashboard-route-map.ts";
const moduleServicePath = "src/lib/dashboard/desktop-modules.ts";
const desktopMainPath = "apps/desktop/src/main.tsx";
const desktopCommandsPath = "apps/desktop/src-tauri/src/commands.rs";
const desktopTauriMainPath = "apps/desktop/src-tauri/src/main.rs";
const desktopSmokePath = "scripts/desktop-smoke.ps1";
const desktopAiRoutePath = "src/app/api/v1/desktop/ai/route.ts";
const desktopAutomationsRoutePath = "src/app/api/v1/desktop/automations/route.ts";
const desktopIntegrationsRoutePath = "src/app/api/v1/desktop/integrations/route.ts";
const desktopClientsRoutePath = "src/app/api/v1/desktop/clients/route.ts";
const desktopClientDetailRoutePath = "src/app/api/v1/desktop/clients/[id]/route.ts";
const desktopClientNoteRoutePath = "src/app/api/v1/desktop/clients/[id]/notes/route.ts";
const desktopMarketingRoutePath = "src/app/api/v1/desktop/marketing/route.ts";
const desktopServicesRoutePath = "src/app/api/v1/desktop/services/route.ts";
const desktopStaffListRoutePath = "src/app/api/v1/desktop/staff/route.ts";
const desktopLocationsListRoutePath = "src/app/api/v1/desktop/locations/route.ts";
const desktopBroadcastsRoutePath = "src/app/api/v1/desktop/broadcasts/route.ts";
const desktopDealsRoutePath = "src/app/api/v1/desktop/deals/route.ts";
const desktopPaymentsRoutePath = "src/app/api/v1/desktop/payments/route.ts";
const desktopReviewsRoutePath = "src/app/api/v1/desktop/reviews/route.ts";
const desktopSettingsRoutePath = "src/app/api/v1/desktop/settings/route.ts";
const desktopServiceRoutePath = "src/app/api/v1/desktop/services/[id]/route.ts";
const desktopStaffRoutePath = "src/app/api/v1/desktop/staff/[id]/route.ts";
const desktopLocationRoutePath = "src/app/api/v1/desktop/locations/[id]/route.ts";
const desktopAvailabilityRoutePath = "src/app/api/v1/desktop/availability/route.ts";
const desktopAvailabilityOverrideRoutePath = "src/app/api/v1/desktop/availability/overrides/route.ts";
const dashboardClientsPath = "src/lib/dashboard/clients.ts";
const dashboardAiPath = "src/lib/dashboard/ai.ts";
const dashboardAutomationsPath = "src/lib/dashboard/automations.ts";
const dashboardIntegrationsPath = "src/lib/dashboard/integrations.ts";
const dashboardBroadcastsPath = "src/lib/dashboard/broadcasts.ts";
const dashboardDealsPath = "src/lib/dashboard/deals.ts";
const dashboardMarketingPath = "src/lib/dashboard/marketing.ts";
const dashboardPaymentsPath = "src/lib/dashboard/payments.ts";
const dashboardReviewsPath = "src/lib/dashboard/reviews.ts";
const dashboardSettingsPath = "src/lib/dashboard/settings.ts";
const dashboardStaffPath = "src/lib/dashboard/staff.ts";
const dashboardLocationsPath = "src/lib/dashboard/locations.ts";
const dashboardAvailabilityPath = "src/lib/dashboard/availability.ts";
const dashboardServicesPath = "src/lib/dashboard/services.ts";
const ciPath = ".github/workflows/ci.yml";
const desktopPackagePath = "apps/desktop/package.json";
const rootPackagePath = "package.json";
const desktopAiContentRoutePath = "src/app/api/v1/desktop/ai/content/route.ts";
const desktopAiContentUpdateRoutePath = "src/app/api/v1/desktop/ai/content/[id]/route.ts";
const desktopAiLocationRoutePath = "src/app/api/v1/desktop/ai/locations/[id]/route.ts";
const desktopAiReactivateRoutePath = "src/app/api/v1/desktop/ai/reactivate/route.ts";

const expectedRoutes = [
  { api: "/api/v1/desktop/overview", href: "/dashboard", id: "overview", module: "overview", phase: 1, status: "native" },
  { api: "/api/v1/desktop/calendar", href: "/dashboard/calendar", id: "calendar", module: "calendar", phase: 2, status: "native" },
  { api: "/api/v1/desktop/bookings", href: "/dashboard/bookings", id: "bookings", phase: 2, status: "native" },
  { api: "/api/v1/desktop/clients", href: "/dashboard/clients", id: "clients", module: "clients", phase: 3, status: "native" },
  { api: "/api/v1/desktop/services", href: "/dashboard/services", id: "services", module: "services", phase: 3, status: "native" },
  { api: "/api/v1/desktop/staff", href: "/dashboard/staff", id: "staff", module: "staff", phase: 3, status: "native" },
  { api: "/api/v1/desktop/locations", href: "/dashboard/locations", id: "locations", module: "locations", phase: 3, status: "native" },
  { api: "/api/v1/desktop/availability", href: "/dashboard/availability", id: "availability", module: "availability", phase: 3, status: "native" },
  { api: "/api/v1/desktop/reviews", href: "/dashboard/reviews", id: "reviews", module: "reviews", phase: 4, status: "native" },
  { api: "/api/v1/desktop/payments", href: "/dashboard/payments", id: "payments", module: "payments", phase: 4, status: "native" },
  { api: "/api/v1/desktop/marketing", href: "/dashboard/marketing", id: "marketing", module: "marketing", phase: 4, status: "native" },
  { api: "/api/v1/desktop/deals", href: "/dashboard/deals", id: "deals", module: "deals", phase: 4, status: "native" },
  { api: "/api/v1/desktop/broadcasts", href: "/dashboard/broadcasts", id: "broadcasts", module: "broadcasts", phase: 4, status: "native" },
  { api: "/api/v1/desktop/ai", href: "/dashboard/ai", id: "aiHub", module: "ai", phase: 4, status: "native" },
  { api: "/api/v1/desktop/reports", href: "/dashboard/reports", id: "reports", module: "reports", phase: 4, status: "native" },
  { api: "/api/v1/desktop/integrations", href: "/dashboard/settings/integrations", id: "integrations", module: "integrations", phase: 5, status: "native" },
  { api: "/api/v1/desktop/automations", href: "/dashboard/automations", id: "automations", module: "automations", phase: 5, status: "native" },
  { api: "/api/v1/desktop/billing", href: "/dashboard/billing", id: "billing", module: "billing", phase: 5, status: "native" },
  { api: "/api/v1/desktop/settings", href: "/dashboard/settings", id: "settings", module: "settings", phase: 5, status: "native" },
];

const requiredFiles = [
  routeMapPath,
  moduleServicePath,
  desktopMainPath,
  desktopCommandsPath,
  desktopTauriMainPath,
  desktopSmokePath,
  ciPath,
  desktopPackagePath,
  rootPackagePath,
  "src/app/api/v1/desktop/[module]/route.ts",
  "src/app/api/v1/desktop/auth/login/route.ts",
  "src/app/api/v1/desktop/auth/logout/route.ts",
  "src/app/api/v1/desktop/bootstrap/route.ts",
  "src/app/api/v1/desktop/bookings/route.ts",
  "src/app/api/v1/desktop/bookings/[id]/route.ts",
  "src/app/api/v1/desktop/bookings/[id]/status/route.ts",
  "src/app/api/v1/desktop/calendar/route.ts",
  "src/app/api/v1/desktop/ai/route.ts",
  "src/app/api/v1/desktop/ai/route.test.ts",
  "src/app/api/v1/desktop/ai/content/route.ts",
  "src/app/api/v1/desktop/ai/content/route.test.ts",
  "src/app/api/v1/desktop/ai/content/[id]/route.ts",
  "src/app/api/v1/desktop/ai/content/[id]/route.test.ts",
  "src/app/api/v1/desktop/ai/locations/[id]/route.ts",
  "src/app/api/v1/desktop/ai/locations/[id]/route.test.ts",
  "src/app/api/v1/desktop/ai/reactivate/route.ts",
  "src/app/api/v1/desktop/ai/reactivate/route.test.ts",
  "src/app/api/v1/desktop/automations/route.ts",
  "src/app/api/v1/desktop/automations/route.test.ts",
  "src/app/api/v1/desktop/integrations/route.ts",
  "src/app/api/v1/desktop/integrations/route.test.ts",
  "src/app/api/v1/desktop/broadcasts/route.ts",
  "src/app/api/v1/desktop/broadcasts/route.test.ts",
  "src/app/api/v1/desktop/clients/route.ts",
  "src/app/api/v1/desktop/clients/route.test.ts",
  "src/app/api/v1/desktop/clients/[id]/notes/route.ts",
  "src/app/api/v1/desktop/clients/[id]/notes/route.test.ts",
  "src/app/api/v1/desktop/services/route.ts",
  "src/app/api/v1/desktop/services/route.test.ts",
  "src/app/api/v1/desktop/staff/route.ts",
  "src/app/api/v1/desktop/staff/route.test.ts",
  "src/app/api/v1/desktop/locations/route.ts",
  "src/app/api/v1/desktop/locations/route.test.ts",
  "src/app/api/v1/desktop/marketing/route.ts",
  "src/app/api/v1/desktop/marketing/route.test.ts",
  "src/app/api/v1/desktop/deals/route.ts",
  "src/app/api/v1/desktop/deals/route.test.ts",
  "src/app/api/v1/desktop/payments/route.ts",
  "src/app/api/v1/desktop/payments/route.test.ts",
  "src/app/api/v1/desktop/reviews/route.ts",
  "src/app/api/v1/desktop/reviews/route.test.ts",
  "src/app/api/v1/desktop/availability/route.ts",
  "src/app/api/v1/desktop/availability/overrides/route.ts",
  "src/app/api/v1/desktop/reports/route.ts",
  "src/app/api/v1/desktop/billing/route.ts",
  "src/app/api/v1/desktop/settings/route.ts",
];

const requiredDetailRoutes = [
  "ai/[id]",
  "automations/[id]",
  "broadcasts/[id]",
  "clients/[id]",
  "deals/[id]",
  "integrations/[id]",
  "locations/[id]",
  "marketing/[id]",
  "payments/[id]",
  "reviews/[id]",
  "services/[id]",
  "staff/[id]",
];

const requiredDesktopUiMarkers = [
  "aria-current",
  "aria-live",
  "desktop_auth_login",
  "desktopApiRequest",
  "desktop-open-command-palette",
  "DesktopErrorBoundary",
  "installFrontendErrorLogging",
  "printDaySheetDocument",
  "bookingRowsCsv",
  "skip-link",
  "offlineCachePrefix",
  "CommandPalette",
  "ClientsWorkspace",
  "client-filter-row",
  "loadClients",
  "client-edit-form",
  "updateClientDetail",
  "client-note-form",
  "addClientNote",
  "ServicesWorkspace",
  "service-filter-row",
  "loadServices",
  "StaffWorkspace",
  "staff-filter-row",
  "loadStaff",
  "LocationsWorkspace",
  "location-filter-row",
  "loadLocations",
  "AiHubWorkspace",
  "ai-filter-row",
  "ai-location-list",
  "ai-content-list",
  "runAiReactivation",
  "generateAiContent",
  "updateAiLocationFeature",
  "loadAiRuns",
  "AutomationsWorkspace",
  "automation-filter-row",
  "loadAutomations",
  "IntegrationsWorkspace",
  "integration-filter-row",
  "loadIntegrations",
  "BroadcastsWorkspace",
  "broadcast-filter-row",
  "loadBroadcasts",
  "MarketingWorkspace",
  "marketing-filter-row",
  "loadMarketing",
  "DealsWorkspace",
  "deal-filter-row",
  "loadDeals",
  "PaymentsWorkspace",
  "payment-filter-row",
  "loadPayments",
  "ReviewsWorkspace",
  "review-filter-row",
  "loadReviews",
  "service-edit-form",
  "updateServiceDetail",
  "staff-edit-form",
  "updateStaffDetail",
  "location-edit-form",
  "updateLocationDetail",
  "availability-edit-form",
  "availability-override-form",
  "updateAvailabilityWindows",
  "upsertAvailabilityOverride",
  "deleteAvailabilityOverride",
  "settings-form-grid",
  "saveSettingsDraft",
  "settingsDraftToPayload",
  "frontend render ready",
];

const requiredRustMarkers = [
  ".header(\"X-Dinaya-Desktop\", \"1\")",
  "ensure_desktop_api_path",
  "RegisterHotKey",
  "desktop_log_event",
  "open_url_in_default_browser",
];

const requiredCiMarkers = [
  "npm run verify",
  "runs-on: windows-latest",
  "npm --prefix apps/desktop run build",
  "npm run desktop:smoke",
  "cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml",
];

const failures = [];
const notes = [];

function fullPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return readFileSync(fullPath(relativePath), "utf8");
}

function requireFile(relativePath) {
  if (!existsSync(fullPath(relativePath))) {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) failures.push(`Missing ${label}: ${needle}`);
}

for (const file of requiredFiles) requireFile(file);
for (const detailRoute of requiredDetailRoutes) {
  requireFile(`src/app/api/v1/desktop/${detailRoute}/route.ts`);
  requireFile(`src/app/api/v1/desktop/${detailRoute}/route.test.ts`);
}

const routeMap = read(routeMapPath);
const moduleService = read(moduleServicePath);
const desktopMain = read(desktopMainPath);
const desktopCommands = read(desktopCommandsPath);
const desktopTauriMain = read(desktopTauriMainPath);
const desktopSmoke = read(desktopSmokePath);
const desktopAiRoute = read(desktopAiRoutePath);
const desktopAiContentRoute = read(desktopAiContentRoutePath);
const desktopAiContentUpdateRoute = read(desktopAiContentUpdateRoutePath);
const desktopAiLocationRoute = read(desktopAiLocationRoutePath);
const desktopAiReactivateRoute = read(desktopAiReactivateRoutePath);
const desktopAutomationsRoute = read(desktopAutomationsRoutePath);
const desktopIntegrationsRoute = read(desktopIntegrationsRoutePath);
const desktopClientsRoute = read(desktopClientsRoutePath);
const desktopClientDetailRoute = read(desktopClientDetailRoutePath);
const desktopClientNoteRoute = read(desktopClientNoteRoutePath);
const desktopMarketingRoute = read(desktopMarketingRoutePath);
const desktopServicesRoute = read(desktopServicesRoutePath);
const desktopStaffListRoute = read(desktopStaffListRoutePath);
const desktopLocationsListRoute = read(desktopLocationsListRoutePath);
const desktopBroadcastsRoute = read(desktopBroadcastsRoutePath);
const desktopDealsRoute = read(desktopDealsRoutePath);
const desktopPaymentsRoute = read(desktopPaymentsRoutePath);
const desktopReviewsRoute = read(desktopReviewsRoutePath);
const desktopSettingsRoute = read(desktopSettingsRoutePath);
const desktopServiceRoute = read(desktopServiceRoutePath);
const desktopStaffRoute = read(desktopStaffRoutePath);
const desktopLocationRoute = read(desktopLocationRoutePath);
const desktopAvailabilityRoute = read(desktopAvailabilityRoutePath);
const desktopAvailabilityOverrideRoute = read(desktopAvailabilityOverrideRoutePath);
const dashboardAi = read(dashboardAiPath);
const dashboardAutomations = read(dashboardAutomationsPath);
const dashboardIntegrations = read(dashboardIntegrationsPath);
const dashboardClients = read(dashboardClientsPath);
const dashboardBroadcasts = read(dashboardBroadcastsPath);
const dashboardDeals = read(dashboardDealsPath);
const dashboardMarketing = read(dashboardMarketingPath);
const dashboardPayments = read(dashboardPaymentsPath);
const dashboardReviews = read(dashboardReviewsPath);
const dashboardSettings = read(dashboardSettingsPath);
const dashboardStaff = read(dashboardStaffPath);
const dashboardLocations = read(dashboardLocationsPath);
const dashboardAvailability = read(dashboardAvailabilityPath);
const dashboardServices = read(dashboardServicesPath);
const ci = read(ciPath);
const rootPackage = JSON.parse(read(rootPackagePath));
const desktopPackage = JSON.parse(read(desktopPackagePath));

for (const route of expectedRoutes) {
  requireText(routeMap, `id: "${route.id}"`, `desktop route id ${route.id}`);
  requireText(routeMap, `href: "${route.href}"`, `desktop route href ${route.id}`);
  requireText(routeMap, `desktopApiPath: "${route.api}"`, `desktop API path ${route.id}`);
  requireText(routeMap, `desktopPhase: ${route.phase}`, `desktop phase ${route.id}`);
  requireText(routeMap, `nativeStatus: "${route.status}"`, `desktop native status ${route.id}`);
  if (route.module) requireText(moduleService, `| "${route.module}"`, `desktop module key ${route.module}`);
}

const routeIdMatches = [...routeMap.matchAll(/id: "([^"]+)"/g)]
  .map((match) => match[1])
  .filter((id) => expectedRoutes.some((route) => route.id === id));
const duplicateRouteIds = routeIdMatches.filter((id, index) => routeIdMatches.indexOf(id) !== index);
if (duplicateRouteIds.length) failures.push(`Duplicate desktop route ids: ${[...new Set(duplicateRouteIds)].join(", ")}`);

if (routeMap.includes('nativeStatus: "fallback"')) {
  failures.push("Route map still contains nativeStatus fallback entries.");
}

for (const marker of requiredDesktopUiMarkers) requireText(desktopMain, marker, "desktop UI marker");
requireText(desktopAiRoute, "export async function GET", "desktop AI runs GET route");
requireText(desktopAiRoute, "requireDesktopRead", "desktop AI runs read auth");
requireText(dashboardAi, "getAiHubDashboardData", "shared AI hub helper");
requireText(dashboardAi, "getAiWorkflowRunsDashboardList", "shared AI run list helper");
requireText(dashboardAi, "isDashboardAiWorkflowRunStatusFilter", "shared AI run status validation");
requireText(desktopAiContentRoute, "export async function POST", "desktop AI content generate route");
requireText(desktopAiContentRoute, "requireDesktopWrite", "desktop AI content write auth");
requireText(desktopAiContentUpdateRoute, "export async function PATCH", "desktop AI content update route");
requireText(desktopAiLocationRoute, "export async function PATCH", "desktop AI location config route");
requireText(desktopAiReactivateRoute, "export async function POST", "desktop AI reactivation route");
requireText(dashboardAi, "generateAiContentDashboardCalendar", "shared AI content generate helper");
requireText(dashboardAi, "updateAiContentDashboardAction", "shared AI content action helper");
requireText(dashboardAi, "updateAiLocationDashboardConfig", "shared AI location config helper");
requireText(dashboardAi, "runAiReactivationDashboard", "shared AI reactivation helper");
requireText(desktopAutomationsRoute, "export async function GET", "desktop automations GET route");
requireText(desktopAutomationsRoute, "requireDesktopRead", "desktop automations read auth");
requireText(dashboardAutomations, "getAutomationsDashboardList", "shared automations list helper");
requireText(dashboardAutomations, "isDashboardAutomationStatusFilter", "shared automation status validation");
requireText(desktopIntegrationsRoute, "export async function GET", "desktop integrations GET route");
requireText(desktopIntegrationsRoute, "requireDesktopRead", "desktop integrations read auth");
requireText(dashboardIntegrations, "getIntegrationsDashboardList", "shared integrations list helper");
requireText(dashboardIntegrations, "isDashboardIntegrationStatusFilter", "shared integrations status validation");
requireText(desktopClientsRoute, "export async function GET", "desktop clients GET route");
requireText(desktopClientsRoute, "requireDesktopRead", "desktop clients read auth");
requireText(desktopClientDetailRoute, "export async function PATCH", "desktop clients PATCH route");
requireText(desktopClientDetailRoute, "requireDesktopWrite", "desktop clients write auth");
requireText(dashboardClients, "getClientsDashboardList", "shared clients list helper");
requireText(dashboardClients, "isDashboardClientStageFilter", "shared clients stage validation");
requireText(dashboardClients, "updateClientDashboardFields", "shared clients update helper");
requireText(desktopClientNoteRoute, "export async function POST", "desktop client note POST route");
requireText(desktopClientNoteRoute, "requireDesktopWrite", "desktop client note write auth");
requireText(dashboardClients, "createClientDashboardNote", "shared client note create helper");
requireText(desktopServicesRoute, "export async function GET", "desktop services GET route");
requireText(desktopServicesRoute, "requireDesktopRead", "desktop services read auth");
requireText(dashboardServices, "getServicesDashboardList", "shared services list helper");
requireText(dashboardServices, "isDashboardServiceStatusFilter", "shared services status validation");
requireText(desktopStaffListRoute, "export async function GET", "desktop staff GET route");
requireText(desktopStaffListRoute, "requireDesktopRead", "desktop staff read auth");
requireText(dashboardStaff, "getStaffDashboardList", "shared staff list helper");
requireText(dashboardStaff, "isDashboardStaffStatusFilter", "shared staff status validation");
requireText(desktopLocationsListRoute, "export async function GET", "desktop locations GET route");
requireText(desktopLocationsListRoute, "requireDesktopRead", "desktop locations read auth");
requireText(dashboardLocations, "getLocationsDashboardList", "shared locations list helper");
requireText(dashboardLocations, "isDashboardLocationStatusFilter", "shared locations status validation");
requireText(desktopBroadcastsRoute, "export async function GET", "desktop broadcasts GET route");
requireText(desktopBroadcastsRoute, "requireDesktopRead", "desktop broadcasts read auth");
requireText(dashboardBroadcasts, "getBroadcastsDashboardList", "shared broadcasts list helper");
requireText(dashboardBroadcasts, "isDashboardBroadcastStatusFilter", "shared broadcast status validation");
requireText(dashboardBroadcasts, "isDashboardBroadcastChannelFilter", "shared broadcast channel validation");
requireText(desktopMarketingRoute, "export async function GET", "desktop marketing GET route");
requireText(desktopMarketingRoute, "requireDesktopRead", "desktop marketing read auth");
requireText(dashboardMarketing, "getMarketingDashboardList", "shared marketing list helper");
requireText(dashboardMarketing, "isDashboardMarketingStatusFilter", "shared marketing status validation");
requireText(desktopDealsRoute, "export async function GET", "desktop deals GET route");
requireText(desktopDealsRoute, "requireDesktopRead", "desktop deals read auth");
requireText(dashboardDeals, "getDealsDashboardList", "shared deals list helper");
requireText(dashboardDeals, "isDashboardDealStatusFilter", "shared deal status validation");
requireText(desktopPaymentsRoute, "export async function GET", "desktop payments GET route");
requireText(desktopPaymentsRoute, "requireDesktopRead", "desktop payments read auth");
requireText(dashboardPayments, "getPaymentsDashboardList", "shared payments list helper");
requireText(dashboardPayments, "isDashboardPaymentStatus", "shared payment status validation");
requireText(desktopReviewsRoute, "export async function GET", "desktop reviews GET route");
requireText(desktopReviewsRoute, "requireDesktopRead", "desktop reviews read auth");
requireText(dashboardReviews, "getReviewsDashboardList", "shared reviews list helper");
requireText(dashboardReviews, "isDashboardReviewStatusFilter", "shared review status validation");
requireText(desktopSettingsRoute, "export async function PATCH", "desktop settings PATCH route");
requireText(desktopSettingsRoute, "requireDesktopWrite", "desktop settings write auth");
requireText(dashboardSettings, "desktopSettingsPatchSchema", "shared desktop settings patch schema");
requireText(dashboardSettings, "updateDesktopSettingsBusiness", "shared desktop settings update helper");
requireText(dashboardSettings, "syncBusinessPrimaryLocation", "settings primary location sync");
requireText(desktopServiceRoute, "export async function PATCH", "desktop service PATCH route");
requireText(desktopServiceRoute, "requireDesktopWrite", "desktop service write auth");
requireText(dashboardServices, "updateServiceDashboardFields", "shared service update helper");
requireText(dashboardServices, "future_bookings", "service deactivation conflict guard");
requireText(desktopStaffRoute, "export async function PATCH", "desktop staff PATCH route");
requireText(desktopStaffRoute, "requireDesktopWrite", "desktop staff write auth");
requireText(dashboardStaff, "updateStaffDashboardFields", "shared staff update helper");
requireText(dashboardStaff, "staffDashboardUpdateSchema", "shared staff update schema");
requireText(desktopLocationRoute, "export async function PATCH", "desktop location PATCH route");
requireText(desktopLocationRoute, "requireDesktopWrite", "desktop location write auth");
requireText(dashboardLocations, "updateLocationDashboardFields", "shared location update helper");
requireText(dashboardLocations, "locationDashboardUpdateSchema", "shared location update schema");
requireText(desktopAvailabilityRoute, "export async function PATCH", "desktop availability PATCH route");
requireText(desktopAvailabilityRoute, "requireDesktopWrite", "desktop availability write auth");
requireText(desktopAvailabilityOverrideRoute, "export async function POST", "desktop availability override POST route");
requireText(desktopAvailabilityOverrideRoute, "export async function DELETE", "desktop availability override DELETE route");
requireText(desktopAvailabilityOverrideRoute, "requireDesktopWrite", "desktop availability override write auth");
requireText(dashboardAvailability, "updateAvailabilityDashboardWindows", "shared availability update helper");
requireText(dashboardAvailability, "Availability blocks cannot overlap.", "availability overlap guard");
requireText(dashboardAvailability, "upsertAvailabilityDashboardOverride", "shared availability override upsert helper");
requireText(dashboardAvailability, "deleteAvailabilityDashboardOverride", "shared availability override delete helper");
for (const marker of requiredRustMarkers) {
  if (!desktopCommands.includes(marker) && !desktopTauriMain.includes(marker)) {
    failures.push(`Missing desktop Rust marker: ${marker}`);
  }
}
for (const marker of requiredCiMarkers) requireText(ci, marker, "CI marker");
for (const marker of ["Capture-WindowBitmap", "Measure-WindowBitmap", "Wait-StartupLogMarker", "FrontendReady", "NonBlankPixelRatio", "UniqueColors"]) {
  requireText(desktopSmoke, marker, "desktop smoke visual marker");
}

if (rootPackage.scripts["desktop:smoke"] !== "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/desktop-smoke.ps1") {
  failures.push("Root package desktop:smoke script is missing or changed.");
}
if (rootPackage.scripts["desktop:audit"] !== "node scripts/desktop-production-readiness.mjs") {
  failures.push("Root package desktop:audit script is missing or changed.");
}
if (desktopPackage.scripts.smoke !== "powershell -NoProfile -ExecutionPolicy Bypass -File ..\\..\\scripts\\desktop-smoke.ps1") {
  failures.push("Desktop package smoke script is missing or changed.");
}

notes.push(`Checked ${expectedRoutes.length} desktop dashboard routes.`);
notes.push(`Checked ${requiredDetailRoutes.length} native detail API route/test pairs.`);
notes.push("Checked desktop shell markers for auth bridge, command palette, offline cache, crash recovery, and print/export.");
notes.push("Checked desktop smoke markers for visible-window screenshot and nonblank pixel verification.");
notes.push("Checked CI markers for Windows desktop build and smoke verification.");

if (failures.length) {
  console.error("Dinaya Desktop production-readiness audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Dinaya Desktop production-readiness audit passed.");
for (const note of notes) console.log(`- ${note}`);
