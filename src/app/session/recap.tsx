import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useTranslation } from "react-i18next";
import { useSessionStore } from "@/store/session-store";
import { finishSession, getSessionWithDetails, updateSet } from "@/db";
import { RecapExerciseCard } from "@/components/session/RecapExerciseCard";
import { RatingSelector } from "@/components/session/RatingSelector";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { formatDuration, WORKOUT_TYPE_LABELS } from "@/lib/utils";
import type { SessionWithDetails, SetStatus } from "@/types";

export default function RecapScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionType = useSessionStore((s) => s.sessionType);
  const sessionLabel = useSessionStore((s) => s.sessionLabel);
  const startedAt = useSessionStore((s) => s.startedAt);
  const endSession = useSessionStore((s) => s.endSession);
  const [rating, setRating] = useState<number | null>(null);
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const loadAndFinish = async () => {
      if (!saved) {
        await finishSession(db, sessionId, undefined);
        setSaved(true);
      }
      const data = await getSessionWithDetails(db, sessionId);
      setSession(data);
    };

    loadAndFinish();
  }, [db, sessionId, saved]);

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
      await finishSession(db, sessionId, rating);
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
