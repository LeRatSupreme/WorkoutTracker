import { View, Text } from "react-native";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
}

export function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <Card className="flex-1">
      <Text className="text-xs text-textSecondary mb-1">{label}</Text>
      <View className="flex-row items-baseline">
        <Text className="text-2xl font-bold text-textPrimary">{value}</Text>
        {unit && (
          <Text className="text-sm text-textTertiary ml-1">{unit}</Text>
        )}
      </View>
    </Card>
  );
}
