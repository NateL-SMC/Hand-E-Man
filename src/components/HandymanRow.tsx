import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Avatar, Stars } from "./ui";
import type { Handyman } from "../lib/types";
import { ROUTES } from "../lib/routes";

export default function HandymanRow({ h }: { h: Handyman }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(ROUTES.service(h.id))}
      className="flex-row items-center bg-white border border-[#E2E8F0] rounded-xl p-2.5 mb-3"
    >
      <Avatar uri={h.photoUrl} size={48} />
      <View className="flex-1 ml-3">
        <Text className="font-bold text-[#0F172A]">{h.name}</Text>
        <Text className="text-xs text-[#475569]">{h.category}</Text>
        <View className="flex-row items-center mt-0.5">
          <Stars rating={h.rating} size={10} />
          <Text className="text-xs font-semibold ml-1">{h.rating.toFixed(1)}</Text>
          <Text className="text-[10px] text-[#475569] ml-1">({h.reviewCount} reviews)</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-xs font-bold text-blue-600">{h.distanceKm.toFixed(1)} km</Text>
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      </View>
    </Pressable>
  );
}
