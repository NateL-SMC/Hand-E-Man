import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function Avatar({ uri, size = 48 }: { uri?: string; size?: number }) {
  const style = { width: size, height: size, borderRadius: 8 };
  return uri ? (
    <Image source={{ uri }} style={style} />
  ) : (
    <View style={style} className="bg-gray-300 items-center justify-center">
      <Ionicons name="person" size={size * 0.6} color="#fff" />
    </View>
  );
}

export function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row">
      {[0, 1, 2, 3, 4].map((i) => (
        <Ionicons key={i} name={i < Math.round(rating) ? "star" : "star-outline"} size={size} color="#F59E0B" />
      ))}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-lg border mr-2 ${active ? "bg-amber-100 border-[#F59E0B]" : "bg-white border-[#E2E8F0]"}`}
    >
      <Text className={`text-xs ${active ? "text-amber-800 font-semibold" : "text-slate-700"}`}>{label}</Text>
    </Pressable>
  );
}

export function Button({
  title, onPress, variant = "primary", loading, disabled,
}: {
  title: string; onPress?: () => void; variant?: "primary" | "dark" | "danger"; loading?: boolean; disabled?: boolean;
}) {
  const bg = { primary: "bg-[#F59E0B]", dark: "bg-[#0F172A]", danger: "bg-red-500" }[variant];
  const text = variant === "primary" ? "text-[#0F172A]" : "text-white";
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      className={`${bg} rounded-xl py-3.5 items-center ${disabled ? "opacity-50" : ""}`}
    >
      {loading ? <ActivityIndicator color="#0F172A" /> : <Text className={`${text} font-bold text-base`}>{title}</Text>}
    </Pressable>
  );
}

export function IconBtn({
  name, onPress, dark, blue,
}: { name: keyof typeof Ionicons.glyphMap; onPress?: () => void; dark?: boolean; blue?: boolean }) {
  const bg = blue ? "bg-blue-500" : dark ? "bg-[#0F172A]" : "bg-white border border-[#E2E8F0]";
  return (
    <Pressable onPress={onPress} className={`w-9 h-9 rounded-full items-center justify-center ml-2 ${bg}`}>
      <Ionicons name={name} size={16} color={dark || blue ? "#fff" : "#0F172A"} />
    </Pressable>
  );
}
