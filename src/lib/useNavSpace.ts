import { useSafeAreaInsets } from "react-native-safe-area-context";

// Height CustomerNavbar occupies (63px bar + bottom inset + border). Add as paddingBottom so content isn't hidden behind it.
export function useNavSpace() {
  const { bottom } = useSafeAreaInsets();
  return 63 + Math.max(bottom, 8) + 1;
}
