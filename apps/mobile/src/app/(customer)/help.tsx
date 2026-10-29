import React, { useMemo, useRef, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Linking, LayoutAnimation, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, ORDER_STATUS_LABEL } from "@yava/shared";
import { Text, SearchBar } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { NavBar, RowChevron, ft } from "@/components/customer/account/kit";
import { LineIcon, type LineIconName } from "@/components/customer/account/icons";
import { PrimaryCTA } from "@/components/customer/account/parts";
import { helpOrderPhoto } from "@/components/customer/account/photos";
import { useMyOrders, useOrder, useSupportPhone, relativeDateTime, loginHref } from "@/features/customer";

/** En web un `<button>` no puede contener otro: la tarjeta del pedido solo se anuncia como botón en nativo. */
const CARD_ROLE = Platform.OS === "web" ? undefined : ("button" as const);

interface Topic { icon: LineIconName; title: string; subtitle: string; faqs: { q: string; a: string }[] }
const TOPICS: Topic[] = [
  { icon: "box", title: "Problemas con mi pedido", subtitle: "Retrasos, productos, calidad y más", faqs: [
    { q: "Mi pedido está demorado", a: "Revisa el tiempo estimado en Seguimiento. Si supera el máximo, escríbenos por el chat de soporte y lo revisamos con el comercio y el repartidor." },
    { q: "Faltó un producto o llegó mal", a: "Desde el pedido entregado toca \"Tuve un problema\" y cuéntanos qué pasó. Te respondemos en minutos y gestionamos el reembolso si aplica." },
    { q: "¿Puedo cancelar?", a: "Puedes cancelar sin costo mientras el comercio no haya empezado a preparar tu pedido, desde Seguimiento → Cancelar pedido." },
  ] },
  { icon: "card", title: "Pagos y reembolsos", subtitle: "Cargos, devoluciones y métodos de pago", faqs: [
    { q: "¿Cómo puedo pagar?", a: "En efectivo o con Nequi/Daviplata al recibir. El pago con tarjeta se procesa de forma segura con Wompi." },
    { q: "¿Cuándo llega mi reembolso?", a: "Los reembolsos a tarjeta tardan de 3 a 10 días hábiles según tu banco. En efectivo se devuelven como saldo o cupón." },
  ] },
  { icon: "user", title: "Mi cuenta", subtitle: "Perfil, seguridad y preferencias", faqs: [
    { q: "Cambiar mi nombre o correo", a: "Ve a Cuenta → Ajustes → Datos personales." },
    { q: "Eliminar mi cuenta", a: "Desde Ajustes → Eliminar cuenta. Procesamos la solicitud en máximo 72 horas." },
  ] },
  { icon: "pin", title: "Direcciones y cobertura", subtitle: "Direcciones, zonas de entrega y horarios", faqs: [
    { q: "¿Dónde entregan?", a: "Por ahora en Puerto Colombia y el norte de Barranquilla. Estamos ampliando la cobertura." },
    { q: "¿En qué horario?", a: "Cada comercio define su horario; lo ves en su página. YAVA opera de 7:00 a 23:00." },
  ] },
];

/** Fondo del círculo de los temas (39 mide #F1F6FE). */
const TOPIC_CIRCLE = "#F1F6FE";

/**
 * Pantalla 39 · ¿Cómo te ayudamos? (tanda-05/39-ayuda.png): flecha, H1, buscador "Busca un tema", tarjeta del pedido
 * reciente (foto, comercio, número, estado y "Ver ayuda ›"), cuatro temas en tarjetas (cada uno se despliega con sus
 * preguntas) y, abajo, "Hablar con soporte" + "Consulta también las preguntas frecuentes". El teléfono de soporte (si existe)
 * aparece al final de los temas cuando se abren las preguntas.
 */
export default function Help() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ order?: string }>();
  const session = useAuth((s) => s.session);
  const orders = useMyOrders();
  const specific = useOrder(params.order);
  const phone = useSupportPhone();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [topicsY, setTopicsY] = useState(0);
  const [q, setQ] = useState("");
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const recent = specific.data ?? orders.data?.[0] ?? null;
  const searching = Boolean(q.trim());
  const topics = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return TOPICS;
    return TOPICS.map((t) => ({ ...t, faqs: t.faqs.filter((f) => f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term)) })).filter((t) => t.faqs.length || t.title.toLowerCase().includes(term));
  }, [q]);

  // Tema y pregunta van en estados separados: abrir una pregunta no debe cerrar su tema.
  function toggleTopic(key: string) { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpenTopic((cur) => (cur === key ? null : key)); }
  function toggleFaq(key: string) { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpenFaq((cur) => (cur === key ? null : key)); }
  function openFaqs() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAll(true);
    scrollRef.current?.scrollTo({ y: Math.max(0, topicsY - 12), animated: true });
  }

  function chat() {
    const target = `/(customer)/support${recent?.id ? `?order=${recent.id}` : ""}`;
    if (!session) { router.push(loginHref(target) as never); return; }
    router.push(target as never);
  }

  const openRecent = () => {
    if (!recent) return;
    router.push(recent.status === "delivered" ? `/(customer)/order/${recent.id}/delivered` as never : `/(customer)/order/${recent.id}` as never);
  };
  const recentTime = recent ? relativeDateTime(recent.delivered_at ?? recent.cancelled_at ?? recent.placed_at).split(" · ")[1] ?? "" : "";
  const recentName = recent ? (recent.type === "shipment" ? "Envío" : recent.merchant_name ?? "Pedido") : "";
  const delivered = recent?.status === "delivered";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <NavBar icon="arrow-back" backLeft={16.1} iconSize={28.3} height={46.6} onBack={() => (router.canGoBack() ? router.back() : router.replace("/(customer)/account" as never))} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.h1} accessibilityRole="header">¿Cómo te ayudamos?</Text>
        <SearchBar value={q} onChangeText={setQ} placeholder="Busca un tema" onClear={() => setQ("")} height={44} style={styles.search} />

        {recent && !searching ? (
          <>
            <Text style={styles.section}>Tu pedido reciente</Text>
            <Pressable onPress={openRecent} accessibilityRole={CARD_ROLE} accessibilityLabel={`${recentName}, pedido #${recent.number}`}
              style={({ pressed }) => [styles.recent, pressed && { opacity: 0.9 }]}>
              {recent.type === "shipment" ? (
                <View style={[styles.recentPhoto, styles.recentShipment]}><LineIcon name="box" size={44} color="#8A6400" /></View>
              ) : (
                <Image source={helpOrderPhoto(recent.merchant_name, recent.merchant_logo)} style={styles.recentPhoto} contentFit="cover" transition={120} />
              )}
              <View style={styles.recentBody}>
                <Text style={ft(13.9, "600", colors.ink, 18)} numberOfLines={1}>{recentName}</Text>
                <Text style={[ft(11.9, "400", "#6E7689", 16), { marginTop: 1.6 }]}>Pedido #{recent.number}</Text>
                {recent.status ? (
                  <View style={[styles.pill, !delivered && { backgroundColor: colors.blueSoft }]}>
                    {delivered ? <Ionicons name="checkmark-circle" size={14.5} color="#13924B" style={{ marginRight: 4 }} /> : null}
                    <Text style={ft(9.9, "500", delivered ? "#0A6B33" : colors.blueText, 14)} numberOfLines={1}>
                      {ORDER_STATUS_LABEL[recent.status]}{recentTime ? ` · ${recentTime}` : ""}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Pressable onPress={chat} hitSlop={10} accessibilityRole="link" accessibilityLabel="Ver ayuda de este pedido" style={styles.recentLink}>
                <Text style={ft(11.4, "500", colors.blueLink, 15)}>Ver ayuda</Text>
                <Ionicons name="chevron-forward" size={14.5} color={colors.blueLink} style={{ marginLeft: 4 }} />
              </Pressable>
            </Pressable>
          </>
        ) : null}

        <Text style={[styles.section, { marginTop: recent && !searching ? 22.6 : 22, marginBottom: 12 }]} onLayout={(e) => setTopicsY(e.nativeEvent.layout.y)}>Temas de ayuda</Text>
        {!topics.length ? (
          <Text style={[ft(13.5, "400", "#6E7689", 19), { textAlign: "center", marginTop: 12 }]}>No encontramos temas para "{q.trim()}". Escríbenos por el chat.</Text>
        ) : (
          <View style={{ gap: 7.4 }}>
            {topics.map((t) => {
              const open = searching || showAll || openTopic === t.title;
              return (
                <View key={t.title} style={styles.topic}>
                  <Pressable onPress={() => toggleTopic(t.title)} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${t.title}. ${t.subtitle}`}
                    style={({ pressed }) => [styles.topicHead, pressed && { opacity: 0.85 }]}>
                    <View style={styles.topicCircle}><LineIcon name={t.icon} size={26} color={colors.blue} stroke={1.7} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={ft(13, "600", colors.ink, 18)} numberOfLines={1}>{t.title}</Text>
                      <Text style={[ft(10.8, "400", "#6E7689", 16), { marginTop: 3 }]} numberOfLines={1}>{t.subtitle}</Text>
                    </View>
                    <RowChevron color="#606B84" size={18} style={open ? { transform: [{ rotate: "90deg" }] } : undefined} />
                  </Pressable>
                  {open ? t.faqs.map((f) => {
                    const key = `${t.title}:${f.q}`;
                    const faqOpen = searching || openFaq === key;
                    return (
                      <View key={f.q} style={styles.faq}>
                        <Pressable onPress={() => toggleFaq(key)} style={styles.faqHead} accessibilityRole="button" accessibilityState={{ expanded: faqOpen }}>
                          <Text style={[ft(13, "600", colors.ink, 18), { flex: 1 }]}>{f.q}</Text>
                          <Ionicons name={faqOpen ? "remove" : "add"} size={18} color={colors.blue} />
                        </Pressable>
                        {faqOpen ? <Text style={[ft(12.6, "400", "#565F73", 18), { marginTop: 6 }]}>{f.a}</Text> : null}
                      </View>
                    );
                  }) : null}
                </View>
              );
            })}
          </View>
        )}
        {/* El PNG no muestra el teléfono: aparece cuando el cliente abre las preguntas (un tema, "preguntas frecuentes" o una búsqueda). */}
        {phone.data && (showAll || searching || openTopic) ? (
          <Pressable onPress={() => { void Linking.openURL(`tel:${phone.data?.replace(/\s/g, "")}`); }} hitSlop={8} accessibilityRole="link" style={styles.call}>
            <Ionicons name="call-outline" size={14} color={colors.blueLink} style={{ marginRight: 5 }} />
            <Text style={ft(12, "500", colors.blueLink, 16)}>¿Prefieres llamar? {phone.data}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 14, 12) }]}>
        <PrimaryCTA title="Hablar con soporte" onPress={chat} height={47.1} radius={14} fontSize={12.9} color="#0047AC"
          leading={<LineIcon name="headset" size={24} color={colors.white} stroke={1.9} />} />
        <Text style={styles.note}>
          Consulta también las{" "}
          <Text style={{ color: colors.blueLink }} onPress={openFaqs} accessibilityRole="link">preguntas frecuentes</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 16.2, paddingBottom: 24 },
  h1: { ...ft(29.7, "700", colors.ink, 35), letterSpacing: -0.5, marginTop: 2.4, marginLeft: 2.8 },
  search: { marginTop: 15.4, marginBottom: 2, marginHorizontal: 1.4 },
  section: { ...ft(16.2, "700", colors.ink, 21), letterSpacing: -0.2, marginTop: 20, marginLeft: 2.3, marginBottom: 9 },
  recent: { flexDirection: "row", height: 103.7, borderRadius: 16, borderWidth: 1, borderColor: "#E6E9EF", backgroundColor: colors.white, marginHorizontal: -1.4, paddingLeft: 9.1, paddingTop: 9.6 },
  recentPhoto: { width: 118.3, height: 82.2, borderRadius: 10, backgroundColor: colors.surfaceGray },
  recentShipment: { alignItems: "center", justifyContent: "center", backgroundColor: "#FFF4D1" },
  recentBody: { flex: 1, marginLeft: 12.4, paddingTop: 11.2 },
  pill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", height: 22.7, borderRadius: 12, backgroundColor: "#E3FBEF", paddingLeft: 5, paddingRight: 9, marginTop: 5.7 },
  recentLink: { position: "absolute", right: 5.4, top: 38.5, flexDirection: "row", alignItems: "center" },
  topic: { borderRadius: 16, borderWidth: 1, borderColor: "#E6E9EF", backgroundColor: colors.white, overflow: "hidden" },
  topicHead: { flexDirection: "row", alignItems: "center", height: 66.4, paddingLeft: 11.4, paddingRight: 15 },
  topicCircle: { width: 41.6, height: 41.6, borderRadius: 21, backgroundColor: TOPIC_CIRCLE, alignItems: "center", justifyContent: "center", marginRight: 16.9 },
  faq: { paddingHorizontal: 16, paddingVertical: 11, borderTopWidth: 1, borderTopColor: "#EEF0F4", backgroundColor: colors.surfaceSoft },
  faqHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  call: { flexDirection: "row", alignItems: "center", alignSelf: "center", marginTop: 18 },
  footer: { paddingHorizontal: 16.6, paddingTop: 8, backgroundColor: colors.white },
  note: { ...ft(12.6, "400", "#6E7689", 17), textAlign: "center", marginTop: 16.7 },
});
