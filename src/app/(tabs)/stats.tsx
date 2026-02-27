import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { PeriodSelector } from "@/components/stats/PeriodSelector";
import { StatCard } from "@/components/stats/StatCard";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { useTheme } from "@/hooks/useTheme";
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
import { useTranslation } from "react-i18next";

const SESSION_TYPES: WorkoutType[] = ["push", "pull", "legs", "custom"];

const SESSION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  push: "fitness",
  pull: "body",
  legs: "walk",
  custom: "barbell",
};

const INSIGHT_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  progression: { icon: "trending-up", color: "#30D158" },
  record: { icon: "trophy", color: "#FFD60A" },
  warning: { icon: "alert-circle", color: "#FF9F0A" },
};

export default function StatsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [period, setPeriod] = useState<StatPeriod>("1M");
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [topExercises, setTopExercises] = useState<TopExercise[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const { t } = useTranslation();

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
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }}
      >
        {/* ─── Header ─── */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text className="text-3xl font-bold text-textPrimary mb-1">
            {t("stats.title")}
          </Text>
          <Text className="text-sm text-textSecondary mb-5">
            {t("stats.subtitle")}
          </Text>
        </Animated.View>

        <PeriodSelector value={period} onChange={setPeriod} />

        {/* ─── Insights ─── */}
        {insights.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(150)}
            className="mb-5"
          >
            <Card variant="glow">
              {insights.map((ins, i) => {
                const cfg = INSIGHT_ICONS[ins.type] || INSIGHT_ICONS.progression;
                return (
                  <View
                    key={`${ins.exercise_name}-${ins.type}`}
                    className={`flex-row items-start ${i > 0 ? "mt-3 pt-3 border-t border-separator" : ""}`}
                  >
                    <View
                      style={[
                        styles.insightIcon,
                        { backgroundColor: cfg.color + "18" },
                      ]}
                    >
                      <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-sm font-semibold text-textPrimary">
                        {ins.exercise_name}
                      </Text>
                      <Text className="text-xs text-textSecondary mt-0.5">
                        {ins.message}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </Animated.View>
        )}

        {/* ─── Overview Stats ─── */}
        {overview && (
          <>
            <View className="flex-row gap-3 mb-3">
              <StatCard
                label={t("stats.sessions")}
                value={String(overview.total_sessions)}
                icon="calendar"
                delay={200}
              />
              <StatCard
                label={t("stats.totalVolume")}
                value={formatVolume(overview.total_volume)}
                icon="barbell"
                delay={260}
              />
            </View>
            <View className="flex-row gap-3 mb-6">
              <StatCard
                label={t("stats.avgDuration")}
                value={String(overview.avg_duration_min)}
                unit="min"
                icon="time"
                delay={320}
              />
              <StatCard
                label={t("stats.sets")}
                value={String(overview.total_sets)}
                icon="layers"
                delay={380}
              />
            </View>
          </>
        )}

        {/* ─── Par type ─── */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <Text className="text-xs font-bold text-textTertiary tracking-widest uppercase mb-3">
            {t("stats.byType")}
          </Text>
        </Animated.View>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {SESSION_TYPES.map((type, i) => {
            const icon = SESSION_ICONS[type] || "barbell";
            return (
              <Animated.View
                key={type}
                entering={FadeInDown.duration(400).delay(450 + i * 50)}
                style={{ width: "47%" }}
              >
                <Pressable
                  onPress={() =>
                    router.push(`/stats/session-type/${type}`)
                  }
                >
                  <Card variant="elevated" className="min-h-[90px]">
                    <View
                      style={[
                        styles.typeIcon,
                        { backgroundColor: colors.accent + "12" },
                      ]}
                    >
                      <Ionicons
                        name={icon}
                        size={18}
                        color={colors.accent}
                      />
                    </View>
                    <Text className="text-base font-bold text-textPrimary mt-2">
                      {WORKOUT_TYPE_LABELS[type]}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs text-textTertiary">
                        {t("stats.viewStats")}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={12}
                        color={colors.textTertiary}
                        style={{ marginLeft: 2 }}
                      />
                    </View>
                  </Card>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* ─── Top exercices ─── */}
        {topExercises.length > 0 && (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(600)}>
              <Text className="text-xs font-bold text-textTertiary tracking-widest uppercase mb-3">
                {t("stats.topExercises")}
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(400).delay(650)}>
              <Card variant="elevated">
                {topExercises.map((ex, i) => {
                  const trend =
                    ex.max_weight > 0 && ex.prev_max_weight > 0
                      ? ex.max_weight > ex.prev_max_weight
                        ? "up"
                        : ex.max_weight < ex.prev_max_weight
                          ? "down"
                          : "same"
                      : null;

                  const trendColor =
                    trend === "up"
                      ? colors.success
                      : trend === "down"
                        ? colors.destructive
                        : colors.textTertiary;

                  const trendIcon =
                    trend === "up"
                      ? "trending-up"
                      : trend === "down"
                        ? "trending-down"
                        : "remove";

                  return (
                    <Pressable
                      key={ex.exercise_id}
                      onPress={() =>
                        router.push(`/stats/exercise/${ex.exercise_id}`)
                      }
                      className={`flex-row items-center py-3 active:opacity-70 ${i > 0 ? "border-t border-separator" : ""
                        }`}
                    >
                      {/* Rank */}
                      <View
                        style={[
                          styles.rankBadge,
                          {
                            backgroundColor:
                              i === 0
                                ? "#FFD60A20"
                                : i === 1
                                  ? "#C0C0C020"
                                  : i === 2
                                    ? "#CD7F3220"
                                    : colors.fill,
                          },
                        ]}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{
                            color:
                              i === 0
                                ? "#FFD60A"
                                : i === 1
                                  ? "#A0A0A0"
                                  : i === 2
                                    ? "#CD7F32"
                                    : colors.textTertiary,
                          }}
                        >
                          {i + 1}
                        </Text>
                      </View>

                      {/* Name */}
                      <View className="flex-1 ml-3">
                        <Text className="text-sm font-semibold text-textPrimary">
                          {ex.exercise_name}
                        </Text>
                        <Text className="text-xs text-textTertiary">
                          {t("stats.sessionsCount", { count: ex.usage_count })}
                        </Text>
                      </View>

                      {/* Weight + Trend */}
                      {ex.max_weight > 0 && (
                        <View className="flex-row items-center">
                          <Text className="text-sm font-semibold text-textSecondary mr-1.5">
                            {ex.max_weight}kg
                          </Text>
                          {trend && (
                            <Ionicons
                              name={trendIcon as any}
                              size={16}
                              color={trendColor}
                            />
                          )}
                        </View>
                      )}

                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={colors.textTertiary}
                        style={{ marginLeft: 8 }}
                      />
                    </Pressable>
                  );
                })}
              </Card>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
