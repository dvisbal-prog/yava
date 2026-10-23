import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";

export function StarRating({ value, onChange, size = 34 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={onChange ? () => onChange(n) : undefined} hitSlop={6} disabled={!onChange}>
          <Ionicons name={n <= value ? "star" : "star-outline"} size={size} color={n <= value ? colors.yellow : colors.gray300} />
        </Pressable>
      ))}
    </View>
  );
}
