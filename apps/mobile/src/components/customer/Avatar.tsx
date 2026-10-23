import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";

export function Avatar({ name, uri, size = 48 }: { name?: string | null; uri?: string | null; size?: number }) {
  const initials = (name ?? "").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "Y";
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.gray100 }} contentFit="cover" />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: colors.blue, fontWeight: "700", fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}
