import { ActivityIndicator, Text, View } from "react-native";

export default function StartPage() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#0000ff" />
      <Text className="mt-4 text-lg font-semibold text-gray-700">
        Loading...
      </Text>
    </View>
  );
}
