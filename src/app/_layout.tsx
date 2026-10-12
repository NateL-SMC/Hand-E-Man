import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/authContext";
import "../../global.css";

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof isAuthenticated == "undefined") return;

    if (isAuthenticated === false) {
      router.replace("/sign-in");
    } else if (isAuthenticated === true) {
      router.replace("/Customer/SearchMenu");
    }
  }, [isAuthenticated]);

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
