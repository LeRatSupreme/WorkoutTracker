import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSessionDetails } from "@/hooks/useSessions";
import { SessionDetailView } from "@/components/history/SessionDetailView";
import { Container } from "@/components/ui/Container";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";

export default function SessionDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, loading } = useSessionDetails(id ?? null);

  return (
    <Container>
      {/* ─── Header ─── */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="px-5 pt-2 pb-2"
      >
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center py-2"
        >
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
          <Text
            className="text-base ml-0.5"
            style={{ color: colors.accent }}
          >
            {t("history.back")}
          </Text>
        </Pressable>
      </Animated.View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : session ? (
        <SessionDetailView session={session} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.fill }}
          >
            <Ionicons
              name="search-outline"
              size={28}
              color={colors.textTertiary}
            />
          </View>
          <Text className="text-base font-semibold text-textPrimary mb-1">
            {t("history.sessionNotFound")}
          </Text>
          <Text className="text-sm text-textTertiary">
            {t("history.sessionNotFoundSubtitle")}
          </Text>
        </View>
      )}
    </Container>
  );
}
