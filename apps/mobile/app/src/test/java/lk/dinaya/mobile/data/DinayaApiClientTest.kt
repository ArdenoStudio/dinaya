package lk.dinaya.mobile.data

import org.junit.Assert.assertEquals
import org.junit.Test

class DinayaApiClientTest {
    @Test
    fun resolveDinayaUrlNormalizesBaseAndPath() {
        val url = resolveDinayaUrl("https://dinaya.lk/", "/api/v1/desktop/bootstrap")

        assertEquals("https://dinaya.lk/api/v1/desktop/bootstrap", url.toString())
    }

    @Test
    fun resolveDinayaUrlAcceptsPathWithoutSlash() {
        val url = resolveDinayaUrl("https://dinaya.lk", "api/v1/desktop/bookings")

        assertEquals("https://dinaya.lk/api/v1/desktop/bookings", url.toString())
    }

    @Test
    fun desktopModulePathUsesDesktopApiWithCompactLimit() {
        assertEquals("/api/v1/desktop/services?limit=40", desktopModulePath("services"))
    }
}
