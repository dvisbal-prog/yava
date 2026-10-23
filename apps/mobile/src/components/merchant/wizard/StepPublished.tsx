import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, radius } from "@yava/shared";
import { Text, Button, Card, Badge } from "@/components/ui";
import { useProductDraft, parsePrice } from "@/features/merchant/productDraft";
import { WizardFrame } from "./WizardFrame";

/** Paso 80 · Publicado. */
export function StepPublished({ merchantName, result, onViewMenu, onEdit, onRetry }: {
  merchantName: string; result: { status: "draft" | "published" | "paused"; reason?: string }; onViewMenu: () => void; onEdit: () => void; onRetry: () => void;
}) {
  const d = useProductDraft();
  const ok = result.status !== "draft";
  const main = d.photos[0];
  const title = result.status === "published" ? "Producto publicado" : result.status === "paused" ? "Producto guardado (pausado)" : "Guardado como borrador";
  return (
    <WizardFrame title={title} step="published" onBack={onViewMenu} badge={null}
      footer={<View>
        <Button title="Volver al menú" onPress={onViewMenu} />
        <Button title={ok ? "Editar producto" : "Reintentar publicación"} variant="ghost" onPress={ok ? onEdit : onRetry} style={{ marginTop: 6 }} />
      </View>}>
      <View style={{ alignItems: "center", marginVertical: 12 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ok ? colors.greenSoft : colors.yellowSoft, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={ok ? "checkmark" : "document-text-outline"} size={32} color={ok ? colors.green : "#8A6400"} />
        </View>
        <Text tone="muted" style={{ marginTop: 10, textAlign: "center" }}>
          {result.status === "published" ? `Ya está visible en el menú de ${merchantName}.` : result.status === "paused" ? "Está en tu menú pero oculto para los clientes." : result.reason ?? "Puedes completarlo más tarde desde Mi menú."}
        </Text>
      </View>
      <Card padded={false}>
        {main ? <Image source={{ uri: main.remoteUrl ?? main.uri }} style={{ width: "100%", height: 200, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }} contentFit="cover" /> : null}
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text variant="heading" style={{ flex: 1 }}>{d.name}</Text>
            <Text variant="heading" tone="primary">{formatCOP(parsePrice(d.price) ?? 0)}</Text>
          </View>
          {d.description ? <Text tone="muted" style={{ marginTop: 4 }}>{d.description}</Text> : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
            <View style={{ marginRight: 6, marginBottom: 6 }}><Badge label={result.status === "published" ? "Publicado" : result.status === "paused" ? "Pausado" : "Borrador"} tone={result.status === "published" ? "green" : result.status === "paused" ? "yellow" : "gray"} /></View>
            {d.trackStock ? <View style={{ marginRight: 6, marginBottom: 6 }}><Badge label={`${d.stock || 0} disponibles`} tone="blue" /></View> : null}
            {d.photos.length ? <View style={{ marginRight: 6, marginBottom: 6 }}><Badge label={`${d.photos.filter((p) => p.upload === "done").length} ${d.photos.length === 1 ? "foto" : "fotos"}`} tone="gray" /></View> : null}
          </View>
          {d.groups.filter((g) => g.name.trim()).map((g) => (
            <View key={g.key} style={{ flexDirection: "row", paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.gray100 }}>
              <Text variant="caption" style={{ flex: 1 }}>{g.name}</Text>
              <Text variant="caption" tone="muted">{g.options.filter((o) => o.name.trim()).length} opciones{g.required ? " · obligatorio" : ""}</Text>
            </View>
          ))}
        </View>
      </Card>
    </WizardFrame>
  );
}
