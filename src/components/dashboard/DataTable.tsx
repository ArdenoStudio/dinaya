import { cn } from "@/lib/utils";

export type DataTableColumn<TRow> = {
  align?: "left" | "right" | "center";
  className?: string;
  header: string;
  key: string;
  render: (row: TRow) => React.ReactNode;
};

export function DataTable<TRow>({
  columns,
  empty,
  getRowId,
  mobileCard,
  rows,
}: {
  columns: DataTableColumn<TRow>[];
  empty?: React.ReactNode;
  getRowId: (row: TRow) => string;
  /** Card layout for viewports below `md` (Apple mobile pattern). */
  mobileCard?: (row: TRow) => React.ReactNode;
  rows: TRow[];
}) {
  if (rows.length === 0) {
    return <>{empty ?? null}</>;
  }

  if (mobileCard) {
    return (
      <>
        <div className="space-y-2 md:hidden">{rows.map((row) => mobileCard(row))}</div>
        <div className="hidden overflow-hidden rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              {renderTableHead(columns)}
              {renderTableBody(columns, rows, getRowId)}
            </table>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          {renderTableHead(columns)}
          {renderTableBody(columns, rows, getRowId)}
        </table>
      </div>
    </div>
  );
}

function renderTableHead<TRow>(columns: DataTableColumn<TRow>[]) {
  return (
    <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            scope="col"
            className={cn(
              "px-4 py-3 font-semibold",
              column.align === "right" && "text-right",
              column.align === "center" && "text-center",
              (!column.align || column.align === "left") && "text-left",
              column.className,
            )}
          >
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function renderTableBody<TRow>(
  columns: DataTableColumn<TRow>[],
  rows: TRow[],
  getRowId: (row: TRow) => string,
) {
  return (
    <tbody className="divide-y">
      {rows.map((row) => (
        <tr key={getRowId(row)} className="transition-colors hover:bg-muted/30">
          {columns.map((column) => (
            <td
              key={column.key}
              className={cn(
                "px-4 py-3 align-middle",
                column.align === "right" && "text-right",
                column.align === "center" && "text-center",
                column.className,
              )}
            >
              {column.render(row)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
