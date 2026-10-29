import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Circle } from "react-native-svg";
import { colors, shadows } from "@yava/shared";
import { Text, IconButton } from "@/components/ui";

/**
 * Íconos de la barra dibujados como en el PNG (estilo SF Symbols, trazo 1,6 pt), caja 20 × 20 pt centrada:
 * casa redondeada con puerta, etiqueta con punta arriba-derecha y ojal, corazón y persona (cabeza + hombros).
 * La pestaña activa usa la versión rellena (08: casa; 33: etiqueta con ojal blanco; 34: corazón; 35: persona).
 */
const HOME_FILLED = "M2.1 9.4Q2.1 8.3 2.9 7.6L8.9 2.5Q10 1.6 11.1 2.5L17.1 7.6Q17.9 8.3 17.9 9.4L17.9 16.6Q17.9 18.4 16.1 18.4L12.2 18.4L12.2 14.4Q12.2 13.1 10.9 13.1L9.1 13.1Q7.8 13.1 7.8 14.4L7.8 18.4L3.9 18.4Q2.1 18.4 2.1 16.6Z";
const HOME_OUTLINE = "M2.9 9.6Q2.9 8.8 3.5 8.3L9.2 3.4Q10 2.7 10.8 3.4L16.5 8.3Q17.1 8.8 17.1 9.6L17.1 16.4Q17.1 17.6 15.9 17.6L12.2 17.6L12.2 14.2Q12.2 13.1 11.1 13.1L8.9 13.1Q7.8 13.1 7.8 14.2L7.8 17.6L4.1 17.6Q2.9 17.6 2.9 16.4Z";
const TAG = "M17.48 2.24L9.82 2.24L2.98 9.63L10.18 16.74L17.48 9.45Z";
const HEART = "M10 17.05C10 17.05 2.25 12.3 2.25 7.2C2.25 4.7 4.1 2.95 6.3 2.95C7.9 2.95 9.2 3.9 10 5.3C10.8 3.9 12.1 2.95 13.7 2.95C15.9 2.95 17.75 4.7 17.75 7.2C17.75 12.3 10 17.05 10 17.05Z";
const PERSON_BODY = "M4 17.75H16Q17.28 17.75 17.28 16.5C17.28 13.4 14.2 11.03 10 11.03C5.8 11.03 2.72 13.4 2.72 16.5Q2.72 17.75 4 17.75Z";
const STROKE = 1.6;

export function TabIcon({ name, focused, color, size = 20 }: { name: string; focused: boolean; color: string; size?: number }) {
  const line = { stroke: color, strokeWidth: STROKE, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const fill = focused ? color : "none";
  let body: React.ReactNode;
  if (name === "index") {
    body = focused ? <Path d={HOME_FILLED} fill={color} /> : <Path d={HOME_OUTLINE} fill="none" {...line} />;
  } else if (name === "offers") {
    body = (
      <>
        <Path d={TAG} fill={fill} {...line} />
        <Circle cx={13.9} cy={5.6} r={focused ? 1.25 : 1.05} fill={focused ? colors.white : "none"} stroke={focused ? "none" : color} strokeWidth={1.2} />
      </>
    );
  } else if (name === "favorites") {
    body = <Path d={HEART} fill={fill} {...line} />;
  } else if (name === "account") {
    body = (
      <>
        <Circle cx={10} cy={5.38} r={3.35} fill={fill} {...line} />
        <Path d={PERSON_BODY} fill={fill} {...line} />
      </>
    );
  } else {
    return <Ionicons name={focused ? "ellipse" : "ellipse-outline"} size={size * 0.9} color={color} />;
  }
  return <Svg width={size} height={size} viewBox="0 0 20 20">{body}</Svg>;
}

/** Alto de la cápsula (pt). */
export const TAB_BAR_HEIGHT = 53.5;

/**
 * Distancia del borde inferior de la cápsula al borde de la pantalla: en iPhone con indicador de inicio
 * queda 1 pt por debajo del área segura (como en el PNG: 33 pt); en web se imita ese mismo hueco.
 */
export function useTabBarBottom(): number {
  const insets = useSafeAreaInsets();
  if (insets.bottom > 0) return Math.max(insets.bottom - 1, 12);
  return Platform.OS === "web" ? 33 : 14;
}

/**
 * Espacio que deben dejar al final las pantallas con barra flotante para que el último elemento no quede
 * tapado (cápsula + hueco inferior + 16 pt de aire).
 */
export function useTabBarSpace(): number {
  return useTabBarBottom() + TAB_BAR_HEIGHT + 16;
}

/**
 * Barra de pestañas FLOTANTE (guía C21, 08/33/34/35): cápsula blanca con sombra, 4 pestañas (Inicio, Ofertas,
 * Favoritos, Cuenta); la activa con píldora `blueSoft` 75,6 × 42,6 pt (5,4 pt de aire arriba y abajo), ícono relleno
 * `blue` y etiqueta `blueText`. Íconos de 20 pt centrados a 20,4 pt del borde superior; etiqueta debajo.
 * A la derecha, botón circular blanco de 53 pt con la lupa que abre `/search`.
 * Se usa como `tabBar` del navegador de `(customer)/(tabs)`; el contenido pasa por detrás.
 */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const router = useRouter();
  const bottom = useTabBarBottom();
  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <View style={[styles.pill, shadows.float]} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const { options } = descriptors[route.key];
          const label = typeof options.title === "string" ? options.title : route.name;
          const onPress = () => {
            const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable key={route.key} onPress={onPress} onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
              accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label} style={styles.item}>
              {focused ? <View style={styles.active} /> : null}
              <View style={styles.icon}><TabIcon name={route.name} focused={focused} color={focused ? colors.blue : colors.ink} /></View>
              <Text variant="tab" style={[styles.label, { color: focused ? colors.blueText : colors.ink }]} numberOfLines={1}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <IconButton icon="search-outline" size={TAB_BAR_HEIGHT} iconSize={22} variant="white" shadow="float" onPress={() => router.push("/(customer)/search" as never)}
        accessibilityLabel="Buscar" style={styles.search} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingLeft: 17, paddingRight: 17.7 },
  pill: {
    flex: 1, height: TAB_BAR_HEIGHT, borderRadius: TAB_BAR_HEIGHT / 2, backgroundColor: colors.white,
    flexDirection: "row", alignItems: "stretch", paddingLeft: 8.6, paddingRight: 14,
  },
  item: { flex: 1, alignItems: "center", paddingTop: 10.4 },
  active: { position: "absolute", top: 5.4, width: 75.6, height: 42.6, borderRadius: 21.3, backgroundColor: colors.blueSoft },
  icon: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  /** 8,5 pt medium en todas (el PNG tiene ≈ 30 % más tinta que 8,2 regular); tracking apretado para conservar el ancho. */
  label: { marginTop: 3.4, fontSize: 8.5, lineHeight: 11, fontWeight: "500", letterSpacing: -0.12 },
  search: { marginLeft: 6.5 },
});
