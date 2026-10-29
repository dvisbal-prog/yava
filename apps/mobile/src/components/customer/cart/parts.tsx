import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle, TextStyle } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons, Feather } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import type { DesignImageSource } from "@/lib/design-images";
import { ArrowBackIcon } from "./LineIcons";

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Encabezado de las pantallas de canasta y pago (guía C2), con posiciones absolutas medidas en cada PNG:
 * - `circle` (15, 16): botón gris 33 pt con `chevron-back`.
 * - `chevron` (17, 28, 42): chevron suelto 24 pt.
 * - `arrow` (19): flecha ← de trazo fino (`ArrowBackIcon`, 20 × 18 pt; `backIcon` no aplica).
 * `titleX`/`titleTop` ubican el título; `height` es el alto total del bloque.
 */
export function NavBar({ variant = "circle", title, subtitle, titleX = 64, titleTop = 10, titleStyle, subtitleStyle, height = 50, backTop, backLeft, backSize = 33, onBack, right, backIcon = 25 }: {
  variant?: "circle" | "chevron" | "arrow"; title?: string; subtitle?: string; titleX?: number; titleTop?: number;
  titleStyle?: StyleProp<TextStyle>; subtitleStyle?: StyleProp<TextStyle>; height?: number; backTop?: number; backLeft?: number;
  /** Diámetro del círculo (`circle`) o tamaño del ícono (`chevron`/`arrow`). */
  backSize?: number; onBack?: () => void; right?: React.ReactNode;
  /** Tamaño del ícono suelto (`chevron`/`arrow`), medido por la altura de tinta en cada PNG. */
  backIcon?: number;
}) {
  const router = useRouter();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")));
  const circle = variant === "circle";
  return (
    <View style={{ height, backgroundColor: colors.white }}>
      <Pressable onPress={goBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Atrás"
        style={({ pressed }) => [
          circle ? [styles.backCircle, { width: backSize, height: backSize, borderRadius: backSize / 2 }] : styles.backPlain,
          { top: backTop ?? (circle ? 9.2 : 9) }, backLeft !== undefined && { left: backLeft }, pressed && { opacity: 0.7 },
        ]}>
        {variant === "arrow" ? <ArrowBackIcon /> : <Ionicons name="chevron-back" size={circle ? Math.round(backSize * 0.58) : backIcon} color={colors.ink} />}
      </Pressable>
      {title ? (
        <View style={{ position: "absolute", left: titleX, right: 60, top: titleTop }} pointerEvents="none">
          <Text numberOfLines={1} style={[styles.title, titleStyle]} accessibilityRole="header">{title}</Text>
          {subtitle ? <Text numberOfLines={1} style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {right ? <View style={{ position: "absolute", right: 17.5, top: 9 }}>{right}</View> : null}
    </View>
  );
}

/** Foto con radio (miniaturas de la canasta). */
export function Thumb({ source, width, height, radius = 10, style }: { source?: DesignImageSource; width: number; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width, height, borderRadius: radius, overflow: "hidden", backgroundColor: colors.surfaceGray }, style]}>
      {source ? <Image source={source} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} /> : null}
    </View>
  );
}

/**
 * Selector de cantidad de la canasta (guía C14):
 * - `cart` (15): píldora blanca 101 × 33 con borde, papelera | n | "+" (el "+" en círculo gris muy claro).
 * - `market` (28): píldora 86 × 38 con borde: "−" gris claro | n | "+" azul.
 * - `filled` (44): píldora gris 88 × 33 sin borde: "−" | n | "+".
 */
export function QtyStepper({ value, onChange, variant = "cart", max = 99, disabled }: {
  value: number; onChange: (v: number) => void; variant?: "cart" | "market" | "filled"; max?: number; disabled?: boolean;
}) {
  const trash = variant === "cart" && value <= 1;
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  if (variant === "cart") {
    return (
      <View style={[styles.stepCart, disabled && { opacity: 0.5 }]}>
        <Pressable onPress={dec} disabled={disabled} hitSlop={6} accessibilityRole="button" accessibilityLabel={trash ? "Quitar" : "Disminuir"} style={styles.stepCartBtn}>
          {trash ? <Feather name="trash" size={16} color={colors.ink} /> : <Ionicons name="remove" size={20} color={colors.ink} />}
        </Pressable>
        <View style={styles.stepDiv} />
        <Text style={styles.stepCartNum}>{value}</Text>
        <View style={styles.stepDiv} />
        <Pressable onPress={inc} disabled={disabled || value >= max} hitSlop={6} accessibilityRole="button" accessibilityLabel="Aumentar" style={styles.stepCartBtn}>
          <View style={styles.stepPlusBg}><Ionicons name="add" size={21} color={colors.ink} /></View>
        </Pressable>
      </View>
    );
  }
  const market = variant === "market";
  return (
    <View style={[market ? styles.stepMarket : styles.stepFilled, disabled && { opacity: 0.5 }]}>
      {/* En mercado (28) el "−" se apaga en 1: para quitar está la papelera. En 44 el "−" en 1 quita la línea. */}
      <Pressable onPress={dec} disabled={disabled || (market && value <= 1)} hitSlop={6} accessibilityRole="button" accessibilityLabel="Disminuir" style={market ? styles.stepMarketBtn : styles.stepFilledBtn}>
        <Ionicons name="remove" size={market ? 19 : 18} color={market && value <= 1 ? "#B3B9C5" : colors.ink} />
      </Pressable>
      <Text style={market ? styles.stepMarketNum : styles.stepFilledNum}>{value}</Text>
      <Pressable onPress={inc} disabled={disabled || value >= max} hitSlop={6} accessibilityRole="button" accessibilityLabel="Aumentar" style={market ? styles.stepMarketBtn : styles.stepFilledBtn}>
        <Ionicons name="add" size={market ? 21.5 : 19} color={market ? colors.blueLink : colors.ink} />
      </Pressable>
    </View>
  );
}

/** "+" de las tarjetas "Te puede gustar" (15): círculo blanco 29 pt con aro azul 2 pt y "+" azul. */
export function AddRing({ onPress, size = 29, style }: { onPress?: () => void; size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel="Agregar"
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1 }, style]}>
      <View style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2, borderWidth: 1.8, borderColor: colors.blueLink, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="add" size={18} color={colors.blueLink} />
      </View>
    </Pressable>
  );
}

/** Separador de 1 pt (`divider`) a lo ancho del contenido. */
export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.divider }, style]} />;
}

/** Botón píldora a lo ancho (C15a/b): azul, con texto centrado y contenido opcional a la derecha. */
export function PillButton({ title, onPress, disabled, loading, height = 52, radius, style, textStyle, right, tone = "blue", accessibilityLabel, glow, color }: {
  title: string; onPress?: () => void; disabled?: boolean; loading?: boolean; height?: number; radius?: number; style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>; right?: React.ReactNode; tone?: "blue" | "soft" | "disabledStrong" | "disabled"; accessibilityLabel?: string;
  /** Halo azul suave bajo el botón (15). */
  glow?: boolean;
  /** Azul propio del PNG cuando difiere del token (16 mide `#034ECC`). Solo aplica a `tone="blue"`. */
  color?: string;
}) {
  const bg = tone === "soft" ? colors.blueSoft : tone === "disabledStrong" ? colors.disabledStrong : tone === "disabled" ? colors.disabledBg : color ?? colors.blue;
  const fg = tone === "soft" ? colors.blueText : tone === "disabled" ? colors.disabledText : colors.white;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} accessibilityState={{ disabled: !!(disabled || loading) }}
      style={({ pressed }) => [{ height, borderRadius: radius ?? height / 2, backgroundColor: pressed && tone === "blue" ? colors.blueDark : bg, alignItems: "center", justifyContent: "center", opacity: loading ? 0.85 : 1 }, glow && tone === "blue" ? { boxShadow: "0px 6px 14px rgba(0, 69, 171, 0.22)" } : null, style]}>
      <Text style={[{ color: fg, fontSize: 15.3, lineHeight: 20, fontWeight: "600" }, textStyle]} numberOfLines={1}>{loading ? "Procesando…" : title}</Text>
      {right ? <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, justifyContent: "center" }}>{right}</View> : null}
    </Pressable>
  );
}

/** Círculo gris con ícono (instrucciones del pedido, filas del checkout). */
export function IconDisc({ icon, size = 34, iconSize = 19, bg = "#EDF0F4", color = colors.ink }: { icon: IconName; size?: number; iconSize?: number; bg?: string; color?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon} size={iconSize} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  backCircle: { position: "absolute", left: 17.5, backgroundColor: "#EEF0F3", alignItems: "center", justifyContent: "center" },
  backPlain: { position: "absolute", left: 14, width: 34, height: 34, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 16, lineHeight: 21, fontWeight: "600", color: colors.ink, letterSpacing: -0.1 },
  subtitle: { fontSize: 13, lineHeight: 17, color: colors.textTertiary, marginTop: 2 },
  stepCart: { width: 101, height: 33, borderRadius: 17, borderWidth: 1, borderColor: "#E7EAF0", backgroundColor: colors.white, flexDirection: "row", alignItems: "center", paddingHorizontal: 3 },
  stepCartBtn: { width: 30, height: "100%", alignItems: "center", justifyContent: "center" },
  stepCartNum: { flex: 1, textAlign: "center", fontSize: 13.5, lineHeight: 18, fontWeight: "500", color: colors.ink },
  stepDiv: { width: 1, height: 18, backgroundColor: "#EEF0F4" },
  stepPlusBg: { width: 27, height: 27, borderRadius: 13.5, backgroundColor: "#F4F5F7", alignItems: "center", justifyContent: "center" },
  stepMarket: { width: 86, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  stepMarketBtn: { width: 28, height: "100%", alignItems: "center", justifyContent: "center" },
  stepMarketNum: { fontSize: 13.5, lineHeight: 18, fontWeight: "500", color: colors.ink, textAlign: "center", minWidth: 14 },
  stepFilled: { width: 88, height: 33, borderRadius: 17, backgroundColor: "#F1F2F5", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  stepFilledBtn: { width: 26, height: "100%", alignItems: "center", justifyContent: "center" },
  stepFilledNum: { fontSize: 13.5, lineHeight: 18, fontWeight: "500", color: colors.ink, textAlign: "center", minWidth: 14 },
});

