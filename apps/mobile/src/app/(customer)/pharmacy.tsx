import React from "react";
import { StoreCategoryScreen } from "@/components/customer/screens/StoreCategoryScreen";
/** Pantalla 29 · Farmacia. */
export default function Pharmacy() {
  return <StoreCategoryScreen category="pharmacy" title="Salud y bienestar" subtitle="Medicamentos de venta libre y cuidado personal." notice="Medicamentos de venta libre. Para fórmula médica, contacta directamente a la farmacia." searchPlaceholder="Busca medicamentos o farmacias" chips={["Dolor y fiebre", "Gripa", "Vitaminas", "Cuidado personal", "Bebés"]} />;
}
