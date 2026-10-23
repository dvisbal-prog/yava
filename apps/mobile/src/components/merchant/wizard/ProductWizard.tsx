import React, { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useProductDraft } from "@/features/merchant/productDraft";
import { useProductSave } from "@/features/merchant/useProductSave";
import { useDeleteProduct } from "@/features/merchant/useMerchant";
import { errorMessage } from "@/lib/errors";
import { StepDetails } from "./StepDetails";
import { StepSource, StepSelect, StepAdjust, StepOrganize } from "./StepPhotos";
import { StepOptions } from "./StepOptions";
import { StepAvailability } from "./StepAvailability";
import { StepPublished } from "./StepPublished";

/** Asistente completo (73–80) y formulario de edición (55). El estado vive en useProductDraft. */
export function ProductWizard({ merchantName }: { merchantName: string }) {
  const router = useRouter();
  const d = useProductDraft();
  const { save, saving, progress } = useProductSave();
  const del = useDeleteProduct();
  const [result, setResult] = useState<{ status: "draft" | "published" | "paused"; reason?: string } | null>(null);

  const goMenu = () => router.replace("/(merchant)/menu");

  const saveDraft = async () => {
    try {
      const r = await save(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setResult({ status: r.status, reason: r.reason ?? "Guardado como borrador. Puedes completarlo más tarde." });
      d.setStep("published");
    } catch (e) { Alert.alert("No se pudo guardar", errorMessage(e)); }
  };

  const publish = async () => {
    try {
      const r = await save(true);
      Haptics.notificationAsync(r.status === "draft" ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success).catch(() => {});
      setResult(r);
      d.setStep("published");
    } catch (e) { Alert.alert("No se pudo publicar", errorMessage(e)); }
  };

  const saveEdit = async () => {
    try {
      const r = await save(true);
      if (r.status === "draft" && r.reason) { Alert.alert("Guardado como borrador", r.reason); }
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      goMenu();
    } catch (e) { Alert.alert("No se pudo guardar", errorMessage(e)); }
  };

  const confirmDelete = () => {
    if (!d.productId) return;
    Alert.alert("Eliminar producto", `¿Eliminar "${d.name}"? Esta acción no se puede deshacer.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
        try { await del.mutateAsync(d.productId as string); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); goMenu(); }
        catch (e) { Alert.alert("No se pudo eliminar", errorMessage(e)); }
      } },
    ]);
  };

  const exit = () => {
    if (d.mode === "edit" || (!d.name && !d.photos.length)) return goMenu();
    Alert.alert("¿Salir sin guardar?", "Puedes guardar un borrador para continuar después.", [
      { text: "Guardar borrador", onPress: saveDraft },
      { text: "Salir", style: "destructive", onPress: goMenu },
      { text: "Seguir editando", style: "cancel" },
    ]);
  };

  switch (d.step) {
    case "details": return <StepDetails onBack={exit} onSaveDraft={saveDraft} onSaveEdit={saveEdit} onDelete={d.mode === "edit" ? confirmDelete : undefined} saving={saving || del.isPending} />;
    case "source": return <StepSource onSaveDraft={saveDraft} />;
    case "select": return <StepSelect />;
    case "adjust": return <StepAdjust />;
    case "organize": return <StepOrganize progress={progress} />;
    case "options": return <StepOptions />;
    case "availability": return <StepAvailability onPublish={publish} onSaveDraft={saveDraft} saving={saving} progress={progress} />;
    case "published":
      return <StepPublished merchantName={merchantName} result={result ?? { status: "draft" }} onViewMenu={goMenu}
        onEdit={() => { if (d.productId) router.replace(`/(merchant)/product/${d.productId}`); else d.setStep("details"); }}
        onRetry={() => d.setStep("availability")} />;
    default: return null;
  }
}
