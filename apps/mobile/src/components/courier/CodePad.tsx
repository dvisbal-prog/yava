import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius } from "@yava/shared";
import { Text } from "@/components/ui";

/** Teclado numérico para el código de entrega de 4 dígitos. */
export function CodePad({ value, onChange, length = 4 }: { value: string; onChange: (v: string) => void; length?: number }) {
  const press = (k: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (k === "del") return onChange(value.slice(0, -1));
    if (value.length >= length) return;
    onChange(value + k);
  };
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 20 }}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={[styles.cell, value[i] ? { borderColor: colors.blue } : null]}>
            <Text variant="title">{value[i] ?? ""}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
        {keys.map((k, i) => (
          <Pressable key={i} onPress={() => k && press(k)} disabled={!k} style={({ pressed }) => [styles.key, pressed && k ? { backgroundColor: colors.gray100 } : null]}>
            {k === "del" ? <Ionicons name="backspace-outline" size={22} color={colors.carbon} /> : <Text variant="title">{k}</Text>}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  cell: { width: 52, height: 60, marginHorizontal: 6, borderRadius: radius.md, borderWidth: 2, borderColor: colors.gray200, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  key: { width: "30%", height: 56, margin: "1.5%", borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
