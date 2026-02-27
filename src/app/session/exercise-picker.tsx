import { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, FlatList, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSQLiteContext } from "expo-sqlite";
import { useExercises } from "@/hooks/useExercises";
import { useSessionStore } from "@/store/session-store";
import { createExerciseLog } from "@/db";
import { getMuscleGroups, getMuscleGroupLabel, SESSION_MUSCLE_MAPPING } from "@/lib/utils";
import { MuscleGroupPicker } from "@/components/session/MuscleGroupPicker";
import { Container } from "@/components/ui/Container";
import { useTheme } from "@/hooks/useTheme";
import type { Exercise, MuscleGroup } from "@/types";

export default function ExercisePickerScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const { exercises, search, create, remove, getUsageCount } = useExercises();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [showMuscleGroupPicker, setShowMuscleGroupPicker] = useState(false);
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionType = useSessionStore((s) => s.sessionType);
  const exerciseCount = useSessionStore((s) => s.exercises.length);
  const addExercise = useSessionStore((s) => s.addExercise);

  const recommendedMuscles = sessionType ? SESSION_MUSCLE_MAPPING[sessionType] : [];

  const filteredExercises = useMemo(() => {
    if (muscleFilter) {
      return exercises.filter((e) => e.muscle_group === muscleFilter);
    }
    return exercises;
  }, [exercises, muscleFilter]);

  const { recommended, others } = useMemo(() => {
    if (muscleFilter || recommendedMuscles.length === 0) {
      return { recommended: [], others: filteredExercises };
    }
    const rec = filteredExercises.filter(
      (e) => e.muscle_group && recommendedMuscles.includes(e.muscle_group as MuscleGroup)
    );
    const oth = filteredExercises.filter(
      (e) => !e.muscle_group || !recommendedMuscles.includes(e.muscle_group as MuscleGroup)
    );
    return { recommended: rec, others: oth };
  }, [filteredExercises, muscleFilter, recommendedMuscles]);

  const handleSearch = (text: string) => {
    setQuery(text);
    search(text);
  };

  const handleSelect = async (exercise: Exercise) => {
    if (!sessionId) return;
    const order = exerciseCount + 1;
    const log = await createExerciseLog(db, sessionId, exercise.id, order);
    addExercise(log.id, exercise, order);
    router.back();
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    const usageCount = await getUsageCount(exercise.id);

    // 1ere confirmation
    Alert.alert(
      t("exercisePicker.deleteTitle"),
      t("exercisePicker.deleteMessage", { name: exercise.name }),
      [
        { text: t("exercisePicker.cancel"), style: "cancel" },
        {
          text: t("exercisePicker.continue"),
          style: "destructive",
          onPress: () => {
            if (usageCount > 0) {
              // 2eme confirmation si l'exo a ete utilise
              Alert.alert(
                t("exercisePicker.warning"),
                t("exercisePicker.usedInSessions", { count: usageCount }),
                [
                  { text: t("exercisePicker.cancel"), style: "cancel" },
                  {
                    text: t("exercisePicker.deleteAnyway"),
                    style: "destructive",
                    onPress: () => {
                      // 3eme confirmation
                      Alert.alert(
                        t("exercisePicker.lastConfirmation"),
                        t("exercisePicker.irreversible"),
                        [
                          { text: t("exercisePicker.cancel"), style: "cancel" },
                          {
                            text: t("exercisePicker.deletePermanently"),
                            style: "destructive",
                            onPress: () => remove(exercise.id),
                          },
                        ]
                      );
                    },
                  },
                ]
              );
            } else {
              // 2eme confirmation (exo jamais utilise)
              Alert.alert(
                t("exercisePicker.confirmDelete"),
                t("exercisePicker.irreversible"),
                [
                  { text: t("exercisePicker.cancel"), style: "cancel" },
                  {
                    text: t("exercisePicker.delete"),
                    style: "destructive",
                    onPress: () => remove(exercise.id),
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const handleCreatePress = () => {
    if (!query.trim()) return;
    setShowMuscleGroupPicker(true);
  };

  const handleCreateConfirm = async (muscleGroup: MuscleGroup, isCable: boolean) => {
    if (!query.trim() || !sessionId) return;
    setShowMuscleGroupPicker(false);
    const exercise = await create(query.trim(), muscleGroup, isCable);
    const order = exerciseCount + 1;
    const log = await createExerciseLog(db, sessionId, exercise.id, order);
    addExercise(log.id, exercise, order);
    router.back();
  };

  const showCreateButton =
    query.trim().length > 0 &&
    !exercises.some((e) => e.name.toLowerCase() === query.trim().toLowerCase());

  const toggleMuscleFilter = (mg: MuscleGroup) => {
    setMuscleFilter((prev) => (prev === mg ? null : mg));
  };

  const renderExerciseItem = (item: Exercise) => (
    <Pressable
      key={item.id}
      onPress={() => handleSelect(item)}
      onLongPress={() => handleDeleteExercise(item)}
      delayLongPress={500}
      className="bg-card rounded-xl p-4 mb-2 border border-cardBorder active:opacity-80 flex-row items-center justify-between"
    >
      <Text className="text-base text-textPrimary flex-1">{item.name}</Text>
      {item.muscle_group && (
        <View className="bg-fill rounded-lg px-2 py-1 ml-2">
          <Text className="text-xs text-textSecondary">
            {getMuscleGroupLabel(item.muscle_group)}
          </Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <Container>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-textPrimary">
            {t("exercisePicker.title")}
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-accent text-base">{t("exercisePicker.cancel")}</Text>
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder={t("exercisePicker.searchPlaceholder")}
          autoFocus
          className="bg-fill rounded-xl px-4 py-3 text-base text-textPrimary mb-3"
          placeholderTextColor={colors.textTertiary}
        />

        {/* Chips filtre muscle group */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3 max-h-10"
        >
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setMuscleFilter(null)}
              className={`px-4 py-2 rounded-full ${
                muscleFilter === null ? "bg-accent" : "bg-fill"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  muscleFilter === null ? "text-white" : "text-textPrimary"
                }`}
              >
                {t("exercisePicker.all")}
              </Text>
            </Pressable>
            {getMuscleGroups().map((mg) => (
              <Pressable
                key={mg.value}
                onPress={() => toggleMuscleFilter(mg.value)}
                className={`px-4 py-2 rounded-full ${
                  muscleFilter === mg.value
                    ? "bg-accent"
                    : "bg-fill"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    muscleFilter === mg.value ? "text-white" : "text-textPrimary"
                  }`}
                >
                  {mg.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {showCreateButton && (
          <Pressable
            onPress={handleCreatePress}
            className="bg-fill rounded-xl p-4 mb-3 border border-accent active:opacity-80"
          >
            <Text className="text-accent font-medium">
              {t("exercisePicker.createExercise", { name: query.trim() })}
            </Text>
          </Pressable>
        )}

        <FlatList
          data={[]}
          renderItem={null}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              {recommended.length > 0 && (
                <>
                  <Text className="text-sm font-semibold text-textSecondary mb-2 mt-1">
                    {t("exercisePicker.recommended")}
                  </Text>
                  {recommended.map(renderExerciseItem)}
                  {others.length > 0 && (
                    <Text className="text-sm font-semibold text-textSecondary mb-2 mt-3">
                      {t("exercisePicker.others")}
                    </Text>
                  )}
                  {others.map(renderExerciseItem)}
                </>
              )}
              {recommended.length === 0 && others.map(renderExerciseItem)}
              {filteredExercises.length === 0 && !showCreateButton && (
                <Text className="text-center text-textTertiary mt-8">
                  {t("exercisePicker.noExercises")}
                </Text>
              )}
            </>
          }
        />
      </View>

      <MuscleGroupPicker
        visible={showMuscleGroupPicker}
        defaultValue={muscleFilter}
        exerciseName={query.trim()}
        onConfirm={handleCreateConfirm}
        onCancel={() => setShowMuscleGroupPicker(false)}
      />
    </Container>
  );
}
