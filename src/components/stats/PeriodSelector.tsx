import { View, Text, Pressable, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
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
  return (
    <View className="flex-row gap-2 mb-4">
      {PERIODS.map((p) => (
        <Pressable
          key={p.value}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(p.value);
          }}
          className={`flex-1 py-2 rounded-lg items-center ${
            value === p.value ? "bg-accent" : "bg-fill"
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              value === p.value ? "text-white" : "text-textSecondary"
            }`}
          >
            {p.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
