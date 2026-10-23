import React from "react";
import { View, Pressable, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { colors, radius } from "@yava/shared";
import { Text } from "@/components/ui";
import type { PromotionRow } from "@/features/customer/types";

export function PromoBanner({ items, onPress }: { items: PromotionRow[]; onPress: (p: PromotionRow) => void }) {
  const { width } = useWindowDimensions();
  const w = width - 32;
  if (!items.length) return null;
  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} snapToInterval={w + 12} decelerationRate="fast" contentContainerStyle={{ paddingRight: 16 }}>
      {items.map((p) => (
        <Pressable key={p.id} onPress={() => onPress(p)} style={({ pressed }) => [styles.card, { width: w, opacity: pressed ? 0.92 : 1 }]}>
          <Image source={{ uri: p.image_url ?? undefined }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          <View style={styles.shade} />
          <View style={{ padding: 16 }}>
            <Text variant="title" tone="inverse" numberOfLines={2}>{p.title}</Text>
            {p.subtitle ? <Text tone="inverse" numberOfLines={1} style={{ opacity: 0.9 }}>{p.subtitle}</Text> : null}
            {p.coupon_code ? <View style={styles.code}><Text variant="small" style={{ color: colors.carbon, fontWeight: "700" }}>{p.coupon_code}</Text></View> : null}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  card: { height: 150, borderRadius: radius.lg, overflow: "hidden", marginRight: 12, backgroundColor: colors.blue, justifyContent: "flex-end" },
  shade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(27,31,36,0.42)" },
  code: { alignSelf: "flex-start", backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
});
