import { describe, expect, it } from "vitest";
import {
  bookingRouterSchema,
  resolveActiveRouter,
  routerOptionServiceId,
  type BookingRouter,
} from "./booking-router";

const router = (over: Partial<BookingRouter> = {}): BookingRouter => ({
  enabled: true,
  question: "What do you need?",
  options: [
    { id: "o1", label: "Cleaning", serviceId: "svc-clean" },
    { id: "o2", label: "Emergency", serviceId: "svc-emerg" },
  ],
  ...over,
});

const schemaRouter = (): BookingRouter => ({
  enabled: true,
  question: "What do you need?",
  options: [
    {
      id: "o1",
      label: "Cleaning",
      serviceId: "00000000-0000-4000-8000-000000000001",
    },
  ],
});

describe("resolveActiveRouter", () => {
  it("returns null when the router is missing or disabled", () => {
    expect(resolveActiveRouter(null, ["svc-clean"])).toBeNull();
    expect(resolveActiveRouter(router({ enabled: false }), ["svc-clean", "svc-emerg"])).toBeNull();
  });

  it("drops options whose service no longer exists", () => {
    const result = resolveActiveRouter(router(), ["svc-clean"]);
    expect(result?.options).toEqual([{ id: "o1", label: "Cleaning", serviceId: "svc-clean" }]);
  });

  it("returns null when no option points at a valid service", () => {
    expect(resolveActiveRouter(router(), ["svc-other"])).toBeNull();
  });

  it("keeps only the first option per service (dedup)", () => {
    const dup = router({
      options: [
        { id: "o1", label: "Cleaning", serviceId: "svc-clean" },
        { id: "o2", label: "Also cleaning", serviceId: "svc-clean" },
      ],
    });
    const result = resolveActiveRouter(dup, ["svc-clean"]);
    expect(result?.options).toHaveLength(1);
    expect(result?.options[0]?.id).toBe("o1");
  });

  it("accepts a Set of valid ids", () => {
    const result = resolveActiveRouter(router(), new Set(["svc-clean", "svc-emerg"]));
    expect(result?.options).toHaveLength(2);
  });
});

describe("routerOptionServiceId", () => {
  it("returns the mapped service id", () => {
    expect(routerOptionServiceId(router(), "o2")).toBe("svc-emerg");
  });
  it("returns null for an unknown option", () => {
    expect(routerOptionServiceId(router(), "nope")).toBeNull();
    expect(routerOptionServiceId(null, "o1")).toBeNull();
  });
});

describe("bookingRouterSchema", () => {
  it("allows an empty disabled router", () => {
    expect(bookingRouterSchema.safeParse({ enabled: false, question: "", options: [] }).success).toBe(true);
  });

  it("requires a question and at least one option when enabled", () => {
    expect(bookingRouterSchema.safeParse({ enabled: true, question: "", options: [] }).success).toBe(false);
  });

  it("accepts a publishable enabled router", () => {
    expect(bookingRouterSchema.safeParse(schemaRouter()).success).toBe(true);
  });
});
