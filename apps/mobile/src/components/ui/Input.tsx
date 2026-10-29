import React, { useState } from "react";
import { TextInput, TextInputProps, View, StyleSheet, Pressable, StyleProp, ViewStyle } from "react-native";
import { colors, radius, shadows, spacing } from "@yava/shared";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";

/**
 * Campo de formulario (guía C19): label arriba, caja de 48 pt radio 12 con borde `border`,
 * foco con borde 2 pt `blueText`, ayuda o error debajo. `multiline` sirve de textarea.
 */
export function Input({ label, error, hint, icon, right, style, containerStyle, optional, onFocus, onBlur, multiline, ...rest }: TextInputProps & {
  label?: string; error?: string | null; hint?: string; icon?: keyof typeof Ionicons.glyphMap; right?: React.ReactNode; containerStyle?: StyleProp<ViewStyle>;
  /** Agrega " (opcional)" en gris al label. */
  optional?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label ? (
        <Text variant="bodyM" tone="secondary" style={{ marginBottom: 7, fontWeight: "500" }}>
          {label}{optional ? <Text variant="bodyM" tone="placeholder"> (opcional)</Text> : null}
        </Text>
      ) : null}
      <View style={[
        styles.box,
        multiline && styles.multi,
        focused && styles.focus,
        error ? { borderColor: colors.red, borderWidth: 1.5 } : null,
      ]}>
        {icon ? <Ionicons name={icon} size={19} color={colors.iconGray} style={{ marginRight: 9 }} /> : null}
        <TextInput
          placeholderTextColor={colors.textPlaceholder}
          selectionColor={colors.blueText}
          style={[styles.input, multiline && { textAlignVertical: "top", minHeight: 64 }, style]}
          multiline={multiline}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...rest}
        />
        {right}
      </View>
      {error ? <Text variant="caption2" tone="danger" style={{ marginTop: 5 }}>{error}</Text>
        : hint ? <Text variant="caption2" tone="placeholder" style={{ marginTop: 5 }}>{hint}</Text> : null}
    </View>
  );
}

/**
 * Buscador (guía C3): píldora blanca 43 pt con borde `searchBorder` y sombra suave, lupa tinta y
 * placeholder gris. Con `onPress` funciona como botón (Inicio, Restaurantes); sin él es un campo con X.
 * `variant="filled"` = relleno gris sin sombra (40 soporte).
 */
export function SearchBar({ value, onChangeText, placeholder = "Busca en YAVA", onPress, autoFocus, onClear, variant = "pill", style, height = 43, onSubmitEditing, clearStyle = "plain" }: {
  value?: string; onChangeText?: (t: string) => void; placeholder?: string; onPress?: () => void; autoFocus?: boolean; onClear?: () => void;
  variant?: "pill" | "filled"; style?: StyleProp<ViewStyle>; height?: number; onSubmitEditing?: () => void;
  /** X suelta (10) o dentro de círculo gris (41). */
  clearStyle?: "plain" | "circle";
}) {
  const inner = (
    <View style={[styles.search, { height, borderRadius: height / 2 }, variant === "pill" ? styles.searchPill : styles.searchFilled, style]}>
      <Ionicons name="search" size={19} color={colors.ink} />
      {onPress ? <Text variant="bodyS" tone="placeholder" style={styles.searchText} numberOfLines={1}>{placeholder}</Text> : (
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textPlaceholder}
          selectionColor={colors.blueText} onSubmitEditing={onSubmitEditing}
          style={[styles.input, styles.searchText, { fontSize: 15 }]} autoFocus={autoFocus} returnKeyType="search" />
      )}
      {value && onClear ? (
        <Pressable onPress={onClear} hitSlop={10} accessibilityLabel="Borrar búsqueda" style={clearStyle === "circle" ? styles.clearCircle : null}>
          <Ionicons name="close" size={clearStyle === "circle" ? 15 : 20} color={colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="search" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>{inner}</Pressable> : inner;
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.r12, paddingHorizontal: 14, minHeight: 48, backgroundColor: colors.white },
  multi: { alignItems: "flex-start", paddingTop: 4 },
  focus: { borderColor: colors.blueText, borderWidth: 2, paddingHorizontal: 13 },
  input: { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 11 },
  search: { flexDirection: "row", alignItems: "center", paddingLeft: 13.5, paddingRight: 14 },
  searchPill: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.searchBorder, ...shadows.soft },
  searchFilled: { backgroundColor: colors.surfaceGray },
  searchText: { marginLeft: 10, flex: 1, fontSize: 13.9 },
  clearCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceGray, alignItems: "center", justifyContent: "center" },
});

/** Margen lateral estándar del diseño, para quien arme su propio contenedor. */
export const GUTTER = spacing.gutter;
