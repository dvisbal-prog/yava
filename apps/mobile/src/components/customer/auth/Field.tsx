import React, { forwardRef, useState } from "react";
import { View, TextInput, Pressable, ActivityIndicator, StyleSheet, Platform, type TextInputProps, type StyleProp, type ViewStyle, type TextStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";

/** En web el navegador dibuja su propio anillo de foco sobre el campo: el diseño solo usa el borde azul. */
export const NO_WEB_OUTLINE = (Platform.OS === "web" ? { outlineStyle: "none" } : null) as unknown as TextStyle | null;

/** Borde de campo enfocado (03: 2 pt `#0038BF`). */
export const FOCUS_BORDER = "#0038BF";

export type FieldLook = {
  /** Alto de la caja (incluye el borde). */
  height: number;
  radius: number;
  borderColor: string;
  /** Tamaño del valor escrito. */
  fontSize: number;
  letterSpacing?: number;
  /** Separación interna izquierda (desde el borde exterior). */
  padLeft: number;
  /** Etiqueta: tamaño, peso, color y separación con la caja (desde la línea base). */
  label: TextStyle;
  labelGap: number;
};

/** 03 Celular / 18: etiqueta gris 500, caja 48–51 pt radio 12. */
export const LOOK_PHONE: FieldLook = {
  height: 48.5, radius: 12, borderColor: "#E3E5ED", fontSize: 17, letterSpacing: -0.2, padLeft: 15.2,
  label: { fontSize: 13, lineHeight: 17, fontWeight: "500", color: colors.textSecondary, letterSpacing: -0.1 }, labelGap: 7,
};

/** 05 Datos personales: etiqueta tinta 400, caja 44,8 pt radio 10 borde `#D7D9E0`. */
export const LOOK_PROFILE: FieldLook = {
  height: 44.8, radius: 9, borderColor: "#D7D9E0", fontSize: 15.5, letterSpacing: -0.2, padLeft: 12.6,
  label: { fontSize: 14.3, lineHeight: 19, fontWeight: "400", color: colors.ink, letterSpacing: -0.2 }, labelGap: 6.8,
};

/** 07 Dirección: etiqueta tinta 400 + "(opcional)" gris, caja 45,7 pt radio 12 borde `#E0E4EA`. */
export const LOOK_ADDRESS: FieldLook = {
  height: 45.7, radius: 9, borderColor: "#DCE0EA", fontSize: 14.9, letterSpacing: -0.31, padLeft: 13.6,
  label: { fontSize: 13.4, lineHeight: 19, fontWeight: "400", color: colors.ink, letterSpacing: -0.29 }, labelGap: 5.4,
};

/**
 * Campo de formulario de las pantallas de acceso y registro (C19 medido en 03, 05 y 07).
 * Etiqueta arriba (con "(opcional)" gris), caja con borde fino que al enfocarse pasa a 2 pt azul,
 * ayuda o error debajo. `left`/`right` para bandera o chevron; `multiline` = textarea.
 */
/** Instancia del TextInput (para `focus()`). */
export type FieldInput = React.ComponentRef<typeof TextInput>;

export const Field = forwardRef<FieldInput, TextInputProps & {
  label?: string;
  optional?: boolean;
  look: FieldLook;
  hint?: string;
  error?: string | null;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Alto de la caja si es `multiline` (textarea de 07: 92,8 pt). */
  boxHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
  /** Mantener el borde azul aunque no tenga foco (03 muestra el campo activo). */
  forceFocus?: boolean;
}>(function Field({ label, optional, look, hint, error, left, right, boxHeight, containerStyle, forceFocus, onFocus, onBlur, multiline, style, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  const active = focused || forceFocus;
  const bw = active ? 1.8 : 1;
  const h = boxHeight ?? look.height;
  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[look.label, { marginBottom: look.labelGap }]}>
          {label}{optional ? <Text style={{ color: colors.textTertiary }}> (opcional)</Text> : null}
        </Text>
      ) : null}
      <View style={[
        styles.box,
        { height: h, borderRadius: look.radius, borderWidth: bw, borderColor: error ? colors.red : active ? FOCUS_BORDER : look.borderColor, paddingLeft: look.padLeft - bw, paddingRight: 12 - bw },
        multiline && styles.multi,
      ]}>
        {left}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textPlaceholder}
          selectionColor={FOCUS_BORDER}
          cursorColor={FOCUS_BORDER}
          multiline={multiline}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, NO_WEB_OUTLINE, { fontSize: look.fontSize, letterSpacing: look.letterSpacing }, multiline && styles.inputMulti, style]}
          {...rest}
        />
        {right}
      </View>
      {error ? <Text style={[styles.below, { color: colors.red }]}>{error}</Text>
        : hint ? <Text style={styles.below}>{hint}</Text> : null}
    </View>
  );
});

/** Casilla de 21–22 pt (C18): vacía con borde gris, marcada azul con check blanco. */
export function Checkbox({ checked, onToggle, label, size = 21.7, radius = 6, style, labelStyle }: {
  checked: boolean; onToggle: () => void; label: string; size?: number; radius?: number;
  style?: StyleProp<ViewStyle>; labelStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable onPress={onToggle} hitSlop={6} accessibilityRole="checkbox" accessibilityState={{ checked }} style={[styles.check, style]}>
      <View style={[styles.checkBox, { width: size, height: size, borderRadius: radius }, checked && styles.checkOn]}>
        {checked ? <MaterialCommunityIcons name="check-bold" size={size * 0.68} color={colors.white} /> : null}
      </View>
      <Text style={[styles.checkLabel, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

/**
 * CTA de las pantallas de acceso (C15a con las medidas de cada PNG): alto, radio y color configurables.
 * Deshabilitado = `disabledBg` + `disabledText`.
 */
export function AuthButton({ title, onPress, loading, disabled, height = 52, radius = 13, color = colors.blue, textStyle, style, variant = "primary" }: {
  title: string; onPress?: () => void; loading?: boolean; disabled?: boolean; height?: number; radius?: number; color?: string;
  textStyle?: StyleProp<TextStyle>; style?: StyleProp<ViewStyle>;
  /** `outline` = blanco con borde gris y texto azul (C15e). */
  variant?: "primary" | "outline";
}) {
  const off = disabled && !loading;
  const outline = variant === "outline";
  const fg = outline ? colors.blueText : off ? colors.disabledText : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      style={({ pressed }) => [
        styles.btn,
        { height, borderRadius: radius },
        outline ? styles.btnOutline : { backgroundColor: off ? colors.disabledBg : pressed ? colors.blueDark : color },
        outline && pressed ? { opacity: 0.8 } : null,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.btnText, { color: fg }, textStyle]} numberOfLines={1}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white },
  multi: { alignItems: "flex-start" },
  input: { flex: 1, alignSelf: "stretch", color: colors.ink, paddingVertical: 0 },
  inputMulti: { textAlignVertical: "top", paddingTop: 12 },
  below: { fontSize: 13.2, lineHeight: 18, color: "#838BA0", marginTop: 7, letterSpacing: -0.28 },
  check: { flexDirection: "row", alignItems: "center" },
  checkBox: { borderWidth: 1.2, borderColor: "#B6BAC3", alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  checkOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  checkLabel: { flex: 1, fontSize: 14.5, lineHeight: 20, color: colors.ink, marginLeft: 13 },
  btn: { alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  btnOutline: { backgroundColor: colors.white, borderWidth: 1, borderColor: "#D5D9E1" },
  btnText: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
});
