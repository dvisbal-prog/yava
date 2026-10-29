import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, formatRating } from "@yava/shared";
import { Text, Skeleton } from "@/components/ui";
import { PriceBreakdown } from "@/components/customer";
import { designImages } from "@/lib/design-images";
import { useOrderItems, useMerchant, useProductsByIds, etaLabel, type OrderSummaryRow, type AddressSnapshot } from "@/features/customer";
import { OrderThumb, PaymentTile, useOrderPayment, addressLine, time12, t } from "./kit";
import { orderMerchantPhoto, orderItemPhoto } from "./photos";

/** Colores medidos en el fondo de tanda-06/47-cancelar-pedido.png (sin el velo). */
const META = "#545A76";
const STEP_GRAY = "#CDD1D9";
const STEP_LABEL = "#56667E";
const NOTICE_BG = "#F0F3FB";

const ACCEPTED = ["accepted", "preparing", "ready"];
const ON_ROUTE = ["assigned", "picked_up", "on_the_way", "delivered"];

/** "1.2k+" para conteos grandes de calificaciones, como en el diseño. */
function countLabel(n: number | null | undefined): string {
  if (!n) return "";
  if (n >= 1000) return `${(Math.floor(n / 100) / 10).toString()}k+`;
  return String(n);
}

/**
 * Detalle del pedido en curso mientras el comercio no lo acepta (fondo de 47 · Cancelar pedido): ‹ y menú ⋮,
 * foto + comercio + "Ceviches · 25–35 min" + ★, progreso de 3 pasos (Pedido recibido / En preparación / En camino),
 * aviso "El comercio aún no ha aceptado tu pedido" y "Detalle del pedido" (productos, resumen, entrega y pago).
 * `onCancel`/`onHelp` alimentan el menú ⋮; sin ellos el menú no hace nada (fondo de la hoja de cancelar).
 */
export function PendingOrderView({ order: o, onBack, onCancel, onHelp, interactive = true }: {
  order: OrderSummaryRow;
  onBack: () => void;
  onCancel?: () => void;
  onHelp?: () => void;
  /** false = fondo decorativo (sin desplazamiento ni toques; lo usa la hoja de 47). */
  interactive?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState(false);
  const items = useOrderItems(o.id ?? undefined);
  const merchant = useMerchant(o.merchant_id ?? undefined);
  const products = useProductsByIds((items.data ?? []).map((it) => it.product_id).filter((x): x is string => Boolean(x)));
  const pay = useOrderPayment(o);
  const m = merchant.data;
  const shipment = o.type === "shipment";
  const status = o.status ?? "placed";
  const step = ON_ROUTE.includes(status) ? 2 : ACCEPTED.includes(status) ? 1 : 0;
  const addr = (o.address_snapshot ?? {}) as AddressSnapshot;
  const productById = useMemo(() => new Map((products.data ?? []).map((p) => [p.id, p])), [products.data]);
  const eta = etaLabel(o.eta_min ?? m?.prep_min, o.eta_max ?? m?.prep_max).replace("-", "–");
  const meta = [shipment ? "Envío" : m?.tagline, eta].filter(Boolean).join(" · ");
  const photo = shipment ? designImages.envioCaja
    : orderMerchantPhoto({ name: o.merchant_name ?? m?.name, slug: m?.slug, cover_url: m?.cover_url, logo_url: o.merchant_logo ?? m?.logo_url }, "live");
  const steps = [
    { label: "Pedido recibido", time: time12(o.placed_at) },
    { label: "En preparación", time: time12(o.accepted_at) },
    { label: "En camino", time: time12(o.picked_up_at) },
  ];
  const notice = step === 0
    ? { title: "El comercio aún no ha aceptado tu pedido", body: "Te avisaremos en cuanto empiece a prepararlo." }
    : { title: "El comercio ya está preparando tu pedido", body: "Te avisaremos cuando salga hacia tu dirección." };
  const hasMenu = interactive && Boolean(onCancel || onHelp);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} pointerEvents={interactive ? "auto" : "none"}>
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} showsVerticalScrollIndicator={false} scrollEnabled={interactive}>
        {/* ‹ · ⋮ */}
        <View style={styles.header}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Atrás" hitSlop={6} style={styles.back}>
            <Ionicons name="chevron-back" size={27} color={colors.ink} />
          </Pressable>
          <Pressable onPress={() => setMenu((v) => !v)} disabled={!hasMenu} accessibilityRole="button" accessibilityLabel="Más opciones del pedido"
            accessibilityState={{ expanded: menu }} style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.75 }]}>
            <Ionicons name="ellipsis-vertical" size={19} color={colors.ink} />
          </Pressable>
        </View>

        {/* Comercio */}
        <View style={styles.merchant}>
          <OrderThumb source={photo} width={127.9} height={77.1} radius={12} />
          <View style={styles.merchantText}>
            <Text style={[t(19.9, "700", colors.ink, 24), { letterSpacing: -0.2 }]} numberOfLines={1}>{shipment ? "Envío" : o.merchant_name}</Text>
            {meta ? <Text style={[t(13.3, "400", META, 17), { marginTop: 3.1 }]} numberOfLines={1}>{meta}</Text> : null}
            {m?.rating_avg ? (
              <View style={styles.rating}>
                <Ionicons name="star" size={15.5} color={colors.star} />
                <Text style={[t(13.6, "600", "#3F4A62", 18), { marginLeft: 5 }]}>{formatRating(Number(m.rating_avg))}</Text>
                {m.rating_count ? <Text style={[t(12.4, "400", "#9EA3B2", 18), { marginLeft: 5 }]}>({countLabel(m.rating_count)})</Text> : null}
              </View>
            ) : null}
          </View>
        </View>

        {/* Progreso (C29 pequeño) */}
        <View style={styles.progress} accessibilityLabel={`Estado: ${steps[step].label}`}>
          <View style={styles.track}>
            <View style={[styles.line, { left: 72.5, width: 115 }]}>
              <View style={{ width: step >= 1 ? "100%" : "31%", height: "100%", backgroundColor: colors.blue, borderRadius: 1 }} />
            </View>
            <View style={[styles.line, { left: 204.6, width: 115 }]}>
              {step >= 1 ? <View style={{ width: step >= 2 ? "100%" : "31%", height: "100%", backgroundColor: colors.blue, borderRadius: 1 }} /> : null}
            </View>
          </View>
          {steps.map((s, i) => (
            <View key={s.label} style={styles.stepCol}>
              {i === step ? (
                <View style={styles.nodeRing}><View style={styles.nodeDot} /></View>
              ) : (
                <View style={[styles.node, i < step && { backgroundColor: colors.blue }]} />
              )}
              {/* El aro del paso actual mide 2,1 pt más que el punto: su etiqueta sube para quedar alineada con las demás. */}
              <Text style={[i === step ? t(10.4, "500", colors.blueText, 14) : t(9.9, "400", STEP_LABEL, 14), styles.stepLabel, i === step && { marginTop: 3 }]} numberOfLines={1}>{s.label}</Text>
              {i <= step && s.time ? <Text style={[t(8.7, "400", "#3E4D66", 12), { marginTop: i === step ? 1.6 : -1 }]}>{s.time}</Text> : null}
            </View>
          ))}
        </View>

        {/* Aviso */}
        <View style={styles.notice}>
          <Ionicons name="time-outline" size={20.4} color={colors.blue} />
          <View style={{ flex: 1, marginLeft: 13.9 }}>
            <Text style={t(12.4, "600", colors.ink, 16)}>{notice.title}</Text>
            <Text style={[t(10.7, "400", "#4E5B70", 14), { marginTop: 2.5 }]}>{notice.body}</Text>
          </View>
        </View>

        {/* Detalle del pedido */}
        <Text style={styles.section} accessibilityRole="header">Detalle del pedido</Text>
        <View style={{ marginTop: 7 }}>
          {items.isLoading ? (
            <View style={{ paddingHorizontal: 16.2, gap: 12 }}><Skeleton height={45} /><Skeleton height={45} /></View>
          ) : !items.data?.length ? (
            <Text style={[t(11.5, "400", META, 16), { paddingHorizontal: 17.1, paddingVertical: 8 }]}>{shipment ? "Envío de paquete punto a punto" : "Sin productos"}</Text>
          ) : items.data.map((it, i) => {
            const p = it.product_id ? productById.get(it.product_id) : undefined;
            const opts = Array.isArray(it.options) ? (it.options as { name?: string }[]).map((x) => x.name).filter(Boolean) : [];
            return (
              <View key={it.id} style={styles.itemRow}>
                <OrderThumb source={orderItemPhoto({ name: it.name, image_urls: p?.image_urls }, "live")} width={57.7} height={44.8} radius={8} style={{ marginTop: 6.6, marginBottom: 6.8 }} />
                <View style={[styles.itemBody, i < items.data.length - 1 && styles.itemDivider]}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={t(12.1, "600", colors.ink, 16)} numberOfLines={1}>{it.name}</Text>
                    <Text style={[t(10.4, "400", "#4D5C76", 14), { marginTop: 2.9 }]} numberOfLines={1}>
                      {it.qty} {it.qty === 1 ? "unidad" : "unidades"}{opts.length ? ` · ${opts.join(", ")}` : ""}
                    </Text>
                  </View>
                  <Text style={t(10.9, "600", colors.ink, 16)}>{formatCOP(it.total)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <PriceBreakdown subtotal={o.items_subtotal ?? 0} deliveryFee={o.delivery_fee ?? 0} serviceFee={o.service_fee ?? 0} discount={o.discount ?? 0} total={o.total ?? 0}
          totalLabel={o.payment_method === "card" && o.payment_status === "paid" ? "Total pagado" : "Total a pagar"}
          sizes={{ label: 11.8, value: 12.3, row: 20.1, total: 13.15, totalValue: 13.9, gap: 6.2 }} style={styles.summary} />

        {/* Entrega y pago */}
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}><Ionicons name="location" size={19} color={colors.iconGray} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={t(11.45, "600", colors.ink, 15)}>Entrega en</Text>
            <Text style={[t(10.75, "400", "#3A4558", 15), { marginTop: 1.3 }]} numberOfLines={2}>{[addr.label, addressLine(addr)].filter(Boolean).join(" · ")}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <PaymentTile isVisa={pay.isVisa} icon={pay.icon} width={38} height={26} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={t(11.45, "600", colors.ink, 15)}>Método de pago</Text>
            <Text style={[t(10.75, "400", "#3A4558", 15), { marginTop: 1.3 }]}>{pay.label}{pay.method !== "card" ? " · al recibir" : ""}</Text>
          </View>
        </View>
      </ScrollView>

      {menu && hasMenu ? (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenu(false)} accessibilityLabel="Cerrar menú" />
          <View style={[styles.menu, { top: insets.top + 38 }]}>
            {onHelp ? (
              <Pressable onPress={() => { setMenu(false); onHelp(); }} accessibilityRole="button" style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.surfaceSoft }]}>
                <Ionicons name="help-circle-outline" size={19} color={colors.ink} />
                <Text style={[t(13, "500", colors.ink, 18), { marginLeft: 10 }]}>Ayuda con el pedido</Text>
              </Pressable>
            ) : null}
            {onCancel ? (
              <Pressable onPress={() => { setMenu(false); onCancel(); }} accessibilityRole="button" style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.surfaceSoft }]}>
                <Ionicons name="close-circle-outline" size={19} color={colors.red} />
                <Text style={[t(13, "500", colors.red, 18), { marginLeft: 10 }]}>Cancelar pedido</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { height: 43.9, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  back: { marginLeft: 4.5, marginTop: 1.7, width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  menuBtn: { marginTop: 1.8, marginRight: 16.6, width: 31.8, height: 31.8, borderRadius: 8, backgroundColor: "#EFEFF1", alignItems: "center", justifyContent: "center" },
  merchant: { flexDirection: "row", alignItems: "flex-start", paddingLeft: 16.2, paddingRight: 17 },
  merchantText: { flex: 1, marginLeft: 14.3, paddingTop: 3.3 },
  rating: { flexDirection: "row", alignItems: "center", marginTop: 5.2 },
  progress: { flexDirection: "row", marginTop: 14.3 },
  track: { position: "absolute", left: 0, right: 0, top: 6.95, height: 1.8 },
  line: { position: "absolute", top: 0, height: 1.8, borderRadius: 1, backgroundColor: STEP_GRAY, overflow: "hidden" },
  stepCol: { width: "33.333%", alignItems: "center" },
  node: { width: 11.5, height: 11.5, borderRadius: 5.75, backgroundColor: "#C3C9D4", marginTop: 2.1 },
  nodeRing: { width: 15.7, height: 15.7, borderRadius: 7.85, borderWidth: 1.6, borderColor: colors.blue, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  nodeDot: { width: 9.9, height: 9.9, borderRadius: 4.95, backgroundColor: "#0A58F0" },
  stepLabel: { marginTop: 5.6 },
  notice: { flexDirection: "row", alignItems: "center", marginTop: 13.4, marginLeft: 14.8, marginRight: 15.2, minHeight: 52.2, borderRadius: 14, backgroundColor: NOTICE_BG, paddingLeft: 14.5, paddingRight: 12, paddingTop: 8.7, paddingBottom: 11 },
  section: { fontSize: 15.5, lineHeight: 20, fontWeight: "700", color: colors.ink, marginTop: 17.9, marginLeft: 17.1, letterSpacing: -0.1 },
  itemRow: { flexDirection: "row", alignItems: "stretch", paddingLeft: 16.2, paddingRight: 17.5 },
  itemBody: { flex: 1, flexDirection: "row", alignItems: "flex-start", marginLeft: 8.3, paddingTop: 11.1 },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: "#ECEFF3" },
  summary: { marginTop: 14, marginHorizontal: 17.5 },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginHorizontal: 17.5 },
  infoIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#ECF4FD", alignItems: "center", justifyContent: "center" },
  menu: {
    position: "absolute", right: 16.6, minWidth: 210, backgroundColor: colors.white, borderRadius: 14, paddingVertical: 6,
    boxShadow: "0px 8px 24px rgba(16, 24, 48, 0.16)",
  },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, height: 44 },
});
