import { ActivityIndicator, Text, View } from "react-native";
import AuthBackground from "../components/AuthBackground";

// Shown while Firebase works out whether you're signed in; _layout.tsx then redirects.
export default function StartPage() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F8FAFC] overflow-hidden">
      <AuthBackground variant="login" />
      <ActivityIndicator size="large" color="#F59E0B" />
      <Text className="mt-4 font-mono text-base font-bold text-[#0F172A]">Loading...</Text>
    </View>
  );
}
