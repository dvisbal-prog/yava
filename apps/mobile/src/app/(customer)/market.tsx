import React from "react";
import { StoreCategoryScreen } from "@/components/customer/screens/StoreCategoryScreen";
/** Pantalla 25 · Mercado. */
export default function Market() {
  return <StoreCategoryScreen category="market" title="Tu mercado, a domicilio" subtitle="Productos frescos y todo lo que necesitas." searchPlaceholder="Busca productos o tiendas" chips={["Frutas", "Verduras", "Lácteos", "Despensa", "Aseo"]} />;
}
