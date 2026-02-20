import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { SetRow } from "@/components/session/SetRow";
import { SetInputForm } from "@/components/session/SetInputForm";
import { LastPerformanceCard } from "@/components/session/LastPerformanceCard";
import { useLastPerformance } from "@/hooks/useLastPerformance";
import { useTheme } from "@/hooks/useTheme";
import type { ActiveExercise } from "@/store/session-store";
import type { SetStatus } from "@/types";

interface ActiveExerciseCardProps {
  exercise: ActiveExercise;
  onAddSet: (weight: number, reps: number, status: SetStatus, muscleFailure: boolean) => void;
  onRemoveSet: (setId: string) => void;
  onCommentChange: (comment: string | null) => void;
  onWeightFactorChange?: (logId: string, factor: number) => void;
}

export function ActiveExerciseCard({
  exercise,
  onAddSet,
  onRemoveSet,
  onCommentChange,
  onWeightFactorChange,
}: ActiveExerciseCardProps) {
  const { colors } = useTheme();
  const { sets: lastPerf } = useLastPerformance(exercise.exercise.id);
  const lastSet = lastPerf.length > 0 ? lastPerf[0] : null;
  const [showComment, setShowComment] = useState(!!exercise.comment);

  return (
    <View>
      <LastPerformanceCard sets={lastPerf} />

      <Card>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-textPrimary flex-1 mr-2">
            {exercise.exercise.name}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setShowComment((v) => !v)}
              className={`p-1 rounded-lg ${showComment ? "bg-accent/15" : ""}`}
            >
              <Text className="text-lg">💬</Text>
            </Pressable>
          </View>
        </View>

        {!!exercise.exercise.is_cable && (
          <View style={[cableStyles.container, { backgroundColor: colors.fill }]}>
            <Pressable
              onPress={() => onWeightFactorChange?.(exercise.logId, 1.0)}
              style={[cableStyles.segment, exercise.weight_factor !== 2.0 && [cableStyles.segmentActive, { backgroundColor: colors.card }]]}
            >
              <Text style={[cableStyles.label, { color: colors.textSecondary }, exercise.weight_factor !== 2.0 && { color: colors.textPrimary }]}>
                Ancienne
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onWeightFactorChange?.(exercise.logId, 2.0)}
              style={[cableStyles.segment, exercise.weight_factor === 2.0 && [cableStyles.segmentActive, { backgroundColor: colors.card }]]}
            >
              <Text style={[cableStyles.label, { color: colors.textSecondary }, exercise.weight_factor === 2.0 && { color: colors.textPrimary }]}>
                Nouvelle
              </Text>
            </Pressable>
          </View>
        )}

        {showComment && (
          <TextInput
            value={exercise.comment ?? ""}
            onChangeText={(text) => onCommentChange(text || null)}
            placeholder="Note sur cet exercice..."
            multiline
            className="bg-fill rounded-xl px-4 py-2.5 text-sm text-textPrimary mb-3 border border-separator"
            placeholderTextColor={colors.textTertiary}
          />
        )}

        {exercise.sets.length > 0 && (
          <View className="mb-3">
            {exercise.sets.map((set, index) => (
              <SetRow
                key={set.id}
                set={set}
                index={index}
                onRemove={() => onRemoveSet(set.id)}
              />
            ))}
          </View>
        )}

        <SetInputForm onAdd={onAddSet} lastPerformance={lastSet} />
      </Card>
    </View>
  );
}

const cableStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 2,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
});
