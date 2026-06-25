export function isMissingSchemaError(error: unknown): boolean {
  const directCode = (error as { code?: string } | null)?.code;
  const causeCode = (error as { cause?: { code?: string } } | null)?.cause?.code;
  return directCode === "42P01" || directCode === "42703" || causeCode === "42P01" || causeCode === "42703";
}

function collectErrorMessages(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 4; depth++) {
    if (typeof current === "string") {
      parts.push(current);
      break;
    }
    const message = (current as { message?: string }).message;
    if (message) parts.push(message);
    current = (current as { cause?: unknown }).cause;
  }
  return parts.join(" ");
}

export function isTransientDbConnectionError(error: unknown): boolean {
  const message = collectErrorMessages(error);
  return /fetch failed|econnreset|etimedout|socket hang up|connection (refused|reset|timed? ?out|terminated|closed)/i.test(message);
}
