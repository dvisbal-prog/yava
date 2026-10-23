import React from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { colors } from "@yava/shared";

export function Screen({ children, scroll = true, padded = true, edges = ["top"], footer, refreshing, onRefresh, bg = colors.white, contentStyle }: {
  children: React.ReactNode; scroll?: boolean; padded?: boolean; edges?: Edge[]; footer?: React.ReactNode;
  refreshing?: boolean; onRefresh?: () => void; bg?: string; contentStyle?: object;
}) {
  const inner = scroll ? (
    <ScrollView contentContainerStyle={[padded && styles.pad, { paddingBottom: 24 }, contentStyle]} keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.blue} /> : undefined}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && styles.pad, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {inner}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  pad: { paddingHorizontal: 16 },
  footer: { padding: 16, paddingBottom: Platform.OS === "ios" ? 28 : 16, borderTopWidth: 1, borderTopColor: colors.gray200, backgroundColor: colors.white },
});
