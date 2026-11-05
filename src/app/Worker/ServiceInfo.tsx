import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EditModal, { type EditField } from "../../components/EditModal";
import WorkerNavbar from "../../components/WorkerNavbar";
import { Button } from "../../components/ui";
import { useAuth } from "../../context/authContext";
import { fetchHandyman } from "../../lib/api";
import { confirmDialog, showAlert } from "../../lib/dialog";
import { getCurrentPlace } from "../../lib/geo";
import { CATEGORIES } from "../../lib/constants";
import { dayLabel, parseISO, peso, toISO } from "../../lib/format";
import { useNavSpace } from "../../lib/useNavSpace";
import { saveHandyman } from "../../lib/worker";
import type { Handyman, Package } from "../../lib/types";

// everything the worker can edit lives in this draft; nothing is written until "Confirm Changes"
type Draft = {
  name: string; headline: string; yearsExp: string; bio: string; category: string; photoUrl: string;
  tags: string[]; packages: Package[]; blocked: string[]; // blocked = dates in the next 2 weeks marked unavailable
};
type Modal = null | { kind: "cover" } | { kind: "details" } | { kind: "tag" } | { kind: "pkg"; index: number };

const WINDOW = 14;
const windowDays = () =>
  Array.from({ length: WINDOW }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; });

function toDraft(h: Handyman): Draft {
  const weekdays = h.availableWeekdays ?? [0, 1, 2, 3, 4, 5, 6];
  const off = h.unavailableDates ?? [];
  return {
    name: h.name ?? "", headline: h.headline ?? "", yearsExp: String(h.yearsExp ?? 0), bio: h.bio ?? "",
    category: h.category ?? CATEGORIES[0].label, photoUrl: h.photoUrl ?? "",
    tags: h.tags ?? [], packages: h.packages ?? [],
    blocked: windowDays().map(toISO).filter((iso) => !weekdays.includes(parseISO(iso).getDay()) || off.includes(iso)),
  };
}

export default function WorkerServiceInfo() {
  const { user, profile } = useAuth();
  const { top } = useSafeAreaInsets();
  const navSpace = useNavSpace();
  const handymanId = profile?.handymanId ?? user?.uid;

  const [orig, setOrig] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [rawDoc, setRawDoc] = useState<Handyman | null>(null);
  const [missing, setMissing] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [saving, setSaving] = useState(false);
  const [locBusy, setLocBusy] = useState(false);

  const load = () => {
    if (!handymanId) return;
    fetchHandyman(handymanId).then((h) => {
      if (!h) return setMissing(true);
      setRawDoc(h); setOrig(toDraft(h)); setDraft(toDraft(h));
    });
  };
  useEffect(load, [handymanId]);

  const days = useMemo(windowDays, []);
  const dirty = !!draft && !!orig && JSON.stringify(draft) !== JSON.stringify(orig);

  if (missing) return <View className="flex-1 bg-[#F8FAFC] items-center justify-center p-8"><Text className="text-[#475569] text-center">No service profile found for this account.</Text></View>;
  if (!draft) return <View className="flex-1 bg-[#F8FAFC] items-center justify-center"><ActivityIndicator color="#F59E0B" /></View>;

  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const toggleDay = (iso: string) =>
    set({ blocked: draft.blocked.includes(iso) ? draft.blocked.filter((d) => d !== iso) : [...draft.blocked, iso] });

  const save = async () => {
    if (!handymanId || !rawDoc) return;
    const todayIso = toISO(days[0]);
    const lastIso = toISO(days[WINDOW - 1]);
    setSaving(true);
    try {
      await saveHandyman(handymanId, {
        name: draft.name.trim(), headline: draft.headline.trim(), bio: draft.bio.trim(), category: draft.category,
        yearsExp: Number(draft.yearsExp) || 0, photoUrl: draft.photoUrl, tags: draft.tags, packages: draft.packages,
        minPrice: draft.packages.length ? Math.min(...draft.packages.map((p) => p.price)) : 0,
        // the 2-week grid decides availability; later dates stay open by default
        availableWeekdays: [0, 1, 2, 3, 4, 5, 6],
        unavailableDates: [
          ...(rawDoc.unavailableDates ?? []).filter((d) => d > lastIso && d >= todayIso),
          ...draft.blocked,
        ],
      });
      load();
      showAlert("Saved", "Your service profile is updated.");
    } catch (e: any) {
      showAlert("Couldn't save", e.message);
    } finally {
      setSaving(false);
    }
  };

  // saved immediately (it's a device action, not a form field)
  const setHere = async () => {
    if (!handymanId) return;
    setLocBusy(true);
    try {
      const place = await getCurrentPlace();
      await saveHandyman(handymanId, { coords: place.coords, locationLabel: place.label });
      load();
      showAlert("Service location updated", place.label);
    } catch (e: any) {
      showAlert("Couldn't get your location", e.message);
    } finally { setLocBusy(false); }
  };

  // ----- modal config -----
  let title = "", fields: EditField[] = [], onSave: (v: Record<string, string>) => void = () => {}, onDelete: (() => void) | undefined;
  if (modal?.kind === "cover") {
    title = "Cover photo"; fields = [{ key: "url", label: "Image URL", value: draft.photoUrl }];
    onSave = (v) => set({ photoUrl: v.url.trim() });
  } else if (modal?.kind === "details") {
    title = "Edit details";
    fields = [
      { key: "name", label: "Name", value: draft.name },
      { key: "headline", label: "Title (e.g. Master Plumber)", value: draft.headline },
      { key: "years", label: "Years of experience", value: draft.yearsExp, numeric: true },
      { key: "category", label: "Category", value: draft.category, options: CATEGORIES.map((c) => c.label) },
      { key: "bio", label: "Description", value: draft.bio, multiline: true },
    ];
    onSave = (v) => set({ name: v.name, headline: v.headline, yearsExp: v.years, category: v.category, bio: v.bio });
  } else if (modal?.kind === "tag") {
    title = "Add tag"; fields = [{ key: "tag", label: "Tag (e.g. Pipe Repair)", value: "" }];
    onSave = (v) => { const t = v.tag.trim(); if (t && !draft.tags.includes(t)) set({ tags: [...draft.tags, t] }); };
  } else if (modal?.kind === "pkg") {
    const isNew = modal.index < 0;
    const p = isNew ? { id: "", title: "", price: 0, description: "" } : draft.packages[modal.index];
    title = isNew ? "Add service" : "Edit service";
    fields = [
      { key: "title", label: "Service name", value: p.title },
      { key: "price", label: "Price (₱)", value: p.price ? String(p.price) : "", numeric: true },
      { key: "description", label: "Description", value: p.description, multiline: true },
    ];
    onSave = (v) => {
      if (!v.title.trim()) return;
      const next: Package = { id: p.id || `svc_${Date.now()}`, title: v.title.trim(), price: Number(v.price) || 0, description: v.description.trim() };
      set({ packages: isNew ? [...draft.packages, next] : draft.packages.map((x, i) => (i === modal.index ? next : x)) });
    };
    if (!isNew) onDelete = () => { set({ packages: draft.packages.filter((_, i) => i !== modal.index) }); setModal(null); };
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-4">
        {/* cover */}
        <View className="h-52 bg-gray-400">
          {!!draft.photoUrl && <Image source={{ uri: draft.photoUrl }} className="w-full h-full" resizeMode="cover" />}
          <Pressable
            onPress={() => setModal({ kind: "cover" })}
            style={{ top: top + 8 }}
            className="absolute right-4 w-9 h-9 rounded-full bg-gray-500/80 items-center justify-center"
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </Pressable>
        </View>

        <View className="px-5 pt-4">
          <View className="flex-row items-center">
            <Text className="text-2xl font-extrabold text-[#0F172A]">{draft.name}</Text>
            <Pressable onPress={() => setModal({ kind: "details" })} className="ml-2 w-6 h-6 rounded-full border border-[#E2E8F0] bg-white items-center justify-center">
              <Ionicons name="pencil" size={11} color="#94A3B8" />
            </Pressable>
          </View>
          <Text className="text-[#475569] mt-0.5">{draft.headline} • {draft.yearsExp} Years Experience</Text>
          {!!draft.bio && <Text className="text-xs text-[#475569] mt-1.5">{draft.bio}</Text>}
          <Pressable onPress={() => setModal({ kind: "details" })} className="self-start mt-2 border border-dashed border-[#CBD5E1] rounded-md px-2.5 py-1">
            <Text className="text-[11px] text-[#475569]">+ Edit Description</Text>
          </Pressable>

          {/* tags */}
          <View className="flex-row flex-wrap mt-4">
            {draft.tags.map((t) => (
              <Pressable
                key={t}
                onPress={() => confirmDialog("Remove tag?", t, () => set({ tags: draft.tags.filter((x) => x !== t) }))}
                className="flex-row items-center border border-[#E2E8F0] bg-white rounded-md px-2 py-1 mr-2 mb-2"
              >
                <Text className="text-[11px] text-slate-600">{t}</Text>
                <Ionicons name="close" size={11} color="#94A3B8" style={{ marginLeft: 4 }} />
              </Pressable>
            ))}
            <Pressable onPress={() => setModal({ kind: "tag" })} className="border border-[#E2E8F0] bg-white rounded-md px-2.5 py-1 mb-2">
              <Text className="text-[11px] text-slate-600">+</Text>
            </Pressable>
          </View>

          {/* service location: lets customers see a real distance */}
          <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-xl p-3 mt-1">
            <Ionicons name="location" size={18} color="#F59E0B" />
            <View className="flex-1 ml-2">
              <Text className="text-xs font-bold text-[#0F172A]">Service location</Text>
              <Text className="text-[11px] text-[#475569]" numberOfLines={2}>{rawDoc?.locationLabel ?? "Not set yet"}</Text>
            </View>
            <Pressable onPress={setHere} disabled={locBusy} className="bg-[#0F172A] rounded-lg px-3 py-2">
              <Text className="text-white text-[11px] font-bold">{locBusy ? "Locating…" : "Use my location"}</Text>
            </Pressable>
          </View>

          {/* services */}
          <Text className="text-base font-extrabold text-[#0F172A] mt-4 mb-2">Service Packages</Text>
          {draft.packages.map((p, i) => (
            <View key={p.id} className="rounded-xl border border-[#F59E0B] bg-white p-3 mb-2">
              <View className="flex-row items-center">
                <Text className="font-bold text-[#0F172A] text-sm flex-1 pr-2">{p.title}</Text>
                <Text className="font-bold text-amber-500 mr-2">{peso(p.price)}</Text>
                <Pressable onPress={() => setModal({ kind: "pkg", index: i })} className="w-6 h-6 rounded-full border border-[#E2E8F0] items-center justify-center">
                  <Ionicons name="pencil" size={11} color="#94A3B8" />
                </Pressable>
              </View>
              <Text className="text-xs text-slate-600 mt-1">{p.description}</Text>
            </View>
          ))}
          <Pressable onPress={() => setModal({ kind: "pkg", index: -1 })} className="border border-dashed border-[#CBD5E1] rounded-lg py-2 items-center">
            <Text className="text-xs text-[#475569]">+ Add Service</Text>
          </Pressable>

          {/* availability */}
          <View className="flex-row justify-between items-center mt-5 mb-2">
            <Text className="text-base font-extrabold text-[#0F172A]">Availability</Text>
            <Text className="text-[11px] text-[#475569]">For the next 2 weeks</Text>
          </View>
          <View className="flex-row flex-wrap -mx-[3px]">
            {days.map((d) => {
              const iso = toISO(d), off = draft.blocked.includes(iso);
              return (
                <View key={iso} style={{ width: "20%", padding: 3 }}>
                  <Pressable
                    onPress={() => toggleDay(iso)}
                    className={`h-16 rounded-xl border items-center justify-center ${off ? "bg-red-100 border-red-300" : "bg-white border-[#E2E8F0]"}`}
                  >
                    <Text className={`text-[11px] ${off ? "text-red-400" : "text-[#475569]"}`}>{dayLabel(d)}</Text>
                    <Text className={`text-lg font-bold ${off ? "text-red-500" : "text-[#0F172A]"}`}>{d.getDate()}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <Text className="text-[11px] text-[#94A3B8] mt-1">Tap a day to mark it unavailable (red).</Text>
        </View>
      </ScrollView>

      <View className="px-5 pt-2 pb-3 flex-row">
        {dirty && (
          <View className="mr-2" style={{ width: 110 }}>
            <Button title="Cancel" variant="dark" onPress={() => orig && setDraft(orig)} />
          </View>
        )}
        <View className="flex-1">
          <Button title="Confirm Changes" onPress={save} loading={saving} disabled={!dirty} />
        </View>
      </View>

      <EditModal visible={!!modal} title={title} fields={fields} onSave={(v) => { onSave(v); setModal(null); }} onClose={() => setModal(null)} onDelete={onDelete} />
      <WorkerNavbar />
    </View>
  );
}
