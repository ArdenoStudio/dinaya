import { describe, expect, it } from "vitest";
import { schemaExistsFromExecuteResult } from "./db-compat";

describe("schemaExistsFromExecuteResult", () => {
  it("reads postgres-js array results", () => {
    expect(schemaExistsFromExecuteResult([{ exists: true }])).toBe(true);
    expect(schemaExistsFromExecuteResult([{ exists: false }])).toBe(false);
  });

  it("reads Neon HTTP .rows results", () => {
    expect(schemaExistsFromExecuteResult({ rows: [{ exists: true }] })).toBe(true);
  });

  it("returns false for empty results", () => {
    expect(schemaExistsFromExecuteResult([])).toBe(false);
    expect(schemaExistsFromExecuteResult({ rows: [] })).toBe(false);
  });
});
