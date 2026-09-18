import { StatusBar } from "expo-status-bar";
import {
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import {
  widthToDP as wp,
  heightToDP as hp,
  widthToFonts as wf,
  heightToFonts as hf,
} from "react-native-responsive-screens";
import { Feather, Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useAuth } from "../../context/authContext";

export default function SignUp() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const emailRef = useRef("");
  const passwordRef = useRef("");
  const usernameRef = useRef("");
  const profileRef = useRef("");

  const handleRegister = async () => {
    if (
      !emailRef.current ||
      !passwordRef.current ||
      !usernameRef.current ||
      !profileRef.current
    ) {
      Alert.alert("Please enter all required fields.");
      alert("Please enter all required fields.");

      return;
    }

    setLoading(true);

    let response = await register(
      emailRef.current,
      passwordRef.current,
      usernameRef.current,
      profileRef.current,
    );

    setLoading(false);

    //console.log("Register response:", response);
    if (!response.success) {
      Alert.alert(`Registration failed: ${response.msg}`);
      alert(`Registration failed: ${response.msg}`);
      return;
    } else {
      router.replace("/StudentDir/home");
      return;
    }
  };

  return (
    //<View className="flex-1 items-center justify-center bg-white">
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
      }}
    >
      <StatusBar style="dark" />
      <View className="w-24 h-24 mb-4 bg-white-750 rounded-full items-center justify-center  ">
        {/* signIn Image */}
        <Image
          style={{ width: wp(20), height: hp(20) }}
          resizeMode="contain"
          source={require("../../assets/images/android-icon-foreground.png")}
        />
      </View>

      <View className="gap-10">
        <Text
          style={{ fontSize: wf(1.5), fontWeight: "bold" }}
          className="text-neutral-700 text-center tracking-wider"
        >
          Sign Up
        </Text>

        <View className="gap-4">
          <View
            style={{ height: hp(7) }}
            className="flex-row items-center justify-center gap-4 bg-neutral-100 border-gray-300 border-2 rounded-lg px-10"
          >
            <Feather name="user" size={wf(1.5)} color="gray" />
            <TextInput
              onChangeText={(value) => (usernameRef.current = value)}
              style={{ fontSize: wf(1) }}
              className="placeholder:text-gray-500 flex-1 text-neutral-800"
              placeholder="Username"
              placeholderTextColor="gray"
            />
          </View>

          <View
            style={{ height: hp(7) }}
            className="flex-row items-center justify-center gap-4 bg-neutral-100 border-gray-300 border-2 rounded-lg px-10"
          >
            <Octicons name="mail" size={wf(1.5)} color="gray" />
            <TextInput
              onChangeText={(value) => (emailRef.current = value)}
              style={{ fontSize: wf(1) }}
              className="placeholder:text-gray-500 flex-1 text-neutral-800"
              placeholder="Email"
              placeholderTextColor="gray"
            />
          </View>

          <View className="gap-3">
            <View
              style={{ height: hp(7) }}
              className="flex-row items-center justify-center gap-4 bg-neutral-100 border-gray-300 border-2 rounded-lg px-10"
            >
              <Octicons name="lock" size={wf(1.5)} color="gray" />
              <TextInput
                onChangeText={(value) => (passwordRef.current = value)}
                style={{ fontSize: wf(1) }}
                className="placeholder:text-gray-500 flex-1 text-neutral-800"
                placeholder="Password"
                placeholderTextColor="gray"
                secureTextEntry={true}
              />
            </View>
          </View>

          <View
            style={{ height: hp(7) }}
            className="flex-row items-center justify-center gap-4 bg-neutral-100 border-gray-300 border-2 rounded-lg px-10"
          >
            <Feather name="link" size={wf(1.5)} color="gray" />
            <TextInput
              onChangeText={(value) => (profileRef.current = value)}
              style={{ fontSize: wf(1) }}
              className="placeholder:text-gray-500 flex-1 text-neutral-800"
              placeholder="Profile URL"
              placeholderTextColor="gray"
            />
          </View>

          {/*In the interest of time, we'll be skipping Lottie animations :(  */}
          <TouchableOpacity onPress={handleRegister}>
            <Text
              style={{ fontSize: wf(1), color: "white" }}
              className="font-bold text-center bg-sky-500 py-3 rounded-xl"
            >
              Sign Up
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center gap-2">
            <Text
              style={{ fontSize: wf(0.8), color: "gray" }}
              className="text-center"
            >
              Already have an account?
            </Text>
            <Pressable onPress={() => router.push("/sign-in")}>
              <Text
                style={{ fontSize: wf(0.8), color: "indigo" }}
                className="font-semibold text-center"
              >
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
