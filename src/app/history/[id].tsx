import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSessionDetails } from "@/hooks/useSessions";
import { SessionDetailView } from "@/components/history/SessionDetailView";
import { Container } from "@/components/ui/Container";

export default function SessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, loading } = useSessionDetails(id ?? null);

  return (
    <Container>
      <View className="px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent text-base">← Retour</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : session ? (
        <SessionDetailView session={session} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-textTertiary">Séance introuvable</Text>
        </View>
      )}
    </Container>
  );
}
