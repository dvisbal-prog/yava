/**
 * Design tokens YAVA · Rediseño V2.
 * Fondo blanco, texto carbón y gris, azul YAVA para acciones, amarillo como acento,
 * punto rojo del logo como color de alerta.
 */
export const colors = {
  blue: "#1E5EFF",
  blueDark: "#1547C9",
  blueSoft: "#E8EFFF",
  yellow: "#FFC72C",
  yellowSoft: "#FFF4D1",
  red: "#E5322D",
  redSoft: "#FDE8E7",
  green: "#1F9D55",
  greenSoft: "#E3F5EA",
  orange: "#F2994A",
  orangeSoft: "#FDF0E3",
  carbon: "#1B1F24",
  gray900: "#2B3139",
  gray700: "#4B5563",
  gray500: "#6B7280",
  gray400: "#9CA3AF",
  gray300: "#D1D5DB",
  gray200: "#E5E7EB",
  gray100: "#F3F4F6",
  gray50: "#F9FAFB",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  small: { fontSize: 11, lineHeight: 14, fontWeight: "500" as const },
} as const;
