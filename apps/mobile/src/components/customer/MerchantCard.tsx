import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP, formatRating } from "@yava/shared";
import { Text, Badge } from "@/components/ui";
import { etaLabel } from "@/features/customer/helpers";

export interface MerchantCardData {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  cover_url: string | null;
  delivery_fee: number;
  prep_min: number;
  prep_max: number;
  rating_avg: number;
  rating_count: number;
  is_open: boolean;
}

function Meta({ m, compact }: { m: MerchantCardData; compact?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: compact ? 6 : 10, marginTop: 4 }}>
      <View style={styles.meta}><Ionicons name="star" size={12} color={colors.yellow} /><Text variant="caption" style={{ marginLeft: 3, fontWeight: "600" }}>{formatRating(Number(m.rating_avg))}</Text></View>
      <View style={styles.meta}><Ionicons name="time-outline" size={12} color={colors.gray500} /><Text variant="caption" tone="muted" style={{ marginLeft: 3 }}>{etaLabel(m.prep_min, m.prep_max)}</Text></View>
      <View style={styles.meta}><Ionicons name="bicycle-outline" size={13} color={colors.gray500} /><Text variant="caption" tone="muted" style={{ marginLeft: 3 }}>{m.delivery_fee > 0 ? `Envío ${formatCOP(m.delivery_fee)}` : "Envío gratis"}</Text></View>
    </View>
  );
}

/** Tarjeta ancha para carruseles horizontales (Inicio). */
export function MerchantCardWide({ m, onPress, width = 240 }: { m: MerchantCardData; onPress: () => void; width?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wide, { width, opacity: pressed ? 0.9 : 1 }]}>
      <View>
        <Image source={{ uri: m.cover_url ?? m.logo_url ?? undefined }} style={[styles.cover, !m.is_open && { opacity: 0.6 }]} contentFit="cover" transition={150} />
        {!m.is_open ? <View style={styles.closedTag}><Badge label="Cerrado" tone="gray" /></View> : null}
        <View style={styles.logoWrap}>
          <Image source={{ uri: m.logo_url ?? undefined }} style={styles.logo} contentFit="cover" />
        </View>
      </View>
      <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 }}>
        <Text variant="bodyStrong" numberOfLines={1}>{m.name}</Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>{m.tagline ?? ""}</Text>
        <Meta m={m} compact />
      </View>
    </Pressable>
  );
}

/** Fila para listas verticales (Restaurantes, Favoritos, Mercado). */
export function MerchantRow({ m, onPress, right }: { m: MerchantCardData; onPress: () => void; right?: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}>
      <View>
        <Image source={{ uri: m.logo_url ?? m.cover_url ?? undefined }} style={[styles.rowImg, !m.is_open && { opacity: 0.5 }]} contentFit="cover" transition={150} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>{m.name}</Text>
          {!m.is_open ? <Badge label="Cerrado" tone="gray" /> : null}
          {right}
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>{m.tagline ?? ""}</Text>
        <Meta m={m} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wide: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray200, overflow: "hidden", marginRight: 12 },
  cover: { width: "100%", height: 120, backgroundColor: colors.gray100 },
  closedTag: { position: "absolute", top: 8, left: 8 },
  logoWrap: { position: "absolute", bottom: -14, left: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, padding: 2, borderWidth: 1, borderColor: colors.gray200 },
  logo: { width: "100%", height: "100%", borderRadius: 18, backgroundColor: colors.gray100 },
  meta: { flexDirection: "row", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  rowImg: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.gray100 },
});
