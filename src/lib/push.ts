// Free push without Cloud Functions: the phone doing the action sends the push through Expo's free push service.
// (Recipient tokens live in pushTokens/{uid}, written by lib/notifications.registerForPush.)
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export async function sendPush(toUid: string | undefined, title: string, body: string, data: Record<string, unknown> = {}) {
  if (!toUid) return;
  try {
    const to = (await getDoc(doc(db, "pushTokens", toUid))).get("token");
    if (!to) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to, title, body, sound: "default", channelId: "default", data }),
    });
  } catch {
    /* push is best-effort */
  }
}
