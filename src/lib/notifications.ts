// Push notifications (Expo). Remote push needs a development build on Android (not Expo Go) and a real device.
import { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { updateMyProfile } from "./api";

if (Platform.OS !== "web") {
  // While the app is open the in-app popup handles "new_request", so don't also show a system banner for it.
  Notifications.setNotificationHandler({
    handleNotification: async (n) => {
      const quiet = n.request.content.data?.type === "new_request";
      return {
        shouldShowAlert: !quiet,
        shouldShowBanner: !quiet,
        shouldShowList: !quiet,
        shouldPlaySound: false,
        shouldSetBadge: false,
      } as any;
    },
  });
}

/** Ask permission, get the Expo push token and store it on users/{uid} so Cloud Functions can message this device. */
export async function registerForPush(uid: string) {
  if (Platform.OS === "web" || !Device.isDevice) return;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    await updateMyProfile(uid, { expoPushToken: token });
  } catch (e) {
    console.log("Push registration skipped:", e);
  }
}

/** Tapping a notification opens the screen named in its `data.route`. */
export function useNotificationRouting() {
  const router = useRouter();
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const route = r.notification.request.content.data?.route;
      if (typeof route === "string") router.push(route as any);
    });
    return () => sub.remove();
  }, []);
}
