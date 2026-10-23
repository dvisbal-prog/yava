import React, { useEffect, useState } from "react";
import { View, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Input, Button, Card, Skeleton } from "@/components/ui";
import { ErrorState } from "@/components/merchant/Rows";
import { useMyMerchant, useMerchantHours, useUpdateMerchant } from "@/features/merchant/useMerchant";
import { WEEKDAY_LONG, shortTime } from "@/features/merchant/types";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query";
import { errorMessage } from "@/lib/errors";

interface DayRow { weekday: number; enabled: boolean; opens: string; closes: string }
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Pantalla 68 · Datos y horarios del comercio. */
export default function MerchantHours() {
  const router = useRouter();
  const mq = useMyMerchant();
  const m = mq.data;
  const hq = useMerchantHours(m?.id);
  const update = useUpdateMerchant();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [prepMin, setPrepMin] = useState("20");
  const [prepMax, setPrepMax] = useState("35");
  const [days, setDays] = useState<DayRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!m) return;
    setName(m.name); setTagline(m.tagline ?? ""); setDescription(m.description ?? ""); setPhone(m.phone ?? ""); setAddress(m.address ?? "");
    setPrepMin(String(m.prep_min)); setPrepMax(String(m.prep_max));
  }, [m]);
  useEffect(() => {
    if (!hq.data || days) return;
    setDays(Array.from({ length: 7 }, (_, wd) => {
      const row = hq.data.find((h) => h.weekday === wd);
      return { weekday: wd, enabled: !!row, opens: row ? shortTime(row.opens) : "08:00", closes: row ? shortTime(row.closes) : "22:00" };
    }));
  }, [hq.data, days]);

  const patchDay = (wd: number, p: Partial<DayRow>) => setDays((ds) => (ds ?? []).map((d) => (d.weekday === wd ? { ...d, ...p } : d)));

  const save = async () => {
    if (!m || !days) return;
    if (!name.trim()) { Alert.alert("Nombre requerido", "El comercio necesita un nombre."); return; }
    const bad = days.find((d) => d.enabled && (!TIME_RE.test(d.opens) || !TIME_RE.test(d.closes)));
    if (bad) { Alert.alert("Horario inválido", `Revisa el horario del ${WEEKDAY_LONG[bad.weekday].toLowerCase()} (formato HH:MM).`); return; }
    setSaving(true);
    try {
      await update.mutateAsync({ merchantId: m.id, patch: { name: name.trim(), tagline: tagline.trim() || null, description: description.trim() || null, phone: phone.trim() || null, address: address.trim() || null, prep_min: Number(prepMin || 20), prep_max: Math.max(Number(prepMin || 20), Number(prepMax || 35)) } });
      const { error: delErr } = await supabase.from("merchant_hours").delete().eq("merchant_id", m.id);
      if (delErr) throw delErr;
      const rows = days.filter((d) => d.enabled).map((d) => ({ merchant_id: m.id, weekday: d.weekday, opens: d.opens, closes: d.closes }));
      if (rows.length) {
        const { error } = await supabase.from("merchant_hours").insert(rows);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["merchant-hours", m.id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } catch (e) { Alert.alert("No se pudo guardar", errorMessage(e)); }
    finally { setSaving(false); }
  };

  if (mq.isLoading || hq.isLoading) return <Screen><Header title="Datos y horarios" /><Skeleton height={48} style={{ marginBottom: 12 }} /><Skeleton height={48} style={{ marginBottom: 12 }} /><Skeleton height={240} /></Screen>;
  if (mq.isError || hq.isError) return <Screen><Header title="Datos y horarios" /><ErrorState message={errorMessage(mq.error ?? hq.error)} onRetry={() => { mq.refetch(); hq.refetch(); }} /></Screen>;

  return (
    <Screen padded={false} footer={<Button title="Guardar cambios" onPress={save} loading={saving} />}>
      <Header title="Datos y horarios" />
      <View style={{ paddingHorizontal: 16 }}>
        <Text variant="heading" style={{ marginBottom: 10 }}>Datos del comercio</Text>
        <Input label="Nombre comercial" value={name} onChangeText={setName} />
        <Input label="Frase corta" placeholder="Ceviches" value={tagline} onChangeText={setTagline} />
        <Input label="Descripción" value={description} onChangeText={setDescription} multiline style={{ minHeight: 64, textAlignVertical: "top" }} />
        <Input label="Teléfono" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Input label="Dirección" value={address} onChangeText={setAddress} />
        <View style={{ flexDirection: "row" }}>
          <Input label="Preparación mín. (min)" keyboardType="number-pad" value={prepMin} onChangeText={(t) => setPrepMin(t.replace(/\D/g, ""))} containerStyle={{ flex: 1, marginRight: 8 }} />
          <Input label="Preparación máx. (min)" keyboardType="number-pad" value={prepMax} onChangeText={(t) => setPrepMax(t.replace(/\D/g, ""))} containerStyle={{ flex: 1 }} />
        </View>

        <Text variant="heading" style={{ marginTop: 8, marginBottom: 4 }}>Horario de atención</Text>
        <Text variant="caption" tone="muted" style={{ marginBottom: 10 }}>Fuera de este horario tu comercio aparece cerrado. Apaga un día para no recibir pedidos.</Text>
        <Card padded={false}>
          {(days ?? []).map((d, i) => (
            <View key={d.weekday} style={{ flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.gray100 }}>
              <View style={{ width: 92 }}>
                <Text variant="bodyStrong">{WEEKDAY_LONG[d.weekday]}</Text>
                <Text variant="small" tone={d.enabled ? "success" : "muted"}>{d.enabled ? "Abierto" : "Cerrado"}</Text>
              </View>
              {d.enabled ? (
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                  <Input value={d.opens} onChangeText={(t) => patchDay(d.weekday, { opens: t })} containerStyle={{ flex: 1, marginBottom: 0 }} keyboardType="numbers-and-punctuation" placeholder="08:00" error={TIME_RE.test(d.opens) ? null : " "} />
                  <Text tone="muted" style={{ marginHorizontal: 6 }}>a</Text>
                  <Input value={d.closes} onChangeText={(t) => patchDay(d.weekday, { closes: t })} containerStyle={{ flex: 1, marginBottom: 0 }} keyboardType="numbers-and-punctuation" placeholder="22:00" error={TIME_RE.test(d.closes) ? null : " "} />
                </View>
              ) : <View style={{ flex: 1 }} />}
              <Switch value={d.enabled} onValueChange={(v) => patchDay(d.weekday, { enabled: v })} trackColor={{ true: colors.blue, false: colors.gray300 }} thumbColor={colors.white} style={{ marginLeft: 8 }} />
            </View>
          ))}
        </Card>
        <View style={{ height: 16 }} />
      </View>
    </Screen>
  );
}
