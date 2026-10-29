import React from "react";
import { View, StyleSheet, Pressable, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@yava/shared";
import { Text } from "./Text";

/** Asa gris 29 × 4 pt centrada (guía C22). */
export function SheetHandle() {
  return <View style={styles.handle} />;
}

/**
 * Hoja (guía C22): fondo blanco, radio superior 24 pt, asa y padding lateral 18.
 * Para modales de expo-router (`presentation: "transparentModal"`), envuélvela en `SheetBackdrop`.
 * `title` + `onClose` dibujan el encabezado "Filtros ✕"; `action` agrega un enlace ("Limpiar").
 */
export function Sheet({ title, onClose, action, children, style, handle = true }: {
  title?: string; onClose?: () => void; action?: { label: string; onPress: () => void }; children: React.ReactNode; style?: StyleProp<ViewStyle>; handle?: boolean;
}) {
  return (
    <View style={[styles.sheet, style]}>
      {handle ? <SheetHandle /> : null}
      {title || onClose ? (
        <View style={styles.head}>
          <Text variant="h3" style={{ flex: 1 }}>{title}</Text>
          {action ? <Pressable onPress={action.onPress} hitSlop={8} style={{ marginRight: onClose ? 16 : 0 }}><Text variant="bodyL" tone="link">{action.label}</Text></Pressable> : null}
          {onClose ? <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Cerrar"><Ionicons name="close" size={24} color={colors.ink} /></Pressable> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Velo `overlay` a pantalla completa que cierra al tocar fuera; la hoja va abajo. */
export function SheetBackdrop({ onClose, children }: { onClose?: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  handle: { alignSelf: "center", width: 29, height: 4, borderRadius: 2, backgroundColor: "#D0D2D6", marginTop: 8, marginBottom: 10 },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.r24, borderTopRightRadius: radius.r24, paddingHorizontal: spacing.gutter, paddingBottom: 16 },
  head: { flexDirection: "row", alignItems: "center", marginBottom: 16, marginTop: 4 },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
});
