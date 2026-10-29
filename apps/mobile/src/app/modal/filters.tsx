import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { FiltersSheet } from "@/components/customer/browse/FiltersSheet";

/**
 * Pantalla 11 · Filtros como ruta (`/modal/filters`, para enlaces directos). Desde 09 Restaurantes la misma
 * hoja se abre encima de la lista (`FiltersSheetModal`); aquí se muestra sobre un velo oscuro que cierra al tocarlo.
 */
export default function Filters() {
  const router = useRouter();
  const close = () => (router.canGoBack() ? router.back() : router.replace("/(customer)/restaurants" as never));
  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="Cerrar filtros" />
      <FiltersSheet onClose={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
});
