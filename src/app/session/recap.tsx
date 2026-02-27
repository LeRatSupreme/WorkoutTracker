import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSessionStore } from "@/store/session-store";
import { finishSession, getSessionWithDetails, updateSet } from "@/db";
import { RecapExerciseCard } from "@/components/session/RecapExerciseCard";
import { RatingSelector } from "@/components/session/RatingSelector";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { formatDuration, WORKOUT_TYPE_LABELS } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import {
  isHealthEnabled,
  getUserWeight,
  estimateCalories,
  getHealthProvider,
  type WorkoutData,
} from "@/lib/health";
import type { SessionWithDetails, SetStatus } from "@/types";

export default function RecapScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionType = useSessionStore((s) => s.sessionType);
  const sessionLabel = useSessionStore((s) => s.sessionLabel);
  const startedAt = useSessionStore((s) => s.startedAt);
  const endSession = useSessionStore((s) => s.endSession);
  const [rating, setRating] = useState<number | null>(null);
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [saved, setSaved] = useState(false);
  const [healthStats, setHealthStats] = useState<{
    avgHR: number | null;
    maxHR: number | null;
    calories: number | null;
  }>({ avgHR: null, maxHR: null, calories: null });

  useEffect(() => {
    if (!sessionId || !startedAt) return;

    const loadAndFinish = async () => {
      // Compute health data before finishing
      let avgHR: number | null = null;
      let maxHR: number | null = null;
      let calories: number | null = null;

      try {
        const enabled = await isHealthEnabled();
        if (enabled) {
          const provider = getHealthProvider();
          const sessionStart = new Date(startedAt);
          const now = new Date();
          const samples = await provider.getHeartRateSamples(sessionStart, now);

          if (samples.length > 0) {
            const bpms = samples.map((s) => s.bpm);
            avgHR = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
            maxHR = Math.max(...bpms);

            const durationMin = (now.getTime() - sessionStart.getTime()) / 60000;
            const userWeight = await getUserWeight();
            if (userWeight) {
              calories = estimateCalories(avgHR, durationMin, userWeight);
            }
          }
        }
      } catch (e) {
        console.warn("[Recap] Health data error:", e);
      }

      setHealthStats({ avgHR, maxHR, calories });

      if (!saved) {
        await finishSession(db, sessionId, undefined, {
          avgHeartRate: avgHR ?? undefined,
          maxHeartRate: maxHR ?? undefined,
          caloriesBurned: calories ?? undefined,
        });
        setSaved(true);

        // Sync workout to HealthKit / Health Connect
        try {
          const enabled = await isHealthEnabled();
          if (enabled) {
            const provider = getHealthProvider();
            const workoutData: WorkoutData = {
              type: sessionType ?? "custom",
              startDate: new Date(startedAt),
              endDate: new Date(),
              totalEnergyBurned: calories ?? undefined,
              avgHeartRate: avgHR ?? undefined,
              maxHeartRate: maxHR ?? undefined,
            };
            await provider.saveWorkout(workoutData);
          }
        } catch (e) {
          console.warn("[Recap] Failed to sync workout:", e);
        }
      }
      const data = await getSessionWithDetails(db, sessionId);
      setSession(data);
    };

    loadAndFinish();
  }, [db, sessionId, startedAt, saved, sessionType]);

  const handleUpdateSet = useCallback(
    async (setId: string, weight: number, reps: number, status: SetStatus) => {
      await updateSet(db, setId, weight, reps, status);
      // Recharger les données
      if (sessionId) {
        const data = await getSessionWithDetails(db, sessionId);
        setSession(data);
      }
    },
    [db, sessionId]
  );

  const handleSaveRating = async () => {
    if (sessionId && rating) {
      await finishSession(db, sessionId, rating, {
        avgHeartRate: healthStats.avgHR ?? undefined,
        maxHeartRate: healthStats.maxHR ?? undefined,
        caloriesBurned: healthStats.calories ?? undefined,
      });
    }
    endSession();
    router.replace("/");
  };

  const handleSkip = () => {
    endSession();
    router.replace("/");
  };

  return (
    <Container>
      <ScrollView className="flex-1 px-6 pt-8">
        <Text className="text-2xl font-bold text-textPrimary mb-1">
          {t("session.sessionFinished")}
        </Text>
        <Text className="text-base text-textSecondary mb-6">
          {sessionLabel || (sessionType ? WORKOUT_TYPE_LABELS[sessionType] : "")} •{" "}
          {startedAt ? formatDuration(startedAt) : ""}
        </Text>

        {/* Health stats */}
        {(healthStats.avgHR || healthStats.calories) && (
          <View className="flex-row gap-3 mb-5">
            {healthStats.avgHR && (
              <View className="flex-1 bg-card border border-cardBorder rounded-2xl p-3 items-center">
                <Ionicons name="heart" size={20} color="#FF453A" />
                <Text className="text-lg font-bold text-textPrimary mt-1">
                  {healthStats.avgHR}
                </Text>
                <Text className="text-xs text-textTertiary">
                  {t("health.avgBPM")}
                </Text>
              </View>
            )}
            {healthStats.maxHR && (
              <View className="flex-1 bg-card border border-cardBorder rounded-2xl p-3 items-center">
                <Ionicons name="heart-circle" size={20} color="#FF9F0A" />
                <Text className="text-lg font-bold text-textPrimary mt-1">
                  {healthStats.maxHR}
                </Text>
                <Text className="text-xs text-textTertiary">
                  {t("health.maxBPM")}
                </Text>
              </View>
            )}
            {healthStats.calories && (
              <View className="flex-1 bg-card border border-cardBorder rounded-2xl p-3 items-center">
                <Ionicons name="flame" size={20} color="#FF6B35" />
                <Text className="text-lg font-bold text-textPrimary mt-1">
                  {healthStats.calories}
                </Text>
                <Text className="text-xs text-textTertiary">
                  {t("health.kcal")}
                </Text>
              </View>
            )}
          </View>
        )}

        {session?.logs.map((log) => (
          <RecapExerciseCard
            key={log.id}
            log={log}
            editable
            onUpdateSet={handleUpdateSet}
          />
        ))}

        <View className="mt-6 mb-4">
          <RatingSelector value={rating} onChange={setRating} />
        </View>

        <View className="gap-3 mt-4 mb-8">
          <Button
            title={t("session.saveSession")}
            onPress={handleSaveRating}
            fullWidth
          />
          <Button
            title={t("session.skip")}
            variant="secondary"
            onPress={handleSkip}
            fullWidth
          />
        </View>
      </ScrollView>
    </Container>
  );
}
