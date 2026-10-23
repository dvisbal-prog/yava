import React, { useMemo, useState } from "react";
import { View, Switch, Alert, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatCOP, radius } from "@yava/shared";
import { Screen, Text, SearchBar, Chip, Card, Badge, Button, EmptyState } from "@/components/ui";
import { ErrorState, ListSkeleton } from "@/components/merchant/Rows";
import { useMyMerchant, useMerchantProducts, useProductCategories, useUpdateProduct } from "@/features/merchant/useMerchant";
import { errorMessage } from "@/lib/errors";

/** Pantalla 54 · Mi menú. */
export default function MerchantMenu() {
  const router = useRouter();
  const { data: merchant } = useMyMerchant();
  const productsQ = useMerchantProducts(merchant?.id);
  const catsQ = useProductCategories(merchant?.id);
  const update = useUpdateProduct();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const list = useMemo(() => (productsQ.data ?? []).filter((p) => (!cat || p.category_id === cat) && (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()))), [productsQ.data, cat, q]);

  const toggle = async (id: string, available: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    try { await update.mutateAsync({ productId: id, patch: { status: available ? "published" : "paused" } }); }
    catch (e) { Alert.alert("No se pudo cambiar", errorMessage(e)); }
  };

  return (
    <Screen scroll={false} padded={false}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Text variant="title" style={{ flex: 1 }}>Mi menú</Text>
          <Button title="Agregar" size="sm" icon="add" full={false} onPress={() => router.push("/(merchant)/product/new")} />
        </View>
        <SearchBar value={q} onChangeText={setQ} placeholder="Buscar producto" onClear={() => setQ("")} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 8 }}>
          <Chip label="Todos" selected={!cat} onPress={() => setCat(null)} />
          {(catsQ.data ?? []).map((c) => <Chip key={c.id} label={c.name} selected={cat === c.id} onPress={() => setCat(c.id)} />)}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {productsQ.isLoading ? <ListSkeleton rows={4} height={88} /> : productsQ.isError ? <ErrorState message={errorMessage(productsQ.error)} onRetry={() => productsQ.refetch()} /> : list.length === 0 ? (
          <EmptyState icon="fast-food-outline" title={q || cat ? "Sin resultados" : "Tu menú está vacío"} body={q || cat ? "Prueba con otra búsqueda o categoría." : "Agrega tu primer producto con fotos, precio y opciones."} actionTitle="Agregar producto" onAction={() => router.push("/(merchant)/product/new")} />
        ) : list.map((p) => {
          const img = p.image_urls[0];
          const outOfStock = p.track_stock && (p.stock ?? 0) <= 0;
          return (
            <Card key={p.id} padded={false} style={{ marginBottom: 10 }} onPress={() => router.push(`/(merchant)/product/${p.id}`)}>
              <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
                <View style={{ width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.gray100, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                  {img ? <Image source={{ uri: img }} style={{ width: 64, height: 64 }} contentFit="cover" /> : <Ionicons name="image-outline" size={22} color={colors.gray400} />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>{p.name}</Text>
                  <Text variant="caption" tone="muted">{formatCOP(p.price)}</Text>
                  <View style={{ flexDirection: "row", marginTop: 4, flexWrap: "wrap" }}>
                    {p.status === "draft" ? <Badge label="Borrador" tone="gray" /> : p.status === "paused" ? <Badge label="Pausado" tone="yellow" /> : null}
                    {p.track_stock ? <View style={{ marginLeft: p.status !== "published" ? 6 : 0 }}><Badge label={outOfStock ? "Sin existencias" : `${p.stock} disp.`} tone={outOfStock ? "red" : "blue"} /></View> : null}
                  </View>
                </View>
                {p.status === "draft" ? (
                  <Pressable onPress={() => router.push(`/(merchant)/product/${p.id}`)} hitSlop={8}><Text variant="caption" tone="primary" style={{ fontWeight: "600" }}>Completar</Text></Pressable>
                ) : (
                  <Switch value={p.status === "published"} onValueChange={(v) => toggle(p.id, v)} disabled={update.isPending} trackColor={{ true: colors.blue, false: colors.gray300 }} thumbColor={colors.white} />
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
