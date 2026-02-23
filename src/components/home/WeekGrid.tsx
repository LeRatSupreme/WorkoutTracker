import { View, Text, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { WeekDay } from "@/hooks/useWeekActivity";

interface WeekGridProps {
  days: WeekDay[];
  sessionCount: number;
}

export function WeekGrid({ days, sessionCount }: WeekGridProps) {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(200)}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-sm font-semibold text-textSecondary tracking-wide uppercase">
          Cette semaine
        </Text>
        <View
          className="px-2.5 py-1 rounded-full"
          style={{ backgroundColor: colors.accent + "18" }}
        >
          <Text
            className="text-xs font-bold"
            style={{ color: colors.accent }}
          >
            {sessionCount} / 7
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between">
        {days.map((day, index) => {
          const isActive = day.hasSession;
          const isToday = day.isToday;

          return (
            <Animated.View
              key={day.date}
              entering={FadeIn.duration(400).delay(100 + index * 60)}
              className="items-center"
            >
              <Text
                className="text-xs font-medium mb-2"
                style={{
                  color: isToday ? colors.accent : colors.textTertiary,
                }}
              >
                {day.label}
              </Text>
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: isActive
                      ? colors.accent
                      : colors.fill,
                    borderWidth: isToday && !isActive ? 2 : 0,
                    borderColor: colors.accent,
                    ...(isActive
                      ? {
                        shadowColor: colors.accent,
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 4,
                      }
                      : {}),
                  },
                ]}
              >
                {isActive ? (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                ) : (
                  <View
                    style={[styles.dot, { backgroundColor: colors.textTertiary + "40" }]}
                  />
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>

      <Text className="text-xs text-textTertiary mt-3 text-center">
        {sessionCount === 0
          ? "Commence ta première séance !"
          : sessionCount === 1
            ? "1 séance — bon début 💪"
            : `${sessionCount} séances — continue comme ça 🔥`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
