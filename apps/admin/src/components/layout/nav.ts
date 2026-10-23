import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Bike,
  Wallet,
  LifeBuoy,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";
import type { Section } from "@/lib/roles";

export interface NavChild {
  label: string;
  href: string;
}
export interface NavItem {
  section: Section;
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
}

export const NAV: NavItem[] = [
  { section: "panorama", label: "Panorama", href: "/", icon: LayoutDashboard },
  { section: "pedidos", label: "Pedidos", href: "/pedidos", icon: ShoppingBag },
  { section: "comercios", label: "Comercios", href: "/comercios", icon: Store },
  { section: "repartidores", label: "Repartidores", href: "/repartidores", icon: Bike },
  {
    section: "finanzas",
    label: "Finanzas",
    href: "/finanzas/ingresos",
    icon: Wallet,
    children: [
      { label: "Ingresos", href: "/finanzas/ingresos" },
      { label: "Conciliación", href: "/finanzas/conciliacion" },
      { label: "Liquidaciones", href: "/finanzas/liquidaciones" },
    ],
  },
  { section: "soporte", label: "Soporte", href: "/soporte", icon: LifeBuoy },
  { section: "reportes", label: "Reportes", href: "/reportes", icon: BarChart3 },
  { section: "equipo", label: "Equipo", href: "/equipo", icon: Users },
  { section: "configuracion", label: "Configuración", href: "/configuracion", icon: Settings },
];

export const SECTION_TITLE: Record<Section, string> = {
  panorama: "Panorama",
  pedidos: "Pedidos",
  comercios: "Comercios",
  repartidores: "Repartidores",
  finanzas: "Finanzas",
  soporte: "Soporte",
  reportes: "Reportes",
  equipo: "Equipo",
  configuracion: "Configuración",
  buscar: "Búsqueda",
};
