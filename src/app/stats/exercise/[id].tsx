import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { PeriodSelector } from "@/components/stats/PeriodSelector";
import { StatCard } from "@/components/stats/StatCard";
import { ProgressChart } from "@/components/stats/ProgressChart";
import { Container } from "@/components/ui/Container";
import {
  getExerciseProgress,
  getExerciseHistory,
  type StatPeriod,
  type ExerciseProgressPoint,
  type ExerciseHistorySession,
} from "@/db/queries/stats";
import { formatDate, formatReps, STATUS_EMOJI, WORKOUT_TYPE_LABELS } from "@/lib/utils";
import type { Exercise } from "@/types";

export default function ExerciseStatsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [period, setPeriod] = useState<StatPeriod>("3M");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [progress, setProgress] = useState<ExerciseProgressPoint[]>([]);
  const [history, setHistory] = useState<ExerciseHistorySession[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      const ex = await db.getFirstAsync<Exercise>(
        "SELECT * FROM exercises WHERE id = ?",
        [id]
      );
      setExercise(ex);

      const [data, hist] = await Promise.all([
        getExerciseProgress(db, id, period),
        getExerciseHistory(db, id, period),
      ]);
      setProgress(data);
      setHistory(hist);
    } catch (e) {
      console.log("[ExerciseStats] loadData FAILED:", e);
    }
  }, [db, id, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const lastPoint = progress.length > 0 ? progress[progress.length - 1] : null;
  const firstPoint = progress.length > 0 ? progress[0] : null;
  const weightChange = lastPoint && firstPoint
    ? lastPoint.max_weight - firstPoint.max_weight
    : 0;

  // 1RM estimé (Epley: weight * (1 + reps/30))
  const oneRM = lastPoint
    ? Math.round(lastPoint.max_weight * (1 + lastPoint.reps_at_max / 30))
    : 0;

  // Moyenne des reps au max
  const avgReps = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.reps_at_max, 0) / progress.length * 10) / 10
    : 0;

  return (
    <Container>
      <View className="px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent text-base">← Retour</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6">
        <Text className="text-2xl font-bold text-textPrimary mb-1">
          {exercise?.name ?? "Exercice"}
        </Text>
        <Text className="text-sm text-textTertiary mb-4">
          {progress.length} séance{progress.length > 1 ? "s" : ""}
        </Text>

        <PeriodSelector value={period} onChange={setPeriod} />

        <View className="flex-row gap-3 mb-3">
          <StatCard
            label="Max actuel"
            value={lastPoint ? String(lastPoint.max_weight) : "—"}
            unit="kg"
          />
          <StatCard
            label="Progression"
            value={weightChange > 0 ? `+${weightChange}` : String(weightChange)}
            unit="kg"
          />
        </View>

        <View className="flex-row gap-3 mb-4">
          <StatCard
            label="1RM estimé"
            value={oneRM > 0 ? String(oneRM) : "—"}
            unit="kg"
          />
          <StatCard
            label="Moy. reps"
            value={avgReps > 0 ? String(avgReps) : "—"}
          />
        </View>

        <ProgressChart
          data={progress}
          metric="max_weight"
          label="Poids max par séance"
        />

        <ProgressChart
          data={progress}
          metric="reps_at_max"
          label="Meilleures reps"
        />

        {history.length > 0 && (
          <View className="mt-2">
            <Text className="text-lg font-semibold text-textPrimary mb-3">
              Historique des séries
            </Text>
            {history.map((session) => (
              <View
                key={session.session_id}
                className="bg-card rounded-xl border border-cardBorder p-4 mb-3"
              >
                <Text className="text-sm font-medium text-textPrimary mb-2">
                  {formatDate(session.date)} ({session.session_label || WORKOUT_TYPE_LABELS[session.session_type] || session.session_type})
                </Text>
                {session.sets.map((s, i) => (
                  <Text key={i} className="text-sm text-textSecondary ml-2 mb-0.5">
                    {s.weight}kg x {formatReps(s.reps)} {STATUS_EMOJI[s.status as keyof typeof STATUS_EMOJI]}{s.muscle_failure ? " 💀" : ""}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </Container>
  );
}
