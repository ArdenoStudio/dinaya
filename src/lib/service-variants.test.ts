import { describe, expect, it } from "vitest";
import { minPriceVariantLkr, resolvePriceVariantSelection, type ServicePriceVariant } from "./service-variants";

const rica: ServicePriceVariant = { id: "rica", label: "Rica White Chocolate", priceLkr: 6500 };
const bruhza: ServicePriceVariant = { id: "bruhza", label: "Bruhza Gold", priceLkr: 5000 };

describe("resolvePriceVariantSelection", () => {
  it("allows no selection when the service has no variants", () => {
    const result = resolvePriceVariantSelection([], null);
    expect(result).toEqual({ ok: true, variant: null });
  });

  it("allows no selection when variants are undefined", () => {
    const result = resolvePriceVariantSelection(undefined, undefined);
    expect(result).toEqual({ ok: true, variant: null });
  });

  it("requires a selection when the service has variants", () => {
    const result = resolvePriceVariantSelection([rica, bruhza], null);
    expect(result.ok).toBe(false);
  });

  it("rejects a submitted id that isn't one of the service's variants", () => {
    const result = resolvePriceVariantSelection([rica, bruhza], "lycon-superberry");
    expect(result.ok).toBe(false);
  });

  it("resolves a valid selection to its full variant", () => {
    const result = resolvePriceVariantSelection([rica, bruhza], "bruhza");
    expect(result).toEqual({ ok: true, variant: bruhza });
  });
});

describe("minPriceVariantLkr", () => {
  it("returns null when there are no variants", () => {
    expect(minPriceVariantLkr([])).toBeNull();
    expect(minPriceVariantLkr(null)).toBeNull();
  });

  it("returns the lowest price among variants", () => {
    expect(minPriceVariantLkr([rica, bruhza])).toBe(5000);
  });
});
