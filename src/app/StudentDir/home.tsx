import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  widthToDP as wp,
  heightToDP as hp,
  widthToFonts as wf,
} from "react-native-responsive-screens";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../../context/authContext";

type Student = {
  id: string;
  name: string;
  year: string;
  course: string;
  profileUrl?: string;
};

const studentsRef = collection(db, "students");

export default function Home() {
  const { logout, user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [course, setCourse] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // READ (realtime)
  useEffect(() => {
    const q = query(studentsRef, orderBy("name", "asc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Student[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Student, "id">),
        }));
        setStudents(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching students:", error);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const resetForm = () => {
    setName("");
    setYear("");
    setCourse("");
    setProfileUrl("");
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (student: Student) => {
    setEditingId(student.id);
    setName(student.name ?? "");
    setYear(student.year ?? "");
    setCourse(student.course ?? "");
    setProfileUrl(student.profileUrl ?? "");
    setModalVisible(true);
  };

  // CREATE + UPDATE
  const handleSave = async () => {
    if (!name.trim() || !year.trim() || !course.trim()) {
      alert("Please fill in Name, Year, and Course.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "students", editingId), {
          name: name.trim(),
          year: year.trim(),
          course: course.trim(),
          profileUrl: profileUrl.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(studentsRef, {
          name: name.trim(),
          year: year.trim(),
          course: course.trim(),
          profileUrl: profileUrl.trim(),
          createdBy: user?.uid ?? null,
          createdAt: serverTimestamp(),
        });
      }
      setModalVisible(false);
      resetForm();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      alert(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // DELETE
  const handleDelete = (student: Student) => {
    Alert.alert("Delete student", `Remove ${student.name} from the list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "students", student.id));
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Delete failed.";
            alert(msg);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Student }) => (
    <View
      style={{ padding: wp(2) }}
      className="flex-row items-center bg-neutral-100 border-2 border-gray-200 rounded-xl mb-3"
    >
      <View
        style={{ width: wp(6), height: wp(6) }}
        className="items-center justify-center bg-sky-500 rounded-full mr-4"
      >
        <Feather name="user" size={wf(1.6)} color="white" />
      </View>

      <View className="flex-1">
        <Text
          style={{ fontSize: wf(1.1) }}
          className="font-bold text-neutral-800"
        >
          {item.name}
        </Text>
        <Text style={{ fontSize: wf(0.9) }} className="text-gray-500">
          {item.year} • {item.course}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => openEditModal(item)}
        style={{ marginRight: wp(3) }}
      >
        <Feather name="edit-2" size={wf(1.3)} color="#0284c7" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item)}>
        <Feather name="trash-2" size={wf(1.3)} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }} className="bg-white">
      <StatusBar style="dark" />

      <View
        style={{
          paddingTop: hp(6),
          paddingHorizontal: wp(5),
          paddingBottom: hp(2),
        }}
        className="flex-row items-center justify-between"
      >
        <Text
          style={{ fontSize: wf(1.6) }}
          className="font-bold text-neutral-800"
        >
          Students
        </Text>
        <TouchableOpacity onPress={logout}>
          <Feather name="log-out" size={wf(1.4)} color="gray" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Loading students...</Text>
        </View>
      ) : students.length === 0 ? (
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingHorizontal: wp(10) }}
        >
          <Ionicons name="school-outline" size={wf(3)} color="#d1d5db" />
          <Text
            style={{ fontSize: wf(1) }}
            className="text-gray-400 text-center mt-3"
          >
            No students yet. Tap + to add one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: wp(5),
            paddingBottom: hp(12),
          }}
        />
      )}

      <TouchableOpacity
        onPress={openAddModal}
        style={{
          position: "absolute",
          right: wp(6),
          bottom: hp(5),
          width: wp(6),
          height: wp(6),
          borderRadius: wp(7),
        }}
        className="bg-sky-500 items-center justify-center shadow-lg"
      >
        <Feather name="plus" size={wf(1.8)} color="white" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          className="justify-end"
        >
          <View
            style={{ padding: wp(6), paddingBottom: hp(4) }}
            className="bg-white rounded-t-3xl"
          >
            <Text
              style={{ fontSize: wf(1.3) }}
              className="font-bold text-neutral-800 mb-4"
            >
              {editingId ? "Edit Student" : "Add Student"}
            </Text>

            <View className="gap-3">
              <View
                style={{ height: hp(6.5) }}
                className="flex-row items-center gap-3 bg-neutral-100 border-gray-300 border-2 rounded-lg px-4"
              >
                <Feather name="user" size={wf(1.3)} color="gray" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={{ fontSize: wf(1) }}
                  className="flex-1 text-neutral-800"
                  placeholder="Name"
                  placeholderTextColor="gray"
                />
              </View>

              <View
                style={{ height: hp(6.5) }}
                className="flex-row items-center gap-3 bg-neutral-100 border-gray-300 border-2 rounded-lg px-4"
              >
                <Feather name="calendar" size={wf(1.3)} color="gray" />
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  style={{ fontSize: wf(1) }}
                  className="flex-1 text-neutral-800"
                  placeholder="Year (e.g. 2nd Year)"
                  placeholderTextColor="gray"
                />
              </View>

              <View
                style={{ height: hp(6.5) }}
                className="flex-row items-center gap-3 bg-neutral-100 border-gray-300 border-2 rounded-lg px-4"
              >
                <Feather name="book-open" size={wf(1.3)} color="gray" />
                <TextInput
                  value={course}
                  onChangeText={setCourse}
                  style={{ fontSize: wf(1) }}
                  className="flex-1 text-neutral-800"
                  placeholder="Course"
                  placeholderTextColor="gray"
                />
              </View>

              <View
                style={{ height: hp(6.5) }}
                className="flex-row items-center gap-3 bg-neutral-100 border-gray-300 border-2 rounded-lg px-4"
              >
                <Feather name="link" size={wf(1.3)} color="gray" />
                <TextInput
                  value={profileUrl}
                  onChangeText={setProfileUrl}
                  style={{ fontSize: wf(1) }}
                  className="flex-1 text-neutral-800"
                  placeholder="Profile URL (optional)"
                  placeholderTextColor="gray"
                />
              </View>
            </View>

            <View className="flex-row gap-3 mt-5">
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                style={{ flex: 1, height: hp(6) }}
                className="items-center justify-center border-2 border-gray-300 rounded-xl"
              >
                <Text
                  style={{ fontSize: wf(1) }}
                  className="font-semibold text-gray-600"
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{ flex: 1, height: hp(6) }}
                className="items-center justify-center bg-sky-500 rounded-xl"
              >
                <Text
                  style={{ fontSize: wf(1), color: "white" }}
                  className="font-semibold"
                >
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
