import { sql } from "drizzle-orm";
import { db } from "@/db";
export { isMissingSchemaError, isTransientDbConnectionError } from "./db-errors";

const tableCache = new Map<string, Promise<boolean>>();
const columnCache = new Map<string, Promise<boolean>>();

function existsFromResult(result: unknown): boolean {
  const rows = (result as { rows?: Array<{ exists?: boolean }> }).rows ?? [];
  return Boolean(rows[0]?.exists);
}

export async function withTransientDbRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  const { isTransientDbConnectionError } = await import("./db-errors");
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientDbConnectionError(error) || attempt === attempts - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function hasPublicTable(tableName: string): Promise<boolean> {
  const cached = tableCache.get(tableName);
  if (cached) return cached;

  const lookup = db.execute(sql`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = ${tableName}
    ) as "exists"
  `).then(existsFromResult);

  tableCache.set(tableName, lookup);
  return lookup;
}

export async function hasPublicColumn(tableName: string, columnName: string): Promise<boolean> {
  const key = `${tableName}.${columnName}`;
  const cached = columnCache.get(key);
  if (cached) return cached;

  const lookup = db.execute(sql`
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = ${tableName}
        and column_name = ${columnName}
    ) as "exists"
  `).then(existsFromResult);

  columnCache.set(key, lookup);
  return lookup;
}
