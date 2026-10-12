import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "../../components/Header";
import HandymanRow from "../../components/HandymanRow";
import { Chip } from "../../components/ui";
import { useAuth } from "../../context/authContext";
import { fetchHandymen } from "../../lib/api";
import { CATEGORIES, DEFAULT_LOCATION, FILTERS } from "../../lib/constants";
import type { Handyman } from "../../lib/types";
import CustomerNavbar from "../../components/CustomerNavbar";
import { useNavSpace } from "../../lib/useNavSpace";

export default function SearchMenu() {
  const { profile } = useAuth();
  const navSpace = useNavSpace();
  const [handymen, setHandymen] = useState<Handyman[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);

  useEffect(() => {
    fetchHandymen().then(setHandymen).finally(() => setLoading(false));
  }, []);

  const toggle = (f: string) => setFilters((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = handymen.filter(
      (h) =>
        (!category || h.category === category) &&
        (!needle || [h.name, h.category, h.headline, ...h.tags].join(" ").toLowerCase().includes(needle))
    );
    if (filters.includes("Urgent")) list = list.filter((h) => h.active);
    if (filters.includes("Rating: 4.5+")) list = list.filter((h) => h.rating >= 4.5);
    return [...list].sort((a, b) =>
      filters.includes("Price: Low-High") ? a.minPrice - b.minPrice
      : filters.includes("Nearby") ? a.distanceKm - b.distanceKm
      : b.rating - a.rating
    );
  }, [handymen, q, category, filters]);

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace }}>
      {/* sticky top bar: lives outside the ScrollView */}
      <Header>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold text-[#0F172A]">Location</Text>
            <View className="flex-row items-center">
              <Ionicons name="location" size={14} color="#0F172A" />
              <Text className="font-bold text-[#0F172A] ml-1">{profile?.location ?? DEFAULT_LOCATION}</Text>
            </View>
          </View>
          <Pressable className="bg-white w-9 h-9 rounded-full items-center justify-center">
            <Ionicons name="notifications-outline" size={18} color="#F59E0B" />
          </Pressable>
        </View>
      </Header>

      <ScrollView contentContainerClassName="px-5 pb-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-full px-4 mt-5">
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search for plumber, electrician..."
            placeholderTextColor="#94A3B8"
            className="flex-1 py-3 ml-2 text-sm text-[#0F172A]"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} className="mt-3">
          {FILTERS.map((f) => (
            <Chip key={f} label={f} active={filters.includes(f)} onPress={() => toggle(f)} />
          ))}
        </ScrollView>

        <Text className="text-base font-bold text-[#0F172A] mt-5 mb-3">All Services</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {CATEGORIES.map((c) => {
            const on = category === c.label;
            return (
              <Pressable
                key={c.label}
                onPress={() => setCategory(on ? null : c.label)}
                className={`w-20 h-20 mr-3 rounded-2xl bg-white items-center justify-center border ${on ? "border-[#F59E0B] bg-amber-50" : "border-[#E2E8F0]"}`}
              >
                <MaterialCommunityIcons name={c.icon} size={30} color="#0F172A" />
                <Text className="text-[11px] font-semibold text-[#0F172A] mt-1" numberOfLines={1}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text className="text-base font-bold text-[#0F172A] mt-6 mb-3">
          {category ? category : "Top Rated Nearby"}
        </Text>
        {loading ? (
          <ActivityIndicator color="#F59E0B" className="mt-6" />
        ) : results.length === 0 ? (
          <Text className="text-[#475569] text-center mt-6">No handymen found.</Text>
        ) : (
          results.map((h) => <HandymanRow key={h.id} h={h} />)
        )}
      </ScrollView>
      <CustomerNavbar />
    </View>
  );
}
