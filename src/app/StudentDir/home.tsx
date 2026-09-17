import { Text, View, Button } from "react-native";
import { useAuth } from "../../../context/authContext";

export default function App() {
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">Welcome to Home!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
