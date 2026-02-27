import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import type { SessionWithCount } from "@/db";
import { formatDate, formatDuration, WORKOUT_TYPE_LABELS } from "@/lib/utils";

interface SessionListItemProps {
  session: SessionWithCount;
  onPress: () => void;
  onLongPress: () => void;
}

const SESSION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  push: "fitness",
  pull: "body",
  legs: "walk",
  custom: "barbell",
};

const RATING_EMOJIS = ["", "😴", "😌", "💪", "🔥", "🏆"];

export function SessionListItem({
  session,
  onPress,
  onLongPress,
}: SessionListItemProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const icon = SESSION_ICONS[session.type] || "barbell";
  const label =
    session.label || WORKOUT_TYPE_LABELS[session.type] || session.type;
  const duration = formatDuration(session.started_at, session.finished_at);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      className="mb-3 active:opacity-80"
    >
      <Card variant="elevated">
        <View className="flex-row items-center">
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.accent + "12" },
            ]}
          >
            <Ionicons name={icon} size={20} color={colors.accent} />
          </View>

          {/* Content */}
          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-textPrimary">
                {label}
              </Text>
              {session.rating ? (
                <Text className="text-sm">{RATING_EMOJIS[session.rating]}</Text>
              ) : null}
            </View>
            <View className="flex-row items-center mt-1">
              <Ionicons
                name="calendar-outline"
                size={12}
                color={colors.textTertiary}
              />
              <Text className="text-xs text-textTertiary ml-1">
                {formatDate(session.started_at)}
              </Text>
              <View
                style={[styles.dot, { backgroundColor: colors.textTertiary }]}
              />
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.textTertiary}
              />
              <Text className="text-xs text-textTertiary ml-1">
                {duration}
              </Text>
              <View
                style={[styles.dot, { backgroundColor: colors.textTertiary }]}
              />
              <Text className="text-xs text-textTertiary">
                {t("sessionListItem.exerciseCount", { count: session.exercise_count })}
              </Text>
            </View>
          </View>

          {/* Chevron */}
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
            style={{ marginLeft: 8 }}
          />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
  },
});
