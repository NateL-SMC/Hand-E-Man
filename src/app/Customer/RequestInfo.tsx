import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Button } from "../../components/ui";
import { useAuth } from "../../context/authContext";
import { createBooking, fetchHandyman, updateMyProfile } from "../../lib/api";
import { DEFAULT_ADDRESS, DEFAULT_TIME } from "../../lib/constants";
import { peso, prettyDate, toISO } from "../../lib/format";
import { payWithPaypalSandbox } from "../../lib/paypal";
import { computeTotals } from "../../lib/pricing";
import type { Handyman } from "../../lib/types";
import CustomerNavbar from "../../components/CustomerNavbar";
import { useNavSpace } from "../../lib/useNavSpace";
import { ROUTES } from "../../lib/routes";

export default function RequestService() {
  const { id, packageId, date } = useLocalSearchParams<{ id: string; packageId: string; date: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const navSpace = useNavSpace();
  const { user, profile } = useAuth();
  const [h, setH] = useState<Handyman | null>(null);
  const [method, setMethod] = useState<"cash" | "paypal">("cash");
  const [pickMethod, setPickMethod] = useState(false);
  const [editAddr, setEditAddr] = useState(false);
  const [address, setAddress] = useState(profile?.address ?? DEFAULT_ADDRESS);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (id) fetchHandyman(id).then(setH); }, [id]);
  useEffect(() => { if (profile?.address) setAddress(profile.address); }, [profile?.address]);

  const pkg = h?.packages.find((p) => p.id === packageId);
  if (!h || !pkg || !date) return <View className="flex-1 bg-[#F8FAFC]" />;

  const urgent = date === toISO(new Date());
  const t = computeTotals(pkg.price, urgent);

  const saveAddress = async () => {
    setEditAddr(false);
    if (user) await updateMyProfile(user.uid, { address });
  };

  const confirm = async () => {
    if (!user) return;
    if (address === DEFAULT_ADDRESS) return Alert.alert("Add an address", "Please set the service location first.");
    setBusy(true);
    try {
      let paid = false, orderId: string | undefined;
      if (method === "paypal") {
        const r = await payWithPaypalSandbox(t.total);
        if (!r.ok) { Alert.alert("Payment cancelled"); return; }
        paid = true; orderId = r.orderId;
      }
      await createBooking({
        customerId: user.uid,
        handymanId: h.id, handymanName: h.name, handymanPhone: h.phone,
        ...(h.photoUrl ? { handymanPhoto: h.photoUrl } : {}),
        category: h.category, packageTitle: pkg.title,
        date, time: DEFAULT_TIME, status: "pending", address,
        paymentMethod: method, paymentStatus: paid ? "paid" : "unpaid",
        ...(orderId ? { paypalOrderId: orderId } : {}),
        ...t, createdAt: Date.now(),
      });
      router.replace(ROUTES.bookings);
    } catch (e: any) {
      Alert.alert("Booking failed", e.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const Row = ({ l, v, bold }: { l: string; v: string; bold?: boolean }) => (
    <View className="flex-row justify-between py-1">
      <Text className={`text-xs ${bold ? "font-bold text-[#0F172A] text-sm" : "text-slate-600"}`}>{l}</Text>
      <Text className={`text-xs ${bold ? "font-extrabold text-[#0F172A] text-base" : "text-slate-700"}`}>{v}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace }}>
      <View style={{ paddingTop: top + 12 }} className="flex-row items-center px-5 pb-3">
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color="#0F172A" /></Pressable>
        <Text className="text-lg font-bold text-[#0F172A] ml-3">Confirm Booking</Text>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-4" showsVerticalScrollIndicator={false}>
        {/* summary */}
        <View className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex-row items-center">
          <Avatar uri={h.photoUrl} size={44} />
          <View className="ml-3 flex-1">
            <Text className="font-bold text-[#0F172A]">{h.name}</Text>
            <Text className="text-xs text-slate-600">{pkg.title}</Text>
            <Text className="text-xs font-semibold text-orange-600">{prettyDate(date)} • {DEFAULT_TIME}</Text>
          </View>
        </View>

        {/* location */}
        <Text className="text-xs font-bold text-[#0F172A] mt-4 mb-2">Service Location</Text>
        <View className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex-row items-center">
          <Ionicons name="location" size={18} color="#EA580C" />
          <View className="flex-1 ml-2">
            <Text className="text-xs font-bold text-[#0F172A]">Home Address</Text>
            {editAddr ? (
              <TextInput value={address} onChangeText={setAddress} autoFocus onBlur={saveAddress} className="text-xs text-slate-700 p-0" />
            ) : (
              <Text className="text-[11px] text-slate-600">{address}</Text>
            )}
          </View>
          <Pressable onPress={() => (editAddr ? saveAddress() : setEditAddr(true))}>
            <Ionicons name={editAddr ? "checkmark" : "create-outline"} size={18} color="#94A3B8" />
          </Pressable>
        </View>

        {/* payment */}
        <View className="bg-white border border-[#E2E8F0] rounded-xl p-3 mt-3">
          <View className="flex-row items-center">
            <Ionicons name="card-outline" size={18} color="#475569" />
            <Text className="text-xs font-semibold text-[#0F172A] ml-2 flex-1">
              Method: {method === "cash" ? "Cash" : "PayPal (Sandbox)"}
            </Text>
            <Pressable onPress={() => setPickMethod(!pickMethod)}>
              <Text className="text-xs font-semibold text-blue-600">Change</Text>
            </Pressable>
          </View>
          {pickMethod && (
            <View className="mt-3 border-t border-[#E2E8F0] pt-2">
              {(["cash", "paypal"] as const).map((m) => (
                <Pressable key={m} onPress={() => { setMethod(m); setPickMethod(false); }} className="flex-row items-center py-2">
                  <Ionicons name={method === m ? "radio-button-on" : "radio-button-off"} size={18} color="#F59E0B" />
                  <Text className="text-sm text-[#0F172A] ml-2">{m === "cash" ? "Cash on service" : "PayPal (Sandbox)"}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* costs */}
        <View className="bg-white border border-[#E2E8F0] rounded-xl p-3 mt-3">
          <Row l="Service Cost" v={peso(t.serviceCost)} />
          <Row l="Priority Fee" v={peso(t.priorityFee)} />
          <Row l="VAT (12%)" v={peso(t.vat)} />
          <View className="border-t border-[#E2E8F0] my-2" />
          <Row l="Total Amount" v={peso(t.total)} bold />
        </View>
      </ScrollView>

      <View className="px-5 py-3">
        <Button title="Confirm Booking" onPress={confirm} loading={busy} />
      </View>
      <CustomerNavbar />
    </View>
  );
}
