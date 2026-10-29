import React, { createContext, useContext } from "react";
import { Text as RNText, TextProps } from "react-native";
import { colors, typography } from "@yava/shared";

export type TextVariant = keyof typeof typography;
export type TextTone =
  | "default" | "muted" | "subtle" | "primary" | "danger" | "success" | "inverse" | "warning"
  | "secondary" | "tertiary" | "placeholder" | "link" | "selected" | "navy" | "category";

const toneColor: Record<TextTone, string> = {
  default: colors.ink,
  muted: colors.textTertiary,
  subtle: colors.textPlaceholder,
  primary: colors.blue,
  danger: colors.red,
  success: colors.green,
  inverse: colors.white,
  warning: colors.orange,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  placeholder: colors.textPlaceholder,
  link: colors.blueLink,
  selected: colors.blueText,
  navy: colors.blueNavy,
  category: colors.textCategory,
};

/** `true` dentro de otro `<Text>`: el texto anidado hereda tamaño e interlineado del padre. */
const NestedText = createContext(false);

/**
 * Texto con la escala de `typography` y los tonos del diseño.
 * Ej.: `<Text variant="section">Restaurantes cerca</Text>`, `<Text variant="meta" tone="tertiary">…</Text>`.
 * Un `<Text>` anidado sin `variant` hereda el tamaño del padre (solo aplica su `tone`, tinta por defecto).
 */
export function Text({ variant, tone = "default", style, ...rest }: TextProps & { variant?: TextVariant; tone?: TextTone }) {
  const nested = useContext(NestedText);
  const base = variant ? typography[variant] : nested ? null : typography.body;
  return (
    <NestedText.Provider value>
      <RNText {...rest} style={[base, { color: toneColor[tone] }, style]} />
    </NestedText.Provider>
  );
}
