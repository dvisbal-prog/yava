import React from "react";
import { View, Pressable, TextInput, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadows } from "@yava/shared";
import { Text } from "@/components/ui";

/**
 * Buscador blanco (C3) con las medidas de cada pantalla de Explorar (09, 10, 25, 29, 33, 41).
 * Igual al `SearchBar` compartido pero con tamaño de texto, lupa y sangrías configurables
 * (cada PNG trae valores algo distintos). Con `onPress` es un botón; sin él es un campo con X.
 * - `clearStyle`: X suelta (10) o dentro de círculo gris (41).
 */
export function SearchPill({
  placeholder, value, onChangeText, onPress, onClear, onSubmitEditing, autoFocus, style,
  height = 43, fontSize = 12.5, valueFontSize, iconSize = 17.5, iconLeft = 14.5, textLeft = 14.5, clearStyle = "plain", clearRight = 14,
}: {
  placeholder: string; value?: string; onChangeText?: (t: string) => void; onPress?: () => void; onClear?: () => void;
  onSubmitEditing?: () => void; autoFocus?: boolean; style?: StyleProp<ViewStyle>;
  height?: number; fontSize?: number; valueFontSize?: number; iconSize?: number;
  /** Distancia del borde izquierdo de la píldora al ícono. */
  iconLeft?: number;
  /** Distancia del ícono al texto. */
  textLeft?: number;
  clearStyle?: "plain" | "circle";
  clearRight?: number;
}) {
  const vfs = valueFontSize ?? fontSize;
  const inner = (
    <View style={[styles.pill, { height, borderRadius: height / 2, paddingLeft: iconLeft, paddingRight: clearRight }, style]}>
      <Ionicons name="search" size={iconSize} color={colors.ink} />
      {onPress ? (
        <Text numberOfLines={1} style={[styles.text, { marginLeft: textLeft, fontSize, lineHeight: fontSize * 1.3, color: colors.textPlaceholder }]}>{placeholder}</Text>
      ) : (
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textPlaceholder}
          selectionColor={colors.blueText} onSubmitEditing={onSubmitEditing} autoFocus={autoFocus} returnKeyType="search"
          autoCorrect={false} autoCapitalize="none" accessibilityLabel={placeholder}
          style={[styles.text, styles.input, { marginLeft: textLeft, fontSize: value ? vfs : fontSize }]} />
      )}
      {value && onClear ? (
        <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button" accessibilityLabel="Borrar búsqueda"
          style={clearStyle === "circle" ? styles.clearCircle : null}>
          <Ionicons name="close" size={clearStyle === "circle" ? 16 : 19} color={colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="search" accessibilityLabel={placeholder} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>{inner}</Pressable>
  ) : inner;
}

const styles = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.searchBorder, ...shadows.soft },
  text: { flex: 1, color: colors.ink },
  input: { paddingVertical: 0, height: "100%" },
  clearCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceGray, alignItems: "center", justifyContent: "center" },
});
