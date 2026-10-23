"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Barra de filtros GET: los <select> envían el formulario al cambiar; el texto al presionar Enter.
 * Los filtros viven en la URL (searchParams) → paginación y recarga coherentes.
 */
export function FilterForm({ children, action, resetHref, className, hidden = {} }: { children: React.ReactNode; action?: string; resetHref?: string; className?: string; hidden?: Record<string, string | undefined> }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      method="get"
      action={action}
      className={cn("flex flex-wrap items-end gap-2", className)}
      onChange={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === "SELECT" || (t as HTMLInputElement).type === "date" || (t as HTMLInputElement).type === "checkbox") ref.current?.requestSubmit();
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {children}
      {resetHref ? (
        <Link href={resetHref} className="inline-flex items-center gap-1 h-10 px-3 rounded-md text-[13px] text-gray-500 hover:bg-gray-100">
          <X className="h-3.5 w-3.5" /> Limpiar
        </Link>
      ) : null}
    </form>
  );
}

export function FilterSelect({ name, label, value, options, className }: { name: string; label: string; value?: string; options: { value: string; label: string }[]; className?: string }) {
  return (
    <div className={cn("min-w-[150px]", className)}>
      <label htmlFor={`f-${name}`} className="sr-only">
        {label}
      </label>
      <Select id={`f-${name}`} name={name} defaultValue={value ?? ""} aria-label={label}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function FilterSearch({ name = "q", label = "Buscar", value, placeholder, className }: { name?: string; label?: string; value?: string; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative min-w-[220px] flex-1 max-w-sm", className)}>
      <label htmlFor={`f-${name}`} className="sr-only">
        {label}
      </label>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden />
      <Input id={`f-${name}`} name={name} type="search" defaultValue={value ?? ""} placeholder={placeholder ?? label} className="pl-9" />
    </div>
  );
}

export function FilterDate({ name, label, value }: { name: string; label: string; value?: string }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="sr-only">
        {label}
      </label>
      <Input id={`f-${name}`} name={name} type="date" defaultValue={value ?? ""} aria-label={label} className="w-[150px]" />
    </div>
  );
}
