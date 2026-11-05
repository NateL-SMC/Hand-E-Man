import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CustomerNavbar from "../../components/CustomerNavbar";
import Header from "../../components/Header";
import { useAuth } from "../../context/authContext";
import { watchBookings } from "../../lib/api";
import { prettyDate } from "../../lib/format";
import { ROUTES } from "../../lib/routes";
import { useNavSpace } from "../../lib/useNavSpace";
import type { Booking } from "../../lib/types";

const INFO: Record<Booking["status"], { icon: keyof typeof Ionicons.glyphMap; color: string; text: (b: Booking) => string }> = {
  ongoing: { icon: "construct", color: "#10B981", text: (b) => `${b.handymanName} is working on your ${b.category.toLowerCase()} job` },
  upcoming: { icon: "calendar", color: "#EF4444", text: (b) => `${b.handymanName} confirmed for ${prettyDate(b.date)} • ${b.time}` },
  pending: { icon: "time", color: "#F59E0B", text: (b) => `Waiting for ${b.handymanName} to accept your request` },
  completed: { icon: "checkmark-circle", color: "#475569", text: (b) => `${b.packageTitle} with ${b.handymanName} is complete` },
  cancelled: { icon: "close-circle", color: "#475569", text: (b) => `Your booking with ${b.handymanName} was cancelled` },
};

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const navSpace = useNavSpace();
  const [items, setItems] = useState<Booking[]>([]);

  useEffect(() => (user ? watchBookings(user.uid, (b) => setItems(b.sort((x, y) => y.createdAt - x.createdAt))) : undefined), [user?.uid]);

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace }}>
      <Header>
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </Pressable>
          <Text className="text-xl font-extrabold text-[#0F172A] ml-3">Notifications</Text>
        </View>
      </Header>

      <ScrollView contentContainerClassName="px-5 py-5" showsVerticalScrollIndicator={false}>
        {items.length === 0 && <Text className="text-[#475569] text-center mt-10">You're all caught up.</Text>}
        {items.map((b) => {
          const i = INFO[b.status];
          return (
            <Pressable
              key={b.id}
              onPress={() => router.push(ROUTES.bookings)}
              className="flex-row items-center bg-white border border-[#E2E8F0] rounded-xl p-3 mb-2.5"
            >
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: i.color + "22" }}>
                <Ionicons name={i.icon} size={20} color={i.color} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-[13px] font-semibold text-[#0F172A]">{i.text(b)}</Text>
                <Text className="text-[11px] text-[#475569] mt-0.5">{b.category} • {b.packageTitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </Pressable>
          );
        })}
      </ScrollView>

      <CustomerNavbar />
    </View>
  );
}
