package lk.dinaya.mobile.data

data class BusinessSummary(
    val id: String,
    val name: String,
    val slug: String,
    val timezone: String,
    val plan: String,
    val customDomain: String?,
)

data class UserSummary(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
)

data class AuthSummary(
    val keyId: String,
    val keyType: String,
    val deviceId: String,
    val deviceName: String,
)

data class LoginResult(
    val deviceKey: String,
    val auth: AuthSummary,
    val business: BusinessSummary,
    val user: UserSummary,
)

data class StaffSummary(
    val id: String,
    val name: String,
    val isActive: Boolean,
)

data class BootstrapResult(
    val business: BusinessSummary,
    val auth: AuthSummary,
    val staff: List<StaffSummary>,
    val serverTime: String,
)

data class BookingSummary(
    val id: String,
    val clientName: String,
    val clientPhone: String,
    val clientEmail: String,
    val serviceName: String,
    val staffName: String,
    val startsAt: String,
    val endsAt: String,
    val status: String,
    val webUrl: String,
)

data class BookingsResult(
    val tab: String,
    val rows: List<BookingSummary>,
    val serverTime: String,
)

data class StatusUpdateResult(
    val id: String,
    val status: String,
    val revisionTs: String,
)

data class ModuleMetric(
    val label: String,
    val value: String,
    val detail: String?,
    val tone: String?,
)

data class ModuleItem(
    val id: String,
    val title: String,
    val subtitle: String?,
    val meta: String?,
    val status: String?,
)

data class DesktopModulePayload(
    val emptyState: String,
    val items: List<ModuleItem>,
    val metrics: List<ModuleMetric>,
    val module: String,
    val refreshedAt: String,
    val summary: String,
    val title: String,
    val webPath: String,
)

data class StoredSession(
    val baseUrl: String,
    val deviceKey: String,
    val keyId: String,
    val deviceId: String,
    val deviceName: String,
    val businessName: String,
    val userEmail: String,
)
