const DEFAULT_LKR_PER_USD = 300;

export function getLkrPerUsd(): number {
  const raw = process.env.LKR_PER_USD;
  const parsed = raw ? Number(raw) : DEFAULT_LKR_PER_USD;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LKR_PER_USD;
}

/** Convert LKR whole rupees to USD with 2 decimal places for PayPal. */
export function convertLkrToUsd(amountLkr: number): number {
  const usd = amountLkr / getLkrPerUsd();
  return Math.max(0.01, Math.ceil(usd * 100) / 100);
}

export function formatUsd(amountUsd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amountUsd);
}
