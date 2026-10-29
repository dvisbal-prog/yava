import React from "react";
import { View, Pressable, StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";

/**
 * Piezas visuales del grupo "Cuenta, envíos y estados globales" (31, 32, 34–40, 48).
 * Medidas tomadas de los PNG (`tanda-04`, `tanda-05`, `tanda-06`) con el ancho de tinta de cada texto.
 */

type Weight = "400" | "500" | "600" | "700";

/** Estilo de texto en pt (tamaño, peso, color e interlineado opcional ≈ 1,3 × tamaño). */
export function ft(size: number, weight: Weight = "400", color: string = colors.ink, lineHeight?: number): TextStyle {
  return { fontSize: size, fontWeight: weight, color, lineHeight: lineHeight ?? Math.round(size * 1.3) };
}

/** Margen lateral de las tarjetas de estas pantallas (16,6 pt en 35/36/37/39). */
export const ACC_GUTTER = 17;

/** Gris de los chevrons de fila (35 mide #818795). */
export const CHEVRON_GRAY = "#818795";

/** Chevron "›" de fila: trazo fino de 1,7 pt (tinta 6,9 × 12 pt a 18,5) en una caja cuadrada de `size`. */
export function RowChevron({ color = CHEVRON_GRAY, size = 18.5, style, stroke = 1.7 }: { color?: string; size?: number; style?: StyleProp<ViewStyle>; stroke?: number }) {
  const h = size * 0.65 - stroke;
  const w = h * 0.52;
  const x0 = (size - w) / 2;
  const y0 = (size - h) / 2;
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Path d={`M${x0} ${y0}L${x0 + w} ${y0 + h / 2}L${x0} ${y0 + h}`} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}

/** Grupo de filas de Cuenta (C17b): tarjeta blanca radio 18, borde `cardBorder`, divisores a todo el ancho. */
export function AccountGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, style]}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <View style={styles.groupDivider} /> : null}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

/** Fila de Cuenta: ícono azul centrado en x 45, texto 15,5 pt en x 82, chevron gris a la derecha. */
export function AccountRow({ icon, title, onPress, right, accessibilityLabel }: {
  icon: React.ReactNode; title: string; onPress: () => void; right?: React.ReactNode; accessibilityLabel?: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceSoft }]}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
      {right}
      <RowChevron style={{ marginLeft: 8 }} />
    </Pressable>
  );
}

/**
 * Barra de navegación de estas pantallas (C2b/C2d): chevron (o flecha) suelto de 28 pt con el trazo en x ≈ 16 y
 * título en línea (36: 18 pt bold en x 52) o centrado (38). `right` va pegado al margen derecho.
 */
export function NavBar({ title, titleStyle, onBack, right, center, icon = "chevron-back", height = 48, iconSize = 28, iconColor = colors.ink, backLeft = 16.2, titleLeft = 52, style, children, chevronHeight = 19.4, chevronStroke = 2.3, rightInset = 17 }: {
  rightInset?: number;
  /** Chevron dibujado: alto de la tinta (36: 19,4; 37: 21,7) y grosor del trazo (36: 2,3; 37: 1,6). */
  chevronHeight?: number; chevronStroke?: number;
  title?: string; titleStyle?: StyleProp<TextStyle>; onBack?: () => void; right?: React.ReactNode; center?: boolean;
  icon?: "chevron-back" | "arrow-back"; height?: number; iconSize?: number; iconColor?: string; backLeft?: number; titleLeft?: number;
  style?: StyleProp<ViewStyle>; children?: React.ReactNode;
}) {
  const router = useRouter();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")));
  return (
    <View style={[{ height, justifyContent: "center", backgroundColor: colors.white }, style]}>
      {title ? (
        <Text style={[ft(18, "700", colors.ink, 24), center ? { textAlign: "center", marginHorizontal: 70 } : { marginLeft: titleLeft, marginRight: 16 }, titleStyle]}
          numberOfLines={1} accessibilityRole="header">{title}</Text>
      ) : null}
      {children}
      <Pressable onPress={goBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Atrás"
        style={[styles.navBack, { left: backLeft, width: iconSize + 4, height: iconSize + 4, marginTop: -(iconSize + 4) / 2 }]}>
        {icon === "arrow-back" ? <Ionicons name={icon} size={iconSize} color={iconColor} /> : <BackChevron height={chevronHeight} stroke={chevronStroke} color={iconColor} />}
      </Pressable>
      {right ? <View style={[styles.navRight, { right: rightInset }]}>{right}</View> : null}
    </View>
  );
}

/** Chevron "‹" de línea con trazo redondeado (Ionicons es más grueso que el del PNG). `height` = alto de la tinta. */
export function BackChevron({ height = 19.4, stroke = 2.3, color = colors.ink }: { height?: number; stroke?: number; color?: string }) {
  const h = height - stroke;
  const w = h * 0.48;
  return (
    <Svg width={w + stroke} height={height} viewBox={`${-stroke / 2} ${-stroke / 2} ${w + stroke} ${height}`}>
      <Path d={`M${w} 0L0 ${h / 2}L${w} ${h}`} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  navBack: { position: "absolute", top: "50%", alignItems: "flex-start", justifyContent: "center" },
  navRight: { position: "absolute", top: 0, bottom: 0, justifyContent: "center" },
  group: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: "#E9EBF0", overflow: "hidden" },
  groupDivider: { height: 1, backgroundColor: "#E9EBF0" },
  row: { flexDirection: "row", alignItems: "center", height: 51, paddingLeft: 11, paddingRight: 9 },
  rowIcon: { width: 32, alignItems: "center", justifyContent: "center", marginRight: 20.4 },
  rowTitle: { flex: 1, ...ft(15.2, "400", colors.ink, 20), transform: [{ translateY: -1.4 }] },
});
