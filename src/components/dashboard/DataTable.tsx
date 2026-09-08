"use client";

import { Table } from "@heroui/react";
import { cn } from "@/lib/utils";

export type DataTableColumn<TRow> = {
  align?: "left" | "right" | "center";
  className?: string;
  header: string;
  key: string;
  render: (row: TRow) => React.ReactNode;
};

/**
 * `column.render` output is cached by react-aria keyed on row identity (see
 * react-aria's `useCachedChildren`) and is NOT re-evaluated when only sibling
 * state changes — only when a row's own object reference changes. So a
 * `render` must not read state that lives outside the row data (e.g. a
 * `confirmDeleteId`/`pendingId` declared in the parent): any dialog gated on
 * it will render frozen at its first-render value and never open. Mount such
 * dialogs as a single instance outside the table instead, keyed off the same
 * id state (see WebhooksClient/ApiKeysClient for the pattern).
 */

export function DataTable<TRow extends object>({
  columns,
  empty,
  getRowId,
  rows,
}: {
  columns: DataTableColumn<TRow>[];
  empty?: React.ReactNode;
  getRowId: (row: TRow) => string;
  rows: TRow[];
}) {
  if (rows.length === 0) {
    return <>{empty ?? null}</>;
  }

  return (
    <Table.Root className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
      <Table.ScrollContainer className="overflow-x-auto">
        <Table.Content aria-label="Data table" className="w-full min-w-184 text-sm">
          <Table.Header columns={columns}>
            {(column: DataTableColumn<TRow>) => (
              <Table.Column
                id={column.key}
                isRowHeader={column === columns[0]}
                className={cn(
                  "bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                  (!column.align || column.align === "left") && "text-left",
                  column.className,
                )}
              >
                {column.header}
              </Table.Column>
            )}
          </Table.Header>
          <Table.Body items={rows} className="divide-y">
            {(row: TRow) => (
              <Table.Row
                id={getRowId(row)}
                columns={columns}
                className="transition-colors hover:bg-muted/30"
              >
                {(column: DataTableColumn<TRow>) => (
                  <Table.Cell
                    className={cn(
                      "px-4 py-3 align-middle",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </Table.Cell>
                )}
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table.Root>
  );
}
