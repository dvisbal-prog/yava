import type { Tables, MerchantCategory, OrderStatus, PaymentMethod } from "@yava/shared";

/** Fila de `nearby_merchants` (RPC). */
export interface NearbyMerchant {
  id: string;
  name: string;
  slug: string;
  category: MerchantCategory;
  tagline: string | null;
  logo_url: string | null;
  cover_url: string | null;
  delivery_fee: number;
  prep_min: number;
  prep_max: number;
  rating_avg: number;
  rating_count: number;
  tags: string[];
  featured: boolean;
  is_open: boolean;
  distance_km: number | null;
}

/** Fila de la vista `merchant_public`. */
export type MerchantPublic = Tables<"merchant_public">;
export type ProductRow = Tables<"products">;
export type ProductCategoryRow = Tables<"product_categories">;
export type OptionGroupRow = Tables<"product_option_groups">;
export type OptionRow = Tables<"product_options">;
export type AddressRow = Tables<"addresses">;
export type PromotionRow = Tables<"promotions">;
export type CouponRow = Tables<"coupons">;
export type PaymentMethodRow = Tables<"payment_methods">;
export type OrderSummaryRow = Tables<"order_summary">;
export type OrderItemRow = Tables<"order_items">;
export type OrderEventRow = Tables<"order_events">;
export type OrderMessageRow = Tables<"order_messages">;
export type NotificationRow = Tables<"notifications">;
export type CourierRow = Tables<"couriers">;
export type SupportCaseRow = Tables<"support_cases">;
export type SupportMessageRow = Tables<"support_messages">;
export type MerchantHourRow = Tables<"merchant_hours">;

export interface OptionGroupWithOptions extends OptionGroupRow {
  options: OptionRow[];
}

export interface ProductDetail extends ProductRow {
  groups: OptionGroupWithOptions[];
}

export interface SearchResult {
  kind: "merchant" | "product";
  id: string;
  merchant_id: string;
  name: string;
  subtitle: string | null;
  image_url: string | null;
  price: number | null;
  rating: number | null;
}

export interface Coverage {
  zone_id: string;
  zone_name: string;
  city_id: string;
  city_name: string;
  base_delivery_fee: number;
  distance_km: number;
}

export interface AddressSnapshot {
  id?: string;
  label?: string;
  line1?: string;
  line2?: string | null;
  instructions?: string | null;
  lat?: number | null;
  lng?: number | null;
  city_id?: string | null;
  recipient_name?: string;
  recipient_phone?: string;
}

export interface PackageDetails {
  type?: string;
  size?: string;
  description?: string;
}

export type CustomerPaymentChoice = Extract<PaymentMethod, "cash" | "nequi" | "card">;

export const ACTIVE_STATUSES: OrderStatus[] = ["pending_payment", "placed", "accepted", "preparing", "ready", "assigned", "picked_up", "on_the_way"];
export const TRACKING_STATUSES: OrderStatus[] = ["assigned", "picked_up", "on_the_way"];
