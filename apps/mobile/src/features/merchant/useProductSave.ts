import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query";
import { publicUrl } from "@/lib/supabase";
import type { ProductDraft, DraftPhoto } from "./productDraft";
import { parsePrice, validateForPublish, useProductDraft } from "./productDraft";
import { compressProductPhoto, uploadLocalFile } from "./upload";
import type { ProductCategoryRow } from "./types";

/**
 * Guarda el producto (borrador o publicado), sube fotos con progreso y reintento,
 * y sincroniza grupos de opciones. Nunca marca publicado si falla alguna subida.
 */
export function useProductSave() {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);

  /** Asegura la fila en products (como draft) y devuelve su id. */
  const ensureProduct = useCallback(async (d: ProductDraft): Promise<string> => {
    if (!d.merchantId) throw new Error("Sin comercio");
    let categoryId = d.categoryId;
    if (!categoryId && d.newCategoryName.trim()) {
      const { data, error } = await supabase.from("product_categories").insert({ merchant_id: d.merchantId, name: d.newCategoryName.trim(), sort: 99 }).select().single();
      if (error) throw error;
      categoryId = (data as ProductCategoryRow).id;
      useProductDraft.getState().patch({ categoryId, newCategoryName: "" });
      queryClient.invalidateQueries({ queryKey: ["product-categories", d.merchantId] });
    }
    const base = {
      merchant_id: d.merchantId,
      category_id: categoryId,
      name: d.name.trim(),
      description: d.description.trim() || null,
      price: parsePrice(d.price) ?? 0,
      track_stock: d.trackStock,
      stock: d.trackStock ? Number(d.stock || 0) : null,
      available_from: d.availableFrom || null,
      available_to: d.availableTo || null,
    };
    if (d.productId) {
      const { error } = await supabase.from("products").update(base).eq("id", d.productId);
      if (error) throw error;
      return d.productId;
    }
    const { data, error } = await supabase.from("products").insert({ ...base, status: "draft" }).select("id").single();
    if (error) throw error;
    const id = (data as { id: string }).id;
    useProductDraft.getState().patch({ productId: id });
    return id;
  }, []);

  /** Sube las fotos locales pendientes. Devuelve true si todas quedaron subidas. */
  const uploadPhotos = useCallback(async (merchantId: string, productId: string): Promise<boolean> => {
    const { photos, setPhotos } = useProductDraft.getState();
    const pending = photos.filter((p) => p.upload !== "done");
    if (!pending.length) return true;
    setProgress({ done: 0, total: pending.length });
    let ok = true;
    let done = 0;
    for (const photo of pending) {
      const n = photos.indexOf(photo) + 1;
      setPhotos((ps) => ps.map((p) => (p.key === photo.key ? { ...p, upload: "uploading" } : p)));
      try {
        const compressed = await compressProductPhoto(photo.uri, photo.width || 1600, photo.height || 1600);
        const path = `${merchantId}/${productId}/${n}-${Date.now().toString(36)}.jpg`;
        await uploadLocalFile("product-images", path, compressed, "image/jpeg");
        const url = publicUrl("product-images", path) ?? path;
        setPhotos((ps) => ps.map((p) => (p.key === photo.key ? { ...p, upload: "done", remoteUrl: url } : p)));
      } catch {
        ok = false;
        setPhotos((ps) => ps.map((p) => (p.key === photo.key ? { ...p, upload: "error" } : p)));
      }
      done += 1;
      setProgress({ done, total: pending.length });
    }
    setProgress(null);
    return ok;
  }, []);

  const syncOptionGroups = useCallback(async (d: ProductDraft, productId: string) => {
    const { data: existing } = await supabase.from("product_option_groups").select("id").eq("product_id", productId);
    const existingIds = ((existing ?? []) as { id: string }[]).map((g) => g.id);
    const keepIds = d.groups.map((g) => g.id).filter((x): x is string => !!x);
    const toDelete = existingIds.filter((id) => !keepIds.includes(id));
    if (toDelete.length) await supabase.from("product_option_groups").delete().in("id", toDelete);
    for (let gi = 0; gi < d.groups.length; gi++) {
      const g = d.groups[gi];
      if (!g.name.trim()) continue;
      const row = { product_id: productId, name: g.name.trim(), min_select: Number(g.minSelect || 0), max_select: Math.max(1, Number(g.maxSelect || 1)), required: g.required, sort: gi };
      let groupId = g.id;
      if (groupId) {
        const { error } = await supabase.from("product_option_groups").update(row).eq("id", groupId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("product_option_groups").insert(row).select("id").single();
        if (error) throw error;
        groupId = (data as { id: string }).id;
      }
      const { data: exOpts } = await supabase.from("product_options").select("id").eq("group_id", groupId);
      const exIds = ((exOpts ?? []) as { id: string }[]).map((o) => o.id);
      const keepOpt = g.options.map((o) => o.id).filter((x): x is string => !!x);
      const delOpts = exIds.filter((id) => !keepOpt.includes(id));
      if (delOpts.length) await supabase.from("product_options").delete().in("id", delOpts);
      for (let oi = 0; oi < g.options.length; oi++) {
        const o = g.options[oi];
        if (!o.name.trim()) continue;
        const orow = { group_id: groupId, name: o.name.trim(), price_delta: parsePrice(o.priceDelta) ?? 0, available: o.available, sort: oi };
        if (o.id) {
          const { error } = await supabase.from("product_options").update(orow).eq("id", o.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("product_options").insert(orow);
          if (error) throw error;
        }
      }
    }
  }, []);

  /**
   * Guarda todo. `publish` intenta publicar; si faltan requisitos o falla la subida, queda como draft
   * y devuelve `{ status: "draft", reason }`.
   */
  const save = useCallback(async (publish: boolean): Promise<{ productId: string; status: "draft" | "published" | "paused"; reason?: string }> => {
    setSaving(true);
    try {
      const d = useProductDraft.getState();
      const productId = await ensureProduct(d);
      const allUploaded = await uploadPhotos(d.merchantId ?? "", productId);
      const after = useProductDraft.getState();
      const urls = after.photos.filter((p) => p.upload === "done" && p.remoteUrl).map((p) => p.remoteUrl as string);
      await syncOptionGroups(after, productId);
      let status: "draft" | "published" | "paused" = "draft";
      let reason: string | undefined;
      if (publish) {
        const v = validateForPublish({ ...after, photos: after.photos });
        if (!allUploaded) reason = "Alguna foto no se pudo subir. Reintenta para publicar.";
        else if (!v.ok) reason = `Falta: ${v.missing.join(", ")}.`;
        else status = after.status;
      }
      const { error } = await supabase.from("products").update({ image_urls: urls, status }).eq("id", productId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      return { productId, status, reason };
    } finally {
      setSaving(false);
    }
  }, [ensureProduct, uploadPhotos, syncOptionGroups]);

  const retryPhoto = useCallback((photo: DraftPhoto) => {
    useProductDraft.getState().setPhotos((ps) => ps.map((p) => (p.key === photo.key ? { ...p, upload: "idle" } : p)));
  }, []);

  return { save, saving, progress, retryPhoto };
}
