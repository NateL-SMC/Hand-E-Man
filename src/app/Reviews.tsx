import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Chip, Stars } from "../components/ui";
import { useAuth } from "../context/authContext";
import { fetchReviews } from "../lib/api";
import { showAlert } from "../lib/dialog";
import { shortDate } from "../lib/format";
import { canReview, submitReview } from "../lib/social";
import type { Review } from "../lib/types";

const SORTS = ["Recent", "Oldest", "Highest", "Critical"] as const;

export default function Reviews() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { top, bottom } = useSafeAreaInsets();
  const [all, setAll] = useState<Review[]>([]);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Recent");
  const [eligible, setEligible] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const isCustomer = profile?.role !== "handyman";
  const load = () => { if (id) fetchReviews(id).then(setAll); };
  useEffect(load, [id]);
  useEffect(() => {
    if (id && user && isCustomer) canReview(user.uid, id).then(setEligible);
  }, [id, user?.uid, isCustomer]);

  const mine = all.find((r) => r.authorId === user?.uid);
  useEffect(() => {
    if (mine) { setRating(mine.rating); setText(mine.text); }
  }, [mine?.id]);

  const list = useMemo(() => {
    const l = [...all];
    switch (sort) {
      case "Recent": return l.sort((a, b) => b.createdAt - a.createdAt);
      case "Oldest": return l.sort((a, b) => a.createdAt - b.createdAt);
      case "Highest": return l.sort((a, b) => b.rating - a.rating);
      case "Critical": return l.filter((r) => r.rating <= 3).sort((a, b) => a.rating - b.rating);
    }
  }, [all, sort]);

  const submit = async () => {
    if (!user || !id) return;
    if (rating < 1) return showAlert("Pick a rating", "Tap the stars to rate your experience.");
    setBusy(true);
    try {
      await submitReview(id, user.uid, profile?.username ?? user.displayName ?? "Customer", rating, text);
      load();
      showAlert(mine ? "Review updated" : "Thanks for your review!");
    } catch (e: any) {
      showAlert("Couldn't post review", e.message);
    } finally { setBusy(false); }
  };

  const form = isCustomer ? (
    <View className="bg-white border border-[#E2E8F0] rounded-xl p-3 mb-3">
      {eligible ? (
        <>
          <Text className="text-xs font-bold text-[#0F172A] mb-2">{mine ? "Your review" : "Write a review"}</Text>
          <View className="flex-row mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
                <Ionicons name={n <= rating ? "star" : "star-outline"} size={28} color="#F59E0B" />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={text} onChangeText={setText} multiline placeholder="How was the job? (optional)" placeholderTextColor="#94A3B8"
            className="border border-[#E2E8F0] rounded-lg p-2.5 h-20 text-sm text-[#0F172A] mb-2" style={{ textAlignVertical: "top" }}
          />
          <Button title={mine ? "Update review" : "Post review"} onPress={submit} loading={busy} />
        </>
      ) : (
        <Text className="text-[11px] text-[#475569]">You can review this handyman once they've accepted one of your bookings.</Text>
      )}
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: bottom }}>
      <View style={{ paddingTop: top + 12 }} className="flex-row items-center px-5 pb-3">
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color="#0F172A" /></Pressable>
        <Text className="font-bold text-[#0F172A] ml-4">{sort === "Recent" ? "Recent" : sort} Reviews</Text>
      </View>

      {/* flexShrink:0 on the wrapper AND the scroller: without it the long list below squeezes the chips (the clipped-tags bug) */}
      <View style={{ flexShrink: 0 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerClassName="px-5 pb-3">
          {SORTS.map((s) => <Chip key={s} label={s} active={sort === s} onPress={() => setSort(s)} />)}
        </ScrollView>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={list}
        keyExtractor={(r) => r.id}
        contentContainerClassName="px-5 pb-6"
        ListHeaderComponent={form}
        ListEmptyComponent={<Text className="text-[#475569] text-center mt-10">No reviews here.</Text>}
        renderItem={({ item }) => (
          <View className="bg-white border border-[#E2E8F0] rounded-xl p-3 mb-2.5">
            <View className="flex-row justify-between">
              <Text className="text-xs font-bold text-[#0F172A]">{item.author}{item.authorId === user?.uid ? " (you)" : ""}</Text>
              <Text className="text-[10px] text-[#475569]">{shortDate(item.createdAt)}</Text>
            </View>
            <Stars rating={item.rating} size={10} />
            {!!item.text && <Text className="text-xs text-slate-600 mt-1.5">{item.text}</Text>}
          </View>
        )}
      />
    </View>
  );
}
