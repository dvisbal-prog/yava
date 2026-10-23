import React, { useEffect, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatCOP, formatRating } from "@yava/shared";
import { Screen, Header, SearchBar, Text, EmptyState, Chip } from "@/components/ui";
import { ErrorState, ListSkeleton } from "@/components/customer";
import { useSearch, type SearchResult } from "@/features/customer";

const SUGGESTIONS = ["Ceviche", "Hamburguesa", "Shawarma", "Limonada", "Frutas", "Dolex"];

/** Pantalla 10 · Búsqueda (41 sin resultados). */
export default function Search() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [text, setText] = useState(params.q ?? "");
  const [debounced, setDebounced] = useState(text);
  useEffect(() => { const id = setTimeout(() => setDebounced(text), 300); return () => clearTimeout(id); }, [text]);
  const q = useSearch(debounced);

  const merchants = (q.data ?? []).filter((r) => r.kind === "merchant");
  const products = (q.data ?? []).filter((r) => r.kind === "product");

  function open(r: SearchResult) {
    if (r.kind === "merchant") router.push(`/(customer)/merchant/${r.id}` as never);
    else router.push(`/(customer)/product/${r.id}` as never);
  }

  return (
    <Screen padded={false}>
      <Header title="Buscar" />
      <View style={{ paddingHorizontal: 16 }}>
        <SearchBar value={text} onChangeText={setText} placeholder="Busca platos, productos o comercios" autoFocus onClear={() => setText("")} />
        {debounced.trim().length < 2 ? (
          <View style={{ marginTop: 20 }}>
            <Text variant="caption" tone="muted" style={{ marginBottom: 10 }}>Sugerencias</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SUGGESTIONS.map((s) => <Chip key={s} label={s} onPress={() => setText(s)} />)}
            </View>
          </View>
        ) : q.isLoading ? (
          <View style={{ marginTop: 20 }}><ListSkeleton rows={4} height={56} /></View>
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => { void q.refetch(); }} />
        ) : !q.data?.length ? (
          <EmptyState icon="search-outline" title={`Sin resultados para "${debounced.trim()}"`} body="Revisa la ortografía o prueba con otra palabra." actionTitle="Ver restaurantes cerca" onAction={() => router.push("/(customer)/restaurants?category=food" as never)} />
        ) : (
          <View style={{ marginTop: 16 }}>
            {merchants.length ? <Text variant="heading" style={{ marginBottom: 6 }}>Comercios</Text> : null}
            {merchants.map((r) => (
              <Pressable key={`m-${r.id}`} onPress={() => open(r)} style={styles.row}>
                <Image source={{ uri: r.image_url ?? undefined }} style={styles.img} contentFit="cover" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="bodyStrong">{r.name}</Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>{r.subtitle ?? ""}</Text>
                </View>
                {r.rating != null ? <View style={{ flexDirection: "row", alignItems: "center" }}><Ionicons name="star" size={12} color={colors.yellow} /><Text variant="caption" style={{ marginLeft: 3 }}>{formatRating(Number(r.rating))}</Text></View> : null}
              </Pressable>
            ))}
            {products.length ? <Text variant="heading" style={{ marginTop: merchants.length ? 20 : 0, marginBottom: 6 }}>Productos</Text> : null}
            {products.map((r) => (
              <Pressable key={`p-${r.id}`} onPress={() => open(r)} style={styles.row}>
                <Image source={{ uri: r.image_url ?? undefined }} style={styles.img} contentFit="cover" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="bodyStrong">{r.name}</Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>{r.subtitle ?? ""}</Text>
                </View>
                <Text variant="bodyStrong">{formatCOP(r.price ?? 0)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  img: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.gray100 },
});
