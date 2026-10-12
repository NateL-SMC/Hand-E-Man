import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Chip, Stars } from "../components/ui";
import { fetchReviews } from "../lib/api";
import { shortDate } from "../lib/format";
import type { Review } from "../lib/types";

const SORTS = ["Recent", "Oldest", "Positive", "Critical"] as const;

export default function Reviews() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [all, setAll] = useState<Review[]>([]);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Recent");

  useEffect(() => {
    if (id) fetchReviews(id).then(setAll);
  }, [id]);

  const list = useMemo(() => {
    const l = [...all];
    switch (sort) {
      case "Recent":
        return l.sort((a, b) => b.createdAt - a.createdAt);
      case "Oldest":
        return l.sort((a, b) => a.createdAt - b.createdAt);
      case "Positive":
        return l.sort((a, b) => b.rating - a.rating);
      case "Critical":
        return l
          .filter((r) => r.rating <= 3)
          .sort((a, b) => a.rating - b.rating);
    }
  }, [all, sort]);

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: bottom }}>
      <View
        style={{ paddingTop: top + 12 }}
        className="flex-row items-center px-5 pb-3"
      >
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <Text className="font-bold text-[#0F172A] ml-4">
          {sort === "Recent" ? "Recent" : sort} Reviews
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerClassName="px-5 pb-3"
      >
        {SORTS.map((s) => (
          <Chip
            key={s}
            label={s}
            active={sort === s}
            onPress={() => setSort(s)}
          />
        ))}
      </ScrollView>
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        contentContainerClassName="px-5 pb-6"
        ListEmptyComponent={
          <Text className="text-[#475569] text-center mt-10">
            No reviews here.
          </Text>
        }
        renderItem={({ item }) => (
          <View className="bg-white border border-[#E2E8F0] rounded-xl p-3 mb-2.5">
            <View className="flex-row justify-between">
              <Text className="text-xs font-bold text-[#0F172A]">
                {item.author}
              </Text>
              <Text className="text-[10px] text-[#475569]">
                {shortDate(item.createdAt)}
              </Text>
            </View>
            <Stars rating={item.rating} size={10} />
            <Text className="text-xs text-slate-600 mt-1.5">{item.text}</Text>
          </View>
        )}
      />
    </View>
  );
}
