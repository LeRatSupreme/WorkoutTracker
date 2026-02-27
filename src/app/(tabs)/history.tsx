import { View, Text, FlatList, Alert } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSessions } from "@/hooks/useSessions";
import { SessionListItem } from "@/components/history/SessionListItem";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useTheme } from "@/hooks/useTheme";
import { WORKOUT_TYPE_LABELS } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { sessions, loading, deleteSession } = useSessions();
  const finishedSessions = sessions.filter((s) => s.finished_at !== null);

  const handleDelete = (sessionId: string, sessionType: string) => {
    Alert.alert(
      t("history.deleteTitle"),
      t("history.deleteMessage", { type: WORKOUT_TYPE_LABELS[sessionType] ?? sessionType }),
      [
        { text: t("history.cancel"), style: "cancel" },
        {
          text: t("history.delete"),
          style: "destructive",
          onPress: () => deleteSession(sessionId),
        },
      ]
    );
  };

  return (
    <Container>
      <View className="flex-1 px-5 pt-6">
        {/* ─── Header ─── */}
        <Animated.View entering={FadeInDown.duration(400)} className="mb-5">
          <Text className="text-3xl font-bold text-textPrimary mb-1">
            {t("history.title")}
          </Text>
          <Text className="text-sm text-textSecondary">
            {finishedSessions.length > 0
              ? t("history.sessionsCount", { count: finishedSessions.length })
              : t("history.emptySubtitle")}
          </Text>
        </Animated.View>

        <FlatList
          data={finishedSessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SessionListItem
              session={item}
              onPress={() => router.push(`/history/${item.id}`)}
              onLongPress={() => handleDelete(item.id, item.type)}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <Animated.View
                entering={FadeInDown.duration(500).delay(200)}
                className="items-center py-20"
              >
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-5"
                  style={{ backgroundColor: colors.fill }}
                >
                  <Ionicons
                    name="barbell-outline"
                    size={36}
                    color={colors.textTertiary}
                  />
                </View>
                <Text className="text-lg font-semibold text-textPrimary mb-1">
                  {t("history.emptyTitle")}
                </Text>
                <Text className="text-sm text-textTertiary mb-6 text-center px-8">
                  {t("history.emptyMessage")}
                </Text>
                <Button
                  title={t("history.startSession")}
                  onPress={() => router.push("/session/start")}
                  icon={<Ionicons name="flash" size={18} color="#fff" />}
                />
              </Animated.View>
            ) : null
          }
        />
      </View>
    </Container>
  );
}
