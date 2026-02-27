import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable, LayoutAnimation } from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useTranslation } from "react-i18next";
import { useSessionStore } from "@/store/session-store";
import { addSet, removeSet, updateComment, updateWeightFactor, createExerciseLog, deleteExerciseLog, getSuggestedExercises, deleteSession } from "@/db";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";
import { useHeartRate } from "@/hooks/useHeartRate";
import { ExerciseList } from "@/components/session/ExerciseList";
import { ActiveExerciseCard } from "@/components/session/ActiveExerciseCard";
import { RestTimerModal } from "@/components/session/RestTimerModal";
import { HeartRateDisplay } from "@/components/session/HeartRateDisplay";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WORKOUT_TYPE_LABELS } from "@/lib/utils";
import type { SetStatus, Exercise } from "@/types";

export default function ActiveSessionScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionType = useSessionStore((s) => s.sessionType);
  const sessionLabel = useSessionStore((s) => s.sessionLabel);
  const startedAt = useSessionStore((s) => s.startedAt);
  const exercises = useSessionStore((s) => s.exercises);
  const currentIndex = useSessionStore((s) => s.currentExerciseIndex);
  const setCurrentIndex = useSessionStore((s) => s.setCurrentExerciseIndex);
  const addSetToExercise = useSessionStore((s) => s.addSetToExercise);
  const removeSetFromExercise = useSessionStore((s) => s.removeSetFromExercise);
  const addExercise = useSessionStore((s) => s.addExercise);
  const removeExercise = useSessionStore((s) => s.removeExercise);
  const setComment = useSessionStore((s) => s.setComment);
  const setWeightFactor = useSessionStore((s) => s.setWeightFactor);
  const endSession = useSessionStore((s) => s.endSession);
  const [timerVisible, setTimerVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<Exercise[]>([]);

  const elapsed = useElapsedTimer(startedAt);
  const hr = useHeartRate(startedAt);
  const currentExercise = exercises[currentIndex] ?? null;

  // Charger les suggestions au mount
  const loadSuggestions = useCallback(async () => {
    if (!sessionType) return;
    const label = sessionType === "custom" ? sessionLabel : null;
    const results = await getSuggestedExercises(db, sessionType, label);
    setSuggestions(results);
  }, [db, sessionType, sessionLabel]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Filtrer les suggestions en excluant les exercices deja ajoutes
  const exerciseIds = new Set(exercises.map((e) => e.exercise.id));
  const filteredSuggestions = suggestions.filter((s) => !exerciseIds.has(s.id));

  const handleAddSet = async (weight: number, reps: number, status: SetStatus, muscleFailure: boolean) => {
    if (!currentExercise) return;
    const order = currentExercise.sets.length + 1;
    const setData = await addSet(db, currentExercise.logId, weight, reps, status, order, muscleFailure);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    addSetToExercise(currentExercise.logId, {
      id: setData.id,
      weight,
      reps,
      status,
      order,
      muscle_failure: muscleFailure,
    });
  };

  const handleRemoveSet = async (setId: string) => {
    if (!currentExercise) return;
    await removeSet(db, setId);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    removeSetFromExercise(currentExercise.logId, setId);
  };

  const handleCommentChange = async (comment: string | null) => {
    if (!currentExercise) return;
    setComment(currentExercise.logId, comment);
    await updateComment(db, currentExercise.logId, comment);
  };

  const handleWeightFactorChange = async (logId: string, factor: number) => {
    setWeightFactor(logId, factor);
    try {
      await updateWeightFactor(db, logId, factor);
    } catch (e) {
      console.warn("updateWeightFactor failed:", e);
    }
  };

  const handleSuggestionPress = async (exercise: Exercise) => {
    if (!sessionId) return;
    const order = exercises.length + 1;
    const log = await createExerciseLog(db, sessionId, exercise.id, order);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    addExercise(log.id, exercise, order);
  };

  const handleRemoveExercise = (logId: string, exerciseName: string) => {
    Alert.alert(
      t("session.removeExerciseTitle", { name: exerciseName }),
      t("session.removeExerciseMessage"),
      [
        { text: t("session.cancel"), style: "cancel" },
        {
          text: t("session.remove"),
          style: "destructive",
          onPress: async () => {
            await deleteExerciseLog(db, logId);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            removeExercise(logId);
          },
        },
      ]
    );
  };

  const handleAbandon = () => {
    Alert.alert(
      t("session.abandonTitle"),
      t("session.abandonMessage"),
      [
        { text: t("session.cancel"), style: "cancel" },
        {
          text: t("session.abandon"),
          style: "destructive",
          onPress: async () => {
            if (sessionId) await deleteSession(db, sessionId);
            endSession();
            router.replace("/");
          },
        },
      ]
    );
  };

  const handleFinish = () => {
    if (exercises.length === 0) {
      Alert.alert(
        t("session.emptySessionTitle"),
        t("session.emptySessionMessage"),
      );
      return;
    }

    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const durationMin = Math.floor((Date.now() - new Date(startedAt!).getTime()) / 60000);
    const summary = t("session.finishMessage", { exercises: exercises.length, sets: totalSets, duration: durationMin });

    Alert.alert(t("session.finishTitle"), summary, [
      { text: t("session.cancel"), style: "cancel" },
      {
        text: t("session.finish"),
        onPress: () => router.replace("/session/recap"),
      },
    ]);
  };

  return (
    <Container>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-textPrimary">
              {sessionLabel || (sessionType ? WORKOUT_TYPE_LABELS[sessionType] : t("session.fallbackLabel"))}
            </Text>
            {elapsed ? (
              <Text className="text-sm text-textSecondary mt-0.5">{elapsed}</Text>
            ) : null}
          </View>
          <Button title={t("session.finish")} variant="secondary" onPress={handleFinish} />
        </View>

        {hr.isMonitoring && (
          <View className="px-6">
            <HeartRateDisplay
              currentBPM={hr.currentBPM}
              avgBPM={hr.avgBPM}
              maxBPM={hr.maxBPM}
              zone={hr.zone}
              isMonitoring={hr.isMonitoring}
            />
          </View>
        )}

        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
          <ExerciseList
            exercises={exercises}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
            onLongPress={handleRemoveExercise}
          />

          {currentExercise ? (
            <ActiveExerciseCard
              exercise={currentExercise}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              onCommentChange={handleCommentChange}
              onWeightFactorChange={handleWeightFactorChange}
            />
          ) : (
            <View className="items-center justify-center py-16">
              <Text className="text-textTertiary text-base mb-4">
                {t("session.noExercises")}
              </Text>

              {filteredSuggestions.length > 0 && (
                <View className="w-full mt-2">
                  <Text className="text-sm font-medium text-textSecondary mb-2 text-center">
                    {t("session.suggestions")}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-[-24px] px-6">
                    <View className="flex-row gap-2">
                      {filteredSuggestions.map((exercise) => (
                        <Pressable
                          key={exercise.id}
                          onPress={() => handleSuggestionPress(exercise)}
                          className="bg-card border border-cardBorder rounded-full px-4 py-2 active:opacity-80"
                        >
                          <Text className="text-sm text-textPrimary">{exercise.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {currentExercise && currentExercise.sets.length > 0 && (
            <View className="mt-4">
              <Button
                title={t("session.rest")}
                variant="secondary"
                fullWidth
                onPress={() => setTimerVisible(true)}
              />
            </View>
          )}

          {/* Suggestions quand des exercices existent deja */}
          {currentExercise && filteredSuggestions.length > 0 && (
            <View className="mt-4">
              <Text className="text-sm font-medium text-textSecondary mb-2">
                {t("session.suggestions")}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {filteredSuggestions.map((exercise) => (
                    <Pressable
                      key={exercise.id}
                      onPress={() => handleSuggestionPress(exercise)}
                      className="bg-card border border-cardBorder rounded-full px-4 py-2 active:opacity-80"
                    >
                      <Text className="text-sm text-textPrimary">{exercise.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View className="mt-4 mb-4">
            <Button
              title={t("session.addExercise")}
              variant="secondary"
              fullWidth
              onPress={() => router.push("/session/exercise-picker")}
            />
          </View>

          <Pressable onPress={handleAbandon} className="items-center mb-8">
            <Text className="text-sm text-destructive">{t("session.abandonSession")}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <RestTimerModal
        visible={timerVisible}
        onClose={() => setTimerVisible(false)}
      />
    </Container>
  );
}
