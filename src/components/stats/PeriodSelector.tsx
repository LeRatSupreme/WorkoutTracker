import { View, Text, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import type { StatPeriod } from "@/db/queries/stats";

const PERIODS: { value: StatPeriod; label: string }[] = [
  { value: "1W", label: "1S" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1A" },
  { value: "ALL", label: "Tout" },
];

interface PeriodSelectorProps {
  value: StatPeriod;
  onChange: (period: StatPeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(100)}
      className="flex-row gap-1.5 mb-5 p-1 rounded-2xl"
      style={{ backgroundColor: colors.fill }}
    >
      {PERIODS.map((p) => {
        const isActive = value === p.value;
        return (
          <Pressable
            key={p.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(p.value);
            }}
            className="flex-1 py-2.5 rounded-xl items-center"
            style={
              isActive
                ? {
                  backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 4,
                }
                : {}
            }
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: isActive ? "#fff" : colors.textSecondary,
              }}
            >
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}
