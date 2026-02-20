import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";

interface RatingSelectorProps {
  value: number | null;
  onChange: (rating: number) => void;
}

const RATINGS = [1, 2, 3, 4, 5];

export function RatingSelector({ value, onChange }: RatingSelectorProps) {
  return (
    <View>
      <Text className="text-base font-semibold text-textPrimary mb-3">
        Difficulté ressentie
      </Text>

      <View className="flex-row items-center justify-between mb-2 px-1">
        <Text className="text-xs text-textTertiary">Facile</Text>
        <Text className="text-xs text-textTertiary">Intense</Text>
      </View>

      <View className="flex-row gap-2">
        {RATINGS.map((r) => {
          const isActive = value !== null && r <= value;
          return (
            <Pressable
              key={r}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(r);
              }}
              className={`flex-1 py-4 rounded-xl items-center ${
                isActive ? "bg-accent" : "bg-fill"
              }`}
            >
              <Text
                className={`text-lg font-bold ${
                  isActive ? "text-white" : "text-textTertiary"
                }`}
              >
                {r}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
