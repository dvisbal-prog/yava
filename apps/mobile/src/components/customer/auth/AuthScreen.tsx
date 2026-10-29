import React, { useEffect, useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Keyboard, Platform, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@yava/shared";

/** true mientras el teclado está abierto (en web nunca). */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s = Keyboard.addListener(showEvt, () => setVisible(true));
    const h = Keyboard.addListener(hideEvt, () => setVisible(false));
    return () => { s.remove(); h.remove(); };
  }, []);
  return visible;
}

/**
 * Contenedor de las pantallas de acceso y registro (03–07): fondo blanco, contenido con scroll y un pie
 * SIN barra (el CTA va suelto, como en los PNG). Con el teclado abierto el pie queda pegado sobre él
 * (`keyboardGap`, 16 pt en 03/04); sin teclado respeta el indicador de inicio.
 */
export function AuthScreen({ children, footer, scroll = true, contentStyle, footerStyle, keyboardGap = 15.7, bottomGap = 16 }: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  /** Separación entre el CTA y el teclado abierto. */
  keyboardGap?: number;
  /** Separación mínima entre el pie y el borde inferior (además del indicador de inicio). */
  bottomGap?: number;
}) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardVisible();
  const bottom = keyboard ? keyboardGap : Math.max(insets.bottom, bottomGap);
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? (
          <ScrollView style={styles.flex} contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={[styles.footer, { paddingBottom: bottom }, footerStyle]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { paddingBottom: 24 },
  footer: { paddingTop: 10, backgroundColor: colors.white },
});
