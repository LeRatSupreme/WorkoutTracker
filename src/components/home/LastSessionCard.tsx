import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import type { LastFinishedSession } from "@/db/queries/sessions";
import { formatDate, formatDuration, WORKOUT_TYPE_LABELS } from "@/lib/utils";

interface LastSessionCardProps {
  session: LastFinishedSession;
}

export function LastSessionCard({ session }: LastSessionCardProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/history/${session.id}`)}>
      <Card>
        <Text className="text-sm text-textSecondary mb-1">Dernière séance</Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-textPrimary">
            {session.label || WORKOUT_TYPE_LABELS[session.type] || session.type}
          </Text>
          <Text className="text-sm text-textTertiary">
            {formatDate(session.started_at)}
          </Text>
        </View>
        <Text className="text-sm text-textSecondary">
          {formatDuration(session.started_at, session.finished_at)} ·{" "}
          {session.exercise_count} exercice{session.exercise_count > 1 ? "s" : ""}
        </Text>
      </Card>
    </Pressable>
  );
}
