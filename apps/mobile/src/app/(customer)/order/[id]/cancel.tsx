import React, { useState } from "react";
import { View, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "@yava/shared";
import { Text, Input, Sheet, Skeleton } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";
import { ErrorState } from "@/components/customer";
import { PendingOrderView } from "@/components/customer/order/PendingOrderView";
import { PillButton, ThinClose, ThinInfo, t } from "@/components/customer/order/kit";
import { useOrder } from "@/features/customer";

const REASONS = ["Me equivoqué en el pedido", "Quiero cambiar la dirección", "Otro motivo"];
const OTHER = "Otro motivo";
/** Velo medido en el PNG (fondo blanco → #8B8C8E). */
const VEIL = "rgba(0, 2, 6, 0.455)";

/**
 * Pantalla 47 · Cancelar pedido (tanda-06/47-cancelar-pedido.png): hoja "¿Cancelar tu pedido?" sobre el
 * detalle del pedido en curso (con velo). Motivos con radio, aviso de reembolso, "Confirmar cancelación"
 * (llama `cancel_order`) y "Seguir con mi pedido". Si ya no se puede cancelar, ofrece hablar con soporte.
 */
export default function CancelOrder() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrder(id);
  const [reason, setReason] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const o = order.data;
  const canCancel = o?.status && ["pending_payment", "placed", "accepted"].includes(o.status);
  const notAccepted = o?.status === "placed" || o?.status === "pending_payment";

  const close = () => (router.canGoBack() ? router.back() : router.replace(`/(customer)/order/${id}` as never));

  // La hoja ya es la confirmación: "Confirmar cancelación" llama cancel_order directamente.
  async function cancelOrder() {
    const text = reason === OTHER ? other.trim() : reason;
    if (!text) { setError(reason === OTHER ? "Cuéntanos el motivo." : "Elige un motivo."); return; }
    setBusy(true); setError(null);
    try {
      const { error: e } = await supabase.rpc("cancel_order", { p_order_id: id, p_reason: text });
      if (e) throw e;
      void qc.invalidateQueries({ queryKey: ["order", id] });
      void qc.invalidateQueries({ queryKey: ["orders"] });
      router.dismissTo("/(customer)/orders" as never);
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  const subtitle = !o ? "" : !canCancel
    ? "Tu pedido ya está en preparación y no se puede cancelar desde aquí."
    : notAccepted ? "El comercio aún no lo ha aceptado." : "El comercio ya lo aceptó, pero aún no empieza a prepararlo.";

  return (
    <View style={styles.root}>
      {/* Fondo: detalle del pedido en curso */}
      {o ? <PendingOrderView order={o} onBack={close} interactive={false} /> : <View style={{ flex: 1 }} />}
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: VEIL }]} onPress={close} accessibilityLabel="Cerrar" />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetWrap} pointerEvents="box-none">
        <Sheet handle={false} style={[styles.sheet, { paddingBottom: insets.bottom + 20.7, maxHeight: screenH - insets.top - 40 }]}>
          <View style={styles.handle} />
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.titleRow}>
              <Text style={[t(19.5, "700", colors.ink, 23), { flex: 1, letterSpacing: -0.2 }]} accessibilityRole="header">¿Cancelar tu pedido?</Text>
              <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.closeBtn}>
                <ThinClose />
              </Pressable>
            </View>

            {order.isLoading && !o ? (
              <View style={{ gap: 14, marginTop: 10, paddingHorizontal: 1.4 }}>
                <Skeleton width={220} height={14} /><Skeleton height={22} /><Skeleton height={22} /><Skeleton height={22} />
              </View>
            ) : order.error || !o ? (
              <ErrorState error={order.error ?? new Error("No encontramos el pedido.")} onRetry={() => { void order.refetch(); }} />
            ) : (
              <>
                <Text style={[t(12.5, "400", "#4A536C", 16), styles.subtitle]}>{subtitle}</Text>

                {canCancel ? (
                  <View style={styles.reasons} accessibilityRole="radiogroup">
                    {REASONS.map((r) => {
                      const on = reason === r;
                      return (
                        <Pressable key={r} onPress={() => { setReason(r); setError(null); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
                          style={({ pressed }) => [styles.reason, pressed && { opacity: 0.7 }]}>
                          <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                          <Text style={[t(12.8, "400", colors.ink, 17), { marginLeft: 14.8, flex: 1 }]}>{r}</Text>
                        </Pressable>
                      );
                    })}
                    {reason === OTHER ? (
                      <Input value={other} onChangeText={(v) => { setOther(v); setError(null); }} placeholder="Cuéntanos qué pasó" multiline maxLength={200}
                        style={{ minHeight: 60 }} containerStyle={{ marginTop: 6, marginBottom: 4 }} />
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.divider} />
                <View style={styles.info}>
                  <View style={{ width: 24, paddingLeft: 1, marginTop: -1.4 }}><ThinInfo /></View>
                  <Text style={[t(10.3, "400", "#5F6A80", 14.3), { flex: 1, marginLeft: 12.6 }]}>
                    {canCancel ? "Veremos si hubo un cobro y te mostraremos el estado del reembolso." : "Si algo salió mal con tu pedido, nuestro equipo de soporte te ayuda."}
                  </Text>
                </View>

                {error ? <Text style={[t(11.5, "500", colors.red, 16), { marginTop: 12, paddingHorizontal: 1.4 }]}>{error}</Text> : null}

                {canCancel ? (
                  <PillButton title="Confirmar cancelación" variant="danger" height={42.1} radius={15.5} fontSize={12.65} color="#D50C1B" style={styles.confirm}
                    onPress={() => { void cancelOrder(); }} loading={busy} disabled={busy} />
                ) : (
                  <PillButton title="Hablar con soporte" variant="outline" height={42.1} radius={15.5} fontSize={12.65} style={styles.confirm}
                    onPress={() => router.push(`/(customer)/support?order=${id}` as never)} />
                )}
                <PillButton title="Seguir con mi pedido" height={43.8} radius={16} fontSize={12.6} style={styles.keep} onPress={close} disabled={busy} />
              </>
            )}
          </ScrollView>
        </Sheet>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  sheetWrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  sheet: { borderTopLeftRadius: 15, borderTopRightRadius: 15, paddingHorizontal: 16.6 },
  handle: { alignSelf: "center", width: 39.3, height: 4.1, borderRadius: 2.05, backgroundColor: "#D3D4D7", marginTop: 6.9 },
  titleRow: { flexDirection: "row", alignItems: "center", marginTop: 18.9, paddingLeft: 1.4 },
  closeBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center", marginRight: -6.5, marginTop: -4.2, marginBottom: -6.8 },
  subtitle: { marginTop: 6, paddingLeft: 1.6 },
  reasons: { marginTop: 8.6 },
  reason: { flexDirection: "row", alignItems: "center", height: 37.3, paddingLeft: 1.4 },
  radio: { width: 21.3, height: 21.3, borderRadius: 10.65, borderWidth: 1.4, borderColor: "#7D8698", alignItems: "center", justifyContent: "center" },
  radioOn: { borderWidth: 1.6, borderColor: "#0A3DAE" },
  radioDot: { width: 11.1, height: 11.1, borderRadius: 5.55, backgroundColor: "#0A3DAE" },
  divider: { height: 1, backgroundColor: "#E7E9EF", marginTop: 10.2 },
  info: { flexDirection: "row", alignItems: "flex-start", marginTop: 12.1, paddingLeft: 2.3, paddingRight: 45 },
  confirm: { marginTop: 19.3 },
  keep: { marginTop: 7.4 },
});
