export const PROVIDER_SEND_TIMEOUT_MS = 8_000;

export function providerTimeoutSignal(timeoutMs = PROVIDER_SEND_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

export async function withProviderTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = PROVIDER_SEND_TIMEOUT_MS,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
