import React from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, spacing } from "@yava/shared";
import { Text } from "@/components/ui";
import { AddButton } from "@/components/customer/AddButton";
import { etaText } from "@/components/customer/MerchantCard";
import { isProductAvailable } from "@/components/customer/ProductRow";
import { splitUnit } from "@/components/customer/store/featured";
import { productImage } from "@/lib/design-images";
import { DEAL_YELLOW, DealBadge, BeforePrice, AlcoholLegal, discountPct, dealLabel } from "@/components/customer/store/Deal";
import type { NearbyDrink } from "@/features/customer";
import { StoreMiniLogo } from "./StoreLogoTile";

const CARD_W = 128;
const PHOTO_H = 118;

/** Título "Cervezas y licores" con la insignia "+18". */
export function DrinksHeader({ title = "Cervezas y licores" }: { title?: string }) {
  return (
    <View style={styles.header}>
      <Text variant="section" numberOfLines={1} style={{ flexShrink: 1 }}>{title}</Text>
      <View style={styles.adult} accessibilityLabel="Solo mayores de 18 años"><Text style={styles.adultText}>+18</Text></View>
    </View>
  );
}

/**
 * Tarjeta de licor del Inicio: foto en caja blanca con "+" azul abajo-derecha (como "Lo esencial" de 25) e insignia
 * "-N %" si tiene precio anterior; precio (resaltado amarillo cuando hay descuento) y el anterior tachado; nombre en
 * dos líneas, presentación ("6 x 330 ml") y la ficha de la tienda (sigla · nombre · tiempo).
 */
export function DrinkCard({ item, onPress, onAdd, onStore }: { item: NearbyDrink; onPress: () => void; onAdd?: () => void; onStore: () => void }) {
  const { product: p, store } = item;
  const { name, unit } = splitUnit(p.name);
  const pct = discountPct(p);
  const available = isProductAvailable(p) && store.is_open;
  const eta = store.is_open ? etaText(store.prep_min, store.prep_max) : "Cerrado";
  const priceLabel = dealLabel(p);
  return (
    <View style={{ width: CARD_W }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${p.name}. ${priceLabel}. ${store.name}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        <View style={styles.photo}>
          <Image source={productImage(p)} style={[StyleSheet.absoluteFill, !available && { opacity: 0.5 }]} contentFit="cover" transition={120} />
          <DealBadge pct={pct} style={styles.badge} />
        </View>
        <View style={styles.priceRow}>
          <View style={pct > 0 ? styles.priceDeal : null}><Text style={styles.price}>{formatCOP(p.price)}</Text></View>
          {pct > 0 && p.compare_at_price ? <BeforePrice value={p.compare_at_price} style={styles.before} /> : null}
        </View>
        {/* Alto fijo (2 líneas de nombre + presentación) para que las fichas de tienda queden alineadas. */}
        <View style={styles.texts}>
          <Text numberOfLines={2} style={styles.name}>{name}</Text>
          {unit ? <Text numberOfLines={1} style={styles.unit}>{unit}</Text> : null}
        </View>
      </Pressable>
      <Pressable onPress={onStore} accessibilityRole="link" accessibilityLabel={`${store.name}, ${eta}`} hitSlop={4}
        style={({ pressed }) => [styles.store, pressed && { opacity: 0.7 }]}>
        <StoreMiniLogo m={store} size={22} />
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text numberOfLines={1} style={styles.storeName}>{store.name}</Text>
          <View style={styles.storeEta}>
            <Ionicons name="time-outline" size={10} color={colors.textTertiary} />
            <Text numberOfLines={1} style={styles.storeEtaText}>{eta}</Text>
          </View>
        </View>
      </Pressable>
      <AddButton size={28} onPhoto onPress={onAdd} disabled={!available || !onAdd} accessibilityLabel={`Agregar ${p.name}`} style={styles.add} />
    </View>
  );
}

/** Fila horizontal de licores + la leyenda legal obligatoria debajo. */
export function DrinksRow({ items, onOpen, onAdd, onStore }: {
  items: NearbyDrink[]; onOpen: (d: NearbyDrink) => void; onAdd: (d: NearbyDrink) => void; onStore: (d: NearbyDrink) => void;
}) {
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {items.map((d) => (
          <DrinkCard key={d.product.id} item={d} onPress={() => onOpen(d)} onAdd={() => onAdd(d)} onStore={() => onStore(d)} />
        ))}
      </ScrollView>
      <AlcoholLegal style={styles.legal} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 9.2, gap: 7 },
  adult: { height: 17, borderRadius: 8.5, paddingHorizontal: 6, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
  adultText: { fontSize: 9, lineHeight: 12, fontWeight: "700", color: colors.textSecondary },
  list: { paddingHorizontal: spacing.gutter, gap: 10, paddingTop: 2, paddingBottom: 2 },
  photo: { height: PHOTO_H, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, overflow: "hidden" },
  badge: { position: "absolute", top: 7, left: 7 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 7, gap: 5, minHeight: 19 },
  priceDeal: { backgroundColor: DEAL_YELLOW, borderRadius: 4, paddingHorizontal: 4, marginLeft: -1 },
  price: { fontSize: 13, lineHeight: 18, fontWeight: "700", color: colors.ink },
  before: { fontSize: 9.7, lineHeight: 13, flexShrink: 1 },
  texts: { height: 46, marginTop: 3 },
  name: { fontSize: 10.8, lineHeight: 14, fontWeight: "600", color: colors.ink },
  unit: { fontSize: 9.5, lineHeight: 13, color: colors.textTertiary, marginTop: 1.5 },
  store: { flexDirection: "row", alignItems: "center", marginTop: 7 },
  storeName: { fontSize: 9.6, lineHeight: 12.5, fontWeight: "600", color: colors.ink },
  storeEta: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 0.5 },
  storeEtaText: { fontSize: 8.8, lineHeight: 11.5, color: colors.textTertiary },
  add: { position: "absolute", right: 6, top: PHOTO_H - 34 },
  legal: { paddingHorizontal: spacing.gutter, marginTop: 10 },
});
