package lk.dinaya.mobile.data

import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

class DinayaApiException(message: String, val statusCode: Int? = null) : Exception(message)

class DinayaApiClient(private val baseUrl: String) {
    suspend fun login(email: String, password: String, deviceName: String): LoginResult = withContext(Dispatchers.IO) {
        val body = JSONObject()
            .put("email", email)
            .put("password", password)
            .put("deviceName", deviceName)
        request("POST", "/api/v1/desktop/auth/login", body = body).toLoginResult()
    }

    suspend fun fetchBootstrap(deviceKey: String): BootstrapResult = withContext(Dispatchers.IO) {
        request("GET", "/api/v1/desktop/bootstrap", deviceKey = deviceKey).toBootstrapResult()
    }

    suspend fun fetchTodayBookings(deviceKey: String): BookingsResult = withContext(Dispatchers.IO) {
        request("GET", "/api/v1/desktop/bookings?tab=today&limit=40", deviceKey = deviceKey).toBookingsResult()
    }

    suspend fun fetchDesktopModule(deviceKey: String, module: String): DesktopModulePayload = withContext(Dispatchers.IO) {
        request("GET", desktopModulePath(module), deviceKey = deviceKey).toDesktopModulePayload(module)
    }

    suspend fun updateBookingStatus(deviceKey: String, bookingId: String, status: String): StatusUpdateResult =
        withContext(Dispatchers.IO) {
            val body = JSONObject().put("status", status)
            request(
                method = "PATCH",
                path = "/api/v1/desktop/bookings/$bookingId/status",
                deviceKey = deviceKey,
                body = body,
            ).toStatusUpdateResult()
        }

    suspend fun logout(deviceKey: String) = withContext(Dispatchers.IO) {
        request("POST", "/api/v1/desktop/auth/logout", deviceKey = deviceKey, body = JSONObject())
        Unit
    }

    private fun request(
        method: String,
        path: String,
        deviceKey: String? = null,
        body: JSONObject? = null,
    ): JSONObject {
        val connection = resolveDinayaUrl(baseUrl, path).openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = 15_000
        connection.readTimeout = 20_000
        connection.setRequestProperty("Accept", "application/json")
        connection.setRequestProperty("X-Dinaya-Mobile", "1")
        if (path.startsWith("/api/v1/desktop/")) {
            connection.setRequestProperty("X-Dinaya-Desktop", "1")
        }
        if (deviceKey != null) {
            connection.setRequestProperty("Authorization", "Bearer $deviceKey")
        }
        if (body != null) {
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use { stream ->
                stream.write(body.toString().toByteArray(StandardCharsets.UTF_8))
            }
        }

        val status = connection.responseCode
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream
        val text = stream?.bufferedReader(StandardCharsets.UTF_8)?.use { it.readText() }.orEmpty()
        if (status !in 200..299) {
            throw DinayaApiException(parseErrorMessage(text), status)
        }
        return if (text.isBlank()) JSONObject() else JSONObject(text)
    }

    private fun parseErrorMessage(text: String): String {
        if (text.isBlank()) return "Dinaya request failed."
        return runCatching {
            JSONObject(text).optString("error").takeIf { it.isNotBlank() }
        }.getOrNull() ?: "Dinaya request failed."
    }
}

internal fun resolveDinayaUrl(baseUrl: String, path: String): URL {
    val normalizedBase = baseUrl.trim().trimEnd('/')
    val normalizedPath = if (path.startsWith("/")) path else "/$path"
    if (normalizedBase.isBlank()) {
        throw DinayaApiException("API base URL is required.")
    }
    return URL("$normalizedBase$normalizedPath")
}

internal fun desktopModulePath(module: String): String = "/api/v1/desktop/$module?limit=40"

private fun JSONObject.toLoginResult() = LoginResult(
    deviceKey = getString("desktopKey"),
    auth = getJSONObject("auth").toAuthSummary(),
    business = getJSONObject("business").toBusinessSummary(),
    user = getJSONObject("user").toUserSummary(),
)

private fun JSONObject.toBootstrapResult() = BootstrapResult(
    business = getJSONObject("business").toBusinessSummary(),
    auth = getJSONObject("auth").toAuthSummary(),
    staff = optJSONArray("staff").toList { it.toStaffSummary() },
    serverTime = optString("serverTime"),
)

private fun JSONObject.toBookingsResult() = BookingsResult(
    tab = optString("tab", "today"),
    rows = optJSONArray("rows").toList { it.toBookingSummary() },
    serverTime = optString("serverTime"),
)

private fun JSONObject.toStatusUpdateResult() = StatusUpdateResult(
    id = getString("id"),
    status = getString("status"),
    revisionTs = optString("revisionTs"),
)

private data class DesktopModuleLabels(
    val emptyState: String,
    val summary: String,
    val title: String,
    val webPath: String,
)

private val desktopModuleLabels = mapOf(
    "ai" to DesktopModuleLabels(
        emptyState = "No AI workflow activity yet.",
        summary = "Generated replies, growth workflows, and AI activity.",
        title = "AI Hub",
        webPath = "/dashboard/ai",
    ),
    "automations" to DesktopModuleLabels(
        emptyState = "No automations configured yet.",
        summary = "Automation rules and enablement state.",
        title = "Automations",
        webPath = "/dashboard/automations",
    ),
    "availability" to DesktopModuleLabels(
        emptyState = "No availability windows configured yet.",
        summary = "Weekly working windows by active staff member.",
        title = "Availability",
        webPath = "/dashboard/availability",
    ),
    "billing" to DesktopModuleLabels(
        emptyState = "No subscription records found.",
        summary = "Current plan and billing subscription state.",
        title = "Plan & billing",
        webPath = "/dashboard/billing",
    ),
    "broadcasts" to DesktopModuleLabels(
        emptyState = "No broadcasts created yet.",
        summary = "Campaign broadcasts and delivery summaries.",
        title = "Broadcasts",
        webPath = "/dashboard/broadcasts",
    ),
    "calendar" to DesktopModuleLabels(
        emptyState = "No bookings scheduled for today.",
        summary = "Today calendar with staff and booking status.",
        title = "Calendar",
        webPath = "/dashboard/calendar",
    ),
    "clients" to DesktopModuleLabels(
        emptyState = "No clients found yet.",
        summary = "Client CRM records and stages.",
        title = "Clients",
        webPath = "/dashboard/clients",
    ),
    "deals" to DesktopModuleLabels(
        emptyState = "No deals created yet.",
        summary = "Deal status, slot usage, and impressions.",
        title = "Deals",
        webPath = "/dashboard/deals",
    ),
    "integrations" to DesktopModuleLabels(
        emptyState = "No integrations connected yet.",
        summary = "Connected provider and voice integration status.",
        title = "Integrations",
        webPath = "/dashboard/settings/integrations",
    ),
    "locations" to DesktopModuleLabels(
        emptyState = "No locations configured yet.",
        summary = "Branch coverage and active location status.",
        title = "Locations",
        webPath = "/dashboard/locations",
    ),
    "marketing" to DesktopModuleLabels(
        emptyState = "No marketing assets configured yet.",
        summary = "Directory listing, social channels, and content calendar.",
        title = "Marketing",
        webPath = "/dashboard/marketing",
    ),
    "overview" to DesktopModuleLabels(
        emptyState = "No activity yet.",
        summary = "Business health and current day activity.",
        title = "Overview",
        webPath = "/dashboard",
    ),
    "payments" to DesktopModuleLabels(
        emptyState = "No payments found yet.",
        summary = "Recent payments and payment status.",
        title = "Payments",
        webPath = "/dashboard/payments",
    ),
    "reports" to DesktopModuleLabels(
        emptyState = "No report metrics recorded yet.",
        summary = "Recent operating metrics and revenue snapshots.",
        title = "Reports",
        webPath = "/dashboard/reports",
    ),
    "reviews" to DesktopModuleLabels(
        emptyState = "No reviews collected yet.",
        summary = "Published reviews, ratings, and replies.",
        title = "Reviews",
        webPath = "/dashboard/reviews",
    ),
    "services" to DesktopModuleLabels(
        emptyState = "No services configured yet.",
        summary = "Service catalog, pricing, duration, and public availability.",
        title = "Services",
        webPath = "/dashboard/services",
    ),
    "settings" to DesktopModuleLabels(
        emptyState = "No desktop devices found.",
        summary = "Business profile and desktop device access.",
        title = "Settings",
        webPath = "/dashboard/settings",
    ),
    "staff" to DesktopModuleLabels(
        emptyState = "No staff members configured yet.",
        summary = "Active staff and appointment load.",
        title = "Staff",
        webPath = "/dashboard/staff",
    ),
)

private fun labelsFor(module: String) = desktopModuleLabels[module]
    ?: DesktopModuleLabels(
        emptyState = "Nothing to show yet.",
        summary = "Dinaya dashboard workspace.",
        title = labelFromKey(module),
        webPath = "/dashboard",
    )

private fun JSONObject.toDesktopModulePayload(moduleKey: String): DesktopModulePayload {
    val labels = labelsFor(moduleKey)
    val genericMetrics = optJSONArray("metrics")
    val genericItems = optJSONArray("items")
    if (genericMetrics != null || genericItems != null || optString("title").isNotBlank()) {
        return DesktopModulePayload(
            emptyState = optString("emptyState", labels.emptyState),
            items = genericItems.toList { it.toModuleItem() },
            metrics = genericMetrics.toList { it.toModuleMetric() },
            module = optString("module", moduleKey),
            refreshedAt = optString("refreshedAt").ifBlank { optString("serverTime") },
            summary = optString("summary", labels.summary),
            title = optString("title", labels.title),
            webPath = optString("webPath").ifBlank { labels.webPath },
        )
    }

    return DesktopModulePayload(
        emptyState = labels.emptyState,
        items = toTypedModuleItems(moduleKey),
        metrics = toTypedModuleMetrics(moduleKey),
        module = moduleKey,
        refreshedAt = optString("serverTime"),
        summary = labels.summary,
        title = labels.title,
        webPath = optString("webUrl").ifBlank { labels.webPath },
    )
}

private fun JSONObject.toModuleMetric() = ModuleMetric(
    label = optString("label"),
    value = opt("value")?.toString().orEmpty(),
    detail = nullableString("detail"),
    tone = nullableString("tone"),
)

private fun JSONObject.toModuleItem() = ModuleItem(
    id = optString("id"),
    title = optString("title"),
    subtitle = nullableString("subtitle"),
    meta = nullableString("meta"),
    status = nullableString("status"),
)

private fun JSONObject.toTypedModuleMetrics(moduleKey: String): List<ModuleMetric> {
    optJSONObject("summary")?.toMetricList()?.takeIf { it.isNotEmpty() }?.let { return it }
    optJSONObject("metrics")?.toMetricList()?.takeIf { it.isNotEmpty() }?.let { return it }

    return when (moduleKey) {
        "availability" -> {
            val members = optJSONArray("members")
            val windowCount = members.sumArrayLengths("windows")
            val overrideCount = members.sumArrayLengths("overrides")
            listOf(
                ModuleMetric("Staff", members.lengthText(), null, "cobalt"),
                ModuleMetric("Windows", windowCount.toString(), null, "emerald"),
                ModuleMetric("Overrides", overrideCount.toString(), null, "amber"),
            )
        }
        "billing" -> listOf(
            ModuleMetric("Plan", optJSONObject("business")?.optString("plan").orEmpty().ifBlank { "Unknown" }, null, "cobalt"),
            ModuleMetric("Subscriptions", optJSONArray("subscriptions").lengthText(), null, "slate"),
            ModuleMetric("Usage items", optJSONArray("usage").lengthText(), null, "emerald"),
        )
        "calendar" -> listOf(
            ModuleMetric("Bookings", optJSONArray("rows").lengthText(), null, "cobalt"),
            ModuleMetric("Staff", optJSONArray("staff").lengthText(), null, "emerald"),
        )
        "settings" -> optJSONObject("summary")?.toMetricList().orEmpty().ifEmpty {
            listOf(ModuleMetric("Devices", optJSONArray("devices").lengthText(), null, "cobalt"))
        }
        else -> emptyList()
    }
}

private fun JSONObject.toTypedModuleItems(moduleKey: String): List<ModuleItem> {
    return when (moduleKey) {
        "availability" -> optJSONArray("members").toList { it.toAvailabilityMemberItem() }
        "billing" -> {
            val subscriptions = optJSONArray("subscriptions").toList { it.toGenericModuleItem(moduleKey) }
            if (subscriptions.isNotEmpty()) subscriptions else optJSONArray("usage").toList { it.toGenericModuleItem(moduleKey) }
        }
        "settings" -> optJSONArray("devices").toList { it.toGenericModuleItem(moduleKey) }
        else -> optJSONArray("rows").toList { it.toGenericModuleItem(moduleKey) }
    }
}

private fun JSONObject.toAvailabilityMemberItem(): ModuleItem {
    val staff = optJSONObject("staff")
    val windows = optJSONArray("windows")
    val locations = optJSONArray("assignedLocations")
    val overrides = optJSONArray("overrides")
    val overrideCount = overrides?.length() ?: 0
    val title = staff?.firstText("name").orEmpty().ifBlank { "Staff member" }
    val subtitle = listOf(
        "${windows.lengthText()} weekly windows",
        "${locations.lengthText()} locations",
    ).joinToString(" - ")
    val status = if (staff?.optBoolean("isActive", true) == false) "inactive" else "active"

    return ModuleItem(
        id = staff?.optString("id").orEmpty().ifBlank { title },
        title = title,
        subtitle = subtitle,
        meta = if (overrideCount > 0) "$overrideCount upcoming overrides" else null,
        status = status,
    )
}

private fun JSONObject.toGenericModuleItem(moduleKey: String): ModuleItem {
    val title = when (moduleKey) {
        "calendar" -> firstText("clientName", "title", "serviceName")
        "payments" -> firstText("clientName", "orderId", "id")
        "reviews" -> firstText("clientName", "comment", "id")
        "deals" -> firstText("title", "serviceName", "name", "id")
        "broadcasts" -> firstText("name", "subject", "title", "id")
        "integrations" -> firstText("name", "provider", "label", "id")
        "ai" -> firstText("subject", "workflowKey", "feature", "id")
        "automations" -> firstText("name", "eventType", "id")
        "billing" -> firstText("label", "plan", "status", "id")
        "settings" -> firstText("deviceName", "name", "keyType", "id")
        else -> firstText("name", "title", "clientName", "serviceName", "staffName", "locationName", "subject", "id")
    }.ifBlank { "Untitled" }

    val subtitle = when (moduleKey) {
        "calendar" -> firstText("serviceName", "staffName", "locationName")
        "clients" -> firstText("phone", "email", "source", "loyaltyTier")
        "services" -> firstText("description", "priceLkr", "durationMinutes")
        "staff" -> firstText("email", "phone", "primaryLocationName")
        "locations" -> firstText("address", "timezone", "phone")
        "reviews" -> firstText("comment", "serviceName", "rating")
        "payments" -> firstText("serviceName", "amountLkr", "staffName")
        "marketing" -> firstText("description", "channel", "type")
        "deals" -> firstText("discountPercent", "locationName", "staffName")
        "broadcasts" -> firstText("channel", "audienceType", "recipientCount")
        "ai" -> firstText("feature", "provider", "channel")
        "integrations" -> firstText("description", "accountName", "provider")
        "automations" -> firstText("channel", "delayMinutes", "template")
        "billing" -> firstText("billingInterval", "amountLkr", "remaining")
        "settings" -> firstText("lastUsedAt", "createdAt", "expiresAt")
        else -> firstText("description", "email", "phone", "channel", "type")
    }.takeIf { it.isNotBlank() }

    return ModuleItem(
        id = firstText("id", "key", "slug").ifBlank { title },
        title = title,
        subtitle = subtitle,
        meta = firstText("startsAt", "createdAt", "updatedAt", "lastBookingAt", "currentPeriodEnd").takeIf { it.isNotBlank() },
        status = statusText(moduleKey),
    )
}

private fun JSONObject.toMetricList(): List<ModuleMetric> {
    val result = mutableListOf<ModuleMetric>()
    val iterator = keys()
    val tones = listOf("cobalt", "emerald", "amber", "slate")
    while (iterator.hasNext() && result.size < 6) {
        val key = iterator.next()
        if (key == "filters") continue
        val value = metricValueText(opt(key)) ?: continue
        result += ModuleMetric(
            label = labelFromKey(key),
            value = value,
            detail = null,
            tone = tones[result.size % tones.size],
        )
    }
    return result
}

private fun JSONObject.firstText(vararg keys: String): String {
    for (key in keys) {
        val text = valueText(opt(key))
        if (!text.isNullOrBlank()) return text
    }
    return ""
}

private fun JSONObject.statusText(moduleKey: String): String? {
    firstText("status", "displayStatus", "stage", "channel").takeIf { it.isNotBlank() }?.let { return it }
    return when {
        has("isActive") -> if (optBoolean("isActive")) "active" else "inactive"
        has("isPublished") -> if (optBoolean("isPublished")) "published" else "hidden"
        has("isDefault") -> if (optBoolean("isDefault")) "default" else null
        has("revokedAt") && !isNull("revokedAt") -> "revoked"
        moduleKey == "settings" -> "active"
        else -> null
    }
}

private fun JSONArray?.lengthText(): String = (this?.length() ?: 0).toString()

private fun JSONArray?.sumArrayLengths(key: String): Int {
    if (this == null) return 0
    var total = 0
    for (index in 0 until length()) {
        total += optJSONObject(index)?.optJSONArray(key)?.length() ?: 0
    }
    return total
}

private fun metricValueText(value: Any?): String? = when (value) {
    null, JSONObject.NULL -> null
    is Boolean -> if (value) "Yes" else "No"
    is Number -> value.toString()
    is String -> value.ifBlank { null }
    is JSONArray -> value.length().toString()
    is JSONObject -> valueText(value.opt("value"))
        ?: valueText(value.opt("used"))?.let { used ->
            val limit = valueText(value.opt("limit")).orEmpty().ifBlank { "Unlimited" }
            "$used / $limit"
        }
        ?: valueText(value.opt("plan"))
        ?: valueText(value.opt("status"))
    else -> value.toString().takeIf { it.isNotBlank() }
}

private fun valueText(value: Any?): String? = when (value) {
    null, JSONObject.NULL -> null
    is Boolean -> if (value) "Yes" else "No"
    is Number -> value.toString()
    is String -> value.ifBlank { null }
    is JSONArray -> value.length().toString()
    is JSONObject -> valueText(value.opt("name"))
        ?: valueText(value.opt("title"))
        ?: valueText(value.opt("label"))
        ?: valueText(value.opt("status"))
    else -> value.toString().takeIf { it.isNotBlank() }
}

private fun labelFromKey(key: String): String {
    val words = key
        .replace(Regex("([a-z])([A-Z])"), "$1 $2")
        .replace("_", " ")
        .replace("-", " ")
        .split(" ")
        .filter { it.isNotBlank() }

    return words.joinToString(" ") { word ->
        when (word.uppercase()) {
            "AI", "API", "ID", "LKR", "URL" -> word.uppercase()
            else -> word.lowercase().replaceFirstChar { it.uppercase() }
        }
    }
}

private fun JSONObject.toBusinessSummary() = BusinessSummary(
    id = getString("id"),
    name = getString("name"),
    slug = getString("slug"),
    timezone = optString("timezone", "Asia/Colombo"),
    plan = optString("plan", "trial"),
    customDomain = nullableString("customDomain"),
)

private fun JSONObject.toUserSummary() = UserSummary(
    id = getString("id"),
    name = optString("name"),
    email = optString("email"),
    role = optString("role"),
)

private fun JSONObject.toAuthSummary() = AuthSummary(
    keyId = getString("keyId"),
    keyType = optString("keyType"),
    deviceId = optString("deviceId"),
    deviceName = optString("deviceName"),
)

private fun JSONObject.toStaffSummary() = StaffSummary(
    id = getString("id"),
    name = optString("name"),
    isActive = optBoolean("isActive", true),
)

private fun JSONObject.toBookingSummary() = BookingSummary(
    id = getString("id"),
    clientName = optString("clientName"),
    clientPhone = optString("clientPhone"),
    clientEmail = optString("clientEmail"),
    serviceName = optString("serviceName"),
    staffName = optString("staffName"),
    startsAt = optString("startsAt"),
    endsAt = optString("endsAt"),
    status = optString("status"),
    webUrl = optString("webUrl"),
)

private fun JSONObject.nullableString(name: String): String? {
    return if (isNull(name)) null else optString(name)
}

private inline fun <T> JSONArray?.toList(transform: (JSONObject) -> T): List<T> {
    if (this == null) return emptyList()
    return (0 until length()).mapNotNull { index ->
        optJSONObject(index)?.let(transform)
    }
}
