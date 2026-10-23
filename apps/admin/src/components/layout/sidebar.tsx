"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import type { AdminRole } from "@yava/shared";
import { canAccess } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";
import { Logo } from "./logo";

const KEY = "yava-admin-sidebar";
const EVENT = "yava-sidebar-change";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}
function writeCollapsed(v: boolean) {
  try {
    window.localStorage.setItem(KEY, v ? "1" : "0");
  } catch {
    /* sin almacenamiento */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function Sidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  // Estado persistido por navegador; en el servidor siempre expandido (sin desajuste de hidratación).
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  function toggle() {
    writeCollapsed(!collapsed);
  }

  const items = NAV.filter((i) => canAccess(role, i.section));

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 border-r border-border bg-card h-screen sticky top-0 transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-60",
      )}
      aria-label="Navegación principal"
    >
      <div className={cn("h-16 flex items-center border-b border-border", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/" aria-label="YAVA Administración · Panorama">
          <Logo compact={collapsed} />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("/").slice(0, 2).join("/"));
          const Icon = item.icon;
          return (
            <div key={item.section}>
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 h-10 text-sm font-medium transition-colors",
                  active ? "bg-blue-soft text-blue" : "text-gray-700 hover:bg-gray-100 hover:text-carbon",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {!collapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
              </Link>
              {!collapsed && item.children && active ? (
                <ul className="ml-[38px] mt-0.5 mb-1 space-y-0.5 border-l border-border pl-3">
                  {item.children.map((c) => {
                    const childActive = pathname.startsWith(c.href);
                    return (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          aria-current={childActive ? "page" : undefined}
                          className={cn("block rounded px-2 h-8 leading-8 text-[13px]", childActive ? "text-blue font-medium" : "text-gray-500 hover:text-carbon")}
                        >
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
      <div className="p-2 border-t border-border">
        <button
          type="button"
          onClick={toggle}
          className="w-full h-9 rounded-md text-gray-500 hover:bg-gray-100 flex items-center justify-center gap-2 text-[13px]"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed ? "Colapsar" : null}
        </button>
      </div>
    </aside>
  );
}

/** Menú inferior para pantallas pequeñas. */
export function MobileNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const items = NAV.filter((i) => canAccess(role, i.section)).slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card flex" aria-label="Navegación">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("/").slice(0, 2).join("/"));
        const Icon = item.icon;
        return (
          <Link key={item.section} href={item.href} className={cn("flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px]", active ? "text-blue" : "text-gray-500")}>
            <Icon className="h-5 w-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
