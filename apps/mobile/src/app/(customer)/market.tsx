import React from "react";
import { colors } from "@yava/shared";
import { StoreCategoryScreen } from "@/components/customer/screens/StoreCategoryScreen";
import { designImages } from "@/lib/design-images";

/** Pantalla 25 · Mercado (tanda-04/25-mercado.png). Los tiles filtran "Lo esencial" por categoría. */
export default function Market() {
  return (
    <StoreCategoryScreen
      searchPlaceholder="Busca productos o tiendas"
      config={{
        category: "market",
        tiles: [
          { key: "Frutas", label: "Frutas", image: designImages.tileFrutas, flex: 82.7, bg: colors.cream },
          { key: "Verduras", label: "Verduras", image: designImages.tileVerduras, flex: 86.4, bg: colors.pastelLeaf },
          { key: "Lácteos", label: "Lácteos", image: designImages.tileLacteos, flex: 85.9, bg: colors.pastelSky },
          { key: "Despensa", label: "Despensa", image: designImages.tileDespensa, flex: 80.9, bg: colors.pastelPeach },
        ],
        banner: { title: "Tu mercado,\na domicilio", subtitle: "Productos frescos y todo\nlo que necesitas." },
      }}
    />
  );
}
