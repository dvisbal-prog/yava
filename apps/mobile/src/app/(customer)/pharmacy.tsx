import React from "react";
import { StoreCategoryScreen } from "@/components/customer/screens/StoreCategoryScreen";
import { designImages } from "@/lib/design-images";

/** Pantalla 29 · Farmacia (tanda-04/29-farmacia.png). Las tarjetas filtran "Productos destacados" por categoría. */
export default function Pharmacy() {
  return (
    <StoreCategoryScreen
      searchPlaceholder="Busca productos de farmacia"
      notice="Medicamentos de venta libre. Para fórmula médica, contacta directamente a la farmacia."
      config={{
        category: "pharmacy",
        cards: [
          { key: "Cuidado personal", title: "Cuidado\npersonal", subtitle: "Higiene y\nbienestar", image: designImages.farmaciaCatCuidadoPersonal },
          { key: "Protección solar", title: "Protección\nsolar", subtitle: "Cuida tu piel\ntodos los días", image: designImages.farmaciaCatProteccionSolar },
          { key: "Bebés", title: "Bebés", subtitle: "Todo para\nsu cuidado", image: designImages.farmaciaCatBebes },
          { key: "Primeros auxilios", title: "Primeros\nauxilios", subtitle: "Siempre\npreparado", image: designImages.farmaciaCatPrimerosAuxilios },
        ],
      }}
    />
  );
}
