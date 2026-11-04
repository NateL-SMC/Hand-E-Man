import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ROUTES } from "../lib/routes";

const tabs = [
  { label: "Home", route: ROUTES.worker.dashboard, icon: "home-outline" },
  { label: "Bookings", route: ROUTES.worker.bookings, icon: "calendar-outline" },
  { label: "Services", route: ROUTES.worker.services, icon: "construct-outline" },
  { label: "Profile", route: ROUTES.worker.profile, icon: "person-outline" },
] as const;

// Same look/height as CustomerNavbar, so useNavSpace() works for both.
export default function WorkerNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 border-t border-[#E2E8F0] bg-[#F8FAFC]"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="h-[63px] flex-row items-center justify-around">
        {tabs.map((tab) => {
          const color = pathname === tab.route ? "#D97706" : "#94A3B8";
          return (
            <Pressable
              key={tab.label}
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              className="flex-1 items-center justify-center gap-1"
              onPress={() => router.replace(tab.route)}
            >
              <Ionicons name={tab.icon} size={22} color={color} />
              <Text className="text-[11px] font-semibold" style={{ color }}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
