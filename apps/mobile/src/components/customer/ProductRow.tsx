import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { colors, radius, formatCOP } from "@yava/shared";
import { Text, Badge } from "@/components/ui";
import { AddButton } from "@/components/customer/AddButton";
import { PillStepper } from "@/components/customer/store/PillStepper";
import { productImage } from "@/lib/design-images";
import type { ProductRow as ProductRowData } from "@/features/customer/types";

/** En web un `<button>` no puede contener otro: las tarjetas con "+" solo se anuncian como botón en nativo. */
const CARD_ROLE = Platform.OS === "web" ? undefined : ("button" as const);

export function isProductAvailable(p: Pick<ProductRowData, "status" | "track_stock" | "stock">): boolean {
  if (p.status !== "published") return false;
  if (p.track_stock && (p.stock ?? 0) <= 0) return false;
  return true;
}

/**
 * Fila de producto con foto a la izquierda (guía C13, pantalla 10): foto 118 × 99 pt radio 10, nombre, precio,
 * descripción de 2 líneas y "+" 32 pt a la derecha. `qty`/`onQty` cambian el "+" por un stepper (Mercado/Farmacia).
 * `disabled` = el comercio está cerrado (43): "+" gris. "Agotado"/"Pausado" solo depende del producto.
 */
export function ProductRow({ p, onPress, onAdd, qty, onQty, disabled }: {
  p: ProductRowData; onPress: () => void; onAdd?: () => void; qty?: number; onQty?: (q: number) => void; disabled?: boolean;
}) {
  const soldOut = !isProductAvailable(p);
  const canAdd = !soldOut && !disabled;
  const inline = typeof qty === "number" && onQty;
  return (
    <Pressable onPress={onPress} accessibilityRole={CARD_ROLE} accessibilityLabel={p.name} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}>
      <Image source={productImage(p, "list")} style={[styles.img, soldOut && { opacity: 0.5 }]} contentFit="cover" transition={150} />
      <View style={{ flex: 1, paddingLeft: 15, paddingRight: 8 }}>
        <Text style={[styles.name, soldOut && { color: colors.textPlaceholder }]} numberOfLines={2}>{p.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 }}>
          <Text style={[styles.price, !canAdd && { color: colors.textTertiary }]}>{formatCOP(p.price)}</Text>
          {soldOut ? <Badge label={p.status === "paused" ? "Pausado" : "Agotado"} tone="gray" /> : null}
        </View>
        {p.description ? <Text style={styles.desc} numberOfLines={2}>{p.description}</Text> : null}
      </View>
      {soldOut ? null : inline && qty > 0 && canAdd ? (
        <PillStepper value={qty} onChange={onQty} height={32} />
      ) : (
        <AddButton size={32} disabled={!canAdd} onPress={onAdd ?? onPress} accessibilityLabel={canAdd ? `Agregar ${p.name}` : "Comercio cerrado"} />
      )}
    </Pressable>
  );
}

/**
 * Tarjeta de sugerencia (guía C12e: 15 "Te puede gustar", 34, 44): foto 172,5 × 90,5 pt radio 12 con "+" outline
 * arriba-derecha; nombre, comercio (opcional) y precio debajo. `width` cambia el ancho (la foto mantiene la proporción).
 * Trae 12,9 pt de margen derecho (separación del carrusel del diseño).
 */
export function ProductTile({ p, onPress, onAdd, width = 172.5, merchantName }: { p: ProductRowData; onPress: () => void; onAdd?: () => void; width?: number; merchantName?: string }) {
  const available = isProductAvailable(p);
  return (
    <Pressable onPress={onPress} accessibilityRole={CARD_ROLE} accessibilityLabel={p.name} style={({ pressed }) => [{ width, marginRight: 12.9, opacity: pressed ? 0.9 : 1 }]}>
      <View>
        <Image source={productImage(p)} style={[styles.tileImg, { height: width * (90.5 / 172.5) }, !available && { opacity: 0.5 }]} contentFit="cover" transition={150} />
        {available && onAdd ? <AddButton size={28} variant="outline" onPress={onAdd} accessibilityLabel={`Agregar ${p.name}`} style={styles.tileAdd} /> : null}
      </View>
      <Text style={styles.tileName} numberOfLines={1}>{p.name}</Text>
      {merchantName ? <Text style={styles.tileMerchant} numberOfLines={1}>{merchantName}</Text> : null}
      <Text style={[styles.tilePrice, !available && { color: colors.textTertiary }]}>{formatCOP(p.price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  img: { width: 118, height: 99, borderRadius: radius.r10, backgroundColor: colors.surfaceGray },
  name: { fontSize: 15, lineHeight: 20, fontWeight: "600", color: colors.ink },
  price: { fontSize: 13.5, lineHeight: 18, fontWeight: "700", color: colors.ink },
  desc: { fontSize: 12, lineHeight: 16, color: colors.textTertiary, marginTop: 3 },

  tileImg: { width: "100%", borderRadius: radius.r12, backgroundColor: colors.surfaceGray },
  tileAdd: { position: "absolute", top: 4, right: 4 },
  tileName: { fontSize: 13.8, lineHeight: 18, fontWeight: "600", color: colors.ink, marginTop: 6 },
  tileMerchant: { fontSize: 12, lineHeight: 16, color: colors.textTertiary, marginTop: 1 },
  tilePrice: { fontSize: 13.8, lineHeight: 19, fontWeight: "700", color: colors.ink, marginTop: 3 },
});
