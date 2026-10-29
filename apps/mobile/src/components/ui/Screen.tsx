import React, { createContext, useContext } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView, Edge, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, shadows, spacing } from "@yava/shared";

/**
 * Espacio extra al final de cada `Screen` (lo provee `(customer)/(tabs)/_layout.tsx` con el alto de la
 * barra de pestañas flotante, para que el contenido no quede tapado). Fuera de las pestañas vale 0.
 */
export const ScreenBottomInset = createContext(0);

/**
 * Contenedor de pantalla: fondo blanco, margen lateral de 18 pt (`padded`), scroll y pie fijo opcional.
 * El `footer` es la barra inferior del diseño (C16): blanca, sin borde, con sombra hacia arriba.
 * `footerStyle="plain"` deja el pie sin fondo ni sombra (C16c: CTA a lo ancho sobre el contenido).
 */
export function Screen({ children, scroll = true, padded = true, edges = ["top"], footer, refreshing, onRefresh, bg = colors.white, contentStyle, footerStyle = "bar", bottomSpace = 24 }: {
  children: React.ReactNode; scroll?: boolean; padded?: boolean; edges?: Edge[]; footer?: React.ReactNode;
  refreshing?: boolean; onRefresh?: () => void; bg?: string; contentStyle?: StyleProp<ViewStyle>;
  footerStyle?: "bar" | "plain";
  /** Espacio extra al final del scroll (p. ej. 110 cuando hay barra de pestañas flotante). */
  bottomSpace?: number;
}) {
  const insets = useSafeAreaInsets();
  const extraBottom = useContext(ScreenBottomInset);
  const bottomPad = edges.includes("bottom") ? 12 : Math.max(insets.bottom, 14);
  const inner = scroll ? (
    <ScrollView contentContainerStyle={[padded && styles.pad, { paddingBottom: bottomSpace + extraBottom }, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.blue} /> : undefined}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingBottom: extraBottom }, padded && styles.pad, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {inner}
        {footer ? <View style={[footerStyle === "bar" ? styles.footerBar : styles.footerPlain, { paddingBottom: bottomPad }]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  pad: { paddingHorizontal: spacing.gutter },
  footerBar: { paddingHorizontal: spacing.gutter, paddingTop: 14, backgroundColor: colors.white, ...shadows.bar },
  footerPlain: { paddingHorizontal: spacing.gutter, paddingTop: 10 },
});
