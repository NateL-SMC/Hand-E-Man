import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../../context/authContext";
import "../../global.css";

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    //
    if (typeof isAuthenticated == "undefined") return;
    const onSignIn = segments[0] === "sign-in";

    if (isAuthenticated === false) {
      router.replace("/sign-in");
    } else if (isAuthenticated === true) {
      router.replace("/StudentDir/home");
    }
  }, [isAuthenticated]);

  return <Stack />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
