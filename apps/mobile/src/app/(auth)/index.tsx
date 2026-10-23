import React from "react";
import { View, Platform, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Text, Button, Logo } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useNavIntent } from "@/features/customer/stores";
import { loginHref } from "@/features/customer/useRequireAuth";

/** Pantalla 01 · Apertura. */
export default function Welcome() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const setPendingNext = useNavIntent((s) => s.setPendingNext);

  function goProtected(target: string) {
    if (session) { router.push(target as never); return; }
    setPendingNext(target);
    router.push(loginHref(target) as never);
  }

  return (
    <Screen scroll={false} edges={["top", "bottom"]}>
      <View style={styles.hero}>
        <Logo size={72} />
        <Text variant="title" style={{ marginTop: 28, textAlign: "center" }}>Lo que necesitas, en minutos</Text>
        <Text tone="muted" style={{ marginTop: 8, textAlign: "center" }}>Comida, mercado, farmacia y envíos en Puerto Colombia y Barranquilla.</Text>
      </View>
      <View style={{ gap: 10 }}>
        <Button title="Continuar con celular" icon="phone-portrait-outline" onPress={() => router.push("/(auth)/phone" as never)} />
        <Button title="Continuar con Google" icon="logo-google" variant="outline" onPress={() => router.push("/(auth)/login?provider=google" as never)} />
        {Platform.OS === "ios" ? <Button title="Continuar con Apple" icon="logo-apple" variant="outline" onPress={() => router.push("/(auth)/login?provider=apple" as never)} /> : null}
        <Button title="Explorar sin cuenta" variant="ghost" onPress={() => router.replace("/(customer)" as never)} />
      </View>
      <View style={styles.links}>
        <Pressable onPress={() => goProtected("/(onboarding)/merchant-register")} style={styles.link}>
          <Ionicons name="storefront-outline" size={16} color={colors.gray700} />
          <Text variant="caption" style={{ marginLeft: 6, fontWeight: "600", color: colors.gray700 }}>Soy comercio</Text>
        </Pressable>
        <View style={{ width: 1, height: 16, backgroundColor: colors.gray300 }} />
        <Pressable onPress={() => goProtected("/(onboarding)/courier-register")} style={styles.link}>
          <Ionicons name="bicycle-outline" size={16} color={colors.gray700} />
          <Text variant="caption" style={{ marginLeft: 6, fontWeight: "600", color: colors.gray700 }}>Soy repartidor</Text>
        </Pressable>
      </View>
      <Text variant="small" tone="subtle" style={{ textAlign: "center", marginTop: 16 }}>Al continuar aceptas los Términos y la Política de privacidad de YAVA.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  links: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 20 },
  link: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
});
