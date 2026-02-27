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
import { getPersonalRecords, type PersonalRecord } from "@/db/queries/stats";
import { formatDate, getMuscleGroupLabel } from "@/lib/utils";
import type { MuscleGroup } from "@/types";

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function PersonalRecordsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await getPersonalRecords(db);
    setRecords(data);
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  const muscleGroups = Array.from(
    new Set(records.map((r) => r.muscle_group).filter(Boolean))
  ) as string[];

  const filteredRecords = filter
    ? records.filter((r) => r.muscle_group === filter)
    : records;

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
            {t("stats.personalRecords")}
          </Text>
          <Text className="text-sm text-textTertiary mb-4">
            {t("stats.prSubtitle", { count: records.length })}
          </Text>
        </Animated.View>

        {/* Filters */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setFilter(null)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: !filter ? colors.accent + "20" : colors.fill,
                  borderWidth: !filter ? 1 : 0,
                  borderColor: !filter ? colors.accent : "transparent",
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: !filter ? colors.accent : colors.textSecondary }}
                >
                  {t("stats.all")}
                </Text>
              </Pressable>
              {muscleGroups.map((mg) => (
                <Pressable
                  key={mg}
                  onPress={() => setFilter(mg === filter ? null : mg)}
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: filter === mg ? colors.accent + "20" : colors.fill,
                    borderWidth: filter === mg ? 1 : 0,
                    borderColor: filter === mg ? colors.accent : "transparent",
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: filter === mg ? colors.accent : colors.textSecondary }}
                  >
                    {getMuscleGroupLabel(mg as MuscleGroup)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Records list */}
        {filteredRecords.map((record, i) => (
          <Animated.View
            key={record.exercise_id}
            entering={FadeInDown.duration(400).delay(150 + i * 40)}
          >
            <Pressable
              onPress={() => router.push(`/stats/exercise/${record.exercise_id}`)}
              className="active:opacity-80"
            >
              <Card variant="elevated" className="mb-3">
                <View className="flex-row items-center">
                  {/* Rank medal */}
                  <View
                    style={[
                      styles.rankBadge,
                      {
                        backgroundColor:
                          i < 3 ? MEDAL_COLORS[i] + "20" : colors.fill,
                      },
                    ]}
                  >
                    {i < 3 ? (
                      <Ionicons
                        name="trophy"
                        size={14}
                        color={MEDAL_COLORS[i]}
                      />
                    ) : (
                      <Text
                        className="text-xs font-bold"
                        style={{ color: colors.textTertiary }}
                      >
                        {i + 1}
                      </Text>
                    )}
                  </View>

                  {/* Exercise info */}
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-textPrimary">
                      {record.exercise_name}
                    </Text>
                    <Text className="text-xs text-textTertiary mt-0.5">
                      {record.muscle_group
                        ? getMuscleGroupLabel(record.muscle_group as MuscleGroup)
                        : ""}{" "}
                      • {formatDate(record.date)}
                    </Text>
                  </View>

                  {/* PR values */}
                  <View className="items-end">
                    <View className="flex-row items-baseline">
                      <Text className="text-lg font-bold text-textPrimary">
                        {record.estimated_1rm}
                      </Text>
                      <Text className="text-xs text-textTertiary ml-0.5">
                        kg
                      </Text>
                    </View>
                    <Text className="text-[10px] text-textTertiary">
                      {t("stats.pr1RM")}
                    </Text>
                    <Text className="text-xs text-textSecondary mt-0.5">
                      {record.best_weight}kg × {record.best_reps_at_weight}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        ))}

        {filteredRecords.length === 0 && (
          <View className="items-center py-16">
            <Ionicons name="trophy-outline" size={40} color={colors.textTertiary} />
            <Text className="text-base text-textTertiary mt-3">
              {t("stats.noPRs")}
            </Text>
          </View>
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
