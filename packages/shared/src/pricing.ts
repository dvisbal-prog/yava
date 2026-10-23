import type { CartLine } from "./types";

/** Tarifa de servicio por pedido (COP). Parametrizable desde platform_settings. */
export const DEFAULT_SERVICE_FEE = 1000;
/** Comisión por defecto a comercios (10 %). */
export const DEFAULT_COMMISSION_RATE = 0.1;

export function lineTotal(line: CartLine): number {
  const extras = line.options.reduce((acc, o) => acc + o.price_delta, 0);
  return (line.unit_price + extras) * line.qty;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + lineTotal(l), 0);
}

export interface Totals {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
}

export function computeTotals(args: {
  lines: CartLine[];
  deliveryFee: number;
  serviceFee?: number;
  coupon?: { type: "percent" | "fixed" | "free_delivery"; value: number; min_order?: number } | null;
}): Totals {
  const subtotal = cartSubtotal(args.lines);
  const serviceFee = args.serviceFee ?? DEFAULT_SERVICE_FEE;
  let deliveryFee = args.deliveryFee;
  let discount = 0;
  const c = args.coupon;
  if (c && subtotal >= (c.min_order ?? 0)) {
    if (c.type === "percent") discount = Math.round((subtotal * c.value) / 100);
    else if (c.type === "fixed") discount = Math.min(c.value, subtotal);
    else if (c.type === "free_delivery") {
      discount = deliveryFee;
    }
  }
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);
  return { subtotal, deliveryFee, serviceFee, discount, total };
}
