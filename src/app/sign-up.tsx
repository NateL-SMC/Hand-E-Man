import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useAuth } from "../context/authContext";
import AuthBackground from "../components/AuthBackground";
import AuthField from "../components/AuthField";

export default function SignUp() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"customer" | "handyman">("customer");

  const usernameRef = useRef("");
  const passwordRef = useRef("");
  const emailRef = useRef("");
  const phoneRef = useRef("");
  const addressRef = useRef("");

  const handleRegister = async () => {
    if (
      !usernameRef.current ||
      !passwordRef.current ||
      !emailRef.current ||
      !phoneRef.current ||
      !addressRef.current
    ) {
      Alert.alert("Please enter all required fields.");
      alert("Please enter all required fields.");
      return;
    }

    setLoading(true);
    const response = await register(
      emailRef.current.trim(),
      passwordRef.current,
      usernameRef.current.trim(),
      "", // no profile URL field in the new design
      {
        phone: phoneRef.current.trim(),
        address: addressRef.current.trim(),
        role,
      },
    );
    setLoading(false);

    if (!response.success) {
      Alert.alert(`Registration failed: ${response.msg}`);
      alert(`Registration failed: ${response.msg}`);
    }
    // _layout.tsx redirects once isAuthenticated flips to true
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#F8FAFC] overflow-hidden"
    >
      <StatusBar style="dark" />
      <AuthBackground variant="register" />

      <ScrollView
        contentContainerClassName="px-10 pt-16 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-mono text-4xl font-bold text-[#F59E0B] mb-6">
          Register
        </Text>

        <AuthField
          label="Username"
          onChangeText={(v) => (usernameRef.current = v)}
        />
        <AuthField
          label="Password"
          secure
          onChangeText={(v) => (passwordRef.current = v)}
        />
        <AuthField
          label="Email"
          keyboardType="email-address"
          onChangeText={(v) => (emailRef.current = v)}
        />
        <AuthField
          label="Contact Number"
          keyboardType="phone-pad"
          onChangeText={(v) => (phoneRef.current = v)}
        />
        <AuthField
          label="Address"
          autoCapitalize="words"
          onChangeText={(v) => (addressRef.current = v)}
        />

        {/* Customer / Handyman toggle */}
        <View
          className="flex-row rounded-full border border-[#E2E8F0] bg-white p-1 mt-2"
          style={{ elevation: 2 }}
        >
          {(["customer", "handyman"] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              className={`flex-1 h-9 rounded-full items-center justify-center ${role === r ? "bg-[#FBBF24]" : ""}`}
            >
              <Text className="font-mono text-xs font-bold text-[#0F172A] capitalize">
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          className="mt-8 h-14 rounded-lg bg-[#F59E0B] items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <Text className="font-mono text-xl font-bold text-[#0F172A]">
              Sign Up
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push("/sign-in")}
          className="mt-4 items-center"
        >
          <Text className="font-mono text-[11px] text-red-600">
            Already have an account?
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
