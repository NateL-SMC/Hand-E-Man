import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, Chip } from "./ui";

export type EditField = {
  key: string;
  label: string;
  value: string;
  multiline?: boolean;
  numeric?: boolean;
  options?: string[]; // renders chips instead of a text box
};

// Generic bottom-sheet form: pass fields, get back { key: value } strings on save.
export default function EditModal({
  visible, title, fields, onSave, onClose, onDelete,
}: {
  visible: boolean;
  title: string;
  fields: EditField[];
  onSave: (values: Record<string, string>) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    if (visible) setVals(Object.fromEntries(fields.map((f) => [f.key, f.value])));
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl p-5 max-h-[85%]">
          <Text className="text-lg font-extrabold text-[#0F172A] mb-3">{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {fields.map((f) => (
              <View key={f.key} className="mb-3">
                <Text className="text-xs font-semibold text-[#475569] mb-1">{f.label}</Text>
                {f.options ? (
                  <View className="flex-row flex-wrap">
                    {f.options.map((o) => (
                      <View key={o} className="mb-2">
                        <Chip label={o} active={vals[f.key] === o} onPress={() => setVals((v) => ({ ...v, [f.key]: o }))} />
                      </View>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    value={vals[f.key] ?? ""}
                    onChangeText={(t) => setVals((v) => ({ ...v, [f.key]: t }))}
                    multiline={f.multiline}
                    keyboardType={f.numeric ? "numeric" : "default"}
                    className={`border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] ${f.multiline ? "h-24" : ""}`}
                    style={f.multiline ? { textAlignVertical: "top" } : undefined}
                  />
                )}
              </View>
            ))}
          </ScrollView>

          {onDelete && (
            <Pressable onPress={onDelete} className="py-2 items-center">
              <Text className="text-red-500 font-semibold text-sm">Delete</Text>
            </Pressable>
          )}
          <View className="flex-row mt-2">
            <View className="flex-1 mr-2"><Button title="Cancel" variant="dark" onPress={onClose} /></View>
            <View className="flex-1 ml-2"><Button title="Save" onPress={() => onSave(vals)} /></View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
