import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { designImages } from "@/lib/design-images";
import { NavBar, PillButton } from "./parts";

/** Botón secundario blanco con borde gris y texto azul (C15e). */
function OutlineButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.outline, pressed && { backgroundColor: colors.surfaceSoft }]}>
      <Text style={styles.outlineText}>{title}</Text>
    </Pressable>
  );
}

/**
 * Dirección fuera de cobertura en "Finalizar pedido" (aviso con el lenguaje de 46): pin tachado en círculo gris,
 * título, texto, "Cambiar dirección" (lleva al selector de ubicación) y "Volver al inicio".
 */
export function OutOfCoverage({ address, onChange, onHome, onNotify }: { address?: string | null; onChange: () => void; onHome: () => void; onNotify?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar variant="circle" title="Finalizar pedido" titleX={57.2} titleTop={14.1} backSize={31} backTop={10.2} height={50} />
      <View style={styles.center}>
        <Image source={designImages.sinCobertura} style={{ width: 58, height: 56 }} contentFit="contain" />
        <Text style={styles.title} accessibilityRole="header">Aún no llegamos a esta zona</Text>
        <Text style={styles.body}>{address ? `${address} está fuera de nuestra cobertura. ` : ""}Prueba con otra dirección en Puerto Colombia o Barranquilla.</Text>
        <PillButton title="Cambiar dirección" onPress={onChange} height={44} radius={12} style={{ alignSelf: "stretch", marginTop: 22 }} />
        <View style={{ height: 10 }} />
        <OutlineButton title="Volver al inicio" onPress={onHome} />
        {onNotify ? (
          <Pressable onPress={onNotify} hitSlop={8} accessibilityRole="button" style={{ marginTop: 16 }}>
            <Text style={styles.link}>Avísame cuando lleguen</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Sin sesión: invita a iniciar sesión antes de pagar. */
export function LoginRequired({ onLogin }: { onLogin: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar variant="circle" title="Finalizar pedido" titleX={57.2} titleTop={14.1} backSize={31} backTop={10.2} height={50} />
      <View style={styles.center}>
        <View style={styles.disc}><Ionicons name="lock-closed" size={26} color={colors.blue} /></View>
        <Text style={styles.title} accessibilityRole="header">Inicia sesión para pedir</Text>
        <Text style={styles.body}>Guarda tu dirección y sigue tu pedido en tiempo real.</Text>
        <PillButton title="Iniciar sesión" onPress={onLogin} height={50} radius={14} style={{ alignSelf: "stretch", marginTop: 22 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 80 },
  disc: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 19, lineHeight: 24, fontWeight: "700", color: colors.ink, textAlign: "center", marginTop: 18, letterSpacing: -0.3 },
  body: { fontSize: 13.6, lineHeight: 19, color: colors.textTertiary, textAlign: "center", marginTop: 6, maxWidth: 300 },
  outline: { alignSelf: "stretch", height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.gray300, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  outlineText: { fontSize: 15, lineHeight: 20, fontWeight: "600", color: colors.blueText },
  link: { fontSize: 13.5, lineHeight: 18, fontWeight: "600", color: colors.blueLink },
});
