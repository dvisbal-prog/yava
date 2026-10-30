import React, { useEffect, useRef, useState } from "react";
import {
  View, Pressable, ScrollView, StyleSheet, AppState, AccessibilityInfo, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { useIsFocused } from "expo-router";
import { colors, spacing } from "@yava/shared";
import { Text } from "@/components/ui";
import { sponsoredFlyer, FLYER_ASPECT } from "@/lib/promo-flyers";
import type { PromotionRow } from "@/features/customer/types";
import { PageDots } from "./PageDots";

/** Tiempo que se muestra cada flyer antes de pasar al siguiente. */
const ADVANCE_MS = 4500;
const RADIUS = 16;

/** Una pauta: el flyer a lo ancho (10:9) con la etiqueta "Patrocinado"; sin imagen, una tarjeta azul con el texto. */
function FlyerCard({ promo, width, height, onPress }: { promo: PromotionRow; width: number; height: number; onPress: () => void }) {
  const img = sponsoredFlyer(promo);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Patrocinado. ${promo.title}. ${promo.subtitle ?? ""}`}
      accessibilityHint="Abre el restaurante"
      style={({ pressed }) => [styles.card, { width, height, opacity: pressed ? 0.94 : 1 }]}>
      {img ? (
        <Image source={img} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.fallback}>
          <Text variant="h3" tone="navy" numberOfLines={2}>{promo.title}</Text>
          {promo.subtitle ? <Text variant="bodyS" tone="navy" numberOfLines={3} style={{ marginTop: 6 }}>{promo.subtitle}</Text> : null}
          {promo.coupon_code ? <View style={styles.code}><Text style={styles.codeText}>{promo.coupon_code}</Text></View> : null}
        </View>
      )}
      <View style={styles.tag} pointerEvents="none">
        <Text style={styles.tagText}>Patrocinado</Text>
      </View>
    </Pressable>
  );
}

/**
 * Carrusel "Promociones" del Inicio (pautas pagadas por los restaurantes): un flyer por página, a lo ancho con el
 * margen del banner. Pasa solo cada 4,5 s y vuelve al primero sin saltar hacia atrás (una copia del primero al
 * final); se detiene mientras el cliente arrastra, cuando la pantalla no está enfocada, con el app en segundo
 * plano, con "Reducir movimiento" o con el lector de pantalla activo (WCAG 2.2.2: nada se mueve solo mientras se
 * lee). Debajo, la píldora de puntos.
 */
export function SponsoredCarousel({ items, onPress }: { items: PromotionRow[]; onPress: (p: PromotionRow) => void }) {
  const { width } = useWindowDimensions();
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const pos = useRef(0);
  const [page, setPage] = useState(0);
  const [touching, setTouching] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState !== "background");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const focused = useIsFocused();
  const n = items.length;
  const loop = n > 1;
  const cardW = width - spacing.gutter * 2;
  const cardH = Math.round(cardW / FLYER_ASPECT);
  const pages = loop ? [...items, items[0]] : items;

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (alive) setReduceMotion(v); }).catch(() => undefined);
    AccessibilityInfo.isScreenReaderEnabled().then((v) => { if (alive) setScreenReader(v); }).catch(() => undefined);
    const a11y = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    const reader = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReader);
    const app = AppState.addEventListener("change", (s) => setAppActive(s === "active"));
    return () => { alive = false; a11y.remove(); reader.remove(); app.remove(); };
  }, []);

  // Si cambia la lista (otra pauta, recarga) se vuelve al primero.
  const ids = items.map((p) => p.id).join(",");
  useEffect(() => {
    pos.current = 0;
    setPage(0);
    ref.current?.scrollTo({ x: 0, animated: false });
  }, [ids]);

  const running = loop && focused && appActive && !touching && !reduceMotion && !screenReader;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => ref.current?.scrollTo({ x: (pos.current + 1) * width, animated: true }), ADVANCE_MS);
    return () => clearTimeout(t);
  }, [running, page, width]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    // Llegó a la copia del primero: salto sin animación al primero real.
    if (loop && x >= n * width - 1) {
      ref.current?.scrollTo({ x: 0, animated: false });
      pos.current = 0;
      setPage(0);
      return;
    }
    const raw = Math.round(x / width);
    pos.current = raw;
    const real = n ? raw % n : 0;
    setPage((cur) => (cur === real ? cur : real));
  };

  if (!n) return null;
  return (
    <View accessibilityLabel="Promociones patrocinadas">
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled={loop}
        onScroll={onScroll} scrollEventThrottle={16}
        onScrollBeginDrag={() => setTouching(true)} onScrollEndDrag={() => setTouching(false)}
        onTouchStart={() => setTouching(true)} onTouchEnd={() => setTouching(false)} onTouchCancel={() => setTouching(false)}>
        {pages.map((p, i) => (
          <View key={`${p.id}-${i}`} style={{ width, paddingHorizontal: spacing.gutter }}
            accessibilityElementsHidden={i >= n} importantForAccessibility={i >= n ? "no-hide-descendants" : "auto"}>
            <FlyerCard promo={p} width={cardW} height={cardH} onPress={() => onPress(p)} />
          </View>
        ))}
      </ScrollView>
      <PageDots count={n} index={page} style={{ marginTop: 9 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS, overflow: "hidden", backgroundColor: colors.surfaceGray },
  fallback: { flex: 1, backgroundColor: colors.blueSoft, padding: 22, justifyContent: "center" },
  code: { alignSelf: "flex-start", backgroundColor: colors.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 12 },
  codeText: { fontSize: 12, lineHeight: 16, fontWeight: "700", color: colors.blueNavy },
  tag: { position: "absolute", top: 9, right: 9, height: 18, borderRadius: 9, paddingHorizontal: 7, justifyContent: "center", backgroundColor: "rgba(255,255,255,0.92)" },
  tagText: { fontSize: 9, lineHeight: 12, fontWeight: "600", color: colors.textSecondary, letterSpacing: 0.1 },
});
