import React, { useState } from "react";
import { View, TextInput, TextInputProps, StyleSheet, StyleProp, ViewStyle, TextStyle, Platform } from "react-native";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";

/** Quita el contorno de foco del navegador (el foco se ve en el borde de la caja). */
export const NO_OUTLINE = (Platform.OS === "web" ? { outlineStyle: "none" } : null) as unknown as TextStyle | null;

/**
 * Campo de formulario de 18 "Agregar tarjeta" (guía C19): label 14,2/600 `#4A5265`, caja 53,5 pt radio 11 con borde
 * `#D6DAE2`, foco 2 pt `blueText`, valor 16 pt y elemento opcional a la derecha.
 */
export function FormField({ label, right, containerStyle, height = 53.5, error, inputPadding = 14.9, placeholderNode, onFocus, onBlur, style, ...rest }: TextInputProps & {
  label: string; right?: React.ReactNode; containerStyle?: StyleProp<ViewStyle>; height?: number; error?: boolean; inputPadding?: number;
  /** Marcador propio cuando el campo está vacío (p. ej. los tres puntos grandes del CVV), en vez de `placeholder`. */
  placeholderNode?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, { height }, focused && styles.focus, error && styles.error]}>
        {placeholderNode && !rest.value ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: "center", paddingLeft: inputPadding - (focused ? 1 : 0) }]}>{placeholderNode}</View>
        ) : null}
        <TextInput
          placeholderTextColor="#989DB0"
          selectionColor={colors.blueText}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, NO_OUTLINE, { paddingLeft: inputPadding - (focused ? 1 : 0) }, style]}
          {...rest}
        />
        {right ? <View style={{ marginRight: focused ? 13 : 14 }}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13.8, lineHeight: 18, fontWeight: "500", color: "#4A5265", marginBottom: 7.4 },
  box: { flexDirection: "row", alignItems: "center", borderRadius: 11, borderWidth: 1, borderColor: "#D6DAE2", backgroundColor: colors.white },
  focus: { borderWidth: 2, borderColor: colors.blueText },
  error: { borderColor: colors.red, borderWidth: 1.5 },
  input: { flex: 1, minWidth: 0, height: "100%", fontSize: 16, color: colors.ink, paddingRight: 8 },
});
