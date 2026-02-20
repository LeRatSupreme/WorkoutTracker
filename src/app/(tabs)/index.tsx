import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
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
import { getUnfinishedSession, getSessionWithDetails, deleteSession, getLastFinishedSession } from "@/db";
import type { LastFinishedSession } from "@/db/queries/sessions";

const glassAvailable = isLiquidGlassAvailable();

const styles = StyleSheet.create({
  glassCTA: {
    overflow: "hidden" as const,
    height: 56,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { firstName } = usePreferences();
  const { days, sessionCount, daysSinceLastSession, loading } = useWeekActivity();
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionType = useSessionStore((s) => s.sessionType);
  const sessionLabel = useSessionStore((s) => s.sessionLabel);
  const startedAt = useSessionStore((s) => s.startedAt);
  const restoreSession = useSessionStore((s) => s.restoreSession);
  const endSession = useSessionStore((s) => s.endSession);
  const { colors } = useTheme();
  const checkedRef = useRef(false);
  const elapsed = useElapsedTimer(startedAt);
  const [lastSession, setLastSession] = useState<LastFinishedSession | null>(null);

  const loadLastSession = useCallback(async () => {
    const session = await getLastFinishedSession(db);
    setLastSession(session);
  }, [db]);

  useEffect(() => {
    loadLastSession();
  }, [loadLastSession]);

  const greeting = useMemo(() => getGreeting(firstName), [firstName]);
  const motivation = useMemo(
    () =>
      getMotivationMessage({
        sessionsThisWeek: sessionCount,
        daysSinceLastSession,
      }),
    [sessionCount, daysSinceLastSession]
  );

  // Vérifier s'il y a une séance non terminée au mount
  useEffect(() => {
    if (checkedRef.current || sessionId) return;
    checkedRef.current = true;

    const checkUnfinished = async () => {
      const unfinished = await getUnfinishedSession(db);
      if (!unfinished) return;

      Alert.alert(
        "Séance non terminée",
        "Une séance est restée ouverte. Que veux-tu faire ?",
        [
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              await deleteSession(db, unfinished.id);
            },
          },
          {
            text: "Reprendre",
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
      <View className="flex-1 px-6 pt-6">
        {/* Header : salutation + settings */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-textPrimary">{greeting}</Text>
          <Pressable
            onPress={() => router.push("/settings")}
            className="p-2"
          >
            <Ionicons name="settings-outline" size={22} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Message de motivation */}
        <Card className="mb-6">
          <Text className="text-base text-textSecondary italic">
            "{motivation}"
          </Text>
        </Card>

        {/* Grille de la semaine */}
        {!loading && (
          <Card className="mb-6">
            <WeekGrid days={days} sessionCount={sessionCount} />
          </Card>
        )}

        {/* Dernière séance */}
        {!sessionId && lastSession && (
          <View className="mb-4">
            <LastSessionCard session={lastSession} />
          </View>
        )}

        {/* Séance en cours */}
        {sessionId && sessionType && startedAt && (
          <Card className="mb-4 border-accent/20 bg-accent/5">
            <Text className="text-sm text-accent mb-1">Séance en cours</Text>
            <Text className="text-base font-semibold text-textPrimary">
              {sessionLabel || WORKOUT_TYPE_LABELS[sessionType]} • {elapsed}
            </Text>
            <View className="mt-3">
              <Button
                title="Reprendre"
                onPress={() => router.push("/session/active")}
                fullWidth
              />
            </View>
            <Pressable
              onPress={() => {
                Alert.alert(
                  "Abandonner la séance ?",
                  "Toutes les données de cette séance seront perdues.",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Abandonner",
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
              className="mt-2 items-center"
            >
              <Text className="text-sm text-destructive">Abandonner</Text>
            </Pressable>
          </Card>
        )}

        <View className="flex-1" />

        {/* Bouton commencer */}
        {!sessionId && (
          <View className="pb-28">
            {glassAvailable ? (
              <Pressable onPress={() => router.push("/session/start")}>
                <GlassView
                  glassEffectStyle="regular"
                  style={styles.glassCTA}
                >
                  <Text className="text-base font-semibold text-accent">
                    Commencer une séance
                  </Text>
                </GlassView>
              </Pressable>
            ) : (
              <Button
                title="Commencer une séance"
                onPress={() => router.push("/session/start")}
                fullWidth
              />
            )}
          </View>
        )}
      </View>
    </Container>
  );
}
