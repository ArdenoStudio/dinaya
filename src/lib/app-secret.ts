/**
 * Returns a required application secret. Fails closed when unset in production.
 */
export function getAppSecret(purpose: string): string {
  const key = process.env.SECRET_ENCRYPTION_KEY ?? process.env.AUTH_SECRET;

  if (key) {
    return key;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${purpose} requires SECRET_ENCRYPTION_KEY or AUTH_SECRET.`);
  }

  throw new Error(
    `${purpose} requires SECRET_ENCRYPTION_KEY or AUTH_SECRET. Set one in your environment.`,
  );
}
