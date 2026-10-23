import React from "react";
import { TextInput, TextInputProps, View, StyleSheet, Pressable } from "react-native";
import { colors, radius } from "@yava/shared";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";

export function Input({ label, error, hint, icon, right, style, containerStyle, ...rest }: TextInputProps & {
  label?: string; error?: string | null; hint?: string; icon?: keyof typeof Ionicons.glyphMap; right?: React.ReactNode; containerStyle?: object;
}) {
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label ? <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>{label}</Text> : null}
      <View style={[styles.box, error ? { borderColor: colors.red } : null]}>
        {icon ? <Ionicons name={icon} size={18} color={colors.gray400} style={{ marginRight: 8 }} /> : null}
        <TextInput placeholderTextColor={colors.gray400} style={[styles.input, style]} {...rest} />
        {right}
      </View>
      {error ? <Text variant="caption" tone="danger" style={{ marginTop: 4 }}>{error}</Text> : hint ? <Text variant="caption" tone="subtle" style={{ marginTop: 4 }}>{hint}</Text> : null}
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder = "Busca en YAVA", onPress, autoFocus, onClear }: {
  value?: string; onChangeText?: (t: string) => void; placeholder?: string; onPress?: () => void; autoFocus?: boolean; onClear?: () => void;
}) {
  const inner = (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.gray500} />
      {onPress ? <Text tone="muted" style={{ marginLeft: 8, flex: 1 }}>{placeholder}</Text> : (
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.gray400}
          style={[styles.input, { marginLeft: 8 }]} autoFocus={autoFocus} returnKeyType="search" />
      )}
      {value && onClear ? <Pressable onPress={onClear} hitSlop={10}><Ionicons name="close-circle" size={18} color={colors.gray400} /></Pressable> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, paddingHorizontal: 12, minHeight: 48, backgroundColor: colors.white },
  input: { flex: 1, fontSize: 15, color: colors.carbon, paddingVertical: 10 },
  search: { flexDirection: "row", alignItems: "center", backgroundColor: colors.gray100, borderRadius: radius.md, paddingHorizontal: 12, height: 44 },
});
