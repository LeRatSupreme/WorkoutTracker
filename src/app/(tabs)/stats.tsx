import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { PeriodSelector } from "@/components/stats/PeriodSelector";
import { StatCard } from "@/components/stats/StatCard";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import {
  getOverviewStats,
  getTopExercises,
  getInsights,
  type StatPeriod,
  type OverviewStats,
  type TopExercise,
  type Insight,
} from "@/db/queries/stats";
import { WORKOUT_TYPE_LABELS } from "@/lib/utils";
import type { WorkoutType } from "@/types";

const SESSION_TYPES: WorkoutType[] = ["push", "pull", "legs", "custom"];

export default function StatsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [period, setPeriod] = useState<StatPeriod>("1M");
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [topExercises, setTopExercises] = useState<TopExercise[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const [ov, top, ins] = await Promise.all([
        getOverviewStats(db, period),
        getTopExercises(db, period),
        getInsights(db, period),
      ]);
      setOverview(ov);
      setTopExercises(top);
      setInsights(ins);
    } catch (e) {
      console.log("[Stats] loadStats error:", e);
    }
  }, [db, period]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatVolume = (vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}t`;
    return `${Math.round(vol)}kg`;
  };

  return (
    <Container>
      <ScrollView className="flex-1 px-6 pt-8">
        <Text className="text-2xl font-bold text-textPrimary mb-4">
          Statistiques
        </Text>

        <PeriodSelector value={period} onChange={setPeriod} />

        {insights.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-semibold text-textPrimary mb-3">
              Insights
            </Text>
            <View className="bg-card rounded-xl border border-cardBorder overflow-hidden">
              {insights.map((ins, i) => (
                <View
                  key={`${ins.exercise_name}-${ins.type}`}
                  className={`px-4 py-3 ${i > 0 ? "border-t border-cardBorder" : ""}`}
                >
                  <Text className="text-sm font-medium text-textPrimary">
                    {ins.type === "progression" ? "📈" : ins.type === "record" ? "🏆" : "⚠️"}{" "}
                    {ins.exercise_name}
                  </Text>
                  <Text className="text-xs text-textSecondary mt-0.5">
                    {ins.message}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {overview && (
          <>
            <View className="flex-row gap-3 mb-3">
              <StatCard
                label="Séances"
                value={String(overview.total_sessions)}
              />
              <StatCard
                label="Volume total"
                value={formatVolume(overview.total_volume)}
              />
            </View>
            <View className="flex-row gap-3 mb-6">
              <StatCard
                label="Durée moy."
                value={String(overview.avg_duration_min)}
                unit="min"
              />
              <StatCard
                label="Séries"
                value={String(overview.total_sets)}
              />
            </View>
          </>
        )}

        {/* Par type de séance */}
        <Text className="text-lg font-semibold text-textPrimary mb-3">
          Par type
        </Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {SESSION_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => router.push(`/stats/session-type/${type}`)}
              className="bg-card rounded-xl p-4 border border-cardBorder active:opacity-80"
              style={{ width: "47%" }}
            >
              <Text className="text-base font-semibold text-textPrimary">
                {WORKOUT_TYPE_LABELS[type]}
              </Text>
              <Text className="text-xs text-textTertiary mt-0.5">
                Voir les stats →
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Top exercices */}
        {topExercises.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-textPrimary mb-3">
              Exercices les plus fréquents
            </Text>
            {topExercises.map((ex, i) => (
              <Pressable
                key={ex.exercise_id}
                onPress={() => router.push(`/stats/exercise/${ex.exercise_id}`)}
                className="bg-card rounded-xl p-4 mb-2 border border-cardBorder active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-sm text-textTertiary w-8">
                      #{i + 1}
                    </Text>
                    <Text className="text-base text-textPrimary flex-1">
                      {ex.exercise_name}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm text-textSecondary">
                      {ex.usage_count}x
                    </Text>
                    {ex.max_weight > 0 && (
                      <Text className="text-xs text-textTertiary">
                        Max: {ex.max_weight}kg{" "}
                        {ex.prev_max_weight > 0 && ex.max_weight > ex.prev_max_weight
                          ? "↗"
                          : ex.prev_max_weight > 0 && ex.max_weight < ex.prev_max_weight
                          ? "↘"
                          : ex.prev_max_weight > 0
                          ? "→"
                          : ""}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </>
        )}

        <View className="h-28" />
      </ScrollView>
    </Container>
  );
}
