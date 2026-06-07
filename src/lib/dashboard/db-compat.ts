import { sql } from "drizzle-orm";
import { db } from "@/db";

const tableCache = new Map<string, Promise<boolean>>();
const columnCache = new Map<string, Promise<boolean>>();

function existsFromResult(result: unknown): boolean {
  const rows = (result as { rows?: Array<{ exists?: boolean }> }).rows ?? [];
  return Boolean(rows[0]?.exists);
}

export function isMissingSchemaError(error: unknown): boolean {
  const directCode = (error as { code?: string } | null)?.code;
  const causeCode = (error as { cause?: { code?: string } } | null)?.cause?.code;
  return directCode === "42P01" || directCode === "42703" || causeCode === "42P01" || causeCode === "42703";
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
