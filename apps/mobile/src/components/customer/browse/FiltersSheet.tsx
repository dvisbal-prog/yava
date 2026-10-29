import React, { useEffect, useRef, useState } from "react";
import { View, Pressable, StyleSheet, Modal, Animated, Easing, StyleProp, ViewStyle, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@yava/shared";
import { Text } from "@/components/ui";
import { useMerchantFilters, type MerchantFilters } from "@/features/customer";

const DEFAULTS: MerchantFilters = { sort: "recommended", maxTime: null, delivery: null, minRating: null, openNow: false, tag: null };

/** Radio de 17,5 pt (11): aro 1,5 pt azul con punto de 9,2 pt, o aro gris. */
function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.radio, { borderColor: selected ? colors.blue : "#8E98AA" }]}>
      {selected ? <View style={styles.radioDot} /> : null}
    </View>
  );
}

function RadioLine({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={label}
      style={({ pressed }) => [styles.radioRow, { opacity: pressed ? 0.7 : 1 }]}>
      <Radio selected={selected} />
      <Text style={styles.radioText}>{label}</Text>
    </Pressable>
  );
}

/** Chip de selección de 3 columnas iguales (C10c de 11): 31,5 pt de alto, seleccionado `blueChip` + borde azul. */
function OptionChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label}
      style={({ pressed }) => [styles.chip, selected ? styles.chipOn : styles.chipOff, { opacity: pressed ? 0.8 : 1 }]}>
      <Text numberOfLines={1} style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function ChipRow<T>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  const cells = [...options, ...Array.from({ length: Math.max(0, 3 - options.length) }, () => null)];
  return (
    <View style={styles.chipRow}>
      {cells.map((o, i) => (
        <View key={i} style={{ flex: 1 }}>
          {o ? <OptionChip label={o[1]} selected={value === o[0]} onPress={() => onChange(o[0])} /> : null}
        </View>
      ))}
    </View>
  );
}

/**
 * Contenido de la hoja 11 · Filtros (tanda-02/11-filtros.png), medido en el PNG: asa, "Filtros" + "Limpiar" + ✕,
 * "Ordenar por" con 3 radios (paso 27,5 pt), "Tiempo de entrega", "Costo de envío" y "Calificación" con chips de
 * 3 columnas, separadores y "Aplicar filtros" en píldora de 37,8 pt. Trabaja sobre una copia local de los filtros y
 * solo los guarda en `useMerchantFilters` al aplicar (lo que no se muestra —abierto ahora, etiqueta— se conserva).
 */
export function FiltersSheet({ onClose, style }: { onClose: () => void; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  const store = useMerchantFilters();
  const [f, setF] = useState<MerchantFilters>({ sort: store.sort, maxTime: store.maxTime, delivery: store.delivery, minRating: store.minRating, openNow: store.openNow, tag: store.tag });

  function apply() { store.set(f); onClose(); }
  function clear() { setF(DEFAULTS); }

  return (
    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom - 4, 16) }, style]}>
      <View style={styles.handle} />
      <View style={styles.head}>
        <Text style={styles.title}>Filtros</Text>
        <Pressable onPress={clear} hitSlop={10} accessibilityRole="button" accessibilityLabel="Limpiar filtros" style={{ marginRight: 21.4 }}>
          <Text style={styles.clear}>Limpiar</Text>
        </Pressable>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.close}>
          <Ionicons name="close-outline" size={23.5} color={colors.ink} />
        </Pressable>
      </View>

      <Text style={[styles.section, { marginTop: 15.1 }]}>Ordenar por</Text>
      <View style={{ marginTop: 6.7 }}>
        <RadioLine label="Recomendados" selected={f.sort === "recommended"} onPress={() => setF({ ...f, sort: "recommended" })} />
        <RadioLine label="Menor tiempo de entrega" selected={f.sort === "fastest"} onPress={() => setF({ ...f, sort: "fastest" })} />
        <RadioLine label="Mejor calificación" selected={f.sort === "rating"} onPress={() => setF({ ...f, sort: "rating" })} />
      </View>

      <View style={[styles.sep, { marginTop: 14.4 }]} />
      <Text style={[styles.section, { marginTop: 10.9 }]}>Tiempo de entrega</Text>
      <View style={{ marginTop: 9.2 }}>
        <ChipRow<MerchantFilters["maxTime"]> options={[[null, "Todos"], [30, "Hasta 30 min"], [45, "Hasta 45 min"]]} value={f.maxTime} onChange={(v) => setF({ ...f, maxTime: v })} />
      </View>

      <View style={[styles.sep, { marginTop: 14.4 }]} />
      <Text style={[styles.section, { marginTop: 11 }]}>Costo de envío</Text>
      <View style={{ marginTop: 9.5 }}>
        <ChipRow<MerchantFilters["delivery"]> options={[[null, "Todos"], ["free", "Gratis"], [3000, "Hasta $3.000"]]} value={f.delivery} onChange={(v) => setF({ ...f, delivery: v })} />
      </View>

      <View style={[styles.sep, { marginTop: 16.3 }]} />
      <Text style={[styles.section, { marginTop: 11.9 }]}>Calificación</Text>
      <View style={{ marginTop: 7.8 }}>
        <ChipRow<MerchantFilters["minRating"]> options={[[null, "Todas"], [4.5, "4,5 o más"]]} value={f.minRating} onChange={(v) => setF({ ...f, minRating: v })} />
      </View>

      <Pressable onPress={apply} accessibilityRole="button" accessibilityLabel="Aplicar filtros"
        style={({ pressed }) => [styles.apply, { backgroundColor: pressed ? colors.blueDark : colors.blue }]}>
        <Text style={styles.applyText}>Aplicar filtros</Text>
      </Pressable>
    </View>
  );
}

/**
 * La hoja de filtros sobre la pantalla actual (09): velo oscuro que se desvanece y hoja que sube desde abajo.
 * Tocar el velo o la ✕ la cierra; "Aplicar filtros" guarda y cierra.
 */
export function FiltersSheetModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { height } = useWindowDimensions();
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setMounted(false));
    }
  }, [visible, anim, mounted]);

  if (!mounted) return null;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [height * 0.7, 0] });
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: anim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar filtros" />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY }] }}>
          <FiltersSheet onClose={onClose} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 17.8 },
  handle: { alignSelf: "center", width: 29, height: 4.2, borderRadius: 2.1, backgroundColor: "#D0D2D7", marginTop: 7.2 },
  head: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  title: { flex: 1, fontSize: 19.2, lineHeight: 24, fontWeight: "700", letterSpacing: -0.3, color: colors.ink },
  clear: { fontSize: 11.2, lineHeight: 15, fontWeight: "600", color: colors.blueLink },
  close: { width: 24, height: 24, alignItems: "center", justifyContent: "center", marginRight: 2.4 },
  section: { fontSize: 13.7, lineHeight: 18, fontWeight: "600", color: colors.ink, letterSpacing: -0.1 },
  radioRow: { flexDirection: "row", alignItems: "center", height: 27.45 },
  radio: { width: 17.5, height: 17.5, borderRadius: 8.75, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginLeft: 1.1 },
  radioDot: { width: 9.2, height: 9.2, borderRadius: 4.6, backgroundColor: colors.blue },
  radioText: { fontSize: 12.7, lineHeight: 17, color: colors.ink, marginLeft: 11.8 },
  sep: { height: 1, backgroundColor: "#DEE2EA", marginRight: 0.3 },
  chipRow: { flexDirection: "row", gap: 6.1, marginLeft: 1.1, marginRight: -1.8 },
  chip: { height: 31.5, borderRadius: 15.75, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  chipOn: { backgroundColor: colors.blueChip, borderWidth: 1.5, borderColor: colors.blueLink },
  chipOff: { backgroundColor: colors.white, borderWidth: 1, borderColor: "#DDE1E7" },
  chipText: { fontSize: 10.9, lineHeight: 15, color: colors.gray900 },
  chipTextOn: { fontWeight: "600", color: colors.blueText },
  apply: { height: 37.8, borderRadius: 18.9, alignItems: "center", justifyContent: "center", marginTop: 18.5, marginRight: 0.3 },
  applyText: { fontSize: 11.2, lineHeight: 15, fontWeight: "600", color: colors.white },
});
