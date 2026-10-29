import React from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text, Button, CountBadge } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { Avatar, useTabBarSpace } from "@/components/customer";
import { AccountGroup, AccountRow, ACC_GUTTER, ft } from "@/components/customer/account/kit";
import { LineIcon } from "@/components/customer/account/icons";
import { useNotifications, loginHref } from "@/features/customer";

/** Amarillo del tiquete de "Cupones" (35 mide #FDBD06). */
const COUPON_YELLOW = "#FDBD06";

/**
 * Pantalla 35 · Cuenta (tanda-05/35-cuenta.png): "Cuenta" H1, avatar con iniciales + nombre + correo + "Editar ›",
 * y tres grupos de filas (C17b) con íconos azules. La barra flotante la pone `(tabs)/_layout.tsx`.
 */
export default function Account() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);
  const notifications = useNotifications();
  const unread = (notifications.data ?? []).filter((n) => !n.read_at).length;

  const go = (path: string) => () => router.push(path as never);
  const icon = (name: React.ComponentProps<typeof LineIcon>["name"], color: string = colors.blue) => <LineIcon name={name} size={29.5} color={color} />;

  if (!session) {
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: tabSpace }} showsVerticalScrollIndicator={false}>
          <Text style={styles.h1}>Cuenta</Text>
          <View style={styles.guest}>
            <View style={styles.guestAvatar}><LineIcon name="user" size={34} /></View>
            <Text style={[ft(17, "700"), { marginTop: 14 }]}>Entra o crea tu cuenta</Text>
            <Text style={[ft(14.5, "400", colors.textTertiary, 20), { textAlign: "center", marginTop: 6, marginBottom: 18 }]}>
              Guarda direcciones, sigue tus pedidos y usa cupones.
            </Text>
            <Button title="Iniciar sesión" onPress={() => router.push(loginHref("/(customer)/account") as never)} />
          </View>
          <AccountGroup style={styles.firstGroup}>
            <AccountRow icon={icon("help")} title="Ayuda" onPress={go("/(customer)/help")} />
          </AccountGroup>
          <AccountGroup style={styles.nextGroup}>
            <AccountRow icon={icon("store")} title="Registra tu comercio" onPress={() => router.push(loginHref("/(onboarding)/merchant-register") as never)} />
            <AccountRow icon={icon("moped")} title="Quiero repartir" onPress={() => router.push(loginHref("/(onboarding)/courier-register") as never)} />
          </AccountGroup>
        </ScrollView>
      </View>
    );
  }

  const name = profile?.full_name ?? "Tu cuenta";
  const contact = profile?.email ?? session.user.email ?? profile?.phone ?? "";

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: tabSpace }} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1} accessibilityRole="header">Cuenta</Text>

        <View style={styles.profile}>
          <Avatar name={profile?.full_name} uri={profile?.avatar_url} size={63} />
          <View style={styles.profileText}>
            <Text style={[ft(15.6, "500", colors.ink, 21), { marginTop: 1.5 }]} numberOfLines={1}>{name}</Text>
            {contact ? <Text style={[ft(12.9, "400", "#6B707E", 18), { marginTop: 1 }]} numberOfLines={1}>{contact}</Text> : null}
          </View>
          <Pressable onPress={go("/(customer)/settings")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Editar perfil" style={styles.edit}>
            <Text style={ft(12.7, "400", colors.blueLink, 18)}>Editar</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.blueLink} style={{ marginLeft: 3 }} />
          </Pressable>
        </View>

        <AccountGroup style={styles.firstGroup}>
          <AccountRow icon={icon("clipboard")} title="Mis pedidos" onPress={go("/(customer)/orders")} />
          <AccountRow icon={icon("pin")} title="Direcciones" onPress={go("/(customer)/addresses")} />
          <AccountRow icon={icon("card")} title="Métodos de pago" onPress={go("/(customer)/payment-methods")} />
          <AccountRow icon={icon("ticket", COUPON_YELLOW)} title="Cupones" onPress={go("/(customer)/coupon")} />
        </AccountGroup>

        <AccountGroup style={styles.nextGroup}>
          <AccountRow icon={icon("bell")} title="Notificaciones" onPress={go("/(customer)/notifications")}
            accessibilityLabel={unread ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
            right={unread ? <View style={styles.unread}><CountBadge count={unread} style={styles.unreadBadge} /></View> : undefined} />
          <AccountRow icon={icon("help")} title="Ayuda" onPress={go("/(customer)/help")} />
          <AccountRow icon={icon("settings")} title="Ajustes" onPress={go("/(customer)/settings")} />
        </AccountGroup>

        <AccountGroup style={styles.nextGroup}>
          <AccountRow icon={icon("store")} title="Registra tu comercio" onPress={go("/(onboarding)/merchant-register")} />
          <AccountRow icon={icon("moped")} title="Quiero repartir" onPress={go("/(onboarding)/courier-register")} />
        </AccountGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  h1: { ...ft(28, "700", colors.ink, 34), letterSpacing: -0.4, marginTop: 13, marginLeft: 20 },
  profile: { flexDirection: "row", alignItems: "center", marginTop: 16, paddingLeft: 19, paddingRight: 15 },
  profileText: { flex: 1, marginLeft: 15 },
  edit: { flexDirection: "row", alignItems: "center" },
  firstGroup: { marginTop: 18, marginHorizontal: ACC_GUTTER },
  nextGroup: { marginTop: 18, marginHorizontal: ACC_GUTTER },
  unread: { width: 22, height: 18, marginRight: 2 },
  unreadBadge: { top: 0, right: 0 },
  guest: { marginTop: 16, marginHorizontal: ACC_GUTTER, alignItems: "center", paddingVertical: 26, paddingHorizontal: 18, borderRadius: 18, borderWidth: 1, borderColor: "#E9EBF0" },
  guestAvatar: { width: 63, height: 63, borderRadius: 32, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" },
});
