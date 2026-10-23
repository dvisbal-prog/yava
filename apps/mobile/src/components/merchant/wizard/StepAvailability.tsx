import React from "react";
import { View, Alert } from "react-native";
import { Text, Input, Button } from "@/components/ui";
import { SwitchRow } from "@/components/merchant/Rows";
import { useProductDraft, isValidTime, validateForPublish } from "@/features/merchant/productDraft";
import { WizardFrame } from "./WizardFrame";

/** Paso 79 · Disponibilidad y existencias. */
export function StepAvailability({ onPublish, onSaveDraft, saving, progress }: { onPublish: () => void; onSaveDraft: () => void; saving: boolean; progress: { done: number; total: number } | null }) {
  const d = useProductDraft();
  const isEdit = d.mode === "edit";
  const timesOk = isValidTime(d.availableFrom) && isValidTime(d.availableTo);
  const pending = d.photos.filter((p) => p.upload !== "done").length;
  const v = validateForPublish(d);
  const missingNonPhoto = v.missing.filter((m) => !m.startsWith("al menos"));

  const publish = () => {
    if (!timesOk) { Alert.alert("Horario inválido", "Usa el formato HH:MM, por ejemplo 11:00."); return; }
    if (missingNonPhoto.length) { Alert.alert("Falta información", `Para publicar necesitas: ${missingNonPhoto.join(", ")}.`); return; }
    if (!d.photos.length) { Alert.alert("Agrega una foto", "Para publicar necesitas al menos una foto. Puedes guardar como borrador mientras tanto."); return; }
    onPublish();
  };

  return (
    <WizardFrame title="Disponibilidad" step="availability" onBack={() => d.setStep(isEdit ? "details" : "options")}
      footer={isEdit ? <Button title="Listo" onPress={() => { if (!timesOk) { Alert.alert("Horario inválido", "Usa el formato HH:MM."); return; } d.setStep("details"); }} /> : (
        <View>
          <Button title={d.status === "paused" ? "Guardar pausado" : "Publicar producto"} onPress={publish} loading={saving} />
          <Button title="Guardar borrador" variant="ghost" onPress={onSaveDraft} disabled={saving} style={{ marginTop: 6 }} />
        </View>
      )}>
      {progress ? <Text variant="caption" tone="primary" style={{ marginBottom: 8 }}>Subiendo fotos {progress.done} de {progress.total}…</Text> : null}
      <SwitchRow label={d.status === "published" ? "Publicado" : "Pausado"} hint={d.status === "published" ? "Visible en tu menú y disponible para pedir" : "Oculto para los clientes sin eliminarlo"} value={d.status === "published"} onValueChange={(v) => d.patch({ status: v ? "published" : "paused" })} />
      <SwitchRow label="Controlar inventario" hint="Descontamos al confirmar cada pedido y pausamos al llegar a cero" value={d.trackStock} onValueChange={(v) => d.patch({ trackStock: v })} />
      {d.trackStock ? <Input label="Existencias disponibles" keyboardType="number-pad" placeholder="20" value={d.stock} onChangeText={(t) => d.patch({ stock: t.replace(/\D/g, "") })} containerStyle={{ marginTop: 12 }} /> : null}
      <Text variant="heading" style={{ marginTop: 20, marginBottom: 4 }}>Horario de disponibilidad</Text>
      <Text variant="caption" tone="muted" style={{ marginBottom: 10 }}>Opcional. Déjalo vacío para que esté disponible siempre que el comercio esté abierto.</Text>
      <View style={{ flexDirection: "row" }}>
        <Input label="Desde" placeholder="11:00" value={d.availableFrom} onChangeText={(t) => d.patch({ availableFrom: t })} containerStyle={{ flex: 1, marginRight: 8 }} error={isValidTime(d.availableFrom) ? null : "HH:MM"} keyboardType="numbers-and-punctuation" />
        <Input label="Hasta" placeholder="22:00" value={d.availableTo} onChangeText={(t) => d.patch({ availableTo: t })} containerStyle={{ flex: 1 }} error={isValidTime(d.availableTo) ? null : "HH:MM"} keyboardType="numbers-and-punctuation" />
      </View>
      {!isEdit ? (
        <Text variant="caption" tone="subtle" style={{ marginTop: 8 }}>
          {pending ? `${pending} ${pending === 1 ? "foto se subirá" : "fotos se subirán"} al publicar. ` : ""}
          Si alguna subida falla, el producto se guarda como borrador y puedes reintentar.
        </Text>
      ) : null}
    </WizardFrame>
  );
}
