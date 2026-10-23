import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP } from "@yava/shared";
import { Text, Badge, Stepper } from "@/components/ui";
import type { ProductRow as ProductRowData } from "@/features/customer/types";

export function isProductAvailable(p: Pick<ProductRowData, "status" | "track_stock" | "stock">): boolean {
  if (p.status !== "published") return false;
  if (p.track_stock && (p.stock ?? 0) <= 0) return false;
  return true;
}

/**
 * Fila de producto. `qty`/`onQty` activan el stepper inline (Mercado/Farmacia);
 * si no, se muestra el botón "+" y toda la fila navega al detalle.
 */
export function ProductRow({ p, onPress, onAdd, qty, onQty, disabled }: {
  p: ProductRowData; onPress: () => void; onAdd?: () => void; qty?: number; onQty?: (q: number) => void; disabled?: boolean;
}) {
  const available = isProductAvailable(p) && !disabled;
  const inline = typeof qty === "number" && onQty;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text variant="bodyStrong" numberOfLines={2} style={!available && { color: colors.gray400 }}>{p.name}</Text>
        {p.description ? <Text variant="caption" tone="muted" numberOfLines={2} style={{ marginTop: 2 }}>{p.description}</Text> : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          <Text variant="bodyStrong" tone={available ? "default" : "muted"}>{formatCOP(p.price)}</Text>
          {!available ? <Badge label={p.status === "paused" ? "Pausado" : "Agotado"} tone="gray" /> : null}
        </View>
      </View>
      <View>
        <Image source={{ uri: p.image_urls[0] }} style={[styles.img, !available && { opacity: 0.5 }]} contentFit="cover" transition={150} />
        {available ? (
          inline && qty > 0 ? (
            <View style={styles.stepperWrap}><Stepper value={qty} onChange={onQty} size="sm" /></View>
          ) : (
            <Pressable onPress={onAdd ?? onPress} hitSlop={8} style={styles.addBtn}>
              <Ionicons name="add" size={18} color={colors.white} />
            </Pressable>
          )
        ) : null}
      </View>
    </Pressable>
  );
}

/** Tarjeta cuadrada para grillas ("Lo esencial", "Te puede gustar"). */
export function ProductTile({ p, onPress, onAdd, width = 140, merchantName }: { p: ProductRowData; onPress: () => void; onAdd?: () => void; width?: number; merchantName?: string }) {
  const available = isProductAvailable(p);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, { width, opacity: pressed ? 0.9 : 1 }]}>
      <View>
        <Image source={{ uri: p.image_urls[0] }} style={[styles.tileImg, { width: width - 2, height: width - 2 }, !available && { opacity: 0.5 }]} contentFit="cover" transition={150} />
        {available && onAdd ? (
          <Pressable onPress={onAdd} hitSlop={8} style={[styles.addBtn, { bottom: 6, right: 6 }]}><Ionicons name="add" size={18} color={colors.white} /></Pressable>
        ) : null}
      </View>
      <View style={{ padding: 10 }}>
        <Text variant="caption" style={{ fontWeight: "600" }} numberOfLines={2}>{p.name}</Text>
        {merchantName ? <Text variant="small" tone="muted" numberOfLines={1}>{merchantName}</Text> : null}
        <Text variant="bodyStrong" style={{ marginTop: 2 }}>{formatCOP(p.price)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  img: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.gray100 },
  addBtn: { position: "absolute", bottom: -6, right: -6, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white },
  stepperWrap: { position: "absolute", bottom: -8, right: -4, backgroundColor: colors.white, borderRadius: 999 },
  tile: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray200, overflow: "hidden", marginRight: 12 },
  tileImg: { backgroundColor: colors.gray100 },
});
