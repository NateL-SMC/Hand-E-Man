// PayPal SANDBOX flow, client-side, for development only.
// The secret ships inside the app bundle, so before release move order creation/capture to a Cloud Function.
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

const BASE = "https://api-m.sandbox.paypal.com";
const CLIENT = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID ?? "";
const SECRET = process.env.EXPO_PUBLIC_PAYPAL_SECRET ?? "";

async function getToken() {
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${CLIENT}:${SECRET}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("PayPal auth failed. Check your sandbox keys.");
  return j.access_token as string;
}

export async function payWithPaypalSandbox(amount: number): Promise<{ ok: boolean; orderId?: string }> {
  const returnUrl = Linking.createURL("paypal-return");
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const orderRes = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: "PHP", value: amount.toFixed(2) } }],
      application_context: { return_url: returnUrl, cancel_url: returnUrl, user_action: "PAY_NOW" },
    }),
  });
  const order = await orderRes.json();
  const approve = order.links?.find((l: any) => l.rel === "approve" || l.rel === "payer-action")?.href;
  if (!approve) throw new Error("Could not create PayPal order.");

  const result = await WebBrowser.openAuthSessionAsync(approve, returnUrl);
  if (result.type !== "success") return { ok: false };

  const cap = await fetch(`${BASE}/v2/checkout/orders/${order.id}/capture`, { method: "POST", headers });
  const capJson = await cap.json();
  return { ok: capJson.status === "COMPLETED", orderId: order.id };
}
