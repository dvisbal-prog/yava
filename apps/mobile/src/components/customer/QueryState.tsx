import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text, Button, Skeleton } from "@/components/ui";
import { errorMessage } from "@/lib/errors";

/** Estado de error con reintento (patrón común en todas las pantallas). */
export function ErrorState({ error, onRetry, compact }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: compact ? 16 : 40, paddingHorizontal: 24 }}>
      <Ionicons name="alert-circle-outline" size={compact ? 24 : 40} color={colors.gray400} style={{ marginBottom: 8 }} />
      <Text tone="muted" style={{ textAlign: "center", marginBottom: 12 }}>{errorMessage(error)}</Text>
      {onRetry ? <Button title="Reintentar" variant="secondary" size="sm" full={false} onPress={onRetry} /> : null}
    </View>
  );
}

export function ListSkeleton({ rows = 3, height = 72 }: { rows?: number; height?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Skeleton width={height} height={height} style={{ borderRadius: 12 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="45%" height={12} />
            <Skeleton width="55%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function CardsSkeleton({ count = 2, width = 220 }: { count?: number; width?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width, gap: 8 }}>
          <Skeleton width="100%" height={120} style={{ borderRadius: 16 }} />
          <Skeleton width="60%" height={16} />
          <Skeleton width="80%" height={12} />
        </View>
      ))}
    </View>
  );
}
