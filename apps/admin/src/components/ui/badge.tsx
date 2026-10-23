import { cn } from "@/lib/utils";
import {
  COURIER_STATUS_LABEL,
  MERCHANT_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  type CourierStatus,
  type MerchantStatus,
  type OrderStatus,
  type PaymentStatus,
  type SettlementStatus,
  type SupportStatus,
} from "@yava/shared";

export type Tone = "neutral" | "blue" | "green" | "yellow" | "orange" | "red" | "gray";

const tones: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  gray: "bg-gray-100 text-gray-500",
  blue: "bg-blue-soft text-blue",
  green: "bg-green-soft text-green",
  yellow: "bg-yellow-soft text-[#8a6400]",
  orange: "bg-orange-soft text-[#b8651f]",
  red: "bg-red-soft text-red",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  dot = false,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  pending_payment: "gray",
  placed: "blue",
  accepted: "blue",
  preparing: "yellow",
  ready: "orange",
  assigned: "orange",
  picked_up: "orange",
  on_the_way: "blue",
  delivered: "green",
  cancelled: "red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus | null | undefined }) {
  if (!status) return <Badge tone="gray">—</Badge>;
  return (
    <Badge tone={ORDER_STATUS_TONE[status]} dot>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

const MERCHANT_TONE: Record<MerchantStatus, Tone> = {
  pending: "gray",
  under_review: "yellow",
  active: "green",
  paused: "orange",
  rejected: "red",
  suspended: "red",
};
export function MerchantStatusBadge({ status }: { status: MerchantStatus }) {
  return (
    <Badge tone={MERCHANT_TONE[status]} dot>
      {MERCHANT_STATUS_LABEL[status]}
    </Badge>
  );
}

const COURIER_TONE: Record<CourierStatus, Tone> = {
  pending: "gray",
  under_review: "yellow",
  active: "green",
  suspended: "red",
};
export function CourierStatusBadge({ status }: { status: CourierStatus }) {
  return (
    <Badge tone={COURIER_TONE[status]} dot>
      {COURIER_STATUS_LABEL[status]}
    </Badge>
  );
}

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  paid: "Pagada",
  rejected: "Rechazada",
};
const SETTLEMENT_TONE: Record<SettlementStatus, Tone> = {
  pending: "yellow",
  approved: "blue",
  paid: "green",
  rejected: "red",
};
export function SettlementStatusBadge({ status }: { status: SettlementStatus }) {
  return (
    <Badge tone={SETTLEMENT_TONE[status]} dot>
      {SETTLEMENT_STATUS_LABEL[status]}
    </Badge>
  );
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  authorized: "Autorizado",
  paid: "Pagado",
  failed: "Fallido",
  refunded: "Reembolsado",
};
const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  pending: "gray",
  authorized: "blue",
  paid: "green",
  failed: "red",
  refunded: "orange",
};
export function PaymentStatusBadge({ status }: { status: PaymentStatus | null | undefined }) {
  if (!status) return <Badge tone="gray">—</Badge>;
  return <Badge tone={PAYMENT_TONE[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
}

export const SUPPORT_STATUS_LABEL: Record<SupportStatus, string> = {
  open: "Abierto",
  in_progress: "En revisión",
  resolved: "Resuelto",
  closed: "Cerrado",
};
const SUPPORT_TONE: Record<SupportStatus, Tone> = {
  open: "blue",
  in_progress: "yellow",
  resolved: "green",
  closed: "gray",
};
export function SupportStatusBadge({ status }: { status: SupportStatus }) {
  return (
    <Badge tone={SUPPORT_TONE[status]} dot>
      {SUPPORT_STATUS_LABEL[status]}
    </Badge>
  );
}

const PRIORITY_TONE: Record<string, Tone> = { baja: "gray", normal: "blue", alta: "orange", urgente: "red" };
export const PRIORITY_LABEL: Record<string, string> = { baja: "Baja", normal: "Media", alta: "Alta", urgente: "Urgente" };
export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge tone={PRIORITY_TONE[priority] ?? "neutral"}>{PRIORITY_LABEL[priority] ?? priority}</Badge>;
}

export const DOC_STATUS_LABEL: Record<string, string> = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" };
const DOC_TONE: Record<string, Tone> = { pending: "yellow", approved: "green", rejected: "red" };
export function DocStatusBadge({ status }: { status: string }) {
  return <Badge tone={DOC_TONE[status] ?? "neutral"}>{DOC_STATUS_LABEL[status] ?? status}</Badge>;
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  pse: "PSE",
  nequi: "Nequi",
  daviplata: "Daviplata",
};
