import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@yava/shared";
import { Text, Button, Skeleton } from "@/components/ui";
import { errorMessage } from "@/lib/errors";

/** Estado de error con reintento (patrón común en todas las pantallas). */
export function ErrorState({ error, onRetry, compact }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: compact ? 16 : 40, paddingHorizontal: 24 }}>
      <Ionicons name="alert-circle-outline" size={compact ? 24 : 40} color={colors.textPlaceholder} style={{ marginBottom: 8 }} />
      <Text variant="bodyM" tone="secondary" style={{ textAlign: "center", marginBottom: 12 }}>{errorMessage(error)}</Text>
      {onRetry ? <Button title="Reintentar" variant="outline" size="sm" full={false} onPress={onRetry} /> : null}
    </View>
  );
}

/** Esqueleto de lista: miniatura cuadrada + 3 líneas. */
export function ListSkeleton({ rows = 3, height = 72 }: { rows?: number; height?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Skeleton width={height} height={height} style={{ borderRadius: radius.r12 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={10} />
            <Skeleton width="55%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Esqueleto de carrusel. Por defecto imita la tarjeta C7 del Inicio (135 pt, foto 70 pt, separación 8);
 * `width`/`photoHeight`/`gap` para otros carruseles.
 */
export function CardsSkeleton({ count = 3, width = 135, photoHeight, gap = 8 }: { count?: number; width?: number; photoHeight?: number; gap?: number }) {
  const ph = photoHeight ?? Math.round(width * 0.52);
  return (
    <View style={{ flexDirection: "row", gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width, gap: 6 }}>
          <Skeleton width="100%" height={ph} style={{ borderRadius: radius.r10 }} />
          <Skeleton width="60%" height={11} />
          <Skeleton width="85%" height={9} />
          <Skeleton width="70%" height={9} />
        </View>
      ))}
    </View>
  );
}
