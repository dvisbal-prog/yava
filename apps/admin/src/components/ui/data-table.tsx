import Link from "next/link";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  width?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  emptyTitle = "Sin resultados",
  emptyDescription,
  footer,
  dense = false,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string | undefined;
  emptyTitle?: string;
  emptyDescription?: string;
  footer?: React.ReactNode;
  dense?: boolean;
  caption?: string;
}) {
  const align = (a?: "left" | "right" | "center") => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-border bg-gray-50/70">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  className={cn("px-4 py-2.5 text-[12px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap", align(c.align), c.className)}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const href = rowHref?.(row);
                return (
                  <tr key={rowKey(row)} className={cn("border-b border-border last:border-b-0", href && "hover:bg-gray-50 transition-colors")}>
                    {columns.map((c, i) => (
                      <td key={c.key} className={cn("px-4 align-middle text-carbon", dense ? "py-2" : "py-3", align(c.align), c.className)}>
                        {href && i === 0 ? (
                          <Link href={href} className="block -m-1 p-1 rounded hover:text-blue focus-visible:outline-blue">
                            {c.cell(row)}
                          </Link>
                        ) : (
                          c.cell(row)
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
