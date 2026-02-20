import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTheme } from "@/hooks/useTheme";
import type { SetStatus, LastPerformanceSet } from "@/types";

interface SetInputFormProps {
  onAdd: (weight: number, reps: number, status: SetStatus, muscleFailure: boolean) => void;
  lastPerformance?: LastPerformanceSet | null;
}

const STATUSES: SetStatus[] = ["success", "partial", "fail"];

export function SetInputForm({ onAdd, lastPerformance }: SetInputFormProps) {
  const { colors } = useTheme();
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [status, setStatus] = useState<SetStatus>("success");
  const [muscleFailure, setMuscleFailure] = useState(false);

  useEffect(() => {
    if (lastPerformance) {
      setWeight(String(lastPerformance.weight));
      const repsVal = lastPerformance.reps;
      setReps(repsVal % 1 === 0 ? String(repsVal) : repsVal.toFixed(1));
    }
  }, [lastPerformance]);

  const handleAdd = () => {
    const w = parseFloat(weight);
    const r = parseFloat(reps);
    if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) return;

    onAdd(w, r, status, muscleFailure);
    setMuscleFailure(false);
  };

  const isValid =
    weight.trim() !== "" &&
    reps.trim() !== "" &&
    !isNaN(parseFloat(weight)) &&
    parseFloat(weight) > 0 &&
    !isNaN(parseFloat(reps)) &&
    parseFloat(reps) > 0;

  return (
    <View className="mt-3">
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Text className="text-xs text-textSecondary mb-1">Poids (kg)</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="0"
            className="h-input bg-fill rounded-2xl px-4 text-base text-textPrimary text-center font-medium"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-textSecondary mb-1">Reps</Text>
          <TextInput
            value={reps}
            onChangeText={setReps}
            keyboardType="decimal-pad"
            placeholder="0"
            className="h-input bg-fill rounded-2xl px-4 text-base text-textPrimary text-center font-medium"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row gap-2 items-center">
          {STATUSES.map((s) => (
            <StatusBadge
              key={s}
              status={s}
              selected={status === s}
              onPress={() => setStatus(s)}
            />
          ))}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMuscleFailure((v) => !v);
            }}
            className={`w-12 h-12 rounded-xl items-center justify-center border ${
              muscleFailure
                ? "bg-accent/15 border-accent"
                : "bg-fill border-transparent"
            }`}
          >
            <Text className="text-lg">💀</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleAdd();
          }}
          disabled={!isValid}
          className={`px-6 py-3 rounded-pill ${
            isValid ? "bg-accent active:opacity-80" : "bg-fill"
          }`}
        >
          <Text
            className={`font-semibold ${isValid ? "text-white" : "text-textTertiary"}`}
          >
            Ajouter
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
