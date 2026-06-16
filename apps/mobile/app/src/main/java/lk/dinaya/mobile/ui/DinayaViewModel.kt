package lk.dinaya.mobile.ui

import android.app.Application
import android.os.Build
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lk.dinaya.mobile.BuildConfig
import lk.dinaya.mobile.data.AndroidKeystoreTokenStore
import lk.dinaya.mobile.data.BookingSummary
import lk.dinaya.mobile.data.BootstrapResult
import lk.dinaya.mobile.data.DinayaApiClient
import lk.dinaya.mobile.data.DesktopModulePayload
import lk.dinaya.mobile.data.StoredSession

data class ModuleContentState(
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val payload: DesktopModulePayload? = null,
)

data class DinayaUiState(
    val baseUrl: String = BuildConfig.DINAYA_API_BASE_URL,
    val email: String = "",
    val password: String = "",
    val deviceName: String = defaultDeviceName(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val session: StoredSession? = null,
    val bootstrap: BootstrapResult? = null,
    val bookings: List<BookingSummary> = emptyList(),
    val lastSyncedAt: String? = null,
    val selectedSectionKey: String = "overview",
    val moduleContent: Map<String, ModuleContentState> = emptyMap(),
)

class DinayaViewModel(application: Application) : AndroidViewModel(application) {
    private val tokenStore = AndroidKeystoreTokenStore(application)
    private val _uiState = MutableStateFlow(DinayaUiState())
    val uiState: StateFlow<DinayaUiState> = _uiState.asStateFlow()

    init {
        val savedSession = tokenStore.load()
        if (savedSession != null) {
            _uiState.update {
                it.copy(
                    baseUrl = savedSession.baseUrl,
                    session = savedSession,
                )
            }
            refresh()
        }
    }

    fun updateBaseUrl(value: String) {
        _uiState.update { it.copy(baseUrl = value, errorMessage = null) }
    }

    fun updateEmail(value: String) {
        _uiState.update { it.copy(email = value, errorMessage = null) }
    }

    fun updatePassword(value: String) {
        _uiState.update { it.copy(password = value, errorMessage = null) }
    }

    fun updateDeviceName(value: String) {
        _uiState.update { it.copy(deviceName = value, errorMessage = null) }
    }

    fun selectSection(sectionKey: String) {
        val section = dashboardSectionByKey(sectionKey)
        _uiState.update {
            it.copy(
                selectedSectionKey = section.key,
                errorMessage = null,
            )
        }
        if (section.desktopModule == null) {
            refresh()
        } else {
            loadSectionModule(section.key, force = false)
        }
    }

    fun signIn() {
        val snapshot = uiState.value
        val email = snapshot.email.trim()
        val password = snapshot.password
        val baseUrl = snapshot.baseUrl.trim()
        val deviceName = snapshot.deviceName.trim().ifBlank { defaultDeviceName() }
        if (email.isBlank() || password.isBlank() || baseUrl.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Email, password, and API URL are required.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching {
                DinayaApiClient(baseUrl).login(email, password, deviceName)
            }.onSuccess { login ->
                val session = StoredSession(
                    baseUrl = baseUrl,
                    deviceKey = login.deviceKey,
                    keyId = login.auth.keyId,
                    deviceId = login.auth.deviceId,
                    deviceName = login.auth.deviceName,
                    businessName = login.business.name,
                    userEmail = login.user.email,
                )
                tokenStore.save(session)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        password = "",
                        session = session,
                        bootstrap = null,
                        bookings = emptyList(),
                        selectedSectionKey = "overview",
                        moduleContent = emptyMap(),
                    )
                }
                refresh()
            }.onFailure { error ->
                _uiState.update {
                    it.copy(isLoading = false, errorMessage = error.message ?: "Sign in failed.")
                }
            }
        }
    }

    fun refresh() {
        val session = uiState.value.session ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val selectedSection = dashboardSectionByKey(uiState.value.selectedSectionKey)
            runCatching {
                val client = DinayaApiClient(session.baseUrl)
                val bootstrap = client.fetchBootstrap(session.deviceKey)
                val bookings = client.fetchTodayBookings(session.deviceKey)
                val module = selectedSection.desktopModule?.let {
                    client.fetchDesktopModule(session.deviceKey, it)
                }
                Triple(bootstrap, bookings, module)
            }.onSuccess { (bootstrap, bookings, module) ->
                _uiState.update {
                    val nextModuleContent = if (module != null) {
                        it.moduleContent + (selectedSection.key to ModuleContentState(payload = module))
                    } else {
                        it.moduleContent
                    }
                    it.copy(
                        isLoading = false,
                        bootstrap = bootstrap,
                        bookings = bookings.rows,
                        lastSyncedAt = bookings.serverTime.ifBlank { bootstrap.serverTime },
                        moduleContent = nextModuleContent,
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(isLoading = false, errorMessage = error.message ?: "Refresh failed.")
                }
            }
        }
    }

    fun refreshSelectedSection() {
        val section = dashboardSectionByKey(uiState.value.selectedSectionKey)
        if (section.desktopModule == null) {
            refresh()
        } else {
            loadSectionModule(section.key, force = true)
        }
    }

    private fun loadSectionModule(sectionKey: String, force: Boolean) {
        val session = uiState.value.session ?: return
        val section = dashboardSectionByKey(sectionKey)
        val module = section.desktopModule ?: return
        val existing = uiState.value.moduleContent[section.key]
        if (!force && existing?.payload != null) return

        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    moduleContent = it.moduleContent + (
                        section.key to ModuleContentState(
                            isLoading = true,
                            payload = existing?.payload,
                        )
                    ),
                )
            }
            runCatching {
                DinayaApiClient(session.baseUrl).fetchDesktopModule(session.deviceKey, module)
            }.onSuccess { payload ->
                _uiState.update {
                    it.copy(
                        moduleContent = it.moduleContent + (
                            section.key to ModuleContentState(payload = payload)
                        ),
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        moduleContent = it.moduleContent + (
                            section.key to ModuleContentState(
                                errorMessage = error.message ?: "Could not load ${section.label}.",
                                payload = existing?.payload,
                            )
                        ),
                    )
                }
            }
        }
    }

    fun updateBookingStatus(bookingId: String, status: String) {
        val session = uiState.value.session ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching {
                DinayaApiClient(session.baseUrl).updateBookingStatus(session.deviceKey, bookingId, status)
            }.onSuccess {
                refresh()
            }.onFailure { error ->
                _uiState.update {
                    it.copy(isLoading = false, errorMessage = error.message ?: "Status update failed.")
                }
            }
        }
    }

    fun signOut() {
        val session = uiState.value.session
        tokenStore.clear()
        _uiState.update {
            DinayaUiState(baseUrl = it.baseUrl, deviceName = it.deviceName)
        }

        if (session != null) {
            viewModelScope.launch {
                runCatching {
                    DinayaApiClient(session.baseUrl).logout(session.deviceKey)
                }
            }
        }
    }
}

private fun defaultDeviceName(): String {
    val model = listOfNotNull(Build.MANUFACTURER, Build.MODEL)
        .joinToString(" ")
        .trim()
        .ifBlank { "Android" }
    return "Dinaya Android - $model"
}
