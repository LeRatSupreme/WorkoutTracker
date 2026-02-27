import { View, Text, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import type { StatPeriod } from "@/db/queries/stats";

const PERIODS: { value: StatPeriod; labelKey: string }[] = [
  { value: "1W", labelKey: "period.1W" },
  { value: "1M", labelKey: "period.1M" },
  { value: "3M", labelKey: "period.3M" },
  { value: "6M", labelKey: "period.6M" },
  { value: "1Y", labelKey: "period.1Y" },
  { value: "ALL", labelKey: "period.all" },
];

interface PeriodSelectorProps {
  value: StatPeriod;
  onChange: (period: StatPeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

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
              {t(p.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}
