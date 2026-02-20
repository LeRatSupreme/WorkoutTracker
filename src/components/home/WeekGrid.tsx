import { View, Text } from "react-native";
import type { WeekDay } from "@/hooks/useWeekActivity";

interface WeekGridProps {
  days: WeekDay[];
  sessionCount: number;
}

export function WeekGrid({ days, sessionCount }: WeekGridProps) {
  return (
    <View>
      <Text className="text-sm font-medium text-textSecondary mb-3">
        Cette semaine
      </Text>
      <View className="flex-row justify-between mb-2">
        {days.map((day) => (
          <View
            key={day.date}
            className={`items-center justify-center w-10 h-14 rounded-xl ${
              day.isToday ? "border-2 border-accent" : ""
            } ${day.hasSession ? "bg-accent" : "bg-fill"}`}
          >
            <Text
              className={`text-xs font-medium mb-1 ${
                day.hasSession ? "text-white" : "text-textTertiary"
              }`}
            >
              {day.label}
            </Text>
            <Text className={day.hasSession ? "text-white" : "text-textTertiary"}>
              {day.hasSession ? "●" : "·"}
            </Text>
          </View>
        ))}
      </View>
      <Text className="text-xs text-textTertiary">
        {sessionCount === 0
          ? "Aucune séance cette semaine"
          : `${sessionCount} séance${sessionCount > 1 ? "s" : ""} cette semaine`}
      </Text>
    </View>
  );
}
