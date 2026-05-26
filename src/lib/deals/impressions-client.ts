const IMPRESSIONS_STORAGE_KEY = "dinaya_deal_impressions";

export function markDealImpression(dealId: string): void {
  if (typeof window === "undefined") return;

  const seen = new Set<string>(JSON.parse(sessionStorage.getItem(IMPRESSIONS_STORAGE_KEY) ?? "[]"));
  if (seen.has(dealId)) return;

  seen.add(dealId);
  sessionStorage.setItem(IMPRESSIONS_STORAGE_KEY, JSON.stringify([...seen]));

  void fetch("/api/deals/impressions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dealIds: [dealId] }),
  }).catch(() => undefined);
}
