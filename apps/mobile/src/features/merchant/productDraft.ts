import { create } from "zustand";
import type { ProductFull } from "./useMerchant";

export type WizardStep = "details" | "source" | "select" | "adjust" | "organize" | "options" | "availability" | "published";

export const WIZARD_ORDER: WizardStep[] = ["details", "source", "select", "adjust", "organize", "options", "availability", "published"];

export interface DraftPhoto {
  /** id local estable para listas */
  key: string;
  /** URI local (file://) o URL remota ya subida */
  uri: string;
  width: number;
  height: number;
  /** URL pública si ya está en Storage */
  remoteUrl: string | null;
  /** Estado de subida */
  upload: "idle" | "uploading" | "done" | "error";
}

export interface DraftOption {
  key: string;
  id: string | null;
  name: string;
  priceDelta: string;
  available: boolean;
}

export interface DraftGroup {
  key: string;
  id: string | null;
  name: string;
  minSelect: string;
  maxSelect: string;
  required: boolean;
  options: DraftOption[];
}

export interface ProductDraft {
  productId: string | null;
  merchantId: string | null;
  name: string;
  categoryId: string | null;
  newCategoryName: string;
  price: string;
  description: string;
  photos: DraftPhoto[];
  /** fotos candidatas de la galería/cámara antes de confirmar (paso 75) */
  candidates: DraftPhoto[];
  groups: DraftGroup[];
  status: "published" | "paused";
  trackStock: boolean;
  stock: string;
  availableFrom: string;
  availableTo: string;
  /** índice de foto que se ajusta en el paso 76 */
  adjustIndex: number;
}

interface DraftState extends ProductDraft {
  step: WizardStep;
  mode: "new" | "edit";
  reset: (merchantId: string) => void;
  loadFromProduct: (full: ProductFull) => void;
  patch: (p: Partial<ProductDraft>) => void;
  setStep: (s: WizardStep) => void;
  setPhotos: (fn: (p: DraftPhoto[]) => DraftPhoto[]) => void;
  setGroups: (fn: (g: DraftGroup[]) => DraftGroup[]) => void;
}

let keyCounter = 0;
export function nextKey(prefix = "k"): string {
  keyCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${keyCounter}`;
}

const EMPTY: ProductDraft = {
  productId: null, merchantId: null, name: "", categoryId: null, newCategoryName: "", price: "", description: "",
  photos: [], candidates: [], groups: [], status: "published", trackStock: false, stock: "", availableFrom: "", availableTo: "", adjustIndex: 0,
};

export const useProductDraft = create<DraftState>((set) => ({
  ...EMPTY,
  step: "details",
  mode: "new",
  reset: (merchantId) => set({ ...EMPTY, merchantId, step: "details", mode: "new" }),
  loadFromProduct: ({ product, groups }) => set({
    ...EMPTY,
    mode: "edit",
    step: "details",
    productId: product.id,
    merchantId: product.merchant_id,
    name: product.name,
    categoryId: product.category_id,
    price: String(product.price),
    description: product.description ?? "",
    photos: product.image_urls.map((u) => ({ key: nextKey("remote"), uri: u, width: 0, height: 0, remoteUrl: u, upload: "done" as const })),
    groups: groups.map((g) => ({
      key: nextKey("g"), id: g.id, name: g.name, minSelect: String(g.min_select), maxSelect: String(g.max_select), required: g.required,
      options: g.options.map((o) => ({ key: nextKey("o"), id: o.id, name: o.name, priceDelta: String(o.price_delta), available: o.available })),
    })),
    status: product.status === "paused" ? "paused" : "published",
    trackStock: product.track_stock,
    stock: product.stock != null ? String(product.stock) : "",
    availableFrom: product.available_from ? product.available_from.slice(0, 5) : "",
    availableTo: product.available_to ? product.available_to.slice(0, 5) : "",
  }),
  patch: (p) => set(p),
  setStep: (step) => set({ step }),
  setPhotos: (fn) => set((s) => ({ photos: fn(s.photos) })),
  setGroups: (fn) => set((s) => ({ groups: fn(s.groups) })),
}));

/** Precio en COP a partir del texto del formulario ("30.000" → 30000). */
export function parsePrice(text: string): number | null {
  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "HH:MM" válido o vacío */
export function isValidTime(t: string): boolean {
  return t === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

export interface DraftValidation {
  ok: boolean;
  missing: string[];
}

/** Requisitos para publicar: nombre, categoría, precio válido, descripción y al menos 1 foto subida. */
export function validateForPublish(d: ProductDraft): DraftValidation {
  const missing: string[] = [];
  if (!d.name.trim()) missing.push("nombre");
  if (!d.categoryId && !d.newCategoryName.trim()) missing.push("categoría");
  if (parsePrice(d.price) == null || parsePrice(d.price) === 0) missing.push("precio válido");
  if (!d.description.trim()) missing.push("descripción");
  if (!d.photos.some((p) => p.upload === "done" && p.remoteUrl)) missing.push("al menos una foto cargada");
  return { ok: missing.length === 0, missing };
}

/** Datos mínimos para guardar un borrador. */
export function validateDraftBasics(d: ProductDraft): DraftValidation {
  const missing: string[] = [];
  if (!d.name.trim()) missing.push("nombre");
  if (parsePrice(d.price) == null) missing.push("precio válido");
  return { ok: missing.length === 0, missing };
}
