import React, { useMemo, useState } from "react";
import { View, Pressable, StyleSheet, Linking, LayoutAnimation } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP } from "@yava/shared";
import { Screen, Header, Text, Button, Card, SearchBar, StatusPill } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useMyOrders, useOrder, useSupportPhone, relativeDateTime, loginHref } from "@/features/customer";

interface Topic { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; faqs: { q: string; a: string }[] }
const TOPICS: Topic[] = [
  { icon: "fast-food-outline", title: "Problemas con mi pedido", subtitle: "Retrasos, productos, calidad y más", faqs: [
    { q: "Mi pedido está demorado", a: "Revisa el tiempo estimado en Seguimiento. Si supera el máximo, escríbenos por el chat de soporte y lo revisamos con el comercio y el repartidor." },
    { q: "Faltó un producto o llegó mal", a: "Desde el pedido entregado toca \"Tuve un problema\" y cuéntanos qué pasó. Te respondemos en minutos y gestionamos el reembolso si aplica." },
    { q: "¿Puedo cancelar?", a: "Puedes cancelar sin costo mientras el comercio no haya empezado a preparar tu pedido, desde Seguimiento → Cancelar pedido." },
  ] },
  { icon: "card-outline", title: "Pagos y reembolsos", subtitle: "Cargos, devoluciones y métodos de pago", faqs: [
    { q: "¿Cómo puedo pagar?", a: "En efectivo o con Nequi/Daviplata al recibir. El pago con tarjeta se procesa de forma segura con Wompi." },
    { q: "¿Cuándo llega mi reembolso?", a: "Los reembolsos a tarjeta tardan de 3 a 10 días hábiles según tu banco. En efectivo se devuelven como saldo o cupón." },
  ] },
  { icon: "person-outline", title: "Mi cuenta", subtitle: "Perfil, seguridad y preferencias", faqs: [
    { q: "Cambiar mi nombre o correo", a: "Ve a Cuenta → Ajustes → Datos personales." },
    { q: "Eliminar mi cuenta", a: "Desde Ajustes → Eliminar cuenta. Procesamos la solicitud en máximo 72 horas." },
  ] },
  { icon: "map-outline", title: "Direcciones y cobertura", subtitle: "Direcciones, zonas de entrega y horarios", faqs: [
    { q: "¿Dónde entregan?", a: "Por ahora en Puerto Colombia y el norte de Barranquilla. Estamos ampliando la cobertura." },
    { q: "¿En qué horario?", a: "Cada comercio define su horario; lo ves en su página. YAVA opera de 7:00 a 23:00." },
  ] },
];

/** Pantalla 39 · ¿Cómo te ayudamos? (FAQ en acordeón, pedido reciente, chat y llamada). */
export default function Help() {
  const router = useRouter();
  const params = useLocalSearchParams<{ order?: string }>();
  const session = useAuth((s) => s.session);
  const orders = useMyOrders();
  const specific = useOrder(params.order);
  const phone = useSupportPhone();
  const [q, setQ] = useState("");
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const recent = specific.data ?? orders.data?.[0] ?? null;
  const topics = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return TOPICS;
    return TOPICS.map((t) => ({ ...t, faqs: t.faqs.filter((f) => f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term)) })).filter((t) => t.faqs.length || t.title.toLowerCase().includes(term));
  }, [q]);

  // Tema y pregunta van en estados separados: abrir una pregunta no debe cerrar su tema.
  function toggleTopic(key: string) { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpenTopic((cur) => (cur === key ? null : key)); }
  function toggleFaq(key: string) { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpenFaq((cur) => (cur === key ? null : key)); }

  function chat() {
    const target = `/(customer)/support${recent?.id ? `?order=${recent.id}` : ""}`;
    if (!session) { router.push(loginHref(target) as never); return; }
    router.push(target as never);
  }

  return (
    <Screen footer={
      <View style={{ gap: 8 }}>
        <Button title="Hablar con soporte" icon="chatbubble-ellipses-outline" onPress={chat} />
        {phone.data ? <Button title={`Llamar ${phone.data}`} icon="call-outline" variant="outline" onPress={() => Linking.openURL(`tel:${phone.data?.replace(/\s/g, "")}`)} /> : null}
      </View>
    }>
      <Header title="¿Cómo te ayudamos?" onBack={() => (router.canGoBack() ? router.back() : router.replace("/(customer)/account" as never))} />
      <View style={{ marginTop: 8 }}><SearchBar value={q} onChangeText={setQ} placeholder="Busca un tema" onClear={() => setQ("")} /></View>

      {recent ? (
        <View style={{ marginTop: 20 }}>
          <Text variant="caption" tone="muted" style={{ marginBottom: 8 }}>Tu pedido reciente</Text>
          <Card onPress={() => router.push(recent.status === "delivered" ? `/(customer)/order/${recent.id}/delivered` as never : `/(customer)/order/${recent.id}` as never)} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{recent.type === "shipment" ? "Envío" : recent.merchant_name} · Pedido #{recent.number}</Text>
              <Text variant="caption" tone="muted">{relativeDateTime(recent.delivered_at ?? recent.placed_at)} · {formatCOP(recent.total)}</Text>
            </View>
            {recent.status ? <StatusPill status={recent.status} /> : null}
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} style={{ marginLeft: 6 }} />
          </Card>
        </View>
      ) : null}

      <Text variant="heading" style={{ marginTop: 24, marginBottom: 8 }}>Temas de ayuda</Text>
      {topics.map((t) => (
        <View key={t.title} style={styles.topic}>
          <Pressable onPress={() => toggleTopic(t.title)} style={styles.topicHead}>
            <View style={styles.iconBox}><Ionicons name={t.icon} size={20} color={colors.blue} /></View>
            <View style={{ flex: 1 }}><Text variant="bodyStrong">{t.title}</Text><Text variant="caption" tone="muted">{t.subtitle}</Text></View>
            <Ionicons name={openTopic === t.title ? "chevron-up" : "chevron-down"} size={18} color={colors.gray400} />
          </Pressable>
          {openTopic === t.title || q.trim() ? t.faqs.map((f) => (
            <View key={f.q} style={styles.faq}>
              <Pressable onPress={() => toggleFaq(`${t.title}:${f.q}`)} style={{ flexDirection: "row", alignItems: "center" }}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>{f.q}</Text>
                <Ionicons name={openFaq === `${t.title}:${f.q}` || q.trim() ? "remove" : "add"} size={18} color={colors.blue} />
              </Pressable>
              {openFaq === `${t.title}:${f.q}` || q.trim() ? <Text tone="muted" style={{ marginTop: 6 }}>{f.a}</Text> : null}
            </View>
          )) : null}
        </View>
      ))}
      <Text variant="caption" tone="subtle" style={{ marginTop: 12, textAlign: "center" }}>Consulta también las preguntas frecuentes antes de escribirnos.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  topic: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.lg, marginBottom: 10, overflow: "hidden" },
  topicHead: { flexDirection: "row", alignItems: "center", padding: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  faq: { paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.gray100, backgroundColor: colors.gray50 },
});
