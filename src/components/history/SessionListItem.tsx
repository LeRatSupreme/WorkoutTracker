import { Pressable, View, Text } from "react-native";
import type { SessionWithCount } from "@/db";
import { formatDate, formatDuration, WORKOUT_TYPE_LABELS } from "@/lib/utils";

interface SessionListItemProps {
  session: SessionWithCount;
  onPress: () => void;
  onLongPress: () => void;
}

export function SessionListItem({ session, onPress, onLongPress }: SessionListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      className="bg-card rounded-2xl p-4 mb-2 border border-cardBorder active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-semibold text-textPrimary">
            {session.label || WORKOUT_TYPE_LABELS[session.type] || session.type}
          </Text>
          <Text className="text-sm text-textTertiary mt-0.5">
            {formatDate(session.started_at)} · {session.exercise_count} exo{session.exercise_count > 1 ? "s" : ""}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm text-textSecondary">
            {formatDuration(session.started_at, session.finished_at)}
          </Text>
          {session.rating && (
            <Text className="text-xs text-textTertiary mt-0.5">
              Difficulté: {session.rating}/5
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
