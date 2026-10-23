import React from "react";
import { View, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatRating, MERCHANT_STATUS_LABEL, ORDER_TYPE_LABEL } from "@yava/shared";
import { Screen, Text, Card, ListRow, Badge, Skeleton } from "@/components/ui";
import { ErrorState } from "@/components/merchant/Rows";
import { useMyMerchant, usePlatformSetting } from "@/features/merchant/useMerchant";
import { parseBankAccount } from "@/features/merchant/types";
import { useAuth } from "@/store/auth";
import { errorMessage } from "@/lib/errors";

/** Pantalla 56 · Cuenta del comercio. */
export default function MerchantAccount() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const q = useMyMerchant();
  const m = q.data;
  const { data: supportPhone } = usePlatformSetting<string>("support_phone", "+57 300 000 0000");
  const bank = parseBankAccount(m?.bank_account);

  const confirmSignOut = () => Alert.alert("Cerrar sesión", "¿Quieres salir de tu cuenta de comercio?", [{ text: "Cancelar", style: "cancel" }, { text: "Cerrar sesión", style: "destructive", onPress: () => signOut() }]);

  return (
    <Screen refreshing={q.isFetching && !q.isLoading} onRefresh={() => q.refetch()}>
      <Text variant="title" style={{ paddingTop: 12, marginBottom: 12 }}>Cuenta</Text>
      {q.isLoading ? <Skeleton height={96} style={{ marginBottom: 16 }} /> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : m ? (
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.gray100, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
              {m.logo_url ? <Image source={{ uri: m.logo_url }} style={{ width: 56, height: 56 }} contentFit="cover" /> : <Ionicons name="storefront-outline" size={24} color={colors.gray400} />}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="heading">{m.name}</Text>
              <Text variant="caption" tone="muted">{ORDER_TYPE_LABEL[m.category]} · {m.address ?? ""}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <Badge label={MERCHANT_STATUS_LABEL[m.status]} tone={m.status === "active" ? "green" : "yellow"} />
                <Ionicons name="star" size={12} color={colors.yellow} style={{ marginLeft: 8, marginRight: 2 }} />
                <Text variant="small" tone="muted">{formatRating(m.rating_avg)} ({m.rating_count})</Text>
              </View>
            </View>
          </View>
        </Card>
      ) : null}

      <Text variant="caption" tone="muted" style={{ marginBottom: 4 }}>Mi comercio</Text>
      <ListRow icon="storefront-outline" title="Datos y horarios" subtitle="Nombre, descripción, teléfono y horario de atención" onPress={() => router.push("/(merchant)/hours")} />
      <ListRow icon="restaurant-outline" title="Mi menú" subtitle="Productos, fotos, precios y disponibilidad" onPress={() => router.push("/(merchant)/menu")} />

      <Text variant="caption" tone="muted" style={{ marginTop: 20, marginBottom: 4 }}>Dinero</Text>
      <ListRow icon="wallet-outline" title="Liquidaciones" subtitle="Ventas menos comisión por periodo" onPress={() => router.push("/(merchant)/settlements")} />
      <ListRow icon="card-outline" title="Cuenta bancaria" subtitle={bank ? `${bank.bank} · ${bank.type} ${bank.number}` : "Agrega la cuenta para recibir tus abonos"} onPress={() => router.push("/(merchant)/bank")} />

      <Text variant="caption" tone="muted" style={{ marginTop: 20, marginBottom: 4 }}>Cuenta</Text>
      <ListRow icon="person-outline" title={profile?.full_name ?? "Administrador"} subtitle={profile?.email ?? profile?.phone ?? ""} chevron={false} />
      <ListRow icon="help-circle-outline" title="Soporte para comercios" subtitle={supportPhone ?? ""} onPress={() => Linking.openURL(`tel:${(supportPhone ?? "").replace(/\s/g, "")}`).catch(() => {})} />
      <ListRow icon="log-out-outline" title="Cerrar sesión" onPress={confirmSignOut} danger chevron={false} />
      <Text variant="small" tone="subtle" style={{ marginTop: 24, textAlign: "center" }}>YAVA Comercios · Puerto Colombia y Barranquilla</Text>
    </Screen>
  );
}
