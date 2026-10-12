import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import { useAuth } from "../context/authContext";
import { fetchBooking, sendMessage, watchMessages } from "../lib/api";
import type { Booking, Message } from "../lib/types";

export default function Chat() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { bottom } = useSafeAreaInsets();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (!bookingId) return;
    fetchBooking(bookingId).then(setBooking);
    return watchMessages(bookingId, setMsgs);
  }, [bookingId]);

  const send = async () => {
    const t = text.trim();
    if (!t || !user || !bookingId) return;
    setText("");
    await sendMessage(bookingId, user.uid, t);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F8FAFC]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header>
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </Pressable>
          <View className="flex-1 flex-row items-center justify-between bg-[#0F172A] rounded-full pl-6 pr-2 py-2 ml-4">
            <Text className="text-[#F59E0B] text-xl font-extrabold">
              {booking?.handymanName ?? "Chat"}
            </Text>
            <Pressable
              onPress={() =>
                booking && Linking.openURL(`tel:${booking.handymanPhone}`)
              }
              className="w-8 h-8 rounded-full border border-[#F59E0B] items-center justify-center"
            >
              <Ionicons name="call-outline" size={16} color="#F59E0B" />
            </Pressable>
          </View>
        </View>
      </Header>

      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerClassName="px-5 pt-6 pb-4"
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        renderItem={({ item }) => {
          const mine = item.senderId === user?.uid;
          return (
            <View
              className={`mb-3 max-w-[75%] ${mine ? "self-end items-end" : "self-start items-start"}`}
            >
              <Text className="text-[10px] text-slate-600 mb-0.5">
                {mine ? "You" : booking?.handymanName}
              </Text>
              <View
                className={`bg-[#0F172A] px-4 py-3 rounded-xl ${mine ? "rounded-br-none" : "rounded-bl-none"}`}
              >
                <Text className="text-white text-[13px]">{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={{ paddingBottom: bottom + 8 }} className="px-4 pt-2">
        <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-3xl p-2">
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
            placeholder="Message..."
            placeholderTextColor="#94A3B8"
            className="flex-1 border border-[#E2E8F0] rounded-full px-4 py-2 text-sm text-[#0F172A]"
          />
          <Pressable
            onPress={send}
            className="w-10 h-10 rounded-full border border-[#0F172A] items-center justify-center ml-2"
          >
            <Ionicons name="paper-plane-outline" size={18} color="#0F172A" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
