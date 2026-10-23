import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Text, ListRow, Button, Card, Badge } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { Avatar } from "@/components/customer";
import { useNotifications, loginHref } from "@/features/customer";

/** Pantalla 35 · Cuenta. */
export default function Account() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);
  const notifications = useNotifications();
  const unread = (notifications.data ?? []).filter((n) => !n.read_at).length;

  const go = (path: string) => () => router.push(path as never);

  if (!session) {
    return (
      <Screen>
        <Text variant="display" style={{ marginTop: 12 }}>Tu cuenta</Text>
        <Card style={{ marginTop: 16, alignItems: "center", paddingVertical: 28 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="person-outline" size={34} color={colors.blue} />
          </View>
          <Text variant="heading" style={{ marginTop: 14 }}>Entra o crea tu cuenta</Text>
          <Text tone="muted" style={{ textAlign: "center", marginTop: 6, marginBottom: 18 }}>Guarda direcciones, sigue tus pedidos y usa cupones.</Text>
          <Button title="Iniciar sesión" onPress={() => router.push(loginHref("/(customer)/account") as never)} />
        </Card>
        <View style={{ marginTop: 20 }}>
          <ListRow icon="help-circle-outline" title="Ayuda" onPress={go("/(customer)/help")} />
          <ListRow icon="storefront-outline" title="Soy comercio" subtitle="Vende en YAVA" onPress={() => router.push(loginHref("/(onboarding)/merchant-register") as never)} />
          <ListRow icon="bicycle-outline" title="Soy repartidor" subtitle="Genera ingresos con tu moto o bici" onPress={() => router.push(loginHref("/(onboarding)/courier-register") as never)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable onPress={go("/(customer)/settings")} style={{ flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 20 }}>
        <Avatar name={profile?.full_name} uri={profile?.avatar_url} size={60} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text variant="title">{profile?.full_name ?? "Tu cuenta"}</Text>
          <Text variant="caption" tone="muted">{profile?.phone ?? profile?.email ?? session.user.email ?? ""}</Text>
        </View>
        <Ionicons name="create-outline" size={20} color={colors.gray500} />
      </Pressable>

      <ListRow icon="receipt-outline" title="Mis pedidos" subtitle="En curso e historial" onPress={go("/(customer)/orders")} />
      <ListRow icon="location-outline" title="Direcciones" onPress={go("/(customer)/addresses")} />
      <ListRow icon="card-outline" title="Métodos de pago" onPress={go("/(customer)/payment-methods")} />
      <ListRow icon="pricetag-outline" title="Cupones" onPress={go("/(customer)/coupon")} />
      <ListRow icon="notifications-outline" title="Notificaciones" onPress={go("/(customer)/notifications")} right={unread ? <Badge label={String(unread)} tone="red" /> : undefined} />
      <ListRow icon="help-circle-outline" title="Ayuda" onPress={go("/(customer)/help")} />
      <ListRow icon="settings-outline" title="Ajustes" subtitle="Notificaciones, idioma y cuenta" onPress={go("/(customer)/settings")} />

      <Text variant="caption" tone="muted" style={{ marginTop: 24, marginBottom: 4 }}>Trabaja con YAVA</Text>
      <ListRow icon="storefront-outline" title="Soy comercio" subtitle="Registra tu negocio" onPress={go("/(onboarding)/merchant-register")} />
      <ListRow icon="bicycle-outline" title="Soy repartidor" subtitle="Genera ingresos con tu moto o bici" onPress={go("/(onboarding)/courier-register")} />
      <Text variant="small" tone="subtle" style={{ textAlign: "center", marginTop: 24 }}>YAVA · v1.0.0</Text>
    </Screen>
  );
}
