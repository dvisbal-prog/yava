import React, { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Screen, Header, Text, Button, Chip } from "@/components/ui";
import { RadioRow } from "@/components/customer";
import { useMerchantFilters, type MerchantFilters } from "@/features/customer";

/** Pantalla 11 · Filtros (orden, tiempo, envío, calificación, abierto ahora). */
export default function Filters() {
  const router = useRouter();
  const store = useMerchantFilters();
  const [f, setF] = useState<MerchantFilters>({ sort: store.sort, maxTime: store.maxTime, delivery: store.delivery, minRating: store.minRating, openNow: store.openNow, tag: store.tag });
  const close = () => (router.canGoBack() ? router.back() : router.replace("/(customer)/restaurants" as never));

  function apply() { store.set(f); close(); }
  function clear() { setF({ sort: "recommended", maxTime: null, delivery: null, minRating: null, openNow: false, tag: null }); }

  return (
    <Screen edges={["top", "bottom"]} footer={<Button title="Aplicar filtros" onPress={apply} />}>
      <Header title="Filtros" back={false}
        right={<Pressable onPress={close} hitSlop={10}><Ionicons name="close" size={24} color={colors.carbon} /></Pressable>} />
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <Pressable onPress={clear} hitSlop={8}><Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>Limpiar</Text></Pressable>
      </View>

      <Text variant="heading" style={{ marginTop: 8, marginBottom: 4 }}>Ordenar por</Text>
      <RadioRow title="Recomendados" selected={f.sort === "recommended"} onPress={() => setF({ ...f, sort: "recommended" })} />
      <RadioRow title="Menor tiempo de entrega" selected={f.sort === "fastest"} onPress={() => setF({ ...f, sort: "fastest" })} />
      <RadioRow title="Mejor calificación" selected={f.sort === "rating"} onPress={() => setF({ ...f, sort: "rating" })} />

      <Text variant="heading" style={{ marginTop: 20, marginBottom: 10 }}>Tiempo de entrega</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip label="Todos" selected={f.maxTime === null} onPress={() => setF({ ...f, maxTime: null })} />
        <Chip label="Hasta 30 min" selected={f.maxTime === 30} onPress={() => setF({ ...f, maxTime: 30 })} />
        <Chip label="Hasta 35 min" selected={f.maxTime === 35} onPress={() => setF({ ...f, maxTime: 35 })} />
        <Chip label="Hasta 45 min" selected={f.maxTime === 45} onPress={() => setF({ ...f, maxTime: 45 })} />
      </ScrollView>

      <Text variant="heading" style={{ marginTop: 20, marginBottom: 10 }}>Costo de envío</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip label="Todos" selected={f.delivery === null} onPress={() => setF({ ...f, delivery: null })} />
        <Chip label="Gratis" selected={f.delivery === "free"} onPress={() => setF({ ...f, delivery: "free" })} />
        <Chip label="Hasta $3.000" selected={f.delivery === 3000} onPress={() => setF({ ...f, delivery: 3000 })} />
      </ScrollView>

      <Text variant="heading" style={{ marginTop: 20, marginBottom: 10 }}>Calificación</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip label="Todas" selected={f.minRating === null} onPress={() => setF({ ...f, minRating: null })} />
        <Chip label="4,5 o más" icon="star" selected={f.minRating === 4.5} onPress={() => setF({ ...f, minRating: 4.5 })} />
      </ScrollView>

      <View style={{ marginTop: 20 }}>
        <RadioRow title="Abierto ahora" subtitle="Oculta los comercios cerrados" checkbox selected={f.openNow} onPress={() => setF({ ...f, openNow: !f.openNow })} />
      </View>
    </Screen>
  );
}
