import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Chip, Stars } from "../../components/ui";
import { fetchHandyman, fetchReviews } from "../../lib/api";
import { dayLabel, peso, shortDate, toISO } from "../../lib/format";
import type { Handyman, Review } from "../../lib/types";
import CustomerNavbar from "../../components/CustomerNavbar";
import { useNavSpace } from "../../lib/useNavSpace";
import { ROUTES } from "../../lib/routes";

export default function ServiceInfo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const navSpace = useNavSpace();
  const [h, setH] = useState<Handyman | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pkgId, setPkgId] = useState<string>();
  const [date, setDate] = useState<string>();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!id) return;
    setH(null); setDate(undefined);
    fetchHandyman(id).then((x) => { setH(x); setPkgId(x?.packages?.[0]?.id); });
    fetchReviews(id).then((r) => setReviews(r.sort((a, b) => b.createdAt - a.createdAt)));
  }, [id]);

  // today -> next week; unavailable days are greyed out
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }),
    []
  );

  if (!h) return <View className="flex-1 bg-[#F8FAFC] items-center justify-center"><ActivityIndicator color="#F59E0B" /></View>;

  const isAvail = (d: Date) => h.availableWeekdays.includes(d.getDay()) && !h.unavailableDates.includes(toISO(d));
  const latest = reviews[0];

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-4">
        {/* hero */}
        <View className="h-52 bg-gray-400">
          {h.photoUrl && <Image source={{ uri: h.photoUrl }} className="w-full h-full" resizeMode="cover" />}
          <View style={{ top: top + 8 }} className="absolute left-4 right-4 flex-row justify-between">
            <Pressable onPress={() => router.back()} className="w-8 h-8 rounded-full bg-gray-500/80 items-center justify-center">
              <Ionicons name="arrow-back" size={16} color="#fff" />
            </Pressable>
            <Pressable onPress={() => setFav(!fav)} className="w-8 h-8 rounded-full bg-gray-500/80 items-center justify-center">
              <Ionicons name={fav ? "heart" : "heart-outline"} size={16} color={fav ? "#EF4444" : "#fff"} />
            </Pressable>
          </View>
        </View>

        <View className="px-5 pt-4">
          <View className="flex-row items-center">
            <Text className="text-xl font-extrabold text-[#0F172A]">{h.name}</Text>
            {h.active && (
              <View className="bg-emerald-100 rounded px-1.5 py-0.5 ml-2">
                <Text className="text-[10px] font-bold text-emerald-600">ACTIVE</Text>
              </View>
            )}
          </View>
          <Text className="text-[#475569] mt-0.5">{h.headline} • {h.yearsExp} Years Experience</Text>
          <View className="flex-row items-center mt-1.5">
            <Stars rating={h.rating} />
            <Text className="text-xs font-bold ml-1.5">{h.rating.toFixed(1)}</Text>
            <Text className="text-xs text-[#475569] ml-1">({h.reviewCount} reviews)</Text>
          </View>

          <View className="flex-row flex-wrap mt-3">
            {h.tags.map((t) => (
              <View key={t} className="border border-[#E2E8F0] bg-white rounded-md px-2 py-1 mr-2 mb-2">
                <Text className="text-[11px] text-slate-600">{t}</Text>
              </View>
            ))}
          </View>

          {/* reviews preview */}
          <Pressable onPress={() => router.push(ROUTES.reviews(h.id))} className="flex-row items-center justify-between mt-3 mb-2">
            <Text className="font-bold text-[#0F172A]">Recent Reviews</Text>
            <Ionicons name="arrow-forward" size={18} color="#0F172A" />
          </Pressable>
          {latest ? (
            <View className="bg-white border border-[#E2E8F0] rounded-lg p-3">
              <View className="flex-row justify-between">
                <Text className="text-xs font-bold text-[#0F172A]">{latest.author}</Text>
                <Text className="text-[10px] text-[#475569]">{shortDate(latest.createdAt)}</Text>
              </View>
              <Stars rating={latest.rating} size={10} />
              <Text className="text-xs text-slate-600 mt-1">{latest.text}</Text>
            </View>
          ) : (
            <Text className="text-xs text-[#475569]">No reviews yet.</Text>
          )}

          {/* packages */}
          <Text className="font-bold text-[#0F172A] mt-5 mb-2">Service Packages</Text>
          {h.packages.map((p) => {
            const on = p.id === pkgId;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPkgId(p.id)}
                className={`rounded-xl p-3 mb-2 border ${on ? "border-[#F59E0B] bg-amber-50" : "border-[#E2E8F0] bg-white"}`}
              >
                <View className="flex-row justify-between">
                  <Text className="font-bold text-[#0F172A] text-sm flex-1 pr-2">{p.title}</Text>
                  <Text className="font-bold text-amber-600">{peso(p.price)}</Text>
                </View>
                <Text className="text-xs text-slate-600 mt-1">{p.description}</Text>
              </Pressable>
            );
          })}

          {/* availability */}
          <Text className="font-bold text-[#0F172A] mt-4 mb-2">Select Availability</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {days.map((d) => {
              const ok = isAvail(d), iso = toISO(d), on = date === iso;
              return (
                <Pressable
                  key={iso}
                  disabled={!ok}
                  onPress={() => setDate(iso)}
                  className={`w-14 h-16 mr-2 rounded-xl border items-center justify-center ${
                    on ? "bg-[#0F172A] border-[#0F172A]" : ok ? "bg-white border-[#E2E8F0]" : "bg-slate-100 border-slate-100"
                  }`}
                >
                  <Text className={`text-[11px] ${on ? "text-white" : ok ? "text-[#475569]" : "text-slate-300"}`}>{dayLabel(d)}</Text>
                  <Text className={`text-lg font-bold ${on ? "text-white" : ok ? "text-[#0F172A]" : "text-slate-300"}`}>{d.getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      <View className="px-5 py-3 bg-[#F8FAFC]">
        <Button
          title="Book Service"
          disabled={!date || !pkgId}
          onPress={() => router.push(ROUTES.request(h.id, pkgId!, date!))}
        />
      </View>
      <CustomerNavbar />
    </View>
  );
}
