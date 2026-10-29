import React, { useMemo, useState } from "react";
import { View, StyleSheet, Platform, LayoutChangeEvent } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { colors, shadows } from "@yava/shared";
import { Text } from "@/components/ui";
import { designImages } from "@/lib/design-images";

export type LatLng = { latitude: number; longitude: number };

/** Azul de la ruta y naranja del pin del restaurante (21). */
const ROUTE = "#0558F2";
const SHOP = "#FC7324";

/**
 * Mapa del seguimiento (21): restaurante (pin naranja + nombre y dirección), repartidor (moto con halo),
 * casa (pin azul + tarjeta "Tu casa") y la ruta azul entre ellos.
 * `visible` = alto de la parte del mapa que no tapa la hoja; los puntos se encuadran en esa franja.
 * En iOS/Android son `Marker` de react-native-maps; en web (el stub no dibuja marcadores) se superponen
 * proyectando lat/lng sobre la misma región.
 */
export function TrackingMap({ shop, rider, home, shopName, shopAddress, homeLabel, homeLines, visible, topInset = 0 }: {
  shop: LatLng | null; rider: LatLng | null; home: LatLng | null;
  shopName?: string | null; shopAddress?: string | null; homeLabel?: string; homeLines: string[];
  /** Alto (pt) de la franja visible del mapa, medido desde el tope de la pantalla. */
  visible: number;
  topInset?: number;
}) {
  const [size, setSize] = useState({ w: 393, h: 852 });
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  /**
   * Región: los puntos ocupan x 70–340 (de 393) y la franja y [topInset+110, visible−50]; el centro del
   * mapa se corre al sur para que queden encima de la hoja.
   */
  const region = useMemo(() => {
    const pts = [shop, rider, home].filter((p): p is LatLng => Boolean(p));
    const lat0 = pts.length ? pts.reduce((a, p) => a + p.latitude, 0) / pts.length : 10.9878;
    const cos = Math.cos((lat0 * Math.PI) / 180);
    const lats = pts.map((p) => p.latitude), lngs = pts.map((p) => p.longitude);
    const minLat = pts.length ? Math.min(...lats) : 10.9878, maxLat = pts.length ? Math.max(...lats) : 10.9878;
    const minLng = pts.length ? Math.min(...lngs) : -74.9547, maxLng = pts.length ? Math.max(...lngs) : -74.9547;
    const bandTop = topInset + 110, bandBottom = Math.max(bandTop + 80, visible - 50);
    const bandW = size.w * (270 / 393), bandH = bandBottom - bandTop;
    // grados de longitud por pt (mínimo ≈ 0,0018° en todo el ancho: con puntos de un mismo barrio los pines quedan
    // repartidos como en el diseño sin acercar de más)
    const degX = Math.max((maxLng - minLng) / bandW, ((maxLat - minLat) / cos) / bandH, 0.0018 / size.w);
    const degY = degX * cos;
    const midLat = (minLat + maxLat) / 2, midLng = (minLng + maxLng) / 2;
    const bandMidY = (bandTop + bandBottom) / 2;
    const centerLat = midLat - (size.h / 2 - bandMidY) * degY;
    return { latitude: centerLat, longitude: midLng, latitudeDelta: degY * size.h, longitudeDelta: degX * size.w, degX, degY };
  }, [shop, rider, home, size.w, size.h, visible, topInset]);

  const route = [shop, rider, home].filter((p): p is LatLng => Boolean(p));
  const mapRegion = { latitude: region.latitude, longitude: region.longitude, latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta };

  const shopPin = shop ? <ShopPin name={shopName} address={shopAddress} /> : null;
  const riderPin = rider ? <RiderPin /> : null;
  const homePin = home ? <HomePin label={homeLabel} lines={homeLines} /> : null;

  if (Platform.OS === "web") {
    // Proyección lineal sobre la región (suficiente a esta escala de barrio).
    const at = (p: LatLng) => ({
      left: size.w / 2 + (p.longitude - region.longitude) / region.degX,
      top: size.h / 2 - (p.latitude - region.latitude) / region.degY,
    });
    const pts = route.map(at);
    return (
      <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
        <MapView style={StyleSheet.absoluteFill} region={mapRegion} />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {pts.slice(1).map((b, i) => {
            const a = pts[i];
            const dx = b.left - a.left, dy = b.top - a.top;
            const len = Math.hypot(dx, dy);
            const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
            return <View key={i} style={{ position: "absolute", left: (a.left + b.left) / 2 - len / 2, top: (a.top + b.top) / 2 - 2, width: len, height: 4, borderRadius: 2, backgroundColor: ROUTE, transform: [{ rotate: `${ang}deg` }] }} />;
          })}
          {shop ? <View style={[styles.anchor, { left: at(shop).left - SHOP_ANCHOR.x, top: at(shop).top - SHOP_ANCHOR.y }]}>{shopPin}</View> : null}
          {rider ? <View style={[styles.anchor, { left: at(rider).left - RIDER_ANCHOR.x, top: at(rider).top - RIDER_ANCHOR.y }]}>{riderPin}</View> : null}
          {home ? <View style={[styles.anchor, { left: at(home).left - HOME_ANCHOR.x, top: at(home).top - HOME_ANCHOR.y }]}>{homePin}</View> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <MapView style={StyleSheet.absoluteFill} region={mapRegion} showsUserLocation={false} showsPointsOfInterests={false} showsCompass={false}
        toolbarEnabled={false} mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}>
        {route.length > 1 ? <Polyline coordinates={route} strokeColor={ROUTE} strokeWidth={4} lineCap="round" lineJoin="round" /> : null}
        {shop ? <Marker coordinate={shop} anchor={{ x: SHOP_ANCHOR.x / SHOP_SIZE.w, y: SHOP_ANCHOR.y / SHOP_SIZE.h }} tracksViewChanges={false}>{shopPin}</Marker> : null}
        {rider ? <Marker coordinate={rider} anchor={{ x: 0.5, y: RIDER_ANCHOR.y / RIDER_SIZE.h }} tracksViewChanges={false}>{riderPin}</Marker> : null}
        {home ? <Marker coordinate={home} anchor={{ x: 0.5, y: HOME_ANCHOR.y / HOME_SIZE.h }} tracksViewChanges={false}>{homePin}</Marker> : null}
      </MapView>
    </View>
  );
}

/* ── Marcadores (medidas de 21) ─────────────────────────────────────────── */

const SHOP_SIZE = { w: 130, h: 82 };
/** Punta del pin naranja (el punto exacto del comercio). */
const SHOP_ANCHOR = { x: 19, y: 45 };

/**
 * Gota del pin del comercio (21): círculo naranja de 28,7 pt con la punta a 45° tangente al círculo
 * (punta a R·√2 del centro) y contorno blanco de 2 pt alrededor de toda la figura.
 */
const SHOP_DROP = { cx: 17, cy: 22.7, r: 14.35 };
const SHOP_TEAR = (() => {
  const { cx, cy, r } = SHOP_DROP;
  const k = r * Math.SQRT1_2;
  return `M${cx} ${cy + r * Math.SQRT2} L${cx + k} ${cy + k} A${r} ${r} 0 1 0 ${cx - k} ${cy + k} Z`;
})();

/** Pin naranja con cubiertos + "Bocamar / Calle 3 # 4-10" debajo. */
function ShopPin({ name, address }: { name?: string | null; address?: string | null }) {
  return (
    <View style={{ width: SHOP_SIZE.w, height: SHOP_SIZE.h }}>
      <View style={styles.shopDrop}>
        <Svg width={34} height={46} viewBox="0 0 34 46">
          <Path d={SHOP_TEAR} fill={colors.white} stroke={colors.white} strokeWidth={4} strokeLinejoin="round" />
          <Path d={SHOP_TEAR} fill={SHOP} />
        </Svg>
        <View style={styles.shopIcon}><MaterialIcons name="restaurant" size={17.5} color={colors.white} /></View>
      </View>
      {name ? <Text style={styles.shopName} numberOfLines={1}>{name}</Text> : null}
      {address ? <Text style={styles.shopAddr} numberOfLines={1}>{address}</Text> : null}
    </View>
  );
}

const RIDER_SIZE = { w: 40, h: 46 };
const RIDER_ANCHOR = { x: 20, y: 26 };

/** Moto del diseño sobre un halo azul claro. */
function RiderPin() {
  return (
    <View style={{ width: RIDER_SIZE.w, height: RIDER_SIZE.h }}>
      <View style={styles.riderHalo} />
      <Image source={designImages.pedidoSeguimientoMoto} style={styles.riderImg} contentFit="contain" />
    </View>
  );
}

const HOME_SIZE = { w: 120, h: 102 };
/** Centro del punto azul (la dirección exacta). */
const HOME_ANCHOR = { x: 60, y: 90 };

/** Tarjeta "Tu casa" + pin azul con casa + punto con halo en la dirección exacta. */
function HomePin({ label = "Tu casa", lines }: { label?: string; lines: string[] }) {
  return (
    <View style={{ width: HOME_SIZE.w, height: HOME_SIZE.h, alignItems: "center" }}>
      <View style={[styles.homeCard, shadows.soft]}>
        <Text style={styles.homeTitle} numberOfLines={1}>{label}</Text>
        {lines.slice(0, 2).map((l) => <Text key={l} style={styles.homeLine} numberOfLines={1}>{l}</Text>)}
      </View>
      <View style={styles.homeHalo} />
      <View style={styles.homeTip} />
      <View style={styles.homeDot} />
      <View style={styles.homeCircle}><Ionicons name="home" size={13} color={colors.white} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: "absolute" },
  shopDrop: { position: "absolute", left: 2, top: 0, width: 34, height: 46 },
  shopIcon: { position: "absolute", left: SHOP_DROP.cx - 12, top: SHOP_DROP.cy - 12, width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  // Nombre y dirección del comercio: 4 pt a la derecha del borde del pin y 5,5 pt bajo la punta (21).
  shopName: { position: "absolute", left: 7.9, top: 44.3, fontSize: 10.8, lineHeight: 14, fontWeight: "700", letterSpacing: -0.2, color: colors.ink, textShadowColor: "rgba(255,255,255,0.9)", textShadowRadius: 3 },
  shopAddr: { position: "absolute", left: 7.9, top: 57.8, fontSize: 9.6, lineHeight: 13, letterSpacing: -0.1, color: "#47506A", textShadowColor: "rgba(255,255,255,0.9)", textShadowRadius: 3 },
  riderHalo: { position: "absolute", left: 0, top: 6, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(5,88,242,0.16)" },
  riderImg: { position: "absolute", left: 5, top: 0, width: 30, height: 36 },
  homeCard: { position: "absolute", top: 0, height: 47, maxWidth: 120, backgroundColor: colors.white, borderRadius: 10, paddingHorizontal: 6.5, paddingTop: 6.2 },
  homeTitle: { fontSize: 10, lineHeight: 13.5, fontWeight: "700", letterSpacing: -0.2, color: colors.ink },
  homeLine: { fontSize: 8.2, lineHeight: 11, letterSpacing: -0.15, color: "#4E5A74" },
  homeHalo: { position: "absolute", top: 78, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(5,88,242,0.16)" },
  homeTip: { position: "absolute", top: 75, width: 7, height: 7, backgroundColor: colors.blue, transform: [{ rotate: "45deg" }] },
  homeDot: { position: "absolute", top: 85.5, width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.blue, borderWidth: 1.5, borderColor: colors.white },
  homeCircle: { position: "absolute", top: 51, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.blue, borderWidth: 2.5, borderColor: colors.white, alignItems: "center", justifyContent: "center" },
});
