import React from "react";
import { View, ViewProps, StyleSheet, Pressable } from "react-native";
import { colors, radius } from "@yava/shared";

export function Card({ style, onPress, children, padded = true, ...rest }: ViewProps & { onPress?: () => void; padded?: boolean }) {
  const content = <View style={[styles.card, padded && { padding: 14 }, style]} {...rest}>{children}</View>;
  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>{content}</Pressable>;
  return content;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray200 },
});
