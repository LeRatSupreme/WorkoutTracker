import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import type { LastPerformanceSet } from "@/types";
import { STATUS_EMOJI, formatReps, timeAgo } from "@/lib/utils";

interface LastPerformanceCardProps {
  sets: LastPerformanceSet[];
}

export function LastPerformanceCard({ sets }: LastPerformanceCardProps) {
  const { t } = useTranslation();
  if (sets.length === 0) {
    return (
      <Card className="mb-4">
        <Text className="text-sm text-textTertiary">
          {t("exercise.firstTime")}
        </Text>
      </Card>
    );
  }

  const sessionDate = sets[0]?.session_date;

  // Series de la derniere seance uniquement, triees par order
  const lastSessionSets = sets
    .filter((s) => s.session_date === sessionDate)
    .sort((a, b) => a.order - b.order);

  // PR = meilleure serie (poids max, puis reps max si egalite)
  const bestOrder = lastSessionSets.reduce((best, s) =>
    s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best
  ).order;

  return (
    <Card className="mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-textSecondary">{t("exercise.lastTime")}</Text>
        {sessionDate && (
          <Text className="text-xs text-textTertiary">{timeAgo(sessionDate)}</Text>
        )}
      </View>
      {[
        lastSessionSets.find((s) => s.order === bestOrder)!,
        ...lastSessionSets.filter((s) => s.order !== bestOrder),
      ].map((s) => {
        const isBest = s.order === bestOrder;
        return (
          <View key={s.order} className="flex-row items-center py-1">
            <Text className={`text-xs w-8 ${isBest ? "font-semibold text-warning" : "text-textTertiary"}`}>
              {isBest ? t("exercise.pr") : `${t("exercise.setPrefix")}${s.order}`}
            </Text>
            <Text className="text-sm font-medium text-textPrimary flex-1">
              {s.weight}kg × {formatReps(s.reps)}
            </Text>
            <Text>{STATUS_EMOJI[s.status]}</Text>
          </View>
        );
      })}
    </Card>
  );
}
