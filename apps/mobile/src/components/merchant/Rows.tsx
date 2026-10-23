import React from "react";
import { View, Switch, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text, Button, Skeleton } from "@/components/ui";

/** Fila etiqueta · valor (desgloses de dinero). */
export function MoneyRow({ label, value, hint, strong, tone = "default", negative }: {
  label: string; value: string; hint?: string; strong?: boolean; tone?: "default" | "muted" | "primary" | "success" | "danger"; negative?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 8 }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text variant={strong ? "bodyStrong" : "body"}>{label}</Text>
        {hint ? <Text variant="caption" tone="muted">{hint}</Text> : null}
      </View>
      <Text variant={strong ? "heading" : "bodyStrong"} tone={tone}>{negative ? `−${value}` : value}</Text>
    </View>
  );
}

/** Fila con interruptor. */
export function SwitchRow({ label, hint, value, onValueChange, disabled }: { label: string; hint?: string; value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text variant="bodyStrong">{label}</Text>
        {hint ? <Text variant="caption" tone="muted">{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} trackColor={{ true: colors.blue, false: colors.gray300 }} thumbColor={colors.white} />
    </View>
  );
}

/** Estado de error con reintento. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
      <Ionicons name="alert-circle-outline" size={36} color={colors.red} />
      <Text tone="muted" style={{ textAlign: "center", marginTop: 10, marginBottom: 14 }}>{message}</Text>
      {onRetry ? <Button title="Reintentar" variant="secondary" size="md" full={false} onPress={onRetry} /> : null}
    </View>
  );
}

/** Título de sección con acción opcional a la derecha. */
export function SectionTitle({ title, actionTitle, onAction, style }: { title: string; actionTitle?: string; onAction?: () => void; style?: object }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 10 }, style]}>
      <Text variant="heading" style={{ flex: 1 }}>{title}</Text>
      {actionTitle ? (
        <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: "row", alignItems: "center" }}>
          <Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>{actionTitle}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.blue} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Punto de estado "• Abierto / • Cerrado". */
export function StatusDot({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: active ? colors.green : colors.gray400, marginRight: 6 }} />
      <Text variant="caption" style={{ color: active ? colors.green : colors.gray500, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

/** Selector de opciones en fila (chips grandes), p. ej. tipo de negocio o vehículo. */
export function OptionGrid<K extends string>({ options, value, onChange }: { options: { key: K; label: string; icon?: keyof typeof Ionicons.glyphMap }[]; value: K | null; onChange: (k: K) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 14 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={{
            flexDirection: "row", alignItems: "center", paddingHorizontal: 14, height: 44, borderRadius: 12, margin: 4,
            borderWidth: 1, borderColor: active ? colors.blue : colors.gray200, backgroundColor: active ? colors.blueSoft : colors.white,
          }}>
            {o.icon ? <Ionicons name={o.icon} size={18} color={active ? colors.blue : colors.gray500} style={{ marginRight: 8 }} /> : null}
            <Text variant="bodyStrong" style={{ color: active ? colors.blue : colors.carbon }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Lista de skeletons para pantallas en carga. */
export function ListSkeleton({ rows = 3, height = 96 }: { rows?: number; height?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} height={height} style={{ marginBottom: 12, borderRadius: 16 }} />)}
    </View>
  );
}
