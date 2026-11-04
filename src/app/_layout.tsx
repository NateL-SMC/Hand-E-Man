import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/authContext";
import { registerForPush, useNotificationRouting } from "../lib/notifications";
import { ROUTES } from "../lib/routes";
import "../../global.css";

const MainLayout = () => {
  const { isAuthenticated, user, profile, profileLoaded } = useAuth();
  const router = useRouter();
  useNotificationRouting();

  // signed out -> sign-in; signed in -> the right home for their role
  useEffect(() => {
    if (typeof isAuthenticated == "undefined") return;

    if (isAuthenticated === false) {
      router.replace("/sign-in");
      return;
    }
    if (!profileLoaded) return; // wait until we know their role
    router.replace(profile?.role === "handyman" ? ROUTES.worker.dashboard : ROUTES.search);
  }, [isAuthenticated, profileLoaded, profile?.role]);

  // store this device's push token on the user doc (customers + workers)
  useEffect(() => {
    if (user?.uid) registerForPush(user.uid);
  }, [user?.uid]);

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
