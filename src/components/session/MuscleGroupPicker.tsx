import { useState } from "react";
import { View, Text, Modal, Pressable, Switch } from "react-native";
import { MUSCLE_GROUPS } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { MuscleGroup } from "@/types";

interface MuscleGroupPickerProps {
  visible: boolean;
  defaultValue?: MuscleGroup | null;
  exerciseName: string;
  onConfirm: (muscleGroup: MuscleGroup, isCable: boolean) => void;
  onCancel: () => void;
}

export function MuscleGroupPicker({
  visible,
  defaultValue,
  exerciseName,
  onConfirm,
  onCancel,
}: MuscleGroupPickerProps) {
  const [selected, setSelected] = useState<MuscleGroup | null>(defaultValue ?? null);
  const [isCable, setIsCable] = useState(false);

  const handleConfirm = () => {
    if (selected) onConfirm(selected, isCable);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end">
        <Pressable className="flex-1" onPress={onCancel} />
        <View className="bg-card rounded-t-3xl px-6 pt-6 pb-10 shadow-lg">
          <Text className="text-xl font-bold text-textPrimary mb-1">
            Groupe musculaire
          </Text>
          <Text className="text-sm text-textSecondary mb-5">
            Pour "{exerciseName}"
          </Text>

          <View className="flex-row flex-wrap gap-3 mb-6">
            {MUSCLE_GROUPS.map((mg) => (
              <Pressable
                key={mg.value}
                onPress={() => setSelected(mg.value)}
                className={`px-5 py-3 rounded-xl ${
                  selected === mg.value
                    ? "bg-accent"
                    : "bg-fill"
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    selected === mg.value ? "text-white" : "text-textPrimary"
                  }`}
                >
                  {mg.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center justify-between mb-4 bg-fill rounded-xl px-4 py-3">
            <Text className="text-base text-textPrimary">Exercice a poulie</Text>
            <Switch value={isCable} onValueChange={setIsCable} />
          </View>

          <View className="gap-3">
            <Button
              title="Confirmer"
              onPress={handleConfirm}
              disabled={!selected}
              fullWidth
            />
            <Button
              title="Annuler"
              variant="secondary"
              onPress={onCancel}
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
