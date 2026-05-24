import { describe, expect, it } from "vitest";
import {
  categoryLabel,
  cityToSlug,
  inferDirectoryCategory,
  slugToCity,
} from "./directory";

describe("directory helpers", () => {
  it("converts cities to URL slugs and back", () => {
    expect(cityToSlug("Colombo")).toBe("colombo");
    expect(slugToCity("colombo")).toBe("Colombo");
    expect(slugToCity("unknown")).toBeNull();
  });

  it("labels categories and infers from business type", () => {
    expect(categoryLabel("salon")).toBe("Salon & beauty");
    expect(categoryLabel(null)).toBe("Services");
    expect(inferDirectoryCategory("salon_barber")).toBe("salon");
    expect(inferDirectoryCategory("clinic")).toBe("clinic");
    expect(inferDirectoryCategory("tuition")).toBe("tutoring");
    expect(inferDirectoryCategory("spa_wellness")).toBe("fitness");
    expect(inferDirectoryCategory("consulting")).toBe("consulting");
    expect(inferDirectoryCategory("tutoring")).toBe("tutoring");
  });
});
