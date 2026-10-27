import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { colors } from "@yava/shared";
import { ProductWizard } from "@/components/merchant/wizard/ProductWizard";
import { useProductDraft } from "@/features/merchant/productDraft";
import { useMyMerchant } from "@/features/merchant/useMerchant";

/**
 * Pantallas 73–80 · Nuevo producto (asistente por pasos).
 * Cada vez que se abre (pantalla nueva en la pila) arranca de cero: reset(merchant.id).
 */
export default function NewProduct() {
  const { data: merchant } = useMyMerchant();
  const reset = useProductDraft((s) => s.reset);
  const merchantId = merchant?.id;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (merchantId && !ready) { reset(merchantId); setReady(true); }
  }, [merchantId, ready, reset]);
  if (!merchant || !ready) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}><ActivityIndicator color={colors.blue} /></View>;
  return <ProductWizard merchantName={merchant.name} />;
}
