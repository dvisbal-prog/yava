import { Tabs } from "@/components/ui/tabs";

export function FinanceTabs({ active }: { active: "ingresos" | "conciliacion" | "liquidaciones" }) {
  return (
    <Tabs
      active={active}
      items={[
        { key: "ingresos", label: "Ingresos", href: "/finanzas/ingresos" },
        { key: "conciliacion", label: "Conciliación", href: "/finanzas/conciliacion" },
        { key: "liquidaciones", label: "Liquidaciones", href: "/finanzas/liquidaciones" },
      ]}
    />
  );
}
