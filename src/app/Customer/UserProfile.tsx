import { useState, type ReactNode } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomerNavbar from "../../components/CustomerNavbar";
import Header from "../../components/Header";
import { Avatar, Button } from "../../components/ui";
import { useAuth } from "../../context/authContext";
import { deleteMyAccount, resetPassword, submitReport, updateMyProfile } from "../../lib/api";
import { useNavSpace } from "../../lib/useNavSpace";

const fmt = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
};

// module-level on purpose: defining this inside Profile would remount the TextInput on every keystroke
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-center mb-3">
      <Text className="w-28 font-mono text-[13px] text-[#0F172A]">{label}</Text>
      <View className="flex-1 border border-[#E2E8F0] bg-white rounded-full px-3 py-1.5 min-h-[32px] justify-center">
        {children}
      </View>
    </View>
  );
}

export default function ProfileUser() {
  const { user, profile, logout } = useAuth();
  const navSpace = useNavSpace();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState("");

  if (!user) return null;
  const name = profile?.username ?? user.displayName ?? user.email?.split("@")[0] ?? "User";
  const role = profile?.role ?? "customer";

  const toggleEdit = async () => {
    if (editing) await updateMyProfile(user.uid, { phone });
    else setPhone(profile?.phone ?? "");
    setEditing(!editing);
  };

  const sendReset = async () => {
    if (!user.email) return;
    try {
      await resetPassword(user.email);
      Alert.alert("Check your email", "We sent you a password reset link.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const confirmDelete = () =>
    Alert.alert("Delete account?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMyAccount(); // _layout redirects to sign-in when auth state clears
          } catch (e: any) {
            const stale = e.code === "auth/requires-recent-login";
            Alert.alert(stale ? "Please log in again" : "Error", stale ? "For security, log out and back in, then retry." : e.message);
          }
        },
      },
    ]);

  const sendReport = async () => {
    if (!report.trim()) return;
    await submitReport(user.uid, report.trim());
    setReport("");
    setReportOpen(false);
    Alert.alert("Thanks!", "Your report has been submitted.");
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingBottom: navSpace }}>
      <Header>
        <View className="flex-row items-center">
          <Avatar uri={profile?.profileUrl || undefined} size={56} />
          <View className="flex-1 ml-3">
            <Text className="text-xl font-extrabold text-[#0F172A]">{name}</Text>
            <Text className="text-sm text-white capitalize">{role} Account</Text>
          </View>
          <Pressable onPress={() => logout()} hitSlop={10}>
            <Ionicons name="log-out-outline" size={30} color="#0F172A" />
          </Pressable>
        </View>
      </Header>

      <ScrollView contentContainerClassName="px-5 pb-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mt-5 mb-3">
          <Text className="text-xl font-extrabold text-[#0F172A]">Account Details</Text>
          <Pressable onPress={toggleEdit} hitSlop={10}>
            <Ionicons name={editing ? "checkmark-circle" : "pencil"} size={20} color={editing ? "#10B981" : "#0F172A"} />
          </Pressable>
        </View>

        <Field label="Password">
          {editing ? (
            <Pressable onPress={sendReset}>
              <Text className="font-mono text-xs text-blue-600">Send reset email</Text>
            </Pressable>
          ) : (
            <Text className="font-mono text-xs text-[#0F172A]">*****</Text>
          )}
        </Field>
        <Field label="Contact Number">
          {editing ? (
            <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" className="font-mono text-xs text-[#0F172A] p-0" />
          ) : (
            <Text className="font-mono text-xs text-[#0F172A]">{profile?.phone ?? "Not set"}</Text>
          )}
        </Field>
        <Field label="Email">
          <Text className="font-mono text-xs text-[#0F172A]" numberOfLines={1}>{user.email}</Text>
        </Field>

        <View className="flex-row mt-1">
          <View className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-3 mr-2">
            <Text className="text-xs text-[#475569]">Date Joined</Text>
            <Text className="text-lg font-extrabold text-[#0F172A]">{fmt(user.metadata.creationTime)}</Text>
          </View>
          <View className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-3 ml-2">
            <Text className="text-xs text-[#475569]">Last Login</Text>
            <Text className="text-lg font-extrabold text-[#0F172A]">{fmt(user.metadata.lastSignInTime)}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="px-5 pb-3">
        <Button title="Report an Issue" variant="dark" onPress={() => setReportOpen(true)} />
        <View className="h-2" />
        <Button title="Delete Account" variant="danger" onPress={confirmDelete} />
      </View>

      <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={() => setReportOpen(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-5">
            <Text className="text-lg font-extrabold text-[#0F172A] mb-2">Report an Issue</Text>
            <TextInput
              value={report}
              onChangeText={setReport}
              multiline
              placeholder="Describe what went wrong..."
              placeholderTextColor="#94A3B8"
              className="border border-[#E2E8F0] rounded-xl p-3 h-32 text-[#0F172A] text-sm"
              style={{ textAlignVertical: "top" }}
            />
            <View className="flex-row mt-4">
              <View className="flex-1 mr-2"><Button title="Cancel" variant="dark" onPress={() => setReportOpen(false)} /></View>
              <View className="flex-1 ml-2"><Button title="Submit" onPress={sendReport} /></View>
            </View>
          </View>
        </View>
      </Modal>

      <CustomerNavbar />
    </View>
  );
}
