import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { PeriodSelector } from "@/components/stats/PeriodSelector";
import { StatCard } from "@/components/stats/StatCard";
import { ProgressChart } from "@/components/stats/ProgressChart";
import { Container } from "@/components/ui/Container";
import {
  getSessionTypeStats,
  getTopExercises,
  getSessionTypeDurations,
  type StatPeriod,
  type SessionTypeStats,
  type TopExercise,
  type SessionDurationPoint,
  type ExerciseProgressPoint,
} from "@/db/queries/stats";
import { WORKOUT_TYPE_LABELS } from "@/lib/utils";
import type { WorkoutType } from "@/types";
import { useTranslation } from "react-i18next";

export default function SessionTypeStatsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const { type } = useLocalSearchParams<{ type: string }>();
  const [period, setPeriod] = useState<StatPeriod>("3M");
  const [stats, setStats] = useState<SessionTypeStats | null>(null);
  const [durations, setDurations] = useState<SessionDurationPoint[]>([]);
  const [topExercises, setTopExercises] = useState<TopExercise[]>([]);

  const loadData = useCallback(async () => {
    if (!type) return;
    try {
      const [data, dur, top] = await Promise.all([
        getSessionTypeStats(db, type as WorkoutType, period),
        getSessionTypeDurations(db, type as WorkoutType, period),
        getTopExercises(db, period, 5, type as WorkoutType),
      ]);
      setStats(data);
      setDurations(dur);
      setTopExercises(top);
    } catch (e) {
      console.log("[SessionTypeStats] loadData FAILED:", e);
    }
  }, [db, type, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatVolume = (vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}t`;
    return `${Math.round(vol)}kg`;
  };

  // Mapper les durées pour le ProgressChart
  const durationChartData: ExerciseProgressPoint[] = durations.map((d) => ({
    date: d.date,
    max_weight: d.duration_min,
    total_volume: 0,
    total_reps: 0,
    reps_at_max: 0,
  }));

  return (
    <Container>
      <View className="px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent text-base">{t("stats.back")}</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6">
        <Text className="text-2xl font-bold text-textPrimary mb-1">
          {WORKOUT_TYPE_LABELS[type ?? ""] ?? type}
        </Text>
        {stats && (
          <Text className="text-sm text-textTertiary mb-4">
            {t("statsSessionType.sessionsTotal", { count: stats.total_sessions })}
          </Text>
        )}

        <PeriodSelector value={period} onChange={setPeriod} />

        {stats && (
          <>
            <View className="flex-row gap-3 mb-3">
              <StatCard
                label={t("statsSessionType.sessions")}
                value={String(stats.total_sessions)}
              />
              <StatCard
                label={t("statsSessionType.volume")}
                value={formatVolume(stats.total_volume)}
              />
            </View>
            <View className="flex-row gap-3 mb-6">
              <StatCard
                label={t("statsSessionType.avgDuration")}
                value={String(stats.avg_duration_min)}
                unit="min"
              />
              <StatCard
                label={t("statsSessionType.frequency")}
                value={period === "1W"
                  ? `${stats.total_sessions}${t("statsSessionType.perWeek")}`
                  : period === "1M"
                  ? `${(stats.total_sessions / 4).toFixed(1)}${t("statsSessionType.perWeek")}`
                  : `${stats.total_sessions}`
                }
              />
            </View>
          </>
        )}

        {durationChartData.length > 1 && (
          <ProgressChart
            data={durationChartData}
            metric="max_weight"
            unit="min"
            label={t("statsSessionType.durationPerSession")}
          />
        )}

        {topExercises.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-textPrimary mb-3">
              {t("statsSessionType.frequentExercises")}
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
                        {t("statsSessionType.max")} {ex.max_weight}kg
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </Container>
  );
}
