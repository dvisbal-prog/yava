import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { designImages } from "@/lib/design-images";
import { NavBar, PillButton } from "./parts";

/**
 * Pantalla 42 · Canasta vacía (tanda-06/42-canasta-vacia.png): chevron + "Tu canasta", canasta de líneas con
 * destellos (`vacio-canasta.png`), título, texto en dos líneas, "Explorar restaurantes" y "Volver al inicio".
 * También se usa como estado vacío del checkout (`title`/`backTitle` cambian el encabezado).
 */
export function EmptyCart({ onExplore, onHome, title = "Tu canasta" }: { onExplore: () => void; onHome: () => void; title?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar variant="chevron" title={title} titleX={64.2} titleTop={14.2} titleStyle={styles.navTitle} height={50} backTop={7.9} backLeft={17} backIcon={23.7} />
      <View style={styles.body}>
        <Image source={designImages.vacioCanasta} style={styles.art} contentFit="contain" accessibilityIgnoresInvertColors />
        <Text style={styles.title} accessibilityRole="header">Tu canasta está vacía</Text>
        <Text style={styles.text}>Explora los comercios y agrega{"\n"}tus favoritos.</Text>
        <PillButton title="Explorar restaurantes" onPress={onExplore} height={54} radius={20} style={styles.cta} textStyle={{ fontSize: 16.2 }} />
        <Pressable onPress={onHome} hitSlop={10} accessibilityRole="button" style={{ alignSelf: "center", marginTop: 19.4 }}>
          <Text style={styles.link}>Volver al inicio</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  navTitle: { fontSize: 18.85, lineHeight: 23, fontWeight: "600" },
  body: { paddingTop: 167.1 },
  art: { width: 113.6, height: 105.3, alignSelf: "center", transform: [{ translateX: 9 }] },
  title: { fontSize: 24.75, lineHeight: 29, fontWeight: "700", color: colors.ink, textAlign: "center", letterSpacing: -0.3, marginTop: 24.2 },
  text: { fontSize: 16.75, lineHeight: 21, color: "#636D83", textAlign: "center", marginTop: 8.8 },
  cta: { marginHorizontal: 22.2, marginTop: 33.9 },
  link: { fontSize: 13.35, lineHeight: 18, fontWeight: "600", color: colors.blueLink },
});
