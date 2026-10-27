import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP } from "@yava/shared";
import { Text, Input, Button, Card } from "@/components/ui";
import { SwitchRow } from "@/components/merchant/Rows";
import { useProductDraft, nextKey, parsePrice } from "@/features/merchant/productDraft";
import type { DraftGroup, DraftOption } from "@/features/merchant/productDraft";
import { confirm, notify } from "@/lib/dialog";
import { WizardFrame } from "./WizardFrame";

function newGroup(): DraftGroup {
  return { key: nextKey("g"), id: null, name: "", minSelect: "0", maxSelect: "1", required: false, options: [newOption()] };
}
function newOption(): DraftOption {
  return { key: nextKey("o"), id: null, name: "", priceDelta: "0", available: true };
}

/** Paso 78 · Opciones y adicionales. */
export function StepOptions() {
  const d = useProductDraft();
  const isEdit = d.mode === "edit";
  const updateGroup = (key: string, patch: Partial<DraftGroup>) => d.setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  const updateOption = (gkey: string, okey: string, patch: Partial<DraftOption>) =>
    d.setGroups((gs) => gs.map((g) => (g.key === gkey ? { ...g, options: g.options.map((o) => (o.key === okey ? { ...o, ...patch } : o)) } : g)));
  const removeGroup = async (key: string) => {
    if (await confirm("Eliminar grupo", "Se quitarán también sus opciones.", { okText: "Eliminar", destructive: true })) d.setGroups((gs) => gs.filter((g) => g.key !== key));
  };

  const invalid = d.groups.find((g) => g.name.trim() && Number(g.minSelect || 0) > Math.max(1, Number(g.maxSelect || 1)));
  const next = () => {
    if (invalid) { notify("Revisa las opciones", `En "${invalid.name}" el mínimo no puede superar el máximo.`); return; }
    d.setStep(isEdit ? "details" : "availability");
  };

  return (
    <WizardFrame title="Opciones y adicionales" step="options" onBack={() => d.setStep(isEdit ? "details" : "organize")}
      footer={<View>
        <Button title={isEdit ? "Listo" : "Continuar"} onPress={next} />
        {!isEdit ? <Button title="Omitir por ahora" variant="ghost" onPress={() => d.setStep("availability")} style={{ marginTop: 6 }} /> : null}
      </View>}>
      <Text tone="muted" style={{ marginBottom: 12 }}>Agrega grupos como "Nivel de picante" (obligatorio) o "Adicionales" con precio extra.</Text>
      {d.groups.map((g, gi) => (
        <Card key={g.key} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text variant="heading" style={{ flex: 1 }}>Grupo {gi + 1}</Text>
            <Pressable onPress={() => removeGroup(g.key)} hitSlop={8}><Ionicons name="trash-outline" size={20} color={colors.red} /></Pressable>
          </View>
          <Input label="Nombre del grupo" placeholder="Nivel de picante" value={g.name} onChangeText={(t) => updateGroup(g.key, { name: t })} />
          <View style={{ flexDirection: "row" }}>
            <Input label="Mínimo" keyboardType="number-pad" value={g.minSelect} onChangeText={(t) => updateGroup(g.key, { minSelect: t.replace(/\D/g, "") })} containerStyle={{ flex: 1, marginRight: 8 }} />
            <Input label="Máximo" keyboardType="number-pad" value={g.maxSelect} onChangeText={(t) => updateGroup(g.key, { maxSelect: t.replace(/\D/g, "") })} containerStyle={{ flex: 1 }} />
          </View>
          <SwitchRow label="Obligatorio" hint="El cliente debe elegir al menos el mínimo" value={g.required} onValueChange={(v) => updateGroup(g.key, { required: v, minSelect: v && Number(g.minSelect || 0) === 0 ? "1" : g.minSelect })} />
          <Text variant="caption" tone="muted" style={{ marginTop: 12, marginBottom: 6 }}>Opciones</Text>
          {g.options.map((o) => (
            <View key={o.key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Input placeholder="Aguacate" value={o.name} onChangeText={(t) => updateOption(g.key, o.key, { name: t })} containerStyle={{ flex: 1, marginBottom: 0, marginRight: 8 }} />
              <Input placeholder="+0" keyboardType="number-pad" value={o.priceDelta} onChangeText={(t) => updateOption(g.key, o.key, { priceDelta: t.replace(/[^\d]/g, "") })} containerStyle={{ width: 96, marginBottom: 0, marginRight: 4 }} />
              <Pressable onPress={() => d.setGroups((gs) => gs.map((x) => (x.key === g.key ? { ...x, options: x.options.filter((y) => y.key !== o.key) } : x)))} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name="close-circle-outline" size={20} color={colors.gray400} />
              </Pressable>
            </View>
          ))}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <Button title="Agregar opción" size="sm" variant="ghost" icon="add" full={false} onPress={() => updateGroup(g.key, { options: [...g.options, newOption()] })} />
            <View style={{ flex: 1 }} />
            <Text variant="small" tone="subtle">{g.options.filter((o) => parsePrice(o.priceDelta)).map((o) => `${o.name || "?"} ${formatCOP(parsePrice(o.priceDelta) ?? 0)}`).slice(0, 2).join(" · ")}</Text>
          </View>
        </Card>
      ))}
      <Button title="Agregar grupo de opciones" variant="secondary" icon="add" onPress={() => d.setGroups((gs) => [...gs, newGroup()])} />
    </WizardFrame>
  );
}
