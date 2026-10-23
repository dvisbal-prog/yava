import React, { useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { colors, formatCOP } from "@yava/shared";
import { Text, Input, Chip, Button, ListRow } from "@/components/ui";
import { useProductDraft, parsePrice, validateDraftBasics } from "@/features/merchant/productDraft";
import { useProductCategories } from "@/features/merchant/useMerchant";
import { WizardFrame, FieldLabel } from "./WizardFrame";

/** Paso 73 · Datos del producto (también formulario de edición 55). */
export function StepDetails({ onBack, onSaveDraft, onSaveEdit, onDelete, saving }: {
  onBack: () => void; onSaveDraft: () => void; onSaveEdit?: () => void; onDelete?: () => void; saving: boolean;
}) {
  const d = useProductDraft();
  const { data: categories } = useProductCategories(d.merchantId ?? undefined);
  const [newCat, setNewCat] = useState(false);
  const [touched, setTouched] = useState(false);
  const v = validateDraftBasics(d);
  const price = parsePrice(d.price);
  const uploaded = d.photos.filter((p) => p.upload === "done").length;
  const isEdit = d.mode === "edit";

  const next = () => {
    setTouched(true);
    if (!v.ok) { Alert.alert("Completa los datos", `Falta: ${v.missing.join(", ")}.`); return; }
    d.setStep(d.photos.length ? "organize" : "source");
  };

  const footer = isEdit ? (
    <View>
      <Button title="Guardar cambios" onPress={onSaveEdit} loading={saving} />
      {onDelete ? <Button title="Eliminar producto" variant="ghost" onPress={onDelete} style={{ marginTop: 6 }} /> : null}
    </View>
  ) : (
    <View>
      <Button title="Continuar" onPress={next} loading={saving} />
      <Button title="Guardar borrador" variant="ghost" onPress={onSaveDraft} disabled={saving} style={{ marginTop: 6 }} />
    </View>
  );

  return (
    <WizardFrame title={isEdit ? "Editar producto" : "Nuevo producto"} step="details" onBack={onBack} footer={footer} badge={isEdit ? (d.status === "paused" ? "Pausado" : "Publicado") : "Borrador"}>
      <Input label="Nombre" placeholder="Ceviche tropical" value={d.name} onChangeText={(t) => d.patch({ name: t })} error={touched && !d.name.trim() ? "Escribe el nombre" : null} />
      <FieldLabel>Categoría</FieldLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ paddingRight: 8 }}>
        {(categories ?? []).map((c) => (
          <Chip key={c.id} label={c.name} selected={d.categoryId === c.id && !newCat} onPress={() => { setNewCat(false); d.patch({ categoryId: c.id, newCategoryName: "" }); }} />
        ))}
        <Chip label="Nueva categoría" icon="add" selected={newCat} onPress={() => { setNewCat(true); d.patch({ categoryId: null }); }} />
      </ScrollView>
      {newCat ? <Input placeholder="Nombre de la nueva categoría" value={d.newCategoryName} onChangeText={(t) => d.patch({ newCategoryName: t })} autoFocus /> : <View style={{ height: 6 }} />}

      <Input label="Precio" placeholder="30.000" keyboardType="number-pad" value={d.price} onChangeText={(t) => d.patch({ price: t.replace(/[^\d.]/g, "") })}
        icon="cash-outline" hint={price != null ? `Se mostrará como ${formatCOP(price)}` : undefined} error={touched && price == null ? "Ingresa un precio válido" : null} />
      <Input label="Descripción" placeholder="Camarones, mango, limón y cebolla morada." value={d.description} onChangeText={(t) => d.patch({ description: t })} multiline style={{ minHeight: 72, textAlignVertical: "top" }} />

      <View style={{ borderTopWidth: 1, borderTopColor: colors.gray100, marginTop: 4 }}>
        <ListRow icon="images-outline" title="Agregar fotos" subtitle={uploaded || d.photos.length ? `${d.photos.length} de 5 fotos` : "Hasta 5 fotos"} onPress={() => d.setStep(d.photos.length ? "organize" : "source")} />
        <ListRow icon="options-outline" title="Opciones y adicionales" subtitle={d.groups.length ? `${d.groups.length} ${d.groups.length === 1 ? "grupo" : "grupos"}` : "Agrega opciones como picante, extras, etc."} onPress={() => d.setStep("options")} />
        <ListRow icon="time-outline" title="Disponibilidad" subtitle={d.trackStock ? `Inventario: ${d.stock || 0} unidades` : "Define cuándo estará disponible este producto."} onPress={() => d.setStep("availability")} />
      </View>
      {d.photos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {d.photos.map((p, i) => (
            <Pressable key={p.key} onPress={() => d.setStep("organize")} style={{ marginRight: 8 }}>
              <PhotoThumb uri={p.uri} size={64} principal={i === 0} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {isEdit ? <Text variant="caption" tone="subtle" style={{ marginTop: 14 }}>Los cambios se aplican al guardar. Las fotos nuevas se suben al guardar.</Text> : null}
    </WizardFrame>
  );
}

export function PhotoThumb({ uri, size, principal, status }: { uri: string; size: number; principal?: boolean; status?: "idle" | "uploading" | "done" | "error" }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 12, overflow: "hidden", backgroundColor: colors.gray100 }}>
      <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      {principal ? <View style={{ position: "absolute", left: 4, top: 4, backgroundColor: colors.yellow, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}><Text variant="small">Principal</Text></View> : null}
      {status === "error" ? <View style={{ position: "absolute", right: 4, bottom: 4 }}><Ionicons name="alert-circle" size={18} color={colors.red} /></View> : null}
      {status === "uploading" ? <View style={{ position: "absolute", right: 4, bottom: 4 }}><Ionicons name="cloud-upload-outline" size={18} color={colors.blue} /></View> : null}
    </View>
  );
}
