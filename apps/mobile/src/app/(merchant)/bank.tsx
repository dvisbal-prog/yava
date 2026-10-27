import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Screen, Header, Text, Input, Button, Chip } from "@/components/ui";
import { useMyMerchant, useUpdateMerchant } from "@/features/merchant/useMerchant";
import { parseBankAccount } from "@/features/merchant/types";
import { notify } from "@/lib/dialog";
import { errorMessage } from "@/lib/errors";

const BANKS = ["Bancolombia", "Davivienda", "Nequi", "Daviplata", "BBVA", "Banco de Bogotá", "Otro"];
const TYPES = ["Ahorros", "Corriente", "Depósito"];

/** Cuenta bancaria del comercio (merchants.bank_account). */
export default function MerchantBank() {
  const router = useRouter();
  const { data: m } = useMyMerchant();
  const update = useUpdateMerchant();
  const [bank, setBank] = useState("");
  const [type, setType] = useState("Ahorros");
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");

  useEffect(() => {
    const b = parseBankAccount(m?.bank_account);
    if (b) { setBank(b.bank); setType(b.type || "Ahorros"); setNumber(b.number); setHolder(b.holder); }
    else if (m) setHolder(m.legal_name ?? m.name);
  }, [m]);

  const save = async () => {
    if (!m) return;
    if (!bank.trim() || number.replace(/\D/g, "").length < 6 || !holder.trim()) { notify("Completa los datos", "Banco, número de cuenta y titular son obligatorios."); return; }
    try {
      await update.mutateAsync({ merchantId: m.id, patch: { bank_account: { bank: bank.trim(), type, number: number.trim(), holder: holder.trim() } } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } catch (e) { notify("No se pudo guardar", errorMessage(e)); }
  };

  return (
    <Screen padded={false} footer={<Button title="Guardar cuenta" onPress={save} loading={update.isPending} />}>
      <Header title="Cuenta bancaria" />
      <View style={{ paddingHorizontal: 16 }}>
        <Text tone="muted" style={{ marginBottom: 16 }}>A esta cuenta abonamos tus liquidaciones. Verifica los datos antes de guardar.</Text>
        <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>Banco</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
          {BANKS.map((b) => <View key={b} style={{ marginBottom: 8 }}><Chip label={b} selected={bank === b} onPress={() => setBank(b)} /></View>)}
        </View>
        {bank === "Otro" || (bank && !BANKS.includes(bank)) ? <Input placeholder="Nombre del banco" value={bank === "Otro" ? "" : bank} onChangeText={setBank} /> : null}
        <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>Tipo de cuenta</Text>
        <View style={{ flexDirection: "row", marginBottom: 14 }}>
          {TYPES.map((t) => <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />)}
        </View>
        <Input label="Número de cuenta" keyboardType="number-pad" value={number} onChangeText={setNumber} placeholder="00000000000" />
        <Input label="Titular" value={holder} onChangeText={setHolder} placeholder="Razón social o nombre" hint="Debe coincidir con el NIT o la cédula registrada." />
      </View>
    </Screen>
  );
}
