import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, type SearchParams, buildQuery } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  searchParams,
  basePath = "",
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: SearchParams;
  basePath?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const link = (p: number) => `${basePath}${buildQuery(searchParams, { page: p === 1 ? null : p })}`;

  const window: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) window.push(p);

  return (
    <nav className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border text-[13px] text-muted" aria-label="Paginación">
      <span>
        Mostrando {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1">
        <PageLink href={link(page - 1)} disabled={page <= 1} label="Anterior">
          <ChevronLeft className="h-4 w-4" />
        </PageLink>
        {window[0] > 1 ? (
          <>
            <PageLink href={link(1)} label="Página 1">1</PageLink>
            {window[0] > 2 ? <span className="px-1">…</span> : null}
          </>
        ) : null}
        {window.map((p) => (
          <PageLink key={p} href={link(p)} active={p === page} label={`Página ${p}`}>
            {p}
          </PageLink>
        ))}
        {window[window.length - 1] < pages ? (
          <>
            {window[window.length - 1] < pages - 1 ? <span className="px-1">…</span> : null}
            <PageLink href={link(pages)} label={`Página ${pages}`}>{pages}</PageLink>
          </>
        ) : null}
        <PageLink href={link(page + 1)} disabled={page >= pages} label="Siguiente">
          <ChevronRight className="h-4 w-4" />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({ href, disabled, active, label, children }: { href: string; disabled?: boolean; active?: boolean; label: string; children: React.ReactNode }) {
  const cls = cn(
    "inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-md border text-[13px]",
    active ? "bg-carbon text-white border-carbon" : "bg-card border-border text-gray-700 hover:bg-gray-50",
    disabled && "opacity-40 pointer-events-none",
  );
  if (disabled) return <span className={cls} aria-disabled>{children}</span>;
  return (
    <Link href={href} className={cls} aria-label={label} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
