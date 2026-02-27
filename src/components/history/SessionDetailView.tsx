import { View, Text, ScrollView, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { RecapExerciseCard } from "@/components/session/RecapExerciseCard";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";
import { formatDate, formatDuration, WORKOUT_TYPE_LABELS } from "@/lib/utils";
import type { SessionWithDetails } from "@/types";

interface SessionDetailViewProps {
  session: SessionWithDetails;
}

const SESSION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  push: "fitness",
  pull: "body",
  legs: "walk",
  custom: "barbell",
};


const RATING_EMOJIS = ["", "😴", "😌", "💪", "🔥", "🏆"];

export function SessionDetailView({ session }: SessionDetailViewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const icon = SESSION_ICONS[session.type] || "barbell";
  const label =
    session.label || WORKOUT_TYPE_LABELS[session.type] || session.type;
  const duration = formatDuration(session.started_at, session.finished_at);
  const totalVolume = session.logs.reduce(
    (acc, log) =>
      acc +
      log.sets.reduce(
        (a, s) => a + s.weight * (log.weight_factor ?? 1) * s.reps,
        0
      ),
    0
  );
  const totalSets = session.logs.reduce(
    (acc, log) => acc + log.sets.length,
    0
  );

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
    >
      {/* ─── Session Header ─── */}
      <Animated.View entering={FadeInDown.duration(400)} className="mb-5">
        <View className="flex-row items-center mb-3">
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.accent + "15" },
            ]}
          >
            <Ionicons name={icon} size={24} color={colors.accent} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-2xl font-bold text-textPrimary">
              {label}
            </Text>
            <Text className="text-sm text-textSecondary mt-0.5">
              {formatDate(session.started_at)}
            </Text>
          </View>
          {session.rating ? (
            <View className="items-center">
              <Text className="text-2xl">{RATING_EMOJIS[session.rating]}</Text>
              <Text className="text-xs text-textTertiary mt-0.5">
                {t(`rating.labels.${session.rating}`)}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {/* ─── Quick Stats ─── */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        className="flex-row gap-3 mb-5"
      >
        <Card variant="elevated" className="flex-1">
          <View className="flex-row items-center mb-1">
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.textTertiary}
            />
            <Text className="text-xs text-textTertiary ml-1 uppercase tracking-wide font-semibold">
              {t("sessionDetail.duration")}
            </Text>
          </View>
          <Text className="text-xl font-bold text-textPrimary">{duration}</Text>
        </Card>
        <Card variant="elevated" className="flex-1">
          <View className="flex-row items-center mb-1">
            <Ionicons
              name="barbell-outline"
              size={14}
              color={colors.textTertiary}
            />
            <Text className="text-xs text-textTertiary ml-1 uppercase tracking-wide font-semibold">
              {t("sessionDetail.volume")}
            </Text>
          </View>
          <Text className="text-xl font-bold text-textPrimary">
            {totalVolume >= 1000
              ? `${(totalVolume / 1000).toFixed(1)}t`
              : `${Math.round(totalVolume)}kg`}
          </Text>
        </Card>
        <Card variant="elevated" className="flex-1">
          <View className="flex-row items-center mb-1">
            <Ionicons
              name="layers-outline"
              size={14}
              color={colors.textTertiary}
            />
            <Text className="text-xs text-textTertiary ml-1 uppercase tracking-wide font-semibold">
              {t("sessionDetail.sets")}
            </Text>
          </View>
          <Text className="text-xl font-bold text-textPrimary">
            {totalSets}
          </Text>
        </Card>
      </Animated.View>

      {/* ─── Health Stats ─── */}
      {(session.avg_heart_rate || session.calories_burned) && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(150)}
          className="flex-row gap-3 mb-5"
        >
          {session.avg_heart_rate && (
            <Card variant="elevated" className="flex-1">
              <View className="flex-row items-center mb-1">
                <Ionicons name="heart" size={14} color="#FF453A" />
                <Text className="text-xs text-textTertiary ml-1 uppercase tracking-wide font-semibold">
                  {t("health.avgHR")}
                </Text>
              </View>
              <Text className="text-xl font-bold text-textPrimary">
                {session.avg_heart_rate}
              </Text>
            </Card>
          )}
          {session.max_heart_rate && (
            <Card variant="elevated" className="flex-1">
              <View className="flex-row items-center mb-1">
                <Ionicons name="heart-circle" size={14} color="#FF9F0A" />
                <Text className="text-xs text-textTertiary ml-1 uppercase tracking-wide font-semibold">
                  {t("health.maxHR")}
                </Text>
              </View>
              <Text className="text-xl font-bold text-textPrimary">
                {session.max_heart_rate}
              </Text>
            </Card>
          )}
          {session.calories_burned && (
            <Card variant="elevated" className="flex-1">
              <View className="flex-row items-center mb-1">
                <Ionicons name="flame" size={14} color="#FF6B35" />
                <Text className="text-xs text-textTertiary ml-1 uppercase tracking-wide font-semibold">
                  {t("health.calories")}
                </Text>
              </View>
              <Text className="text-xl font-bold text-textPrimary">
                {session.calories_burned}
              </Text>
            </Card>
          )}
        </Animated.View>
      )}

      {/* ─── Exercise List ─── */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <Text className="text-xs font-bold text-textTertiary tracking-widest uppercase mb-3">
          {t("sessionDetail.exercises", { count: session.logs.length })}
        </Text>
      </Animated.View>

      {session.logs.map((log, i) => (
        <Animated.View
          key={log.id}
          entering={FadeInDown.duration(400).delay(250 + i * 60)}
        >
          <RecapExerciseCard log={log} />
        </Animated.View>
      ))}

      {session.logs.length === 0 && (
        <Animated.View
          entering={FadeInDown.duration(500).delay(300)}
          className="items-center py-16"
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.fill }}
          >
            <Ionicons
              name="barbell-outline"
              size={28}
              color={colors.textTertiary}
            />
          </View>
          <Text className="text-base font-semibold text-textPrimary mb-1">
            {t("sessionDetail.noExercises")}
          </Text>
          <Text className="text-sm text-textTertiary">
            {t("sessionDetail.noExercisesMessage")}
          </Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
