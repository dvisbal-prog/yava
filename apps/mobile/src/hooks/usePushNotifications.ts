import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** Registra el token de push del dispositivo en Supabase cuando hay sesión. */
export function usePushNotifications() {
  const session = useAuth((s) => s.session);
  useEffect(() => {
    if (!session || !Device.isDevice) return;
    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (existing !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== "granted") return;
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", { name: "Pedidos", importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 250, 250, 250], lightColor: "#1E5EFF" });
        }
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId || String(projectId).startsWith("REEMPLAZAR")) return;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        await supabase.from("device_tokens").upsert({ user_id: session.user.id, token, platform: Platform.OS === "ios" ? "ios" : "android" }, { onConflict: "token" });
      } catch { /* sin permisos o sin EAS configurado */ }
    })();
  }, [session]);
}
