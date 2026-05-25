export function computeDiscountedPrice(priceLkr: number, discountPercent: number): number {
  return Math.floor(priceLkr * (1 - discountPercent / 100));
}

export function computeAmountDueLkr(
  priceLkr: number,
  discountPercent: number,
  depositPercent: number,
): number {
  const discounted = computeDiscountedPrice(priceLkr, discountPercent);
  if (depositPercent > 0) {
    return Math.ceil((discounted * depositPercent) / 100);
  }
  return discounted;
}

export function computeAmountDueFromDiscountedPrice(
  discountedPriceLkr: number,
  depositPercent: number,
): number {
  if (depositPercent > 0) {
    return Math.ceil((discountedPriceLkr * depositPercent) / 100);
  }
  return discountedPriceLkr;
}
