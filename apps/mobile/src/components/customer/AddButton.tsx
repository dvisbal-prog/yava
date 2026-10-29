import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadows } from "@yava/shared";

/**
 * Botón "+" circular (guía C11). Tamaños medidos: 26 (12 cuadrícula), 28 (25/29), 32 (10 filas), 34 (26).
 * - `blue` (por defecto): azul con "+" blanco; `onPhoto` agrega borde blanco de 2 pt (sobre fotos).
 * - `white`: blanco con "+" tinta (14 "Acompañantes").
 * - `outline`: blanco con borde 2 pt azul y "+" azul (15 "Te puede gustar").
 * `disabled` lo pinta `#C8CDD9` (43 cerrado).
 */
export function AddButton({ onPress, size = 32, variant = "blue", onPhoto, disabled, style, accessibilityLabel = "Agregar" }: {
  onPress?: () => void; size?: 26 | 28 | 32 | 34 | number; variant?: "blue" | "white" | "outline"; onPhoto?: boolean; disabled?: boolean;
  style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}) {
  const bg = disabled ? "#C8CDD9" : variant === "blue" ? colors.blue : colors.white;
  const fg = disabled || variant === "blue" ? colors.white : variant === "outline" ? colors.blue : colors.ink;
  return (
    <Pressable onPress={onPress} disabled={disabled || !onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1 },
        variant === "outline" && !disabled ? { borderWidth: 2, borderColor: colors.blue } : null,
        onPhoto ? { borderWidth: 2, borderColor: colors.white } : null,
        variant === "white" && !disabled ? shadows.soft : null,
        style,
      ]}>
      <Ionicons name="add" size={Math.round(size * 0.68)} color={fg} />
    </Pressable>
  );
}
