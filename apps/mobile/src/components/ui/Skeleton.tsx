import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";
import { colors, radius } from "@yava/shared";

export function Skeleton({ width = "100%", height = 16, style }: { width?: number | `${number}%`; height?: number; style?: ViewStyle }) {
  const op = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={[{ width, height, borderRadius: radius.sm, backgroundColor: colors.gray200, opacity: op }, style]} />;
}
