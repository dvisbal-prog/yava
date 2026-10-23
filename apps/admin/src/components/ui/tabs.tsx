import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: React.ReactNode;
  href: string;
  count?: number | null;
}

/** Pestañas basadas en enlaces (estado en la URL). */
export function Tabs({ items, active, className }: { items: TabItem[]; active: string; className?: string }) {
  return (
    <nav className={cn("flex gap-1 border-b border-border overflow-x-auto", className)} aria-label="Pestañas">
      {items.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 px-3 h-10 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              isActive ? "border-blue text-blue" : "border-transparent text-gray-500 hover:text-carbon hover:border-gray-300",
            )}
          >
            {t.label}
            {typeof t.count === "number" ? (
              <span className={cn("rounded-full px-1.5 text-[11px] leading-4", isActive ? "bg-blue-soft text-blue" : "bg-gray-100 text-gray-500")}>{t.count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Filtros tipo "chips" (Todos / Abiertos / …) basados en enlaces. */
export function ChipTabs({ items, active }: { items: TabItem[]; active: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {items.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-medium border transition-colors",
              isActive ? "bg-carbon text-white border-carbon" : "bg-card text-gray-700 border-border hover:bg-gray-50",
            )}
          >
            {t.label}
            {typeof t.count === "number" ? <span className={cn("text-xs", isActive ? "text-gray-300" : "text-gray-400")}>({t.count})</span> : null}
          </Link>
        );
      })}
    </div>
  );
}
