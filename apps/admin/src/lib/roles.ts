import type { AdminRole } from "@yava/shared";

export type Section =
  | "panorama"
  | "pedidos"
  | "comercios"
  | "repartidores"
  | "finanzas"
  | "soporte"
  | "reportes"
  | "equipo"
  | "configuracion"
  | "buscar";

const ACCESS: Record<AdminRole, Section[]> = {
  owner: ["panorama", "pedidos", "comercios", "repartidores", "finanzas", "soporte", "reportes", "equipo", "configuracion", "buscar"],
  finance: ["panorama", "finanzas", "reportes", "buscar"],
  operations: ["panorama", "pedidos", "comercios", "repartidores", "soporte", "reportes", "buscar"],
  support: ["panorama", "pedidos", "soporte", "buscar"],
};

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Owner",
  finance: "Finanzas",
  operations: "Operaciones",
  support: "Soporte",
};

export const ROLE_DESCRIPTION: Record<AdminRole, string> = {
  owner: "Visión global y gestión de accesos.",
  finance: "Ingresos, conciliación y liquidaciones.",
  operations: "Pedidos, comercios, repartidores y catálogo.",
  support: "Casos y consulta de los pedidos asociados.",
};

export const ROLE_PERMISSIONS: Record<AdminRole, { label: string; allowed: boolean }[]> = {
  owner: [
    { label: "Ver ingresos", allowed: true },
    { label: "Revisar liquidaciones", allowed: true },
    { label: "Aprobar pagos", allowed: true },
    { label: "Gestionar catálogo", allowed: true },
    { label: "Cambiar permisos", allowed: true },
  ],
  finance: [
    { label: "Ver ingresos", allowed: true },
    { label: "Revisar liquidaciones", allowed: true },
    { label: "Aprobar pagos", allowed: true },
    { label: "Gestionar catálogo", allowed: false },
    { label: "Cambiar permisos", allowed: false },
  ],
  operations: [
    { label: "Ver ingresos", allowed: false },
    { label: "Revisar liquidaciones", allowed: false },
    { label: "Aprobar pagos", allowed: false },
    { label: "Gestionar catálogo", allowed: true },
    { label: "Cambiar permisos", allowed: false },
  ],
  support: [
    { label: "Ver ingresos", allowed: false },
    { label: "Revisar liquidaciones", allowed: false },
    { label: "Aprobar pagos", allowed: false },
    { label: "Gestionar catálogo", allowed: false },
    { label: "Cambiar permisos", allowed: false },
  ],
};

export function canAccess(role: AdminRole, section: Section): boolean {
  return ACCESS[role].includes(section);
}

/** Soporte solo lee pedidos; owner y operaciones los gestionan. */
export function canManageOrders(role: AdminRole): boolean {
  return role === "owner" || role === "operations";
}
export function canManageMerchants(role: AdminRole): boolean {
  return role === "owner" || role === "operations";
}
export function canEditCommission(role: AdminRole): boolean {
  return role === "owner" || role === "finance";
}
export function canManageFinance(role: AdminRole): boolean {
  return role === "owner" || role === "finance";
}
export function canManageSupport(role: AdminRole): boolean {
  return role === "owner" || role === "operations" || role === "support";
}

export function sectionFromPath(pathname: string): Section {
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  switch (seg) {
    case "":
      return "panorama";
    case "pedidos":
    case "comercios":
    case "repartidores":
    case "finanzas":
    case "soporte":
    case "reportes":
    case "equipo":
    case "configuracion":
    case "buscar":
      return seg;
    default:
      return "panorama";
  }
}
