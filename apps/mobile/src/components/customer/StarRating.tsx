import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/** Amarillo de las estrellas de 24 (`#FEBE1C`) y gris de las vacías. */
const STAR_ON = "#FEBE1C";
const STAR_OFF = "#DDE1E8";
const LABELS = ["Muy mala", "Mala", "Regular", "Buena", "Excelente"];

/** Texto de la calificación: 5 → "Excelente". */
export function ratingLabel(value: number): string {
  return value >= 1 && value <= 5 ? LABELS[value - 1] : "";
}

/**
 * Estrellas de calificación (24): 5 estrellas rellenas de 39 pt (37 pt de tinta) cada 50 pt;
 * las no marcadas van en gris claro. `onChange` las vuelve tocables.
 */
export function StarRating({ value, onChange, size = 39, gap = 11 }: { value: number; onChange?: (v: number) => void; size?: number; gap?: number }) {
  return (
    <View style={{ flexDirection: "row", gap }} accessibilityRole={onChange ? "adjustable" : undefined} accessibilityValue={{ min: 0, max: 5, now: value }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={onChange ? () => onChange(n) : undefined} hitSlop={4} disabled={!onChange}
          accessibilityRole="button" accessibilityLabel={`${n} ${n === 1 ? "estrella" : "estrellas"}`} accessibilityState={{ selected: n <= value }}>
          <Ionicons name="star" size={size} color={n <= value ? STAR_ON : STAR_OFF} />
        </Pressable>
      ))}
    </View>
  );
}
