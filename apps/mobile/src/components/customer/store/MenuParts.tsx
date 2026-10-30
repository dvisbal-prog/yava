import React, { useEffect, useRef, useState } from "react";
import { View, Pressable, ScrollView, StyleSheet, StyleProp, ViewStyle, Platform } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP } from "@yava/shared";
import { Text } from "@/components/ui";
import { AddButton } from "@/components/customer/AddButton";
import type { DesignImageSource } from "@/lib/design-images";
import { PillStepper } from "./PillStepper";
import { DEAL_YELLOW, DealBadge, BeforePrice, discountPct, dealLabel } from "./Deal";

/** En web un `<button>` no puede contener otro: las tarjetas con "+" adentro solo se anuncian como botón en nativo. */
const CARD_ROLE = Platform.OS === "web" ? undefined : ("button" as const);

/* ───────────────────────── C26 · Franja de info en 3 columnas (12) ───────────────────────── */

export interface InfoItem { label: string; icon: React.ReactNode; value: React.ReactNode; /** Ancho relativo de la columna (12: 123 · 111 · 121). */ flex?: number }

/** Franja blanca con borde y 3 columnas separadas por líneas verticales: "Entrega en ⏱ / 25–35 min" (12). */
export function InfoStrip({ items, style }: { items: InfoItem[]; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.strip, style]}>
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i > 0 ? <View style={styles.stripSep} /> : null}
          <View style={[styles.stripCol, it.flex ? { flex: it.flex } : null]}>
            <View style={styles.stripLabelRow}>
              <Text style={styles.stripLabel}>{it.label}</Text>
              <View style={{ marginLeft: 6.5 }}>{it.icon}</View>
            </View>
            <Text style={styles.stripValue} numberOfLines={1}>{it.value}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

/* ───────────────────────── C27 · Pestañas subrayadas (12) ───────────────────────── */

export interface TabItem { key: string; label: string }

/** Pestañas con subrayado azul del ancho del texto y línea base gris a todo el ancho (12). Scroll horizontal. */
export function UnderlineTabs({ tabs, value, onChange, style }: { tabs: TabItem[]; value: string; onChange: (k: string) => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.tabsWrap, style]}>
      <View style={styles.tabsBase} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {tabs.map((t) => {
          const active = t.key === value;
          return (
            <Pressable key={t.key} onPress={() => onChange(t.key)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={styles.tab} hitSlop={{ top: 8, bottom: 4 }}>
              <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>{t.label}</Text>
              {active ? <View style={styles.tabLine} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ───────────────────────── C12a · Tarjeta del grid del menú (12) ───────────────────────── */

/** Foto 115,5 pt radio 12 con "+" 27,5 pt arriba-derecha; nombre, descripción de 2 líneas y precio (12). */
export function MenuGridCard({ name, description, price, image, onPress, onAdd, disabled, soldOutLabel, width }: {
  name: string; description?: string | null; price: number; image?: DesignImageSource; onPress: () => void; onAdd?: () => void;
  disabled?: boolean; soldOutLabel?: string; width: number;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole={CARD_ROLE} accessibilityLabel={name} style={({ pressed }) => [{ width, opacity: pressed ? 0.9 : 1 }]}>
      <View>
        <Image source={image} style={[styles.gridPhoto, soldOutLabel ? { opacity: 0.5 } : null]} contentFit="cover" transition={150} />
        {soldOutLabel ? (
          <View style={styles.gridSoldOut}><Text style={styles.gridSoldOutText}>{soldOutLabel}</Text></View>
        ) : (
          <AddButton size={27.5} onPhoto disabled={disabled} onPress={onAdd} style={styles.gridAdd} accessibilityLabel={`Agregar ${name}`} />
        )}
      </View>
      <View style={{ paddingHorizontal: 2.6 }}>
        <Text style={styles.gridName} numberOfLines={1}>{name}</Text>
        {description ? <Text style={styles.gridDesc} numberOfLines={2}>{description}</Text> : null}
        <Text style={[styles.gridPrice, (disabled || soldOutLabel) ? { color: colors.textTertiary } : null]}>{formatCOP(price)}</Text>
      </View>
    </Pressable>
  );
}

/* ───────────────────────── C10f · Barra segmentada de categorías (26) ───────────────────────── */

/**
 * Barra gris con el segmento activo `blueSoft` a toda la altura (26). Con hasta 4 opciones cortas el activo abraza su
 * texto y el resto se reparte el ancho; con más, o si alguna no cabe en su parte ("Cervezas y licores", "Cuidado
 * personal"), se desplaza horizontalmente y cada una muestra su nombre completo; al elegir una que no se ve entera,
 * la barra se desplaza para mostrarla.
 */
export function SegmentBar({ tabs, value, onChange, style }: { tabs: TabItem[]; value: string; onChange: (k: string) => void; style?: StyleProp<ViewStyle> }) {
  const fit = tabs.length <= 4 && tabs.every((t) => t.label.length <= 12);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const pos = useRef<Record<string, { x: number; w: number }>>({});
  const [barW, setBarW] = useState(0);
  const scrollX = useRef(0);
  useEffect(() => {
    const p = pos.current[value];
    if (fit || !p || !barW) return;
    const start = scrollX.current;
    if (p.x >= start && p.x + p.w <= start + barW) return; // ya se ve entero
    // Cortado a la derecha: se alinea su borde derecho (con aire); a la izquierda, su borde izquierdo. El
    // ScrollView no pasa del final del contenido.
    const x = p.x + p.w > start + barW ? p.x + p.w - barW + 12 : p.x - 12;
    scrollRef.current?.scrollTo({ x: Math.max(0, x), animated: true });
  }, [value, fit, barW]);
  const items = tabs.map((t) => {
    const active = t.key === value;
    return (
      <Pressable key={t.key} onPress={() => onChange(t.key)} accessibilityRole="tab" accessibilityState={{ selected: active }}
        onLayout={fit ? undefined : (e) => { pos.current[t.key] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width }; }}
        style={[styles.seg, active && styles.segActive, fit && !active ? { flex: 1, paddingHorizontal: 4 } : null]}>
        <Text style={[styles.segText, active && styles.segTextActive]} numberOfLines={1}>{t.label}</Text>
      </Pressable>
    );
  });
  return (
    <View style={[styles.segBar, style]} onLayout={fit ? undefined : (e) => setBarW(e.nativeEvent.layout.width)}>
      {fit ? <View style={styles.segRow}>{items}</View> : (
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segRow}
          onScroll={(e) => { scrollX.current = e.nativeEvent.contentOffset.x; }} scrollEventThrottle={32}>{items}</ScrollView>
      )}
    </View>
  );
}

/* ───────────────────────── C12b · Tarjeta de producto de mercado (26) ───────────────────────── */

/**
 * Tarjeta 173,7 × 219 pt radio 14 con borde: foto 135 pt, nombre, presentación, precio y "+" 34 pt (26).
 * Con `compareAt` (precio antes del descuento) suma la insignia "-N%" sobre la foto, el precio anterior tachado junto
 * a la presentación y el resaltado amarillo del precio, como la tarjeta de licores del Inicio.
 */
export function MarketProductCard({ name, unit, price, compareAt, image, onPress, onAdd, qty, onQty, disabled, soldOutLabel, width }: {
  name: string; unit?: string | null; price: number; compareAt?: number | null; image?: DesignImageSource; onPress: () => void; onAdd?: () => void;
  qty?: number; onQty?: (q: number) => void; disabled?: boolean; soldOutLabel?: string; width: number;
}) {
  const showStepper = !disabled && !soldOutLabel && typeof qty === "number" && qty > 0 && onQty;
  const pct = soldOutLabel ? 0 : discountPct({ price, compare_at_price: compareAt });
  return (
    <Pressable onPress={onPress} accessibilityRole={CARD_ROLE} accessibilityLabel={pct ? `${name}. ${dealLabel({ price, compare_at_price: compareAt })}` : name}
      style={({ pressed }) => [styles.mkCard, { width, opacity: pressed ? 0.92 : 1 }]}>
      <Image source={image} style={[styles.mkPhoto, soldOutLabel ? { opacity: 0.5 } : null]} contentFit="cover" transition={150} />
      {pct ? <DealBadge pct={pct} style={styles.mkBadge} /> : null}
      <View style={styles.mkBody}>
        <Text style={styles.mkName} numberOfLines={1}>{name}</Text>
        {pct && compareAt ? (
          <View style={styles.mkUnitRow}>
            {unit ? <Text style={[styles.mkUnit, styles.mkUnitShrink]} numberOfLines={1}>{unit}</Text> : null}
            <BeforePrice value={compareAt} style={[styles.mkBefore, unit ? { marginLeft: 6 } : null]} />
          </View>
        ) : (
          <Text style={styles.mkUnit} numberOfLines={1}>{soldOutLabel ?? unit ?? " "}</Text>
        )}
        <View style={[styles.mkPriceWrap, showStepper ? { marginRight: 92 } : { marginRight: 40 }, pct ? styles.mkPriceDeal : null]}>
          <Text style={[styles.mkPrice, (disabled || soldOutLabel) ? { color: colors.textTertiary } : null]} numberOfLines={1}>{formatCOP(price)}</Text>
        </View>
      </View>
      {soldOutLabel ? null : showStepper ? (
        <PillStepper value={qty} onChange={onQty} style={styles.mkAction} />
      ) : (
        <AddButton size={34} disabled={disabled} onPress={onAdd} accessibilityLabel={`Agregar ${name}`} style={styles.mkAction} />
      )}
    </Pressable>
  );
}

/* ───────────────────────── 43 · Restaurante cerrado ───────────────────────── */

/** Tarjeta de 2 columnas del "Menú destacado" (43): foto 135,5 pt, nombre, precio y "+" 30 pt deshabilitado. */
export function ClosedMenuCard({ name, price, image, onPress, width = 169 }: { name: string; price: number; image?: DesignImageSource; onPress: () => void; width?: number }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={CARD_ROLE} accessibilityLabel={name} style={({ pressed }) => [styles.clCard, { width, opacity: pressed ? 0.92 : 1 }]}>
      <Image source={image} style={styles.clPhoto} contentFit="cover" transition={150} />
      <View style={styles.clBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.clName} numberOfLines={1}>{name}</Text>
          <Text style={styles.clPrice}>{formatCOP(price)}</Text>
        </View>
        <AddButton size={30} disabled accessibilityLabel="Restaurante cerrado" />
      </View>
    </Pressable>
  );
}

/** Dato de la fila "★ 4,8 (320+) • 25–35 min • $3.000" con su etiqueta gris debajo (43). `strong`: valor grande en negrita ("4,8"). */
export function StatCell({ value, extra, label, icon, strong }: { value: string; extra?: string; label: string; icon?: React.ReactNode; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {icon ? <View style={{ marginRight: 7.5, marginTop: 1.3 }}>{icon}</View> : null}
      <View>
        <Text style={styles.statValue}>
          {strong ? <Text style={styles.statStrong}>{value}</Text> : value}
          {extra ? <Text style={styles.statExtra}>{`  ${extra}`}</Text> : null}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

/** Aviso "⏱ Abre hoy a las 12:00 / Puedes ver el menú…" con el reloj en círculo gris 45 pt (43). */
export function ClosedNotice({ title, body, style }: { title: string; body: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.notice, style]}>
      <View style={styles.noticeCircle}><Ionicons name="time-outline" size={26} color="#2E3646" /></View>
      <View style={{ flex: 1, marginLeft: 11.8 }}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // C26
  strip: { flexDirection: "row", alignItems: "center", height: 62.8, borderRadius: radius.r16, borderWidth: 1, borderColor: "#E9ECF2", backgroundColor: colors.white },
  stripCol: { flex: 1, alignItems: "center" },
  stripSep: { width: 1, height: 32, backgroundColor: "#E6E9EF" },
  stripLabelRow: { flexDirection: "row", alignItems: "center", height: 17 },
  stripLabel: { fontSize: 11.7, lineHeight: 17, color: colors.textTertiary },
  stripValue: { fontSize: 13.3, lineHeight: 20, fontWeight: "500", color: colors.ink, marginTop: 2.5 },

  // C27
  tabsWrap: { backgroundColor: colors.white, paddingBottom: 1 },
  tabsBase: { position: "absolute", left: 13.4, right: 13.4, bottom: 0, height: 1, backgroundColor: "#E8ECF2" },
  tabsRow: { paddingHorizontal: 13.2, gap: 15.4 },
  tab: { paddingHorizontal: 4.2, paddingTop: 8, height: 35.6, justifyContent: "flex-start" },
  tabText: { fontSize: 14.3, lineHeight: 21, color: colors.textTertiary },
  tabTextActive: { fontSize: 14.2, fontWeight: "600", color: colors.blueLink },
  tabLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: 2.4, borderRadius: 1.2, backgroundColor: "#0745CE" },

  // C12a
  gridPhoto: { width: "100%", height: 115.5, borderRadius: radius.r12, backgroundColor: colors.surfaceGray },
  gridAdd: { position: "absolute", top: 4.2, right: 4.6 },
  gridSoldOut: { position: "absolute", top: 6, right: 6, backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 9, height: 22, justifyContent: "center" },
  gridSoldOutText: { fontSize: 12, lineHeight: 15, fontWeight: "500", color: colors.ink },
  gridName: { fontSize: 13.1, lineHeight: 19, fontWeight: "600", color: colors.ink, marginTop: 4 },
  gridDesc: { fontSize: 11.3, lineHeight: 14.8, color: colors.textTertiary, marginTop: 0.3, minHeight: 29.6 },
  gridPrice: { fontSize: 13.6, lineHeight: 21, fontWeight: "700", color: colors.ink, marginTop: 2.2 },

  // C10f
  segBar: { height: 41.6, borderRadius: radius.pill, backgroundColor: "#F7F8F9", overflow: "hidden" },
  segRow: { flexDirection: "row", alignItems: "stretch", flexGrow: 1 },
  seg: { height: 41.6, paddingHorizontal: 19.9, alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
  segActive: { backgroundColor: "#E6EDFC" },
  segText: { fontSize: 12.4, lineHeight: 17, color: "#5D6679" },
  segTextActive: { fontSize: 13.5, fontWeight: "600", color: colors.blue },

  // C12b
  mkCard: { height: 219, borderRadius: radius.r14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, overflow: "hidden" },
  mkPhoto: { width: "100%", height: 135, backgroundColor: colors.surfaceGray },
  mkBody: { paddingLeft: 9.5, paddingTop: 6.9 },
  mkAction: { position: "absolute", right: 7.6, bottom: 12.4 },
  mkName: { fontSize: 14.3, lineHeight: 19, fontWeight: "600", color: colors.ink, marginRight: 8 },
  mkUnit: { fontSize: 11.7, lineHeight: 16, color: colors.textTertiary, marginTop: 0.1, marginRight: 8 },
  mkPrice: { fontSize: 16.6, lineHeight: 25, fontWeight: "700", color: colors.ink },
  mkPriceWrap: { alignSelf: "flex-start", marginTop: 5 },
  mkPriceDeal: { backgroundColor: DEAL_YELLOW, borderRadius: 5, paddingHorizontal: 5, marginLeft: -2 },
  mkUnitRow: { flexDirection: "row", alignItems: "center", marginTop: 0.1, marginRight: 8 },
  mkUnitShrink: { flexShrink: 1, marginTop: 0, marginRight: 0 },
  mkBefore: { fontSize: 11.7, lineHeight: 16, flexShrink: 0 },
  mkBadge: { position: "absolute", top: 8, left: 8 },

  // 43
  clCard: { borderRadius: radius.r14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, overflow: "hidden" },
  clPhoto: { width: "100%", height: 135.5, backgroundColor: colors.surfaceGray },
  clBody: { flexDirection: "row", alignItems: "center", paddingLeft: 8.6, paddingRight: 9.7, paddingTop: 7, paddingBottom: 11.3 },
  clName: { fontSize: 11.2, lineHeight: 15, fontWeight: "600", color: colors.ink },
  clPrice: { fontSize: 12.5, lineHeight: 17, color: "#2A3142", marginTop: 3.5 },
  statValue: { fontSize: 11.6, lineHeight: 20, color: "#2A3142" },
  statStrong: { fontSize: 14.4, fontWeight: "600", color: colors.ink },
  statExtra: { fontSize: 12.3, color: colors.textTertiary },
  statLabel: { fontSize: 10.5, lineHeight: 14, color: colors.textTertiary, marginTop: -0.6 },
  notice: { flexDirection: "row", alignItems: "center" },
  noticeCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: "#EEF1F6", alignItems: "center", justifyContent: "center" },
  noticeTitle: { fontSize: 14.4, lineHeight: 19, fontWeight: "700", color: colors.ink },
  noticeBody: { fontSize: 11.5, lineHeight: 16, color: colors.textTertiary, marginTop: 1.7 },
});
