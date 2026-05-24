import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

const PREFIX = "enc:v1:";

function getSecretKey(): string {
  if (process.env.NODE_ENV === "production") {
    const productionKey = process.env.SECRET_ENCRYPTION_KEY;
    if (!productionKey) {
      throw new Error("SECRET_ENCRYPTION_KEY is required in production.");
    }
    return productionKey;
  }

  const key = process.env.SECRET_ENCRYPTION_KEY ?? process.env.AUTH_SECRET;
  if (!key) {
    throw new Error("SECRET_ENCRYPTION_KEY or AUTH_SECRET is required for secret encryption.");
  }
  return key;
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(PREFIX));
}

export function encryptSecret(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return `${PREFIX}${AES.encrypt(trimmed, getSecretKey()).toString()}`;
}

export function decryptSecret(value: string | null | undefined): string | null {
  if (!value) return null;

  if (!isEncryptedSecret(value)) {
    return value;
  }

  const ciphertext = value.slice(PREFIX.length);
  const decrypted = AES.decrypt(ciphertext, getSecretKey()).toString(Utf8);

  if (!decrypted) {
    throw new Error("Unable to decrypt stored secret.");
  }

  return decrypted;
}
