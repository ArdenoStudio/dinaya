import { promises as dns } from "node:dns";
import { randomBytes } from "node:crypto";

const VERIFY_PREFIX = "dinaya-verify=";

export function generateDomainVerificationToken(): string {
  return randomBytes(16).toString("hex");
}

export function verificationHost(domain: string): string {
  return `_dinaya-verify.${domain}`;
}

export function expectedVerificationRecord(token: string): string {
  return `${VERIFY_PREFIX}${token}`;
}

export async function verifyDomainTxtRecord(
  domain: string,
  token: string,
): Promise<boolean> {
  const host = verificationHost(domain);
  const expected = expectedVerificationRecord(token);

  try {
    const records = await dns.resolveTxt(host);
    return records.some((chunks) => chunks.join("").includes(expected));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return false;
    }
    throw error;
  }
}
