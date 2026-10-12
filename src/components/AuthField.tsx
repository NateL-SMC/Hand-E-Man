import { Text, TextInput, View, type KeyboardTypeOptions } from "react-native";

// Labelled pill input used by Sign In / Sign Up. Keep it module-level so typing never remounts it.
export default function AuthField({
  label, onChangeText, secure, keyboardType, autoCapitalize = "none", shadow,
}: {
  label: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words";
  shadow?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="font-mono text-xs text-[#0F172A] ml-3 mb-1.5">{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        className={`h-11 rounded-full border border-[#E2E8F0] bg-white px-5 text-sm text-[#0F172A] ${shadow ? "shadow-md shadow-black/20" : ""}`}
        style={shadow ? { elevation: 4 } : undefined}
      />
    </View>
  );
}
