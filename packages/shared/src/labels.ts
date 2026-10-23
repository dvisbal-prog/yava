import type { OrderStatus, MerchantStatus, CourierStatus, OrderType } from "./types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pago pendiente",
  placed: "Nuevo",
  accepted: "Confirmado",
  preparing: "En preparación",
  ready: "Listo",
  assigned: "Repartidor asignado",
  picked_up: "Recogido",
  on_the_way: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const MERCHANT_STATUS_LABEL: Record<MerchantStatus, string> = {
  pending: "Pendiente",
  under_review: "En revisión",
  active: "Activo",
  paused: "Pausado",
  rejected: "Rechazado",
  suspended: "Suspendido",
};

export const COURIER_STATUS_LABEL: Record<CourierStatus, string> = {
  pending: "Pendiente",
  under_review: "En revisión",
  active: "Activo",
  suspended: "Suspendido",
};

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  food: "Comida",
  market: "Mercado",
  pharmacy: "Farmacia",
  shipment: "Envíos",
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "placed", "accepted", "preparing", "ready", "assigned", "picked_up", "on_the_way",
];
