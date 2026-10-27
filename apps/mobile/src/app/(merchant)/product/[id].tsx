import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors } from "@yava/shared";
import { Screen, Header } from "@/components/ui";
import { ErrorState } from "@/components/merchant/Rows";
import { ProductWizard } from "@/components/merchant/wizard/ProductWizard";
import { useProductDraft } from "@/features/merchant/productDraft";
import { useMyMerchant, useProduct } from "@/features/merchant/useMerchant";
import { errorMessage } from "@/lib/errors";

/**
 * Pantalla 55 · Editar producto (mismo formulario, precargado).
 * Cada vez que se abre carga el producto en el borrador (loadFromProduct, modo edición con su id),
 * así nunca hereda el estado de otro producto ni crea uno duplicado.
 */
export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: merchant } = useMyMerchant();
  const q = useProduct(id);
  const load = useProductDraft((s) => s.loadFromProduct);
  const [loaded, setLoaded] = useState<string | null>(null);
  useEffect(() => {
    // Espera a que termine una recarga en curso para no editar sobre datos viejos de la caché.
    if (q.data && !q.isFetching && loaded !== q.data.product.id) { load(q.data); setLoaded(q.data.product.id); }
  }, [q.data, q.isFetching, loaded, load]);

  if (q.isError && loaded == null) return <Screen><Header title="Editar producto" /><ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /></Screen>;
  if (!q.data || !merchant || loaded !== q.data.product.id) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}><ActivityIndicator color={colors.blue} /></View>;
  return <ProductWizard merchantName={merchant.name} />;
}
