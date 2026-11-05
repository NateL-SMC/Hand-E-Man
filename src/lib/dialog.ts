// Alert.alert() with buttons does nothing on web, so every confirm/notice goes through these.
import { Alert, Platform } from "react-native";

export function showAlert(title: string, message?: string) {
  if (Platform.OS === "web") (globalThis as any).alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

export function confirmDialog(title: string, message: string, onYes: () => void, destructive = true) {
  if (Platform.OS === "web") {
    if ((globalThis as any).confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: "No", style: "cancel" },
    { text: "Yes", style: destructive ? "destructive" : "default", onPress: onYes },
  ]);
}
