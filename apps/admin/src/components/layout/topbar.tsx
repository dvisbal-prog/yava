"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRight, LogOut, MapPin, Search } from "lucide-react";
import type { AdminRole } from "@yava/shared";
import { ROLE_LABEL, sectionFromPath } from "@/lib/roles";
import { Avatar } from "@/components/ui/avatar";
import { SECTION_TITLE } from "./nav";
import { setCityAction, signOutAction } from "@/app/(admin)/actions";
import { Logo } from "./logo";

export function Topbar({
  name,
  role,
  avatarUrl,
  cities,
  selectedCity,
  today,
}: {
  name: string;
  role: AdminRole;
  avatarUrl: string | null;
  cities: { id: string; name: string }[];
  selectedCity: string | null;
  today: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [pending, start] = useTransition();
  const section = sectionFromPath(pathname);

  return (
    <header className="h-16 border-b border-border bg-card sticky top-0 z-30 flex items-center gap-4 px-4 md:px-6">
      <Link href="/" className="md:hidden" aria-label="Panorama">
        <Logo compact />
      </Link>
      <nav className="hidden lg:flex items-center gap-1 text-[13px] text-muted shrink-0" aria-label="Ruta">
        <Link href="/" className="hover:text-carbon">
          Administración
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-carbon font-medium">{SECTION_TITLE[section]}</span>
      </nav>

      <form
        role="search"
        className="flex-1 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          const term = q.trim();
          if (term) router.push(`/buscar?q=${encodeURIComponent(term)}`);
        }}
      >
        <label htmlFor="global-search" className="sr-only">
          Buscar pedidos, comercios, usuarios
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden />
          <input
            id="global-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar pedidos, comercios, usuarios..."
            className="w-full h-10 rounded-md border border-border bg-gray-50 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:bg-card focus:border-blue"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden xl:block text-[13px] text-muted whitespace-nowrap">{today}</span>
        <div className="hidden sm:flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-gray-400" aria-hidden />
          <label htmlFor="city-select" className="sr-only">
            Ciudad
          </label>
          <select
            id="city-select"
            value={selectedCity ?? "all"}
            disabled={pending}
            onChange={(e) => {
              const v = e.target.value;
              start(async () => {
                await setCityAction(v);
                router.refresh();
              });
            }}
            className="h-9 rounded-md border border-border bg-card px-2 text-[13px] text-carbon"
          >
            <option value="all">Todas las ciudades</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <UserMenu name={name} role={role} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}

function UserMenu({ name, role, avatarUrl }: { name: string; role: AdminRole; avatarUrl: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md pl-1 pr-2 h-10 hover:bg-gray-100"
      >
        <Avatar name={name} src={avatarUrl} size="sm" />
        <span className="hidden md:block text-left leading-tight">
          <span className="block text-[13px] font-medium text-carbon">{name}</span>
          <span className="block text-[11px] text-muted">{ROLE_LABEL[role]}</span>
        </span>
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 mt-1 w-48 rounded-md border border-border bg-card shadow-lg z-40 py-1 yv-fade-in">
            <div className="px-3 py-2 border-b border-border md:hidden">
              <p className="text-[13px] font-medium">{name}</p>
              <p className="text-[11px] text-muted">{ROLE_LABEL[role]}</p>
            </div>
            <form action={signOutAction}>
              <button type="submit" role="menuitem" className="w-full flex items-center gap-2 px-3 h-9 text-sm text-gray-700 hover:bg-gray-100">
                <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
              </button>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
