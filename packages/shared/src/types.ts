export type AppRole = "customer" | "merchant" | "courier" | "admin";
export type AdminRole = "owner" | "finance" | "operations" | "support";
export type MerchantCategory = "food" | "market" | "pharmacy";
export type OrderType = "food" | "market" | "pharmacy" | "shipment";
export type OrderStatus =
  | "pending_payment"
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "assigned"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "cancelled";
export type PaymentMethod = "cash" | "card" | "pse" | "nequi" | "daviplata";
export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded";
export type MerchantStatus = "pending" | "under_review" | "active" | "paused" | "rejected" | "suspended";
export type CourierStatus = "pending" | "under_review" | "active" | "suspended";
export type ProductStatus = "draft" | "published" | "paused";
export type SettlementStatus = "pending" | "approved" | "paid" | "rejected";
export type SupportStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Address {
  id: string;
  user_id: string;
  label: string;
  line1: string;
  line2: string | null;
  city_id: string;
  instructions: string | null;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
}

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  category: MerchantCategory;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  city_id: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  status: MerchantStatus;
  accepts_orders: boolean;
  is_open: boolean;
  commission_rate: number;
  delivery_fee: number;
  prep_min: number;
  prep_max: number;
  rating_avg: number;
  rating_count: number;
  tags: string[];
}

export interface Product {
  id: string;
  merchant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_urls: string[];
  status: ProductStatus;
  track_stock: boolean;
  stock: number | null;
  sort: number;
}

export interface ProductOptionGroup {
  id: string;
  product_id: string;
  name: string;
  min_select: number;
  max_select: number;
  required: boolean;
  options: ProductOption[];
}

export interface ProductOption {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
  available: boolean;
}

export interface CartLine {
  product_id: string;
  name: string;
  unit_price: number;
  qty: number;
  options: { group_id: string; option_id: string; name: string; price_delta: number }[];
  notes?: string;
}

export interface Order {
  id: string;
  number: number;
  customer_id: string;
  merchant_id: string | null;
  courier_id: string | null;
  type: OrderType;
  status: OrderStatus;
  address_snapshot: Record<string, unknown>;
  items_subtotal: number;
  delivery_fee: number;
  service_fee: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes: string | null;
  delivery_code: string;
  placed_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  eta_min: number | null;
  eta_max: number | null;
}
