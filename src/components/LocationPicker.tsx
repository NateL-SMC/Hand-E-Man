import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./ui";
import { showAlert } from "../lib/dialog";
import { geocode, getCurrentPlace } from "../lib/geo";
import type { Coords } from "../lib/types";

export type PickedPlace = { label: string; coords?: Coords };

// Bottom sheet: "use my GPS location" or type an area/address and we look it up.
export default function LocationPicker({
  visible, current, onClose, onPick,
}: { visible: boolean; current: string; onClose: () => void; onPick: (p: PickedPlace) => Promise<void> }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"gps" | "text" | null>(null);

  const useGps = async () => {
    setBusy("gps");
    try {
      await onPick(await getCurrentPlace());
      onClose();
    } catch (e: any) {
      showAlert("Couldn't get your location", e.message ?? "Check that location is turned on and allowed for this app.");
    } finally { setBusy(null); }
  };

  const useText = async () => {
    if (!text.trim()) return;
    setBusy("text");
    try {
      const g = await geocode(text);
      if (!g) return showAlert("Not found", "Try adding the city, e.g. “Tibanga, Iligan City”.");
      await onPick({ label: text.trim(), coords: g.coords });
      setText("");
      onClose();
    } finally { setBusy(null); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl p-5">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-extrabold text-[#0F172A]">Your location</Text>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={22} color="#475569" /></Pressable>
          </View>
          <View className="flex-row items-center mb-4">
            <Ionicons name="location" size={14} color="#F59E0B" />
            <Text className="text-sm text-[#475569] ml-1 flex-1" numberOfLines={2}>{current}</Text>
          </View>

          <Button title="Use my current location" onPress={useGps} loading={busy === "gps"} />

          <Text className="text-center text-xs text-[#94A3B8] my-3">or enter it manually</Text>
          <TextInput
            value={text} onChangeText={setText} onSubmitEditing={useText} returnKeyType="search"
            placeholder="e.g. Tibanga, Iligan City" placeholderTextColor="#94A3B8"
            className="border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] mb-3"
          />
          <Button title="Search & save" variant="dark" onPress={useText} loading={busy === "text"} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
