import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WorkerNavbar from "../../components/WorkerNavbar";
import { IconBtn } from "../../components/ui";
import { useAuth } from "../../context/authContext";
import { openChat } from "../../lib/chat";
import { confirmDialog, showAlert } from "../../lib/dialog";
import { peso, prettyDate, timeAgo, toISO } from "../../lib/format";
import { ROUTES } from "../../lib/routes";
import { useNavSpace } from "../../lib/useNavSpace";
import {
  acceptBooking, cancelBooking, completeBooking, declineBooking, releaseIfIdle, setWorkStatus, startBooking,
  watchHandyman, watchWorkerBookings, type WorkStatus,
} from "../../lib/worker";
import type { Booking, BookingStatus, Handyman } from "../../lib/types";

const TABS: { key: BookingStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Current" },
  { key: "completed", label: "Done" },
];

const STATUS_UI: Record<WorkStatus, { label: string; pill: string; text: string }> = {
  available: { label: "AVAILABLE", pill: "bg-emerald-100", text: "text-emerald-600" },
  on_job: { label: "ON THE JOB", pill: "bg-amber-100", text: "text-amber-700" },
  unavailable: { label: "UNAVAILABLE", pill: "bg-slate-200", text: "text-slate-600" },
};

function Btn({ title, onPress, tone }: { title: string; onPress: () => void; tone: "green" | "red" | "amber" | "navy" | "white" }) {
  const bg = { green: "bg-[#10B981]", red: "bg-[#EF4444]", amber: "bg-[#F59E0B]", navy: "bg-[#0F172A]", white: "bg-white border border-[#E2E8F0]" }[tone];
  const text = tone === "white" || tone === "amber" ? "text-[#0F172A]" : "text-white";
  return (
    <Pressable onPress={onPress} className={`flex-1 ${bg} rounded-lg py-2.5 items-center mx-1`}>
      <Text className={`${text} text-sm font-bold`}>{title}</Text>
    </Pressable>
  );
}

type Actions = {
  onOpen?: () => void; onAccept: () => void; onDecline: () => void; onStart: () => void;
  onComplete: () => void; onCancel: () => void; onChat: () => void; onCall: () => void;
};

function JobCard({ b, a }: { b: Booking; a: Actions }) {
  const live = b.status === "upcoming" || b.status === "ongoing";
  return (
    <Pressable onPress={a.onOpen} disabled={!a.onOpen} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <Text className="font-bold text-[#0F172A]">{b.customerName ?? "Customer"}</Text>
          <Text className="text-xs text-[#475569] mt-0.5">{b.packageTitle}</Text>
        </View>
        <Text className="font-extrabold text-[#F59E0B]">{peso(b.serviceCost + b.priorityFee)}</Text>
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-1 pr-2">
          <Text className="text-xs font-bold text-[#0F172A]">{prettyDate(b.date)}, {b.time}</Text>
          <Text className="text-[11px] text-[#475569] mt-0.5" numberOfLines={2}>{b.address}</Text>
          {live && <Text className="text-[10px] text-blue-600 mt-1">Tap to open live tracking</Text>}
        </View>
        {live && (
          <View className="flex-row">
            <IconBtn name="call-outline" onPress={a.onCall} />
            <IconBtn name="chatbubble-outline" dark onPress={a.onChat} />
          </View>
        )}
      </View>

      <View className="flex-row mt-3 -mx-1">
        {b.status === "pending" && (<><Btn title="Decline" tone="red" onPress={a.onDecline} /><Btn title="Confirm" tone="green" onPress={a.onAccept} /></>)}
        {b.status === "upcoming" && (<><Btn title="Cancel" tone="white" onPress={a.onCancel} /><Btn title="Start Trip" tone="amber" onPress={a.onStart} /></>)}
        {b.status === "ongoing" && (<><Btn title="Cancel" tone="white" onPress={a.onCancel} /><Btn title="Complete Job" tone="green" onPress={a.onComplete} /></>)}
      </View>
    </Pressable>
  );
}

export default function WorkerBookings() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const navSpace = useNavSpace();
  const handymanId = profile?.handymanId ?? user?.uid;

  const [items, setItems] = useState<Booking[]>([]);
  const [h, setH] = useState<Handyman | null>(null);
  const [tab, setTab] = useState<BookingStatus>("pending");
  const [showStatus, setShowStatus] = useState(false);
  const [popup, setPopup] = useState<Booking | null>(null);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => (handymanId ? watchHandyman(handymanId, setH) : undefined), [handymanId]);

  // live bookings + "new request" popup: only requests that arrive while this screen is open pop up
  useEffect(() => {
    if (!user) return;
    return watchWorkerBookings(user.uid, (list) => {
      setItems(list);
      const pending = list.filter((b) => b.status === "pending");
      if (seen.current === null) { seen.current = new Set(pending.map((b) => b.id)); return; }
      const fresh = pending.filter((b) => !seen.current!.has(b.id));
      fresh.forEach((b) => seen.current!.add(b.id));
      if (fresh.length) setPopup(fresh[fresh.length - 1]);
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(null), 15000);
    return () => clearTimeout(t);
  }, [popup?.id]);

  const shownPopup = popup && items.find((b) => b.id === popup.id && b.status === "pending");
  const list = useMemo(
    () => items.filter((b) => b.status === tab).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [items, tab]
  );
  const count = (s: BookingStatus) => items.filter((b) => b.status === s).length;

  const run = async (fn: () => Promise<unknown>) => {
    try { await fn(); } catch (e: any) { showAlert("Something went wrong", e.message ?? "Please try again."); }
  };
  const release = async () => { if (user && handymanId) await releaseIfIdle(user.uid, handymanId); };

  // ---- actions (all of them write to the same booking doc the customer is watching) ----
  const accept = (b: Booking) => run(() => acceptBooking(b, user!.uid));
  const decline = (b: Booking) => confirmDialog("Decline request?", "The customer will be notified.", () => run(() => declineBooking(b)));
  const start = (b: Booking) => run(async () => {
    await startBooking(b);
    if (handymanId) await setWorkStatus(handymanId, "on_job");
    router.push(ROUTES.tracking(b.id));
  });
  const complete = (b: Booking) =>
    confirmDialog("Complete job?", "This marks it as done and paid.", () => run(async () => { await completeBooking(b); await release(); }), false);
  const cancel = (b: Booking) =>
    confirmDialog("Cancel this job?", "The customer will be notified.", () => run(async () => { await cancelBooking(b); await release(); }));
  const call = (b: Booking) => (b.customerPhone ? Linking.openURL(`tel:${b.customerPhone}`) : showAlert("No phone number", "This customer didn't leave a number."));
  const chat = (b: Booking) => openChat(router, b).catch((e) => showAlert("Couldn't open chat", e.message));

  const actions = (b: Booking): Actions => ({
    onOpen: b.status === "upcoming" || b.status === "ongoing" ? () => router.push(ROUTES.tracking(b.id)) : undefined,
    onAccept: () => accept(b), onDecline: () => decline(b), onStart: () => start(b),
    onComplete: () => complete(b), onCancel: () => cancel(b), onChat: () => chat(b), onCall: () => call(b),
  });

  // upcoming is split like the design: "Scheduled For Today" first
  const todayIso = toISO(new Date());
  const sections =
    tab === "upcoming"
      ? [
          { title: "Scheduled For Today", items: list.filter((b) => b.date <= todayIso) },
          { title: "Later", items: list.filter((b) => b.date > todayIso) },
        ]
      : [{ title: tab === "pending" ? "Waiting for Confirmation" : tab === "ongoing" ? "Current Job" : "Completed Jobs", items: list }];

  const status = STATUS_UI[h?.status ?? "unavailable"];

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace, paddingTop: top + 12 }}>
      <ScrollView contentContainerClassName="px-5 pb-6" showsVerticalScrollIndicator={false}>
        {/* work status */}
        <View className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-extrabold text-[#0F172A]">Work Status</Text>
            <Pressable onPress={() => setShowStatus(!showStatus)} className={`${status.pill} rounded-full px-3 py-1`}>
              <Text className={`${status.text} text-[11px] font-bold`}>● {status.label}</Text>
            </Pressable>
          </View>
          {showStatus && (
            <View className="flex-row mt-3">
              {(Object.keys(STATUS_UI) as WorkStatus[]).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => { if (handymanId) run(() => setWorkStatus(handymanId, s)); setShowStatus(false); }}
                  className={`flex-1 mx-1 rounded-lg py-2 items-center ${h?.status === s ? STATUS_UI[s].pill : "bg-[#F1F5F9]"}`}
                >
                  <Text className={`text-[10px] font-bold ${h?.status === s ? STATUS_UI[s].text : "text-[#475569]"}`}>{STATUS_UI[s].label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* tabs */}
        <View className="flex-row bg-white border border-[#E2E8F0] rounded-xl p-1 mt-4">
          {TABS.map((t) => (
            <Pressable key={t.key} onPress={() => setTab(t.key)} className={`flex-1 py-2.5 rounded-lg items-center ${tab === t.key ? "bg-[#0F172A]" : ""}`}>
              <Text className={`text-[12px] font-semibold ${tab === t.key ? "text-white" : "text-[#475569]"}`}>
                {t.label}{t.key === "pending" && count("pending") > 0 ? ` (${count("pending")})` : ""}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* temporary new-request popup */}
        {shownPopup && (
          <View className="rounded-2xl border border-[#F59E0B] bg-[#FEF3C7] p-4 mt-4">
            <View className="flex-row justify-between">
              <Text className="text-[11px] font-extrabold text-[#D97706]">NEW REQUEST RECEIVED!</Text>
              <Text className="text-[11px] text-[#475569]">{timeAgo(shownPopup.createdAt)}</Text>
            </View>
            <Text className="text-lg font-extrabold text-[#0F172A] mt-1">{shownPopup.customerName ?? "Customer"}</Text>
            <Text className="text-xs text-[#475569]">{shownPopup.packageTitle}</Text>
            <Text className="text-xs font-bold text-[#0F172A] mt-0.5">{shownPopup.address}</Text>
            <View className="flex-row mt-3 -mx-1">
              <Btn title="Decline" tone="white" onPress={() => { run(() => declineBooking(shownPopup)); setPopup(null); }} />
              <Btn title="Accept" tone="navy" onPress={() => { accept(shownPopup); setPopup(null); }} />
            </View>
          </View>
        )}

        {list.length === 0 && <Text className="text-[#475569] text-center mt-8">Nothing here yet.</Text>}
        {sections.filter((s) => s.items.length > 0).map((s) => (
          <View key={s.title}>
            <Text className="text-base font-extrabold text-[#0F172A] mt-5 mb-3">{s.title}</Text>
            {s.items.map((b) => <JobCard key={b.id} b={b} a={actions(b)} />)}
          </View>
        ))}
      </ScrollView>

      <WorkerNavbar />
    </View>
  );
}
