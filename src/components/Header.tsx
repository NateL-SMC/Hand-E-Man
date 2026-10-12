import { View } from "react-native";
import { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Orange rounded-bottom header used by Search, Bookings, Profile and Chat.
export default function Header({ children }: { children: ReactNode }) {
  const { top } = useSafeAreaInsets();
  return (
    <View
      style={{ paddingTop: top + 8, elevation: 6 }}
      className="bg-[#F59E0B] rounded-b-3xl px-5 pb-4 shadow-md shadow-black/20 z-10"
    >
      {children}
    </View>
  );
}
