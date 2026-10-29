import type { CartLine, Totals } from "@yava/shared";
import type { ProductRow } from "@/features/customer";

/** Comercio de la canasta con los datos públicos que hacen falta para pintarla. */
export interface CartMerchantView {
  id: string;
  name: string;
  category: string;
  tagline: string | null;
  prep_min: number;
  prep_max: number;
  delivery_fee: number;
  slug?: string | null;
  cover_url?: string | null;
  logo_url?: string | null;
}

/** Todo lo que necesitan las variantes visuales de la canasta (15, 28, 44); la lógica vive en `cart.tsx`. */
export interface CartViewProps {
  merchant: CartMerchantView;
  lines: CartLine[];
  /** Productos de las líneas por id (foto, descripción, categoría): los frescos de la BD y, mientras llegan, los del menú. */
  products: Map<string, ProductRow>;
  unavailable: Set<string>;
  suggestions: ProductRow[];
  totals: Totals;
  notes: string;
  onNotes: (t: string) => void;
  onQty: (index: number, qty: number) => void;
  onAddSuggestion: (p: ProductRow) => void;
  onOpenProduct: (id: string) => void;
  onAddMore: () => void;
  onContinue: () => void;
}
