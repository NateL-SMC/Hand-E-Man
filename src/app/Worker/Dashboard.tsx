import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Header from "../../components/Header";
import WorkerNavbar from "../../components/WorkerNavbar";
import { useAuth } from "../../context/authContext";
import { fetchReviews } from "../../lib/api";
import { peso } from "../../lib/format";
import { ROUTES } from "../../lib/routes";
import { useNavSpace } from "../../lib/useNavSpace";
import { DAY_MS, earningsOf, startOfWeek, watchHandyman, watchWorkerBookings } from "../../lib/worker";
import type { Booking, Handyman, Review } from "../../lib/types";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const money = (n: number) => peso(n).replace(/\.00$/, "");

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-3 mx-1">
      <Text className="text-[11px] text-[#475569]">{label}</Text>
      <Text className="text-lg font-extrabold text-[#0F172A] mt-1">{value}</Text>
    </View>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const navSpace = useNavSpace();
  const handymanId = profile?.handymanId ?? user?.uid;

  const [h, setH] = useState<Handyman | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => (handymanId ? watchHandyman(handymanId, setH) : undefined), [handymanId]);
  useEffect(() => (user ? watchWorkerBookings(user.uid, setBookings) : undefined), [user?.uid]);
  useEffect(() => { if (handymanId) fetchReviews(handymanId).then(setReviews).catch(() => {}); }, [handymanId]);

  // revenue per weekday (Mon..Sun) from jobs completed this week
  const { perDay, weekly, completed } = useMemo(() => {
    const start = startOfWeek().getTime();
    const per = [0, 0, 0, 0, 0, 0, 0];
    let count = 0;
    for (const b of bookings) {
      if (b.status !== "completed") continue;
      count++;
      const t = b.completedAt ?? 0;
      if (t >= start && t < start + 7 * DAY_MS) per[Math.min(6, Math.floor((t - start) / DAY_MS))] += earningsOf(b);
    }
    return { perDay: per, weekly: per.reduce((a, b) => a + b, 0), completed: count };
  }, [bookings]);

  const max = Math.max(...perDay, 1);
  const counts = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => Math.round(r.rating) === s).length);
  const totalReviews = Math.max(1, counts.reduce((a, b) => a + b, 0));
  const name = profile?.username ?? h?.name ?? "Worker";

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace }}>
      <Header>
        <Text className="text-xs text-white">Welcome to your dashboard!</Text>
        <Text className="text-xl font-extrabold text-[#0F172A]">{name}</Text>
      </Header>

      <ScrollView contentContainerClassName="px-5 pb-6" showsVerticalScrollIndicator={false}>
        <Text className="text-lg font-extrabold text-[#0F172A] mt-5 mb-3">Performance & Earnings</Text>

        <View className="flex-row -mx-1">
          <Stat label="Weekly Earnings" value={money(weekly)} />
          <Stat label="Jobs Completed" value={String(completed)} />
          <Stat label="Rating" value={h && h.rating > 0 ? `${h.rating.toFixed(2)} ★` : "—"} />
        </View>

        {/* revenue chart */}
        <View className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mt-4">
          <View className="flex-row justify-between">
            <Text className="font-bold text-[#0F172A]">Revenue (This Week)</Text>
            <Text className="text-xs text-[#475569]">Total: {peso(weekly)}</Text>
          </View>
          <View className="flex-row items-end h-32 mt-4">
            {perDay.map((v, i) => (
              <View key={i} className="flex-1 mx-1.5 justify-end">
                <View
                  className="w-full rounded-t-md"
                  style={{ height: Math.max(6, (v / max) * 120), backgroundColor: v > 0 ? "#3B82F6" : "#E2E8F0" }}
                />
              </View>
            ))}
          </View>
          <View className="flex-row mt-1.5">
            {WEEKDAYS.map((d, i) => (
              <Text key={i} className="flex-1 text-center text-[11px] text-[#94A3B8]">{d}</Text>
            ))}
          </View>
        </View>

        {/* ratings breakdown */}
        <View className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mt-4">
          <Text className="font-bold text-[#0F172A] mb-3">Ratings Breakdown</Text>
          {[5, 4, 3, 2, 1].map((star, i) => (
            <View key={star} className="flex-row items-center mb-2">
              <Text className="w-14 text-xs text-[#475569]">{star} Stars</Text>
              <View className="flex-1 h-2 rounded-full bg-[#F1F5F9] overflow-hidden mx-2">
                <View className="h-2 rounded-full bg-[#F59E0B]" style={{ width: `${(counts[i] / totalReviews) * 100}%` }} />
              </View>
              <Text className="w-8 text-right text-xs text-[#475569]">{counts[i]}</Text>
            </View>
          ))}
          <Pressable
            onPress={() => handymanId && router.push(ROUTES.reviews(handymanId))}
            className="mt-2 border border-[#CBD5E1] rounded-lg py-2 items-center"
          >
            <Text className="text-xs font-semibold text-[#0F172A]">View Reviews</Text>
          </Pressable>
        </View>
      </ScrollView>

      <WorkerNavbar />
    </View>
  );
}
