import { describe, expect, it } from "vitest";
import {
  filterServices,
  shouldShowServiceSearch,
  uniqueServiceCategories,
} from "@/lib/booking/service-list-filter";

const services = [
  { name: "Haircut", description: "Standard cut", categoryName: "Haircuts" },
  { name: "Beard trim", description: "Shape and line", categoryName: "Grooming" },
  { name: "Full colour", description: "All-over colour", categoryName: "Colour" },
];

describe("service-list-filter", () => {
  it("filters by query across name and description", () => {
    expect(filterServices(services, "beard", null)).toHaveLength(1);
    expect(filterServices(services, "colour", null)[0]?.name).toBe("Full colour");
  });

  it("filters by category", () => {
    expect(filterServices(services, "", "Haircuts")).toHaveLength(1);
    expect(filterServices(services, "beard", "Grooming")).toHaveLength(1);
  });

  it("lists unique sorted categories", () => {
    expect(uniqueServiceCategories(services)).toEqual(["Colour", "Grooming", "Haircuts"]);
  });

  it("shows search at threshold", () => {
    expect(shouldShowServiceSearch(7)).toBe(false);
    expect(shouldShowServiceSearch(8)).toBe(true);
  });
});
