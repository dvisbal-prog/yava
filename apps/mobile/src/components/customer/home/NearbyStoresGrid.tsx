import React, { useState } from "react";
import { View, Pressable, ScrollView, StyleSheet, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@yava/shared";
import { Text } from "@/components/ui";
import { etaText } from "@/components/customer/MerchantCard";
import type { NearbyMerchant } from "@/features/customer/types";
import { StoreLogoTile } from "./StoreLogoTile";
import { PageDots } from "./PageDots";

const COLS = 3;
const PER_PAGE = 6;
const COL_GAP = 10.5;
const ROW_GAP = 13;
/** Proporción ancho/alto de la baldosa de marca. */
const TILE_ASPECT = 1.6;

/** Título de sección con botón redondo "›" a la derecha (Inicio "Tiendas cerca de ti"). */
export function RoundChevronHeader({ title, onPress, accessibilityLabel }: { title: string; onPress?: () => void; accessibilityLabel?: string }) {
  return (
    <View style={styles.header}>
      <Text variant="section" numberOfLines={1} style={{ flexShrink: 1 }}>{title}</Text>
      {onPress ? (
        <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? `Ver ${title.toLowerCase()}`}
          style={({ pressed }) => [styles.chevron, pressed && { opacity: 0.75 }]}>
          <Ionicons name="chevron-forward" size={16} color={colors.ink} style={{ marginLeft: 1 }} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * "Tiendas cerca de ti" del Inicio: cuadrícula de 3 columnas × 2 filas por página con las tiendas de mercado
 * cercanas (orden de `nearby_merchants`): baldosa de marca 1,6:1, nombre y "⏱ 25–35 min". Con más de 6 tiendas
 * se pasa de página deslizando y aparecen los puntos.
 */
export function NearbyStoresGrid({ stores, onStore }: { stores: NearbyMerchant[]; onStore: (m: NearbyMerchant) => void }) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const inner = width - spacing.gutter * 2;
  const colW = (inner - COL_GAP * (COLS - 1)) / COLS;
  const tileH = Math.round(colW / TILE_ASPECT);
  const pages: NearbyMerchant[][] = [];
  for (let i = 0; i < stores.length; i += PER_PAGE) pages.push(stores.slice(i, i + PER_PAGE));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };

  return (
    <View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled={pages.length > 1}
        onScroll={onScroll} scrollEventThrottle={32}>
        {pages.map((list, pi) => (
          <View key={pi} style={[styles.page, { width }]}>
            {list.map((m) => {
              const eta = m.is_open ? etaText(m.prep_min, m.prep_max) : "Cerrado";
              return (
                <Pressable key={m.id} onPress={() => onStore(m)} accessibilityRole="button" accessibilityLabel={`${m.name}, ${eta}`}
                  style={({ pressed }) => [{ width: colW, opacity: pressed ? 0.85 : 1 }]}>
                  <StoreLogoTile m={m} width={colW} height={tileH} dimmed={!m.is_open} />
                  <Text numberOfLines={1} style={styles.name}>{m.name}</Text>
                  <View style={styles.meta}>
                    <Ionicons name="time-outline" size={11.5} color={colors.textTertiary} />
                    <Text numberOfLines={1} style={styles.metaText}>{eta}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
      {pages.length > 1 ? <PageDots count={pages.length} index={page} style={{ marginTop: 10 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9.2 },
  chevron: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceGray, alignItems: "center", justifyContent: "center" },
  page: { flexDirection: "row", flexWrap: "wrap", columnGap: COL_GAP, rowGap: ROW_GAP, paddingHorizontal: spacing.gutter, alignContent: "flex-start" },
  name: { fontSize: 11.5, lineHeight: 15, fontWeight: "600", color: colors.ink, textAlign: "center", marginTop: 5 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 1.5, gap: 3.5 },
  metaText: { fontSize: 9.7, lineHeight: 13, color: colors.textTertiary, flexShrink: 1 },
});
