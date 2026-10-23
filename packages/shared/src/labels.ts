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

export const SETTLEMENT_STATUS_LABEL: Record<string, string> = { pending: "Pendiente", approved: "Aprobada", paid: "Pagada", rejected: "Rechazada" };
export const PAYMENT_STATUS_LABEL: Record<string, string> = { pending: "Pendiente", authorized: "Autorizado", paid: "Pagado", failed: "Fallido", refunded: "Reembolsado" };
export const PAYMENT_METHOD_LABEL: Record<string, string> = { cash: "Efectivo", card: "Tarjeta", pse: "PSE", nequi: "Nequi", daviplata: "Daviplata" };
export const SUPPORT_STATUS_LABEL: Record<string, string> = { open: "Abierto", in_progress: "En proceso", resolved: "Resuelto", closed: "Cerrado" };
export const VEHICLE_LABEL: Record<string, string> = { moto: "Moto", bicicleta: "Bicicleta", carro: "Carro", a_pie: "A pie" };
export const ADMIN_ROLE_LABEL: Record<string, string> = { owner: "Owner", finance: "Finanzas", operations: "Operaciones", support: "Soporte" };
