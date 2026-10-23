import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";
import { colors, typography } from "@yava/shared";

type Variant = keyof typeof typography;
type Tone = "default" | "muted" | "subtle" | "primary" | "danger" | "success" | "inverse" | "warning";

const toneColor: Record<Tone, string> = {
  default: colors.carbon, muted: colors.gray500, subtle: colors.gray400, primary: colors.blue,
  danger: colors.red, success: colors.green, inverse: colors.white, warning: colors.orange,
};

export function Text({ variant = "body", tone = "default", style, ...rest }: TextProps & { variant?: Variant; tone?: Tone }) {
  return <RNText {...rest} style={[styles.base, typography[variant], { color: toneColor[tone] }, style]} />;
}
const styles = StyleSheet.create({ base: { fontFamily: undefined } });
