import React from "react";
import { View, Pressable, StyleSheet, StyleProp, ViewStyle, TextStyle, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { designImages, type DesignImageSource } from "@/lib/design-images";
import { usePaymentMethods, type OrderSummaryRow } from "@/features/customer";

/*
 * Piezas visuales de las pantallas del pedido: 20 (confirmado), 21 (seguimiento), 22 (chat), 23 (entregado),
 * 24 (calificación), 45 (pago fallido) y 47 (cancelar),
 * con medidas tomadas de sus PNG (tanda-03 y tanda-06).
 */

type IconName = keyof typeof Ionicons.glyphMap;
type Weight = "400" | "500" | "600" | "700";

/**
 * Estilo de texto medido en los PNG del pedido (tamaño por ancho de tinta, ver guía §4.1).
 * `t(13.6, "600", colors.white)` → `{ fontSize, lineHeight, fontWeight, color }`.
 */
export function t(size: number, weight: Weight = "400", color: string = colors.ink, lineHeight?: number): TextStyle {
  return { fontSize: size, lineHeight: lineHeight ?? Math.round(size * 1.3), fontWeight: weight, color };
}

/** Margen lateral de las tarjetas del pedido (bordes en x 17 → 376 pt). */
export const ORDER_GUTTER = 17;

/** Borde fino de las tarjetas del diseño (≈ 1 px físico). */
export const CARD_BORDER = 0.75;

/** Check grueso del diseño (círculo de 20/23): trazo redondeado `blue`. */
export function BoldCheck({ width = 24, color = colors.blue, stroke = 3 }: { width?: number; color?: string; stroke?: number }) {
  const h = width * 0.72;
  return (
    <Svg width={width} height={h} viewBox="0 0 24 17.3">
      <Path d="M2 9.2 L8.6 15.3 L22 2" stroke={color} strokeWidth={stroke * (24 / width)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** "×" de trazo fino del diseño (47: 13,4 pt de lado y 2 pt de trazo; el `close` de Ionicons sale más grueso). */
export function ThinClose({ size = 13.4, stroke = 2, color = colors.ink }: { size?: number; stroke?: number; color?: string }) {
  const h = stroke / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Line x1={h} y1={h} x2={size - h} y2={size - h} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Line x1={size - h} y1={h} x2={h} y2={size - h} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </Svg>
  );
}

/** "ⓘ" de trazo fino del diseño (47: 18,9 pt, trazo 1,6 pt, "i" sin remates; el de Ionicons sale más grueso). */
export function ThinInfo({ size = 18.9, stroke = 1.6, color = "#637083" }: { size?: number; stroke?: number; color?: string }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={c} cy={c} r={c - stroke / 2} stroke={color} strokeWidth={stroke} fill="none" />
      <Circle cx={c} cy={size * 0.3} r={size * 0.056} fill={color} />
      <Line x1={c} y1={size * 0.44} x2={c} y2={size * 0.69} stroke={color} strokeWidth={stroke * 1.06} strokeLinecap="round" />
    </Svg>
  );
}

/** Candado relleno con ojo de cerradura blanco (código de entrega de 21); caja de tinta 15 × 18,5 pt. */
export function KeyholeLock({ color = "#0049DD", hole = "#FFFFFF", height = 18.5 }: { color?: string; hole?: string; height?: number }) {
  const width = (height * 31) / 37;
  return (
    <Svg width={width} height={height} viewBox="4 4 31 37">
      <Path d="M11.75 17.5 V13.5 A7.75 7.75 0 0 1 27.25 13.5 V17.5" stroke={color} strokeWidth={3.5} fill="none" />
      <Path d="M8.5 17 H31.5 A3.5 3.5 0 0 1 35 20.5 V37.5 A3.5 3.5 0 0 1 31.5 41 H8.5 A3.5 3.5 0 0 1 5 37.5 V20.5 A3.5 3.5 0 0 1 8.5 17 Z" fill={color} />
      <Circle cx={19.75} cy={27.2} r={2.9} fill={hole} />
      <Path d="M18.45 28 H21.05 V33.6 A1.3 1.3 0 0 1 18.45 33.6 Z" fill={hole} />
    </Svg>
  );
}

/** Foto con radio (miniaturas de comercio y productos). */
export function OrderThumb({ source, width, height, radius = 10, style }: {
  source?: DesignImageSource; width: number; height: number; radius?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ width, height, borderRadius: radius, overflow: "hidden", backgroundColor: colors.surfaceGray }, style]}>
      {source ? <Image source={source} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} /> : null}
    </View>
  );
}

/** Tarjeta blanca con borde fino `cardBorder` (C20a), sin sombra. */
export function OrderCard({ children, style, onPress, radius = 16, accessibilityLabel }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; radius?: number; accessibilityLabel?: string;
}) {
  const box = [styles.card, { borderRadius: radius }, style];
  if (!onPress) return <View style={box}>{children}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => [box, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export type PillVariant = "primary" | "outline" | "soft" | "danger" | "link";
const PILL_BG: Record<PillVariant, string> = { primary: colors.blue, outline: colors.white, soft: "#E9F1FD", danger: colors.white, link: "transparent" };
const PILL_FG: Record<PillVariant, string> = { primary: colors.white, outline: "#0A3DA8", soft: "#0A3DA8", danger: "#D50C1B", link: colors.blueLink };
const PILL_BORDER: Partial<Record<PillVariant, ViewStyle>> = {
  outline: { borderWidth: 1, borderColor: "#CDD2DC" },
  danger: { borderWidth: 1.5, borderColor: "#D60218" },
};

/**
 * Botón de las pantallas del pedido con alto, radio y tamaño de texto medidos en cada PNG (C15a/c/e/f/h).
 * `chevron` dibuja el `chevron-forward` pegado a la derecha ("Seguir pedido ›" de 20).
 */
/** Azul de los botones primarios de 23 y 24 (más claro que el de 20/45/47). */
export const BLUE_BRIGHT = "#004CC1";

export function PillButton({ title, onPress, variant = "primary", height = 44, radius, fontSize = 13.6, chevron, loading, disabled, style, color, bg: bgColor, accessibilityLabel }: {
  title: string; onPress?: () => void; variant?: PillVariant; height?: number; radius?: number; fontSize?: number;
  chevron?: boolean; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; color?: string;
  /** Fondo medido en el PNG cuando difiere del azul base (23 y 24 usan `#004CC1`). */
  bg?: string; accessibilityLabel?: string;
}) {
  const off = disabled || loading;
  const solid = variant === "primary";
  const bg = solid && disabled && !loading ? colors.disabledBg : bgColor ?? PILL_BG[variant];
  const fg = solid && disabled && !loading ? colors.disabledText : color ?? PILL_FG[variant];
  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        styles.pill, { height, borderRadius: radius ?? height / 2, backgroundColor: pressed && solid ? colors.blueDark : bg },
        PILL_BORDER[variant], { opacity: !solid && disabled ? 0.5 : pressed && !solid ? 0.75 : 1 }, style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <Text style={{ fontSize, lineHeight: Math.round(fontSize * 1.3), fontWeight: "600", color: fg }} numberOfLines={1}>{title}</Text>
      )}
      {chevron && !loading ? <Ionicons name="chevron-forward" size={Math.round(height * 0.47)} color={fg} style={styles.pillChevron} /> : null}
    </Pressable>
  );
}

/** Método de pago del pedido: "Visa •••• 4242", "Efectivo"… y si la tarjeta es Visa (para el logo del diseño). */
export function useOrderPayment(o: Pick<OrderSummaryRow, "payment_method" | "payment_method_id"> | null | undefined) {
  const methods = usePaymentMethods();
  const method = o?.payment_method ?? null;
  // Pedidos con tarjeta sin `payment_method_id` (anteriores a que el checkout lo guardara): la tarjeta guardada que
  // ofrece el checkout (la primera de tipo tarjeta).
  const card = method !== "card" ? undefined
    : o?.payment_method_id ? methods.data?.find((m) => m.id === o.payment_method_id)
    : methods.data?.find((m) => m.method === "card");
  const brand = card?.brand ?? "Tarjeta";
  const label = method === "cash" ? "Efectivo"
    : method === "nequi" ? "Nequi"
    : method === "daviplata" ? "Daviplata"
    : card ? `${brand} •••• ${card.last4 ?? ""}`.trim()
    : "Tarjeta";
  const icon: IconName = method === "cash" ? "cash-outline" : method === "nequi" || method === "daviplata" ? "phone-portrait-outline" : "card-outline";
  return { label, isVisa: method === "card" && /visa/i.test(card?.brand ?? ""), icon, method };
}

/**
 * Baldosa del método de pago: logo VISA del diseño (`light` = claro de 20, `solid` = azul de 23)
 * o, para otros métodos, el ícono sobre la misma baldosa.
 */
export function PaymentTile({ isVisa, icon, width, height, variant = "light", style }: {
  isVisa: boolean; icon: IconName; width: number; height: number; variant?: "light" | "solid"; style?: StyleProp<ViewStyle>;
}) {
  if (isVisa) {
    return <Image source={variant === "solid" ? designImages.pedidoEntregadoVisa : designImages.pagoVisaClaro} style={[{ width, height }, style as never]} contentFit={variant === "solid" ? "cover" : "contain"} />;
  }
  return (
    <View style={[{ width, height, borderRadius: 6, backgroundColor: variant === "solid" ? colors.blue : colors.blueTint, alignItems: "center", justifyContent: "center" }, style]}>
      <Ionicons name={icon} size={Math.round(height * 0.62)} color={variant === "solid" ? colors.white : colors.blue} />
    </View>
  );
}

/** Hora con "a. m./p. m." en hora de Bogotá (UTC−5, sin horario de verano): "12:05 p. m.". */
export function time12(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const d = new Date(ms - 5 * 60 * 60 * 1000);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

/** "Calle 2 # 3-45, Apto. 302" */
export function addressLine(a: { line1?: string | null; line2?: string | null }): string {
  return [a.line1, a.line2].filter(Boolean).join(", ");
}

/** Nombre corto del repartidor: "Carlos Rodríguez" → "Carlos R." */
export function shortCourierName(name: string | null | undefined, fallback = "Tu repartidor"): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: CARD_BORDER, borderColor: "#E8EBF1" },
  pill: { alignItems: "center", justifyContent: "center", paddingHorizontal: 18, alignSelf: "stretch" },
  pillChevron: { position: "absolute", right: 18 },
});
