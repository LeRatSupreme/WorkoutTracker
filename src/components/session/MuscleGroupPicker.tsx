import { useState } from "react";
import { View, Text, Modal, Pressable, Switch } from "react-native";
import { useTranslation } from "react-i18next";
import { getMuscleGroups } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { MuscleGroup } from "@/types";

const MUSCLE_GROUP_I18N_KEYS: Record<MuscleGroup, string> = {
  pecs: "chest",
  triceps: "triceps",
  epaules: "shoulders",
  dos: "back",
  biceps: "biceps",
  jambes: "legs",
};

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
  const { t } = useTranslation();
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
            {t("exercise.muscleGroupTitle")}
          </Text>
          <Text className="text-sm text-textSecondary mb-5">
            {t("exercise.muscleGroupSubtitle", { name: exerciseName })}
          </Text>

          <View className="flex-row flex-wrap gap-3 mb-6">
            {getMuscleGroups().map((mg) => (
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
                  {t(`muscleGroups.${MUSCLE_GROUP_I18N_KEYS[mg.value]}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center justify-between mb-4 bg-fill rounded-xl px-4 py-3">
            <Text className="text-base text-textPrimary">{t("exercise.cableExercise")}</Text>
            <Switch value={isCable} onValueChange={setIsCable} />
          </View>

          <View className="gap-3">
            <Button
              title={t("exercise.confirm")}
              onPress={handleConfirm}
              disabled={!selected}
              fullWidth
            />
            <Button
              title={t("common.cancel")}
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
