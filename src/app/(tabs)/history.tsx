import { View, Text, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSessions } from "@/hooks/useSessions";
import { SessionListItem } from "@/components/history/SessionListItem";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WORKOUT_TYPE_LABELS } from "@/lib/utils";

export default function HistoryScreen() {
  const router = useRouter();
  const { sessions, loading, deleteSession } = useSessions();
  const finishedSessions = sessions.filter((s) => s.finished_at !== null);

  const handleDelete = (sessionId: string, sessionType: string) => {
    Alert.alert(
      "Supprimer cette séance ?",
      `${WORKOUT_TYPE_LABELS[sessionType] ?? sessionType} sera définitivement supprimée.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteSession(sessionId),
        },
      ]
    );
  };

  return (
    <Container>
      <View className="flex-1 px-6 pt-8">
        <Text className="text-2xl font-bold text-textPrimary mb-6">
          Historique
        </Text>

        <FlatList
          data={finishedSessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 112 }}
          renderItem={({ item }) => (
            <SessionListItem
              session={item}
              onPress={() => router.push(`/history/${item.id}`)}
              onLongPress={() => handleDelete(item.id, item.type)}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <View className="items-center py-16">
                <Text className="text-textTertiary text-base mb-4">
                  Aucune séance enregistrée
                </Text>
                <Button
                  title="Commencer une séance"
                  onPress={() => router.push("/session/start")}
                />
              </View>
            ) : null
          }
        />
      </View>
    </Container>
  );
}
