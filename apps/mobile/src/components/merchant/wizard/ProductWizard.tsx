import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useProductDraft } from "@/features/merchant/productDraft";
import { useProductSave } from "@/features/merchant/useProductSave";
import type { SaveResult } from "@/features/merchant/useProductSave";
import { useDeleteProduct, useUpdateProduct } from "@/features/merchant/useMerchant";
import { alert, confirm, notify } from "@/lib/dialog";
import { errorMessage, isForeignKeyViolation } from "@/lib/errors";
import { StepDetails } from "./StepDetails";
import { StepSource, StepSelect, StepAdjust, StepOrganize } from "./StepPhotos";
import { StepOptions } from "./StepOptions";
import { StepAvailability } from "./StepAvailability";
import { StepPublished } from "./StepPublished";

type WizardResult = Pick<SaveResult, "status" | "reason">;

/** Asistente completo (73–80) y formulario de edición (55). El estado vive en useProductDraft. */
export function ProductWizard({ merchantName }: { merchantName: string }) {
  const router = useRouter();
  const d = useProductDraft();
  const { save, saving, progress } = useProductSave();
  const del = useDeleteProduct();
  const update = useUpdateProduct();
  const [result, setResult] = useState<WizardResult | null>(null);

  /** Vuelve a Mi menú cerrando el asistente (si no está en la pila, lo reemplaza). */
  const goMenu = () => router.dismissTo("/(merchant)/menu");

  const saveDraft = async () => {
    setResult(null);
    try {
      const r = await save(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setResult({ status: r.status, reason: r.reason ?? "Guardado como borrador. Puedes completarlo más tarde." });
      d.setStep("published");
    } catch (e) { notify("No se pudo guardar", errorMessage(e)); }
  };

  const publish = async () => {
    setResult(null);
    try {
      const r = await save(true);
      Haptics.notificationAsync(r.status === "draft" ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success).catch(() => {});
      setResult({ status: r.status, reason: r.reason });
      d.setStep("published");
    } catch (e) { notify("No se pudo publicar", errorMessage(e)); }
  };

  const saveEdit = async () => {
    try {
      const r = await save(true);
      if (r.photosFailed && r.status !== "draft") {
        // Producto visible: se guardó lo demás y conserva su estado. Se queda en el formulario para reintentar.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        notify("No se pudieron subir todas las fotos", r.reason);
        return;
      }
      if (r.status === "draft" && r.reason) notify("Guardado como borrador", r.reason);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      goMenu();
    } catch (e) { notify("No se pudo guardar", errorMessage(e)); }
  };

  /** Si el producto ya tiene pedidos no se puede borrar: se ofrece pausarlo. */
  const offerPause = async (productId: string, e: unknown) => {
    const pause = await confirm("No se puede eliminar", errorMessage(e), { okText: "Pausar producto", cancelText: "Cancelar" });
    if (!pause) return;
    try {
      await update.mutateAsync({ productId, patch: { status: "paused" } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      goMenu();
    } catch (e2) { notify("No se pudo pausar", errorMessage(e2)); }
  };

  const confirmDelete = async () => {
    const productId = d.productId;
    if (!productId) return;
    const ok = await confirm("Eliminar producto", `¿Eliminar "${d.name}"? Esta acción no se puede deshacer.`, { okText: "Eliminar", destructive: true });
    if (!ok) return;
    try {
      await del.mutateAsync(productId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      goMenu();
    } catch (e) {
      if (isForeignKeyViolation(e)) await offerPause(productId, e);
      else notify("No se pudo eliminar", errorMessage(e));
    }
  };

  const exit = async () => {
    if (d.mode === "edit" || (!d.name && !d.photos.length)) return goMenu();
    if (Platform.OS !== "web") {
      alert("¿Salir sin guardar?", "Puedes guardar un borrador para continuar después.", [
        { text: "Guardar borrador", onPress: saveDraft },
        { text: "Salir", style: "destructive", onPress: goMenu },
        { text: "Seguir editando", style: "cancel" },
      ]);
      return;
    }
    // En web el diálogo solo admite dos botones: se pregunta en dos pasos.
    if (await confirm("¿Guardar borrador?", "Puedes guardar lo que llevas y continuar después.", { okText: "Guardar borrador", cancelText: "No guardar" })) return saveDraft();
    if (await confirm("¿Salir sin guardar?", "Se perderán los datos de este producto.", { okText: "Salir", cancelText: "Seguir editando", destructive: true })) goMenu();
  };

  // Android: el botón "atrás" del sistema no cierra el asistente de golpe (se perdería el borrador).
  const exitRef = useRef(exit);
  exitRef.current = exit;
  const goMenuRef = useRef(goMenu);
  goMenuRef.current = goMenu;
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      const { step, setStep } = useProductDraft.getState();
      if (step === "published") goMenuRef.current();
      else if (step === "details") exitRef.current();
      else setStep("details");
      return true;
    });
    return () => sub.remove();
  }, []);

  const busy = saving || del.isPending || update.isPending;

  switch (d.step) {
    case "details": return <StepDetails onBack={exit} onSaveDraft={saveDraft} onSaveEdit={saveEdit} onDelete={d.mode === "edit" ? confirmDelete : undefined} saving={busy} />;
    case "source": return <StepSource onSaveDraft={d.mode === "edit" ? undefined : saveDraft} />;
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
