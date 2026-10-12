import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Header from "../../components/Header";
import { Avatar, IconBtn } from "../../components/ui";
import { useAuth } from "../../context/authContext";
import { watchBookings } from "../../lib/api";
import { prettyDate } from "../../lib/format";
import type { Booking, BookingStatus } from "../../lib/types";
import CustomerNavbar from "../../components/CustomerNavbar";
import { useNavSpace } from "../../lib/useNavSpace";
import { ROUTES } from "../../lib/routes";

const SECTIONS: { key: BookingStatus; title: string; color: string }[] = [
  { key: "ongoing", title: "Ongoing", color: "text-emerald-500" },
  { key: "pending", title: "Pending", color: "text-amber-500" },
  { key: "upcoming", title: "Upcoming", color: "text-red-500" },
];
// order of the list sections in the design
const LIST_ORDER: BookingStatus[] = ["ongoing", "upcoming", "pending"];

export default function Bookings() {
  const { user } = useAuth();
  const navSpace = useNavSpace();
  const router = useRouter();
  const [items, setItems] = useState<Booking[]>([]);

  useEffect(() => (user ? watchBookings(user.uid, setItems) : undefined), [user?.uid]);

  const by = (s: BookingStatus) => items.filter((b) => b.status === s).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace }}>
      <Header>
        <View className="flex-row mt-2 mb-1">
          {SECTIONS.map((s) => (
            <View key={s.key} className="flex-1 bg-white border border-[#E2E8F0] rounded-lg py-2 items-center mx-1.5">
              <Text className={`text-[10px] ${s.color}`}>{s.title}</Text>
              <Text className={`text-xl font-extrabold ${s.color}`}>{by(s.key).length}</Text>
            </View>
          ))}
        </View>
      </Header>

      <ScrollView contentContainerClassName="px-5 pb-6" showsVerticalScrollIndicator={false}>
        {items.filter((b) => LIST_ORDER.includes(b.status)).length === 0 && (
          <Text className="text-[#475569] text-center mt-10">No bookings yet. Find a handyman in Search!</Text>
        )}
        {LIST_ORDER.map((status) => {
          const list = by(status);
          if (!list.length) return null;
          return (
            <View key={status}>
              <Text className="text-base font-bold text-[#0F172A] mt-5 mb-2 capitalize">{status}</Text>
              {list.map((b) => (
                <View key={b.id} className="flex-row items-center bg-white border border-[#E2E8F0] rounded-xl p-2.5 mb-2">
                  <Avatar uri={b.handymanPhoto} size={44} />
                  <View className="flex-1 ml-3">
                    <Text className="font-bold text-[#0F172A] text-sm">{b.handymanName}</Text>
                    <Text className="text-xs text-[#475569]">{b.category}</Text>
                    {status !== "ongoing" && (
                      <Text className="text-[10px] text-orange-600">{prettyDate(b.date)} • {b.time}</Text>
                    )}
                  </View>
                  <IconBtn name="call-outline" onPress={() => Linking.openURL(`tel:${b.handymanPhone}`)} />
                  <IconBtn name="chatbubble-outline" dark onPress={() => router.push(ROUTES.chat(b.id))} />
                  {status === "ongoing" && (
                    <IconBtn name="location" blue onPress={() => Alert.alert("Coming soon", "Live location tracking will be added with GPS.")} />
                  )}
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
      <CustomerNavbar />
    </View>
  );
}
