import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabs = [
  { label: "Search", route: "/Customer/SearchMenu", icon: "search-outline" },
  {
    label: "Bookings",
    route: "/Customer/Bookings",
    icon: "calendar-outline",
  },
  {
    label: "Profile",
    route: "/Customer/UserProfile",
    icon: "person-outline",
  },
] as const;

export default function CustomerNavbar() {
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
          const isActive = pathname === tab.route;
          const color = isActive ? "#D97706" : "#94A3B8";

          return (
            <Pressable
              key={tab.label}
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              className="flex-1 items-center justify-center gap-1"
              onPress={() => router.replace(tab.route)}
            >
              <Ionicons name={tab.icon} size={22} color={color} />
              <Text
                className="font-sans text-[11px] font-semibold"
                style={{ color }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
