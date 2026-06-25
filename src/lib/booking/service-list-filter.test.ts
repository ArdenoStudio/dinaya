import { describe, expect, it } from "vitest";
import {
  filterServices,
  groupServicesByCategory,
  paginateServices,
  shouldGroupServicesByCategory,
  shouldShowServiceSearch,
  shouldUseSearchPagination,
  takeGroupedServicesWindow,
  takeServicesWindow,
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

  it("shows search on hub when multiple services", () => {
    expect(shouldShowServiceSearch(1, "hub")).toBe(false);
    expect(shouldShowServiceSearch(2, "hub")).toBe(true);
  });

  it("shows search in wizard at lowered threshold", () => {
    expect(shouldShowServiceSearch(4, "wizard")).toBe(false);
    expect(shouldShowServiceSearch(5, "wizard")).toBe(true);
  });

  it("paginates large filtered lists", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      name: `Service ${i}`,
      description: null,
      categoryName: null,
    }));
    expect(shouldUseSearchPagination(25, "service", null)).toBe(true);
    const page1 = paginateServices(many, 1);
    expect(page1.items).toHaveLength(20);
    expect(page1.totalPages).toBe(2);
    const page2 = paginateServices(many, 2);
    expect(page2.items).toHaveLength(5);
  });

  it("groups services by category", () => {
    const groups = groupServicesByCategory(services, "Other");
    expect(groups.map((g) => g.category)).toEqual(["Colour", "Grooming", "Haircuts"]);
  });

  it("groups browse lists when enough categories and no filter", () => {
    expect(shouldGroupServicesByCategory(["A", "B", "C"], "", null)).toBe(true);
    expect(shouldGroupServicesByCategory(["A", "B"], "", null)).toBe(false);
    expect(shouldGroupServicesByCategory(["A", "B", "C"], "hair", null)).toBe(false);
  });

  it("windows flat and grouped lists", () => {
    const windowed = takeServicesWindow(services, 2);
    expect(windowed.items).toHaveLength(2);
    expect(windowed.hasMore).toBe(true);

    const groups = groupServicesByCategory(services, "Other");
    const grouped = takeGroupedServicesWindow(groups, 2);
    expect(grouped.groups.reduce((sum, g) => sum + g.services.length, 0)).toBe(2);
    expect(grouped.hasMore).toBe(true);
  });
});
