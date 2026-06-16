package lk.dinaya.mobile.data

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import org.json.JSONObject

interface SecureTokenStore {
    fun save(session: StoredSession)
    fun load(): StoredSession?
    fun clear()
}

class AndroidKeystoreTokenStore(context: Context) : SecureTokenStore {
    private val appContext = context.applicationContext
    private val prefs = appContext.getSharedPreferences("dinaya_mobile_auth", Context.MODE_PRIVATE)
    private val keyAlias = "dinaya_mobile_device_key"
    private val cipherName = "AES/GCM/NoPadding"

    override fun save(session: StoredSession) {
        val cipher = Cipher.getInstance(cipherName)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateSecretKey())
        val plaintext = JSONObject()
            .put("baseUrl", session.baseUrl)
            .put("deviceKey", session.deviceKey)
            .put("keyId", session.keyId)
            .put("deviceId", session.deviceId)
            .put("deviceName", session.deviceName)
            .put("businessName", session.businessName)
            .put("userEmail", session.userEmail)
            .toString()
            .toByteArray(StandardCharsets.UTF_8)
        val encrypted = cipher.doFinal(plaintext)

        prefs.edit()
            .putString("iv", Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
            .putString("payload", Base64.encodeToString(encrypted, Base64.NO_WRAP))
            .apply()
    }

    override fun load(): StoredSession? {
        val encodedIv = prefs.getString("iv", null) ?: return null
        val encodedPayload = prefs.getString("payload", null) ?: return null

        return runCatching {
            val cipher = Cipher.getInstance(cipherName)
            val iv = Base64.decode(encodedIv, Base64.NO_WRAP)
            val payload = Base64.decode(encodedPayload, Base64.NO_WRAP)
            cipher.init(Cipher.DECRYPT_MODE, getOrCreateSecretKey(), GCMParameterSpec(128, iv))
            val decoded = cipher.doFinal(payload).toString(StandardCharsets.UTF_8)
            JSONObject(decoded).toStoredSession()
        }.getOrNull()
    }

    override fun clear() {
        prefs.edit().clear().apply()
    }

    private fun getOrCreateSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        val existing = keyStore.getEntry(keyAlias, null) as? KeyStore.SecretKeyEntry
        if (existing != null) return existing.secretKey

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        val spec = KeyGenParameterSpec.Builder(
            keyAlias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build()
        generator.init(spec)
        return generator.generateKey()
    }
}

private fun JSONObject.toStoredSession() = StoredSession(
    baseUrl = getString("baseUrl"),
    deviceKey = getString("deviceKey"),
    keyId = getString("keyId"),
    deviceId = getString("deviceId"),
    deviceName = getString("deviceName"),
    businessName = getString("businessName"),
    userEmail = getString("userEmail"),
)
