import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useAuth } from "../context/authContext";
import AuthBackground from "../components/AuthBackground";
import AuthField from "../components/AuthField";

export default function SignIn() {
  const router = useRouter();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSignIn = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("Please enter both email and password.");
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const response = await login(emailRef.current, passwordRef.current);
    setLoading(false);

    if (!response.success) {
      Alert.alert(`Login failed: ${response.msg}`);
      alert(`Login failed: ${response.msg}`);
      return;
    }
    // _layout.tsx redirects once isAuthenticated flips to true
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#F8FAFC] overflow-hidden"
    >
      <StatusBar style="dark" />
      <AuthBackground variant="login" />

      <View className="flex-1 justify-center px-10 pb-16">
        <Text className="font-mono text-[44px] font-bold text-[#F59E0B] mb-14">
          Login
        </Text>

        {/* Firebase signs in with email, so this field is Email (design said Username) */}
        <AuthField
          label="Email"
          keyboardType="email-address"
          onChangeText={(v) => (emailRef.current = v)}
          shadow
        />
        <View className="h-2" />
        <AuthField
          label="Password"
          secure
          onChangeText={(v) => (passwordRef.current = v)}
          shadow
        />

        <Pressable
          onPress={handleSignIn}
          disabled={loading}
          className="mt-14 h-14 rounded-lg bg-[#F59E0B] items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <Text className="font-mono text-xl font-bold text-[#0F172A]">
              Login
            </Text>
          )}
        </Pressable>

        <View className="flex-row justify-center items-center mt-4">
          <Text className="font-mono text-[11px] text-[#0F172A]">
            Don't have an account?{" "}
          </Text>
          <Pressable onPress={() => router.push("/sign-up")}>
            <Text className="font-mono text-[11px] text-red-600">Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
