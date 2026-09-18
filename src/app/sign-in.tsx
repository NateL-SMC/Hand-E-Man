import { StatusBar } from "expo-status-bar";
import {
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  widthToDP as wp,
  heightToDP as hp,
  widthToFonts as wf,
  heightToFonts as hf,
} from "react-native-responsive-screens";
import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useAuth } from "../../context/authContext";
import { login } from "../../context/authContext";

export default function SignIn() {
  const router = useRouter();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth;

  const handleSignIn = async () => {
    if (!emailRef.current || !passwordRef.current) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    const response = await login;

    setLoading(false);
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
          source={require("../../assets/images/reactLogo3.png")}
        />
      </View>

      <View className="gap-10">
        <Text
          style={{ fontSize: wf(1.5), fontWeight: "bold" }}
          className="text-neutral-700 text-center tracking-wider"
        >
          Sign In
        </Text>

        <View className="gap-4">
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
            <View>
              <Text
                style={{ fontSize: wf(0.8), color: "indigo" }}
                className="font-semibold text-right"
              >
                Forgot Password?
              </Text>
            </View>
          </View>

          {/*In the interest of time, we'll be skipping Lottie animations :(  */}
          <TouchableOpacity onPress={handleSignIn}>
            <Text
              style={{ fontSize: wf(1), color: "white" }}
              className="font-bold text-center bg-sky-500 py-3 rounded-xl"
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center gap-2">
            <Text
              style={{ fontSize: wf(0.8), color: "gray" }}
              className="text-center"
            >
              Don't have an account?
            </Text>
            <Pressable onPress={() => router.push("/sign-up")}>
              <Text
                style={{ fontSize: wf(0.8), color: "indigo" }}
                className="font-semibold text-center"
              >
                Sign Up
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
