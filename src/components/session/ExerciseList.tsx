import { View, Text, Pressable, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import type { ActiveExercise } from "@/store/session-store";

interface ExerciseListProps {
  exercises: ActiveExercise[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onLongPress?: (logId: string, exerciseName: string) => void;
}

export function ExerciseList({ exercises, currentIndex, onSelect, onLongPress }: ExerciseListProps) {
  if (exercises.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2 px-1">
        {exercises.map((ex, index) => (
          <Pressable
            key={ex.logId}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(index);
            }}
            onLongPress={() => onLongPress?.(ex.logId, ex.exercise.name)}
            className={`px-4 py-2 rounded-full ${
              index === currentIndex
                ? "bg-accent"
                : "bg-fill"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                index === currentIndex ? "text-white" : "text-textPrimary"
              }`}
            >
              {ex.exercise.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
