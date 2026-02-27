import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  getComparableSessions,
  getSessionForComparison,
  type ComparisonSession,
} from "@/db/queries/stats";
import { formatDate, WORKOUT_TYPE_LABELS } from "@/lib/utils";
import type { WorkoutType } from "@/types";

const SESSION_TYPES: WorkoutType[] = ["push", "pull", "legs", "custom"];

export default function CompareScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [selectedType, setSelectedType] = useState<WorkoutType>("push");
  const [availableSessions, setAvailableSessions] = useState<
    { id: string; date: string; label: string | null }[]
  >([]);
  const [sessionA, setSessionA] = useState<ComparisonSession | null>(null);
  const [sessionB, setSessionB] = useState<ComparisonSession | null>(null);
  const [pickingSlot, setPickingSlot] = useState<"A" | "B" | null>(null);

  const loadSessions = useCallback(async () => {
    const list = await getComparableSessions(db, selectedType, 30);
    setAvailableSessions(list);
    setSessionA(null);
    setSessionB(null);
    setPickingSlot(null);
  }, [db, selectedType]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const selectSession = useCallback(
    async (id: string) => {
      const data = await getSessionForComparison(db, id);
      if (!data) return;
      if (pickingSlot === "A") {
        setSessionA(data);
      } else {
        setSessionB(data);
      }
      setPickingSlot(null);
    },
    [db, pickingSlot]
  );

  const formatVolume = (vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}t`;
    return `${Math.round(vol)}kg`;
  };

  const renderDelta = (a: number, b: number, unit: string = "") => {
    const diff = b - a;
    if (diff === 0) return null;
    const color = diff > 0 ? colors.success : colors.destructive;
    const sign = diff > 0 ? "+" : "";
    return (
      <Text className="text-xs font-semibold" style={{ color }}>
        {sign}
        {unit === "t" || unit === "kg" ? formatVolume(diff) : diff}
        {unit && unit !== "t" && unit !== "kg" ? unit : ""}
      </Text>
    );
  };

  return (
    <Container>
      <View className="px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
          <Text className="text-base ml-0.5" style={{ color: colors.accent }}>
            {t("stats.back")}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text className="text-2xl font-bold text-textPrimary mb-1">
            {t("stats.comparison")}
          </Text>
          <Text className="text-sm text-textTertiary mb-4">
            {t("stats.comparisonSubtitle")}
          </Text>
        </Animated.View>

        {/* Type selector */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {SESSION_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      selectedType === type ? colors.accent + "20" : colors.fill,
                    borderWidth: selectedType === type ? 1 : 0,
                    borderColor:
                      selectedType === type ? colors.accent : "transparent",
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{
                      color:
                        selectedType === type
                          ? colors.accent
                          : colors.textSecondary,
                    }}
                  >
                    {WORKOUT_TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Session Pickers */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <View className="flex-row gap-3 mb-4">
            {/* Slot A */}
            <Pressable
              className="flex-1"
              onPress={() => setPickingSlot(pickingSlot === "A" ? null : "A")}
            >
              <Card
                variant={sessionA ? "elevated" : "default"}
                className="min-h-[70px] justify-center"
              >
                {sessionA ? (
                  <>
                    <Text className="text-xs text-textTertiary">
                      {t("stats.sessionA")}
                    </Text>
                    <Text
                      className="text-sm font-semibold text-textPrimary mt-0.5"
                      numberOfLines={1}
                    >
                      {sessionA.label || WORKOUT_TYPE_LABELS[sessionA.type as WorkoutType]}
                    </Text>
                    <Text className="text-xs text-textTertiary">
                      {formatDate(sessionA.started_at)}
                    </Text>
                  </>
                ) : (
                  <View className="items-center">
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={
                        pickingSlot === "A" ? colors.accent : colors.textTertiary
                      }
                    />
                    <Text
                      className="text-xs mt-1"
                      style={{
                        color:
                          pickingSlot === "A"
                            ? colors.accent
                            : colors.textTertiary,
                      }}
                    >
                      {t("stats.sessionA")}
                    </Text>
                  </View>
                )}
              </Card>
            </Pressable>

            {/* VS */}
            <View className="justify-center">
              <Text className="text-base font-bold text-textTertiary">VS</Text>
            </View>

            {/* Slot B */}
            <Pressable
              className="flex-1"
              onPress={() => setPickingSlot(pickingSlot === "B" ? null : "B")}
            >
              <Card
                variant={sessionB ? "elevated" : "default"}
                className="min-h-[70px] justify-center"
              >
                {sessionB ? (
                  <>
                    <Text className="text-xs text-textTertiary">
                      {t("stats.sessionB")}
                    </Text>
                    <Text
                      className="text-sm font-semibold text-textPrimary mt-0.5"
                      numberOfLines={1}
                    >
                      {sessionB.label || WORKOUT_TYPE_LABELS[sessionB.type as WorkoutType]}
                    </Text>
                    <Text className="text-xs text-textTertiary">
                      {formatDate(sessionB.started_at)}
                    </Text>
                  </>
                ) : (
                  <View className="items-center">
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={
                        pickingSlot === "B" ? colors.accent : colors.textTertiary
                      }
                    />
                    <Text
                      className="text-xs mt-1"
                      style={{
                        color:
                          pickingSlot === "B"
                            ? colors.accent
                            : colors.textTertiary,
                      }}
                    >
                      {t("stats.sessionB")}
                    </Text>
                  </View>
                )}
              </Card>
            </Pressable>
          </View>
        </Animated.View>

        {/* Session picker dropdown */}
        {pickingSlot && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card variant="elevated" className="mb-4">
              <Text className="text-xs font-bold text-textTertiary tracking-widest uppercase mb-2">
                {t("stats.chooseSession")}
              </Text>
              {availableSessions.length === 0 ? (
                <Text className="text-sm text-textTertiary py-4 text-center">
                  {t("stats.noSessionsForType")}
                </Text>
              ) : (
                availableSessions.map((s, i) => {
                  const isSelected =
                    (pickingSlot === "A" && sessionA?.id === s.id) ||
                    (pickingSlot === "B" && sessionB?.id === s.id);
                  const isUsedByOther =
                    (pickingSlot === "A" && sessionB?.id === s.id) ||
                    (pickingSlot === "B" && sessionA?.id === s.id);
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => !isUsedByOther && selectSession(s.id)}
                      className={`flex-row items-center py-2.5 ${
                        i > 0 ? "border-t border-separator" : ""
                      }`}
                      style={{ opacity: isUsedByOther ? 0.4 : 1 }}
                    >
                      <Ionicons
                        name={isSelected ? "radio-button-on" : "radio-button-off"}
                        size={18}
                        color={isSelected ? colors.accent : colors.textTertiary}
                      />
                      <View className="flex-1 ml-2">
                        <Text className="text-sm font-medium text-textPrimary">
                          {s.label ||
                            WORKOUT_TYPE_LABELS[selectedType]}
                        </Text>
                        <Text className="text-xs text-textTertiary">
                          {formatDate(s.date)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </Card>
          </Animated.View>
        )}

        {/* Comparison Results */}
        {sessionA && sessionB && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            {/* Overall stats */}
            <Text className="text-xs font-bold text-textTertiary tracking-widest uppercase mb-3">
              {t("stats.overallComparison")}
            </Text>

            <Card variant="elevated" className="mb-4">
              {[
                {
                  label: t("stats.totalVolume"),
                  a: formatVolume(sessionA.total_volume),
                  b: formatVolume(sessionB.total_volume),
                  delta: renderDelta(sessionA.total_volume, sessionB.total_volume, "kg"),
                },
                {
                  label: t("stats.sets"),
                  a: String(sessionA.total_sets),
                  b: String(sessionB.total_sets),
                  delta: renderDelta(sessionA.total_sets, sessionB.total_sets),
                },
                {
                  label: t("stats.avgDuration"),
                  a: `${sessionA.duration_min}min`,
                  b: `${sessionB.duration_min}min`,
                  delta: renderDelta(
                    sessionA.duration_min,
                    sessionB.duration_min,
                    "min"
                  ),
                },
                {
                  label: t("stats.totalReps"),
                  a: String(sessionA.total_reps),
                  b: String(sessionB.total_reps),
                  delta: renderDelta(sessionA.total_reps, sessionB.total_reps),
                },
              ].map((row, i) => (
                <View
                  key={row.label}
                  className={`flex-row items-center py-2.5 ${
                    i > 0 ? "border-t border-separator" : ""
                  }`}
                >
                  <Text className="flex-1 text-sm text-textSecondary">
                    {row.label}
                  </Text>
                  <Text className="text-sm font-semibold text-textPrimary w-16 text-right">
                    {row.a}
                  </Text>
                  <View className="w-12 items-center">{row.delta}</View>
                  <Text className="text-sm font-semibold text-textPrimary w-16 text-right">
                    {row.b}
                  </Text>
                </View>
              ))}
            </Card>

            {/* Per-exercise comparison */}
            <Text className="text-xs font-bold text-textTertiary tracking-widest uppercase mb-3">
              {t("stats.exerciseBreakdown")}
            </Text>

            {sessionB.exercises.map((exB, i) => {
              const exA = sessionA.exercises.find(
                (e) => e.name === exB.name
              );
              return (
                <Animated.View
                  key={exB.name}
                  entering={FadeInDown.duration(300).delay(250 + i * 30)}
                >
                  <Card variant="default" className="mb-2">
                    <Text className="text-sm font-semibold text-textPrimary mb-2">
                      {exB.name}
                    </Text>
                    <View className="flex-row justify-between">
                      <View className="items-center flex-1">
                        <Text className="text-xs text-textTertiary mb-0.5">
                          {t("stats.sessionA")}
                        </Text>
                        <Text className="text-sm font-semibold text-textPrimary">
                          {exA ? formatVolume(exA.volume) : "—"}
                        </Text>
                        <Text className="text-[10px] text-textTertiary">
                          {exA ? `${exA.sets}×${exA.max_weight}kg` : "—"}
                        </Text>
                      </View>

                      <View className="items-center justify-center">
                        {exA
                          ? renderDelta(exA.volume, exB.volume, "kg")
                          : (
                            <Text className="text-xs font-semibold" style={{ color: colors.success }}>
                              {t("stats.newExercise")}
                            </Text>
                          )}
                      </View>

                      <View className="items-center flex-1">
                        <Text className="text-xs text-textTertiary mb-0.5">
                          {t("stats.sessionB")}
                        </Text>
                        <Text className="text-sm font-semibold text-textPrimary">
                          {formatVolume(exB.volume)}
                        </Text>
                        <Text className="text-[10px] text-textTertiary">
                          {exB.sets}×{exB.max_weight}kg
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* Empty state */}
        {(!sessionA || !sessionB) && !pickingSlot && (
          <View className="items-center py-10">
            <Ionicons
              name="git-compare-outline"
              size={40}
              color={colors.textTertiary}
            />
            <Text className="text-sm text-textTertiary mt-3 text-center">
              {t("stats.compareHint")}
            </Text>
          </View>
        )}
      </ScrollView>
    </Container>
  );
}
