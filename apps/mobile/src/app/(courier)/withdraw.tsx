import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, formatCOP, formatDate } from "@yava/shared";
import { Screen, Header, Text, Input, Button, Card, Chip, Badge, Skeleton, ListRow } from "@/components/ui";
import { MoneyRow, ErrorState } from "@/components/merchant/Rows";
import { useMyCourier, useWithdrawals, useRequestWithdrawal, useUpdateCourier } from "@/features/courier/useCourier";
import { usePlatformSetting } from "@/features/merchant/useMerchant";
import { parseBankAccount, SETTLEMENT_LABEL, SETTLEMENT_TONE } from "@/features/merchant/types";
import { maskAccount } from "@/features/courier/types";
import { errorMessage } from "@/lib/errors";
import { alert, confirm, notify } from "@/lib/dialog";

const BANKS = ["Nequi", "Bancolombia", "Daviplata", "Davivienda", "BBVA", "Otro"];

/** Pantalla 71 · Retirar saldo. */
export default function CourierWithdraw() {
  const router = useRouter();
  const courierQ = useMyCourier();
  const wq = useWithdrawals();
  const request = useRequestWithdrawal();
  const updateCourier = useUpdateCourier();
  const { data: minWithdrawal } = usePlatformSetting<number>("min_withdrawal", 50000);
  const c = courierQ.data;
  const balance = c?.balance ?? 0;
  const bank = parseBankAccount(c?.bank_account);
  const [amount, setAmount] = useState("");
  const [editBank, setEditBank] = useState(false);
  const [bBank, setBBank] = useState(""); const [bNumber, setBNumber] = useState(""); const [bHolder, setBHolder] = useState("");

  // Prellenar el monto con el saldo una sola vez; después el campo es del usuario (puede borrarlo).
  const amountInit = useRef(false);
  useEffect(() => {
    if (!c || amountInit.current) return;
    amountInit.current = true;
    if (c.balance > 0) setAmount(String(c.balance));
  }, [c]);
  // El número no se prellena para no mostrar la cuenta completa: se vuelve a escribir al cambiarla.
  const openBankEditor = () => { setBBank(bank?.bank ?? ""); setBNumber(""); setBHolder(bank?.holder ?? ""); setEditBank(true); };

  const n = Number(amount.replace(/\D/g, "") || 0);
  const min = minWithdrawal ?? 50000;
  const error = !n ? null : n < min ? `El retiro mínimo es ${formatCOP(min)}` : n > balance ? "Supera tu saldo disponible" : null;

  const saveBank = async () => {
    if (!bBank.trim() || bNumber.replace(/\D/g, "").length < 6 || !bHolder.trim()) { notify("Completa los datos", "Entidad, número y titular son obligatorios."); return; }
    try {
      await updateCourier.mutateAsync({ bank_account: { bank: bBank.trim(), type: bBank === "Nequi" || bBank === "Daviplata" ? "Depósito" : "Ahorros", number: bNumber.trim(), holder: bHolder.trim() } });
      setEditBank(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) { notify("No se pudo guardar", errorMessage(e)); }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(courier)/earnings"));

  const submitWithdrawal = async () => {
    if (!bank) { notify("Agrega una cuenta", "Necesitamos saber a dónde enviarte el dinero."); openBankEditor(); return; }
    if (error || !n) { notify("Revisa el monto", error ?? "Ingresa un monto."); return; }
    const ok = await confirm("Confirmar retiro", `Retirar ${formatCOP(n)} a ${bank.bank} ${maskAccount(bank.number)}.`, { okText: "Confirmar" });
    if (!ok) return;
    try {
      await request.mutateAsync(n);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      alert("Retiro solicitado", "Verás el estado del retiro en tus movimientos. Lo procesamos en 1 a 2 días hábiles.", [{ text: "Listo", onPress: goBack }]);
    } catch (e) { notify("No se pudo solicitar", errorMessage(e)); }
  };

  if (courierQ.isLoading) return <Screen><Header title="Retirar saldo" /><Skeleton height={100} style={{ marginBottom: 12 }} /><Skeleton height={60} style={{ marginBottom: 12 }} /><Skeleton height={120} /></Screen>;
  if (courierQ.isError) return <Screen><Header title="Retirar saldo" /><ErrorState message={errorMessage(courierQ.error)} onRetry={() => courierQ.refetch()} /></Screen>;

  return (
    <Screen padded={false} footer={<Button title="Confirmar retiro" onPress={submitWithdrawal} loading={request.isPending} disabled={!!error || !n} />}>
      <Header title="Retirar saldo" />
      <View style={{ paddingHorizontal: 16 }}>
        <Card style={{ backgroundColor: colors.blueSoft, borderColor: colors.blueSoft, marginBottom: 16 }}>
          <Text variant="caption" tone="muted">Saldo disponible</Text>
          <Text variant="display" tone="primary">{formatCOP(balance)}</Text>
          <Text variant="caption" tone="muted">Retiro mínimo {formatCOP(min)}</Text>
        </Card>
        <Input label="Monto a retirar" keyboardType="number-pad" value={amount} onChangeText={(t) => setAmount(t.replace(/\D/g, ""))} icon="cash-outline" error={error}
          right={<Button title="Todo" size="sm" variant="ghost" full={false} onPress={() => setAmount(String(balance))} />} />

        <Text variant="heading" style={{ marginBottom: 8 }}>Destino</Text>
        {!editBank ? (
          <Card onPress={openBankEditor} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" tone="muted">Cuenta bancaria</Text>
                <Text variant="bodyStrong">{bank ? `${bank.bank} · ${maskAccount(bank.number)}` : "Agrega tu cuenta Nequi o bancaria"}</Text>
                {bank ? <Text variant="caption" tone="muted">{bank.holder}</Text> : null}
              </View>
              <Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>{bank ? "Cambiar" : "Agregar"}</Text>
            </View>
          </Card>
        ) : (
          <Card style={{ marginBottom: 16 }}>
            <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>Entidad</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
              {BANKS.map((b) => <View key={b} style={{ marginBottom: 8 }}><Chip label={b} selected={bBank === b} onPress={() => setBBank(b)} /></View>)}
            </View>
            {bBank === "Otro" ? <Input placeholder="Nombre de la entidad" onChangeText={setBBank} /> : null}
            <Input label="Número de cuenta o celular" keyboardType="number-pad" value={bNumber} onChangeText={setBNumber} placeholder={bank?.number ? `Termina en ${bank.number.replace(/\s/g, "").slice(-4)}` : "3001234567"} />
            <Input label="Titular" value={bHolder} onChangeText={setBHolder} placeholder="Nombre completo" />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button title="Cancelar" variant="outline" size="md" onPress={() => setEditBank(false)} style={{ flex: 1 }} />
              <Button title="Guardar cuenta" size="md" onPress={saveBank} loading={updateCourier.isPending} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        <Text variant="heading" style={{ marginBottom: 4 }}>Resumen</Text>
        <Card style={{ marginBottom: 16 }}>
          <MoneyRow label="Retiro" value={formatCOP(n)} />
          <MoneyRow label="Costo" value={formatCOP(0)} tone="muted" />
          <MoneyRow label="Recibirás" value={formatCOP(n)} strong tone="success" />
          <Text variant="caption" tone="subtle">Verás el estado del retiro en tus movimientos.</Text>
        </Card>

        <Text variant="heading" style={{ marginBottom: 4 }}>Movimientos</Text>
        {wq.isLoading ? <Skeleton height={56} /> : wq.isError ? <ErrorState message={errorMessage(wq.error)} onRetry={() => wq.refetch()} /> : (wq.data ?? []).length === 0 ? <Text tone="muted" variant="caption">Aún no has hecho retiros.</Text> : (wq.data ?? []).map((w) => (
          <ListRow key={w.id} icon="arrow-up-circle-outline" title={formatCOP(w.amount)} subtitle={`${formatDate(w.created_at)}${w.reference ? ` · Ref. ${w.reference}` : ""}`} right={<Badge label={SETTLEMENT_LABEL[w.status]} tone={SETTLEMENT_TONE[w.status]} />} chevron={false} />
        ))}
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
