import React from "react";
import { View } from "react-native";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Badge } from "@/components/ui";
import type { WizardStep } from "@/features/merchant/productDraft";
import { WIZARD_ORDER } from "@/features/merchant/productDraft";

/** Marco común de los pasos del asistente de producto (73–80). */
export function WizardFrame({ title, step, onBack, footer, children, badge = "Borrador", scroll = true, right }: {
  title: string; step: WizardStep; onBack: () => void; footer?: React.ReactNode; children: React.ReactNode; badge?: string | null; scroll?: boolean; right?: React.ReactNode;
}) {
  const idx = WIZARD_ORDER.indexOf(step);
  const total = WIZARD_ORDER.length - 1; // "published" no cuenta como paso
  return (
    <Screen scroll={scroll} padded={false} footer={footer}>
      <Header title={title} onBack={onBack} right={right ?? (badge ? <Badge label={badge} tone={badge === "Publicado" ? "green" : "gray"} /> : null)} />
      {step !== "published" ? (
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 12 }}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, marginHorizontal: 2, borderRadius: 2, backgroundColor: i <= idx ? colors.blue : colors.gray200 }} />
          ))}
        </View>
      ) : null}
      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>{children}</View>
    </Screen>
  );
}

export function FieldLabel({ children }: { children: string }) {
  return <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>{children}</Text>;
}
