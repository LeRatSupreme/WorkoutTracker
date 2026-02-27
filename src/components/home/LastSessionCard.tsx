import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";
import type { LastFinishedSession } from "@/db/queries/sessions";
import { formatDate, formatDuration, WORKOUT_TYPE_LABELS } from "@/lib/utils";

interface LastSessionCardProps {
  session: LastFinishedSession;
}

const WORKOUT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  push: "fitness",
  pull: "body",
  legs: "walk",
  custom: "barbell",
};

export function LastSessionCard({ session }: LastSessionCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const icon = WORKOUT_ICONS[session.type] || "barbell";
  const label = session.label || WORKOUT_TYPE_LABELS[session.type] || session.type;

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(350)}>
      <Pressable onPress={() => router.push(`/history/${session.id}`)}>
        <Card variant="elevated">
          <Text className="text-xs font-semibold text-textTertiary tracking-wide uppercase mb-3">
            {t("home.lastSession")}
          </Text>
          <View className="flex-row items-center">
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accent + "15" },
              ]}
            >
              <Ionicons name={icon} size={22} color={colors.accent} />
            </View>

            {/* Info */}
            <View className="flex-1 ml-3">
              <Text className="text-base font-bold text-textPrimary">
                {label}
              </Text>
              <Text className="text-sm text-textSecondary mt-0.5">
                {formatDuration(session.started_at, session.finished_at)} ·{" "}
                {session.exercise_count} exercice
                {session.exercise_count > 1 ? "s" : ""}
              </Text>
            </View>

            {/* Date + Chevron */}
            <View className="items-end">
              <Text className="text-xs text-textTertiary mb-1">
                {formatDate(session.started_at)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textTertiary}
              />
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
