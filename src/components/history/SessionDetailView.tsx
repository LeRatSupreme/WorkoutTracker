import { View, Text, ScrollView } from "react-native";
import { RecapExerciseCard } from "@/components/session/RecapExerciseCard";
import { formatDate, formatDuration, WORKOUT_TYPE_LABELS } from "@/lib/utils";
import type { SessionWithDetails } from "@/types";

interface SessionDetailViewProps {
  session: SessionWithDetails;
}

export function SessionDetailView({ session }: SessionDetailViewProps) {
  return (
    <ScrollView className="flex-1 px-6 pt-4">
      <Text className="text-2xl font-bold text-textPrimary mb-1">
        {session.label || WORKOUT_TYPE_LABELS[session.type] || session.type}
      </Text>
      <Text className="text-base text-textSecondary mb-1">
        {formatDate(session.started_at)} •{" "}
        {formatDuration(session.started_at, session.finished_at)}
      </Text>
      {session.rating && (
        <Text className="text-sm text-textTertiary mb-4">
          Difficulté: {session.rating}/5
        </Text>
      )}

      <View className="mt-4">
        {session.logs.map((log) => (
          <RecapExerciseCard key={log.id} log={log} />
        ))}
      </View>

      {session.logs.length === 0 && (
        <View className="items-center py-16">
          <Text className="text-textTertiary">Aucun exercice enregistré</Text>
        </View>
      )}
    </ScrollView>
  );
}
