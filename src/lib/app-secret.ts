/**
 * Returns a required application secret. Fails closed when unset in production.
 */
export function getAppSecret(purpose: string): string {
  if (process.env.NODE_ENV === "production") {
    const productionKey = process.env.SECRET_ENCRYPTION_KEY;
    if (!productionKey) {
      throw new Error(`${purpose} requires SECRET_ENCRYPTION_KEY in production.`);
    }
    return productionKey;
  }

  const key = process.env.SECRET_ENCRYPTION_KEY ?? process.env.AUTH_SECRET;

  if (key) {
    return key;
  }

  throw new Error(
    `${purpose} requires SECRET_ENCRYPTION_KEY or AUTH_SECRET. Set one in your environment.`,
  );
}
