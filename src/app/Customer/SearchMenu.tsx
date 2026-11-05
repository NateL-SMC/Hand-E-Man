import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CustomerNavbar from "../../components/CustomerNavbar";
import Header from "../../components/Header";
import HandymanRow from "../../components/HandymanRow";
import LocationPicker from "../../components/LocationPicker";
import { Avatar, Chip, Stars } from "../../components/ui";
import { useAuth } from "../../context/authContext";
import { fetchHandymen, updateMyProfile } from "../../lib/api";
import { CATEGORIES, DEFAULT_LOCATION, FILTERS } from "../../lib/constants";
import { haversineKm } from "../../lib/geo";
import { ROUTES } from "../../lib/routes";
import { useNavSpace } from "../../lib/useNavSpace";
import type { Handyman } from "../../lib/types";

export default function SearchMenu() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const navSpace = useNavSpace();
  const [handymen, setHandymen] = useState<Handyman[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    fetchHandymen().then(setHandymen).finally(() => setLoading(false));
  }, []);

  const toggle = (f: string) => setFilters((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));

  // real distance once both the customer and the handyman have a GPS position, otherwise the stored estimate
  const distanceOf = (h: Handyman) =>
    profile?.coords && h.coords ? haversineKm(profile.coords, h.coords) : h.distanceKm;

  const favorites = useMemo(
    () => handymen.filter((h) => profile?.favorites?.includes(h.id)),
    [handymen, profile?.favorites]
  );

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = handymen.filter(
      (h) =>
        (h.packages?.length ?? 0) > 0 && // workers who haven't listed a service yet can't be booked
        (!category || h.category === category) &&
        (!needle || [h.name, h.category, h.headline, ...(h.tags ?? [])].join(" ").toLowerCase().includes(needle))
    );
    if (filters.includes("Urgent")) list = list.filter((h) => h.active);
    if (filters.includes("Rating: 4.5+")) list = list.filter((h) => h.rating >= 4.5);
    return [...list].sort((a, b) =>
      filters.includes("Price: Low-High") ? a.minPrice - b.minPrice
      : filters.includes("Nearby") ? distanceOf(a) - distanceOf(b)
      : b.rating - a.rating
    );
  }, [handymen, q, category, filters, profile?.coords]);

  const locationLabel = profile?.location ?? DEFAULT_LOCATION;

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace }}>
      <Header>
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => setPickerOpen(true)} className="flex-1 pr-3">
            <Text className="text-[10px] font-bold text-[#0F172A]">Location</Text>
            <View className="flex-row items-center">
              <Ionicons name="location" size={14} color="#0F172A" />
              <Text className="font-bold text-[#0F172A] ml-1 flex-shrink" numberOfLines={1}>{locationLabel}</Text>
              <Ionicons name="chevron-down" size={14} color="#0F172A" style={{ marginLeft: 2 }} />
            </View>
          </Pressable>
          <Pressable onPress={() => router.push(ROUTES.notifications)} className="bg-white w-9 h-9 rounded-full items-center justify-center">
            <Ionicons name="notifications-outline" size={18} color="#F59E0B" />
          </Pressable>
        </View>
      </Header>

      <ScrollView contentContainerClassName="px-5 pb-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-full px-4 mt-5">
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            value={q} onChangeText={setQ} placeholder="Search for plumber, electrician..." placeholderTextColor="#94A3B8"
            className="flex-1 py-3 ml-2 text-sm text-[#0F172A]"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} className="mt-3">
          {FILTERS.map((f) => <Chip key={f} label={f} active={filters.includes(f)} onPress={() => toggle(f)} />)}
        </ScrollView>

        <Text className="text-base font-bold text-[#0F172A] mt-5 mb-3">All Services</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }}>
          {CATEGORIES.map((c) => {
            const on = category === c.label;
            return (
              <Pressable
                key={c.label} onPress={() => setCategory(on ? null : c.label)}
                className={`w-20 h-20 mr-3 rounded-2xl bg-white items-center justify-center border ${on ? "border-[#F59E0B] bg-amber-50" : "border-[#E2E8F0]"}`}
              >
                <MaterialCommunityIcons name={c.icon} size={30} color="#0F172A" />
                <Text className="text-[11px] font-semibold text-[#0F172A] mt-1" numberOfLines={1}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* favorites carousel (heart a handyman on their page to add them here) */}
        {favorites.length > 0 && (
          <>
            <View className="flex-row items-center mt-6 mb-3">
              <Ionicons name="heart" size={16} color="#EF4444" />
              <Text className="text-base font-bold text-[#0F172A] ml-1.5">Favorites</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }}>
              {favorites.map((h) => (
                <Pressable
                  key={h.id} onPress={() => router.push(ROUTES.service(h.id))}
                  className="w-36 bg-white border border-[#E2E8F0] rounded-xl p-3 mr-3"
                >
                  <Avatar uri={h.photoUrl} size={44} />
                  <Text className="font-bold text-[#0F172A] mt-2" numberOfLines={1}>{h.name}</Text>
                  <Text className="text-xs text-[#475569]" numberOfLines={1}>{h.category}</Text>
                  <View className="flex-row items-center mt-1">
                    <Stars rating={h.rating} size={9} />
                    <Text className="text-[10px] font-semibold ml-1">{h.rating.toFixed(1)}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <Text className="text-base font-bold text-[#0F172A] mt-6 mb-3">{category ? category : "Top Rated Nearby"}</Text>
        {loading ? (
          <ActivityIndicator color="#F59E0B" className="mt-6" />
        ) : results.length === 0 ? (
          <Text className="text-[#475569] text-center mt-6">No handymen found.</Text>
        ) : (
          results.map((h) => <HandymanRow key={h.id} h={h} km={distanceOf(h)} />)
        )}
      </ScrollView>

      <LocationPicker
        visible={pickerOpen}
        current={locationLabel}
        onClose={() => setPickerOpen(false)}
        onPick={async (p) => { if (user) await updateMyProfile(user.uid, { location: p.label, coords: p.coords }); }}
      />
      <CustomerNavbar />
    </View>
  );
}
