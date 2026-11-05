import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomerNavbar from "../components/CustomerNavbar";
import LiveMap from "../components/LiveMap";
import WorkerNavbar from "../components/WorkerNavbar";
import { Avatar, Button, IconBtn } from "../components/ui";
import { useAuth } from "../context/authContext";
import { openChat } from "../lib/chat";
import { confirmDialog, showAlert } from "../lib/dialog";
import { ensureLocationPermission, geocode, getCurrentCoords } from "../lib/geo";
import { ROUTES } from "../lib/routes";
import { getRoute, type RouteInfo } from "../lib/routing";
import { watchBooking } from "../lib/social";
import { STAGES, stageOf } from "../lib/tracking";
import { useNavSpace } from "../lib/useNavSpace";
import { arriveBooking, completeBooking, releaseIfIdle, setWorkStatus, startBooking, updateWorkerLocation } from "../lib/worker";
import type { Booking, Coords } from "../lib/types";

// One screen, two roles: customers see progress + ETA, workers get the trip / arrive / finish controls.
export default function Tracking() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const navSpace = useNavSpace();

  const [b, setB] = useState<Booking | null>(null);
  const [dest, setDest] = useState<Coords | null>(null);
  const [me, setMe] = useState<Coords | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [busy, setBusy] = useState(false);

  const isWorker = !!b && user?.uid === b.handymanUid;
  const handymanId = profile?.handymanId ?? user?.uid;
  const stage = b ? stageOf(b) : "accepted";
  const stageIdx = STAGES.findIndex((s) => s.key === stage);
  const live = !!b && b.status === "ongoing" && stage === "on_the_way";

  useEffect(() => (bookingId ? watchBooking(bookingId, setB) : undefined), [bookingId]);

  // where the job is: saved at booking time, otherwise look the address up now
  useEffect(() => {
    if (!b) return;
    if (b.destination) { setDest(b.destination); return; }
    geocode(b.address).then((g) => g && setDest(g.coords));
  }, [b?.id, b?.destination?.latitude, b?.destination?.longitude]);

  // worker: show own position, and broadcast it to the booking doc while on the way
  useEffect(() => {
    if (!isWorker || !b) return;
    let sub: Location.LocationSubscription | undefined;
    let dead = false, last = 0;
    (async () => {
      try {
        if (!(await ensureLocationPermission()) || dead) return;
        if (!live) { setMe(await getCurrentCoords()); return; }
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 20, timeInterval: 5000 },
          (p) => {
            const c = { latitude: p.coords.latitude, longitude: p.coords.longitude };
            setMe(c);
            if (Date.now() - last < 5000) return;
            last = Date.now();
            updateWorkerLocation(b.id, c).catch(() => {});
          }
        );
      } catch { /* no GPS, map just shows the destination */ }
    })();
    return () => { dead = true; sub?.remove(); };
  }, [isWorker, b?.id, live]);

  const from: Coords | null = isWorker ? me : b?.workerLocation ?? null;
  const fromKey = from ? `${from.latitude.toFixed(3)},${from.longitude.toFixed(3)}` : "";

  // driving route + ETA (re-fetched when the worker has moved ~100 m)
  useEffect(() => {
    if (!from || !dest || stage === "arrived" || stage === "finished") { setRoute(null); return; }
    let cancel = false;
    getRoute(from, dest).then((r) => !cancel && setRoute(r));
    return () => { cancel = true; };
  }, [fromKey, dest?.latitude, dest?.longitude, stage]);

  if (!b) return <View className="flex-1 bg-[#F8FAFC]" />;

  const other = isWorker
    ? { name: b.customerName ?? "Customer", sub: b.address, phone: b.customerPhone, photo: undefined as string | undefined }
    : { name: b.handymanName, sub: b.packageTitle, phone: b.handymanPhone, photo: b.handymanPhoto };

  const minutes = route ? Math.max(1, Math.round(route.minutes)) : null;
  const eta =
    b.status === "cancelled" ? "Cancelled"
    : stage === "finished" ? "Job complete"
    : stage === "arrived" ? "Arrived"
    : stage === "on_the_way" ? (minutes ? `${minutes} Minute${minutes === 1 ? "" : "s"}` : "Calculating…")
    : "Not started";
  const pill = b.status === "cancelled" ? "Cancelled" : stage === "finished" ? "Finished" : stage === "arrived" ? "Arrived" : stage === "on_the_way" ? "En Route" : "Scheduled";

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); } catch (e: any) { showAlert("Something went wrong", e.message); }
    finally { setBusy(false); }
  };

  const stageAction =
    stage === "accepted" ? { title: "Start Trip", go: () => run(async () => { await startBooking(b); if (handymanId) await setWorkStatus(handymanId, "on_job"); }) }
    : stage === "on_the_way" ? { title: "I've Arrived", go: () => run(() => arriveBooking(b)) }
    : null;

  const finish = () =>
    confirmDialog("Finish job?", "This marks the job as done and paid for both of you.", () =>
      run(async () => {
        await completeBooking(b);
        if (user && handymanId) await releaseIfIdle(user.uid, handymanId);
        router.replace(ROUTES.worker.bookings);
      }), false);

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace }}>
      <View className="flex-1">
        <LiveMap destination={dest} worker={from} route={route?.coords} />
        <Pressable
          onPress={() => router.back()}
          style={{ top: top + 8, elevation: 4 }}
          className="absolute left-4 flex-row items-center bg-white rounded-lg px-3 py-1.5 shadow-md shadow-black/20"
        >
          <Ionicons name="arrow-back" size={14} color="#0F172A" />
          <Text className="text-xs font-bold text-[#0F172A] ml-1.5">Back</Text>
        </Pressable>
      </View>

      <View className="bg-white rounded-t-3xl px-5 pt-4 pb-4 border-t border-[#E2E8F0]">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[11px] text-[#475569]">Estimated Arrival</Text>
            <Text className="text-2xl font-extrabold text-[#0F172A]">{eta}</Text>
          </View>
          <View className="bg-[#FEF3C7] rounded-md px-2.5 py-1">
            <Text className="text-[11px] font-bold text-[#D97706]">{pill}</Text>
          </View>
        </View>

        <View className="flex-row items-center border border-[#E2E8F0] rounded-2xl p-3 mt-3">
          <Avatar uri={other.photo} size={44} />
          <View className="flex-1 ml-3">
            <Text className="font-bold text-[#0F172A]">{other.name}</Text>
            <Text className="text-xs text-[#475569]" numberOfLines={1}>{other.sub}</Text>
          </View>
          <IconBtn name="call-outline" onPress={() => (other.phone ? Linking.openURL(`tel:${other.phone}`) : showAlert("No phone number"))} />
          <IconBtn name="chatbubble-outline" dark onPress={() => openChat(router, b).catch((e) => showAlert("Couldn't open chat", e.message))} />
        </View>

        {isWorker ? (
          b.status === "cancelled" || stage === "finished" ? null : (
            <View className="flex-row mt-3">
              {stageAction && <View className="flex-1 mr-2"><Button title={stageAction.title} onPress={stageAction.go} loading={busy} /></View>}
              {stage !== "accepted" && (
                <View className="flex-1">
                  <Button title="Finish Job" variant="dark" onPress={finish} disabled={busy} />
                </View>
              )}
            </View>
          )
        ) : (
          <>
            <Text className="font-bold text-[#0F172A] mt-4 mb-2">Job Timeline</Text>
            <View className="flex-row">
              {STAGES.map((s, i) => {
                const done = b.status !== "cancelled" && i <= stageIdx;
                return (
                  <View key={s.key} className="flex-1 items-center">
                    <View className={`w-5 h-5 rounded-full items-center justify-center ${done ? "bg-[#F97316]" : "bg-[#E2E8F0]"}`}>
                      {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text className={`text-[10px] mt-1 ${done ? "text-[#F97316] font-semibold" : "text-[#94A3B8]"}`}>{s.label}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      {isWorker ? <WorkerNavbar /> : <CustomerNavbar />}
    </View>
  );
}
