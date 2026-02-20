import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUS_EMOJI, formatReps } from "@/lib/utils";
import type { ExerciseLogWithDetails, SetStatus } from "@/types";

interface RecapExerciseCardProps {
  log: ExerciseLogWithDetails;
  editable?: boolean;
  onUpdateSet?: (setId: string, weight: number, reps: number, status: SetStatus) => void;
}

const STATUSES: SetStatus[] = ["success", "partial", "fail"];

export function RecapExerciseCard({ log, editable = false, onUpdateSet }: RecapExerciseCardProps) {
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editStatus, setEditStatus] = useState<SetStatus>("success");

  const wf = log.weight_factor ?? 1.0;
  const totalVolume = log.sets.reduce((acc, s) => acc + s.weight * wf * s.reps, 0);
  const maxWeight = log.sets.length > 0 ? Math.max(...log.sets.map((s) => s.weight * wf)) : 0;

  const startEdit = (set: typeof log.sets[0]) => {
    setEditingSetId(set.id);
    setEditWeight(String(set.weight));
    setEditReps(set.reps % 1 === 0 ? String(set.reps) : set.reps.toFixed(1));
    setEditStatus(set.status);
  };

  const saveEdit = () => {
    if (!editingSetId || !onUpdateSet) return;
    const w = parseFloat(editWeight);
    const r = parseFloat(editReps);
    if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) return;
    onUpdateSet(editingSetId, w, r, editStatus);
    setEditingSetId(null);
  };

  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-textPrimary">
          {log.exercise_name}
        </Text>
        <Text className="text-sm text-textTertiary">
          {log.sets.length} série{log.sets.length > 1 ? "s" : ""}
        </Text>
      </View>

      {log.comment && (
        <Text className="text-sm text-textSecondary italic mb-2">
          💬 {log.comment}
        </Text>
      )}

      {log.sets.map((set) => (
        editingSetId === set.id ? (
          <View key={set.id} className="py-2 border-b border-separator">
            <View className="flex-row gap-2 mb-2">
              <TextInput
                value={editWeight}
                onChangeText={setEditWeight}
                keyboardType="decimal-pad"
                className="flex-1 bg-fill rounded-lg px-3 py-2 text-sm text-center"
                placeholder="Poids"
              />
              <TextInput
                value={editReps}
                onChangeText={setEditReps}
                keyboardType="decimal-pad"
                className="flex-1 bg-fill rounded-lg px-3 py-2 text-sm text-center"
                placeholder="Reps"
              />
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row gap-1">
                {STATUSES.map((s) => (
                  <StatusBadge
                    key={s}
                    status={s}
                    selected={editStatus === s}
                    onPress={() => setEditStatus(s)}
                    size="sm"
                  />
                ))}
              </View>
              <View className="flex-row gap-2">
                <Pressable onPress={() => setEditingSetId(null)} className="px-3 py-1.5">
                  <Text className="text-sm text-textSecondary">Annuler</Text>
                </Pressable>
                <Pressable onPress={saveEdit} className="bg-accent px-3 py-1.5 rounded-lg">
                  <Text className="text-sm text-white font-medium">OK</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            key={set.id}
            onPress={editable ? () => startEdit(set) : undefined}
            className="flex-row items-center py-1"
          >
            <Text className="text-sm text-textTertiary w-8">S{set.order}</Text>
            <Text className="text-sm text-textPrimary flex-1">
              {set.weight * wf}kg × {formatReps(set.reps)}
            </Text>
            {set.muscle_failure && <Text className="mr-1">💀</Text>}
            <Text>{STATUS_EMOJI[set.status]}</Text>
          </Pressable>
        )
      ))}

      <View className="flex-row mt-2 pt-2 border-t border-separator">
        <Text className="text-xs text-textTertiary flex-1">
          Volume: {Math.round(totalVolume)}kg
        </Text>
        <Text className="text-xs text-textTertiary">Max: {maxWeight}kg</Text>
      </View>
    </Card>
  );
}
