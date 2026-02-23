import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  delay?: number;
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  delay = 0,
}: StatCardProps) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      className="flex-1"
    >
      <Card variant="elevated">
        {icon && (
          <View
            style={[
              styles.iconBg,
              { backgroundColor: colors.accent + "12" },
            ]}
          >
            <Ionicons name={icon} size={16} color={colors.accent} />
          </View>
        )}
        <Text className="text-xs font-semibold text-textTertiary tracking-wide uppercase mb-1">
          {label}
        </Text>
        <View className="flex-row items-baseline">
          <Text className="text-2xl font-bold text-textPrimary">
            {value}
          </Text>
          {unit && (
            <Text className="text-sm text-textSecondary ml-1">{unit}</Text>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconBg: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});
