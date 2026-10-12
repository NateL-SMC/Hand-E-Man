import { StyleSheet, View } from "react-native";

type Circle = { s: number; o: number; top?: number; bottom?: number; left?: number; right?: number };

const SHAPES: Record<"login" | "register", Circle[]> = {
  register: [
    { s: 260, o: 0.35, top: -150, left: 70 },
    { s: 150, o: 0.4, top: 30, right: -50 },
    { s: 28, o: 0.5, top: 125, left: 185 },
    { s: 190, o: 0.3, bottom: -70, left: 10 },
    { s: 80, o: 0.45, bottom: 5, left: -25 },
  ],
  login: [
    { s: 230, o: 0.4, top: -120, left: 10 },
    { s: 120, o: 0.5, top: -10, right: -40 },
    { s: 40, o: 0.5, top: 40, left: -15 },
    { s: 28, o: 0.4, top: 85, left: 160 },
    { s: 70, o: 0.5, top: 125, right: 40 },
    { s: 230, o: 0.35, bottom: -60, left: -80 },
    { s: 90, o: 0.4, bottom: 120, left: 160 },
    { s: 26, o: 0.4, bottom: 190, right: 20 },
    { s: 150, o: 0.3, bottom: -90, right: -20 },
  ],
};

// Decorative amber bubbles behind the Login / Register forms.
export default function AuthBackground({ variant }: { variant: "login" | "register" }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      {SHAPES[variant].map(({ s, o, ...pos }, i) => (
        <View
          key={i}
          style={{ position: "absolute", width: s, height: s, borderRadius: s / 2, backgroundColor: "#F59E0B", opacity: o, ...pos }}
        />
      ))}
    </View>
  );
}
