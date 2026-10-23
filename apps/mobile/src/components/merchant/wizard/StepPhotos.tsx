import React, { useState } from "react";
import { View, Pressable, Alert, Linking, ActivityIndicator, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { colors, radius } from "@yava/shared";
import { Text, Button, Card, Badge } from "@/components/ui";
import { useProductDraft, nextKey } from "@/features/merchant/productDraft";
import type { DraftPhoto } from "@/features/merchant/productDraft";
import { rotatePhoto, cropSquare } from "@/features/merchant/upload";
import { errorMessage } from "@/lib/errors";
import { WizardFrame } from "./WizardFrame";
import { PhotoThumb } from "./StepDetails";

export const MAX_PHOTOS = 5;

function toDraft(a: ImagePicker.ImagePickerAsset): DraftPhoto {
  return { key: nextKey("p"), uri: a.uri, width: a.width, height: a.height, remoteUrl: null, upload: "idle" };
}

/** Paso 74 · Cámara o galería. */
export function StepSource({ onSaveDraft }: { onSaveDraft: () => void }) {
  const d = useProductDraft();
  const remaining = MAX_PHOTOS - d.photos.length;
  const [busy, setBusy] = useState<"camera" | "gallery" | null>(null);

  const denied = (which: "cámara" | "galería", other: () => void) => {
    Alert.alert(
      `Sin acceso a la ${which}`,
      `Puedes permitirlo en Ajustes, usar ${which === "cámara" ? "la galería" : "la cámara"} o guardar el producto como borrador.`,
      [
        { text: "Abrir ajustes", onPress: () => Linking.openSettings().catch(() => {}) },
        { text: which === "cámara" ? "Usar galería" : "Usar cámara", onPress: other },
        { text: "Guardar borrador", onPress: onSaveDraft },
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  const takePhoto = async () => {
    setBusy("camera");
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { denied("cámara", pickGallery); return; }
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 });
      if (res.canceled || !res.assets.length) return;
      const photo = toDraft(res.assets[0]);
      d.setPhotos((ps) => [...ps, photo]);
      d.patch({ adjustIndex: d.photos.length });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      d.setStep("adjust");
    } catch (e) {
      Alert.alert("No se pudo abrir la cámara", errorMessage(e));
    } finally { setBusy(null); }
  };

  const pickGallery = async () => {
    setBusy("gallery");
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { denied("galería", takePhoto); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: remaining, quality: 1, orderedSelection: true });
      if (res.canceled || !res.assets.length) return;
      d.patch({ candidates: res.assets.map(toDraft) });
      d.setStep("select");
    } catch (e) {
      Alert.alert("No se pudo abrir la galería", errorMessage(e));
    } finally { setBusy(null); }
  };

  return (
    <WizardFrame title="Agregar fotos" step="source" onBack={() => d.setStep(d.photos.length ? "organize" : "details")}
      footer={<Button title="Cancelar" variant="ghost" onPress={() => d.setStep(d.photos.length ? "organize" : "details")} />}>
      <Text variant="title" style={{ marginBottom: 4 }}>Elige cómo quieres subirlas</Text>
      <Text tone="muted" style={{ marginBottom: 20 }}>Puedes agregar hasta {MAX_PHOTOS} fotos. Te quedan {remaining}.</Text>
      <SourceOption icon="camera-outline" title="Tomar foto" body="Usa la cámara de tu celular" onPress={takePhoto} loading={busy === "camera"} disabled={remaining <= 0} />
      <SourceOption icon="images-outline" title="Elegir de la galería" body={`Selecciona hasta ${remaining} fotos`} onPress={pickGallery} loading={busy === "gallery"} disabled={remaining <= 0} />
      <Text variant="caption" tone="subtle" style={{ marginTop: 12 }}>Aceptamos JPEG, PNG y HEIC hasta 10 MB. Las optimizamos al subir.</Text>
    </WizardFrame>
  );
}

function SourceOption({ icon, title, body, onPress, loading, disabled }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <Card onPress={disabled ? undefined : onPress} style={{ marginBottom: 12, opacity: disabled ? 0.5 : 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
          {loading ? <ActivityIndicator color={colors.blue} /> : <Ionicons name={icon} size={24} color={colors.blue} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="caption" tone="muted">{body}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
      </View>
    </Card>
  );
}

/** Paso 75 · Selección múltiple (hasta 5). */
export function StepSelect() {
  const d = useProductDraft();
  const remaining = MAX_PHOTOS - d.photos.length;
  const [selected, setSelected] = useState<string[]>(() => d.candidates.slice(0, remaining).map((c) => c.key));

  const toggle = (key: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelected((s) => {
      if (s.includes(key)) return s.filter((k) => k !== key);
      if (s.length >= remaining) { Alert.alert("Límite de fotos", `Solo puedes agregar ${remaining} más.`); return s; }
      return [...s, key];
    });
  };

  const confirm = () => {
    const chosen = selected.map((k) => d.candidates.find((c) => c.key === k)).filter((c): c is DraftPhoto => !!c);
    const startIdx = d.photos.length;
    d.setPhotos((ps) => [...ps, ...chosen]);
    d.patch({ candidates: [], adjustIndex: startIdx });
    d.setStep(chosen.length ? "adjust" : "organize");
  };

  return (
    <WizardFrame title="Seleccionar fotos" step="select" onBack={() => { d.patch({ candidates: [] }); d.setStep("source"); }}
      footer={<Button title={selected.length ? `Agregar ${selected.length} ${selected.length === 1 ? "foto" : "fotos"}` : "Selecciona al menos una"} disabled={!selected.length} onPress={confirm} />}>
      <Text tone="muted" style={{ marginBottom: 12 }}>Toca para seleccionar. Hasta {remaining} {remaining === 1 ? "foto" : "fotos"} más.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
        {d.candidates.map((c) => {
          const idx = selected.indexOf(c.key);
          return (
            <Pressable key={c.key} onPress={() => toggle(c.key)} style={{ width: "33.33%", padding: 4 }}>
              <View style={{ aspectRatio: 1, borderRadius: radius.md, overflow: "hidden", borderWidth: 2, borderColor: idx >= 0 ? colors.blue : "transparent" }}>
                <Image source={{ uri: c.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                <View style={{ position: "absolute", right: 6, top: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: idx >= 0 ? colors.blue : "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.white }}>
                  {idx >= 0 ? <Text variant="small" tone="inverse">{idx + 1}</Text> : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </WizardFrame>
  );
}

/** Paso 76 · Ajustar (rotar, recorte cuadrado). */
export function StepAdjust() {
  const d = useProductDraft();
  const photo = d.photos[d.adjustIndex];
  const [busy, setBusy] = useState(false);
  const isLast = d.adjustIndex >= d.photos.length - 1;
  const local = photo && !photo.remoteUrl;

  const apply = async (fn: (p: DraftPhoto) => Promise<{ uri: string; width: number; height: number }>) => {
    if (!photo || !local) return;
    setBusy(true);
    try {
      const out = await fn(photo);
      d.setPhotos((ps) => ps.map((p) => (p.key === photo.key ? { ...p, uri: out.uri, width: out.width, height: out.height, upload: "idle" } : p)));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (e) {
      Alert.alert("No se pudo ajustar la foto", errorMessage(e));
    } finally { setBusy(false); }
  };

  const nextPhoto = () => {
    // Saltar las ya subidas (remotas), que no se pueden editar localmente
    let i = d.adjustIndex + 1;
    while (i < d.photos.length && d.photos[i].remoteUrl) i++;
    if (i >= d.photos.length) d.setStep("organize"); else d.patch({ adjustIndex: i });
  };

  if (!photo) {
    return (
      <WizardFrame title="Ajustar foto" step="adjust" onBack={() => d.setStep("organize")} footer={<Button title="Continuar" onPress={() => d.setStep("organize")} />}>
        <Text tone="muted">No hay fotos para ajustar.</Text>
      </WizardFrame>
    );
  }

  return (
    <WizardFrame title={`Ajustar foto ${d.adjustIndex + 1} de ${d.photos.length}`} step="adjust" onBack={() => d.setStep("organize")}
      footer={<Button title={isLast ? "Listo" : "Siguiente foto"} onPress={nextPhoto} disabled={busy} />}>
      <View style={{ aspectRatio: 1, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" }}>
        <Image source={{ uri: photo.uri }} style={{ width: "100%", height: "100%" }} contentFit="contain" />
        {busy ? <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.6)" }]}><ActivityIndicator color={colors.blue} /></View> : null}
      </View>
      {photo.width && photo.height ? <Text variant="caption" tone="muted" style={{ marginTop: 8, textAlign: "center" }}>{photo.width} × {photo.height} px{photo.width === photo.height ? " · cuadrada" : ""}</Text> : null}
      {!local ? <Badge label="Foto ya publicada: no se puede editar" tone="gray" /> : null}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
        <ToolButton icon="refresh-outline" label="Rotar" onPress={() => apply((p) => rotatePhoto(p.uri, 90))} disabled={busy || !local} />
        <ToolButton icon="crop-outline" label="Cuadrado 1:1" onPress={() => apply((p) => cropSquare(p.uri, p.width, p.height))} disabled={busy || !local || photo.width === photo.height} />
        <ToolButton icon="trash-outline" label="Quitar" danger onPress={() => {
          d.setPhotos((ps) => ps.filter((p) => p.key !== photo.key));
          if (d.photos.length <= 1) d.setStep("source"); else d.patch({ adjustIndex: Math.min(d.adjustIndex, d.photos.length - 2) });
        }} disabled={busy} />
      </View>
      <Text variant="caption" tone="subtle" style={{ marginTop: 16, textAlign: "center" }}>El recorte ajusta el encuadre y la orientación. Las fotos se optimizan a 1600 px al subir.</Text>
    </WizardFrame>
  );
}

function ToolButton({ icon, label, onPress, disabled, danger }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ alignItems: "center", marginHorizontal: 14, opacity: disabled ? 0.4 : 1 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: danger ? colors.redSoft : colors.blueSoft, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={22} color={danger ? colors.red : colors.blue} />
      </View>
      <Text variant="small" tone="muted" style={{ marginTop: 6 }}>{label}</Text>
    </Pressable>
  );
}

/** Paso 77 · Organizar: principal, reordenar, eliminar. */
export function StepOrganize({ progress }: { progress: { done: number; total: number } | null }) {
  const d = useProductDraft();
  const move = (from: number, to: number) => {
    if (to < 0 || to >= d.photos.length) return;
    Haptics.selectionAsync().catch(() => {});
    d.setPhotos((ps) => { const c = [...ps]; const [it] = c.splice(from, 1); c.splice(to, 0, it); return c; });
  };
  return (
    <WizardFrame title="Fotos del producto" step="organize" onBack={() => d.setStep("details")}
      footer={<Button title="Continuar" onPress={() => d.setStep("options")} disabled={!d.photos.length} />}>
      <Text tone="muted" style={{ marginBottom: 12 }}>La primera foto es la principal. Reordena o elimina las demás.</Text>
      {progress ? <Text variant="caption" tone="primary" style={{ marginBottom: 8 }}>Subiendo {progress.done} de {progress.total}…</Text> : null}
      {d.photos.map((p, i) => (
        <Card key={p.key} style={{ marginBottom: 10 }} padded={false}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
            <PhotoThumb uri={p.uri} size={64} principal={i === 0} status={p.upload} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="bodyStrong">Foto {i + 1}</Text>
              <Text variant="caption" tone={p.upload === "error" ? "danger" : "muted"}>
                {p.upload === "done" ? "Subida" : p.upload === "uploading" ? "Subiendo…" : p.upload === "error" ? "Error al subir · se reintentará" : "Pendiente de subir"}
              </Text>
              {i !== 0 ? <Pressable onPress={() => move(i, 0)} hitSlop={6}><Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>Hacer principal</Text></Pressable> : null}
            </View>
            <View style={{ flexDirection: "row" }}>
              <IconBtn icon="chevron-up" onPress={() => move(i, i - 1)} disabled={i === 0} />
              <IconBtn icon="chevron-down" onPress={() => move(i, i + 1)} disabled={i === d.photos.length - 1} />
              <IconBtn icon="trash-outline" danger onPress={() => Alert.alert("Eliminar foto", "¿Quitar esta foto del producto?", [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", style: "destructive", onPress: () => d.setPhotos((ps) => ps.filter((x) => x.key !== p.key)) }])} />
            </View>
          </View>
        </Card>
      ))}
      {d.photos.length < MAX_PHOTOS ? <Button title={`Agregar más (${d.photos.length}/${MAX_PHOTOS})`} variant="secondary" icon="add" onPress={() => d.setStep("source")} /> : <Text variant="caption" tone="muted" style={{ textAlign: "center" }}>Llegaste al máximo de {MAX_PHOTOS} fotos.</Text>}
      {d.photos.some((p) => !p.remoteUrl) ? <Button title="Ajustar fotos" variant="ghost" onPress={() => { const i = d.photos.findIndex((p) => !p.remoteUrl); d.patch({ adjustIndex: Math.max(0, i) }); d.setStep("adjust"); }} style={{ marginTop: 6 }} /> : null}
    </WizardFrame>
  );
}

function IconBtn({ icon, onPress, disabled, danger }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={4} style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.3 : 1 }}>
      <Ionicons name={icon} size={20} color={danger ? colors.red : colors.gray700} />
    </Pressable>
  );
}
