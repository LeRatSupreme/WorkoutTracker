import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WeekGrid } from "@/components/home/WeekGrid";
import { LastSessionCard } from "@/components/home/LastSessionCard";
import { useSessionStore } from "@/store/session-store";
import { usePreferences } from "@/hooks/usePreferences";
import { useWeekActivity } from "@/hooks/useWeekActivity";
import { getGreeting, getMotivationMessage } from "@/lib/greeting";
import { WORKOUT_TYPE_LABELS } from "@/lib/utils";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import {
  getUnfinishedSession,
  getSessionWithDetails,
  deleteSession,
  getLastFinishedSession,
} from "@/db";
import type { LastFinishedSession } from "@/db/queries/sessions";

const glassAvailable = isLiquidGlassAvailable();

const TIME_EMOJI: Record<string, string> = {
  morning: "☀️",
  afternoon: "👋",
  evening: "🌙",
  night: "🌟",
};

function getTimeEmoji(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return TIME_EMOJI.morning;
  if (hour >= 12 && hour < 18) return TIME_EMOJI.afternoon;
  if (hour >= 18 && hour < 22) return TIME_EMOJI.evening;
  return TIME_EMOJI.night;
}

export default function HomeScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { firstName } = usePreferences();
  const { days, sessionCount, daysSinceLastSession, loading } =
    useWeekActivity();
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionType = useSessionStore((s) => s.sessionType);
  const sessionLabel = useSessionStore((s) => s.sessionLabel);
  const startedAt = useSessionStore((s) => s.startedAt);
  const restoreSession = useSessionStore((s) => s.restoreSession);
  const endSession = useSessionStore((s) => s.endSession);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const checkedRef = useRef(false);
  const elapsed = useElapsedTimer(startedAt);
  const [lastSession, setLastSession] = useState<LastFinishedSession | null>(
    null
  );

  const loadLastSession = useCallback(async () => {
    const session = await getLastFinishedSession(db);
    setLastSession(session);
  }, [db]);

  useEffect(() => {
    loadLastSession();
  }, [loadLastSession]);

  const greeting = useMemo(() => getGreeting(firstName, t), [firstName, t]);
  const emoji = useMemo(() => getTimeEmoji(), []);
  const motivation = useMemo(
    () =>
      getMotivationMessage({
        sessionsThisWeek: sessionCount,
        daysSinceLastSession,
      }, t),
    [sessionCount, daysSinceLastSession, t]
  );

  // Vérifier s'il y a une séance non terminée au mount
  useEffect(() => {
    if (checkedRef.current || sessionId) return;
    checkedRef.current = true;

    const checkUnfinished = async () => {
      const unfinished = await getUnfinishedSession(db);
      if (!unfinished) return;

      Alert.alert(
        t("home.unfinishedTitle"),
        t("home.unfinishedMessage"),
        [
          {
            text: t("home.delete"),
            style: "destructive",
            onPress: async () => {
              await deleteSession(db, unfinished.id);
            },
          },
          {
            text: t("home.resume"),
            onPress: async () => {
              const details = await getSessionWithDetails(db, unfinished.id);
              if (details) {
                restoreSession(details);
                router.push("/session/active");
              }
            },
          },
        ]
      );
    };

    checkUnfinished();
  }, [db, sessionId, restoreSession, router]);

  return (
    <Container>
      <View className="flex-1 px-5 pt-4">
        {/* ─── Header ─── */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          className="flex-row items-center justify-between mb-1"
        >
          <Text className="text-3xl font-bold text-textPrimary">
            {greeting} {emoji}
          </Text>
          <Pressable
            onPress={() => router.push("/settings")}
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.fill }}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </Animated.View>

        {/* ─── Motivation ─── */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text className="text-sm text-textSecondary mb-6">
            {motivation}
          </Text>
        </Animated.View>

        {/* ─── Séance en cours ─── */}
        {sessionId && sessionType && startedAt && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(150)}
            className="mb-5"
          >
            <Card variant="glow">
              <View className="flex-row items-center mb-3">
                <View
                  style={[styles.pulse, { backgroundColor: colors.accent }]}
                />
                <Text
                  className="text-xs font-bold tracking-wide uppercase ml-2"
                  style={{ color: colors.accent }}
                >
                  {t("home.activeSession")}
                </Text>
              </View>
              <Text className="text-lg font-bold text-textPrimary mb-0.5">
                {sessionLabel || WORKOUT_TYPE_LABELS[sessionType]}
              </Text>
              <Text className="text-2xl font-light text-accent mb-4 tabular-nums">
                {elapsed}
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    title={t("home.resume")}
                    onPress={() => router.push("/session/active")}
                    fullWidth
                    icon={
                      <Ionicons name="play" size={16} color="#fff" />
                    }
                  />
                </View>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      t("home.abandonTitle"),
                      t("home.abandonMessage"),
                      [
                        { text: t("home.cancel"), style: "cancel" },
                        {
                          text: t("home.abandon"),
                          style: "destructive",
                          onPress: async () => {
                            await deleteSession(db, sessionId);
                            endSession();
                            loadLastSession();
                          },
                        },
                      ]
                    );
                  }}
                  className="items-center justify-center px-4 rounded-pill"
                  style={{ backgroundColor: colors.destructive + "15" }}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.destructive}
                  />
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ─── Week Grid ─── */}
        {!loading && (
          <View className="mb-5">
            <Card variant="elevated">
              <WeekGrid days={days} sessionCount={sessionCount} />
            </Card>
          </View>
        )}

        {/* ─── Dernière séance ─── */}
        {!sessionId && lastSession && (
          <View className="mb-4">
            <LastSessionCard session={lastSession} />
          </View>
        )}

        <View className="flex-1" />

        {/* ─── CTA Commencer ─── */}
        {!sessionId && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(500)}
            className="pb-28"
          >
            {glassAvailable ? (
              <Pressable onPress={() => router.push("/session/start")}>
                <GlassView
                  glassEffectStyle="regular"
                  style={styles.glassCTA}
                >
                  <Ionicons
                    name="flash"
                    size={20}
                    color={colors.accent}
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-base font-bold text-accent">
                    {t("home.startSession")}
                  </Text>
                </GlassView>
              </Pressable>
            ) : (
              <Button
                title={t("home.startSession")}
                onPress={() => router.push("/session/start")}
                fullWidth
                icon={<Ionicons name="flash" size={18} color="#fff" />}
              />
            )}
          </Animated.View>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  glassCTA: {
    overflow: "hidden",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
