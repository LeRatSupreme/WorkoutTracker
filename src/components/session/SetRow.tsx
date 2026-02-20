import { View, Text, Pressable } from "react-native";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatReps } from "@/lib/utils";
import type { ActiveSet } from "@/store/session-store";

interface SetRowProps {
  set: ActiveSet;
  index: number;
  onRemove: () => void;
}

export function SetRow({ set, index, onRemove }: SetRowProps) {
  return (
    <View className="flex-row items-center py-2 border-b border-separator">
      <Text className="text-sm text-textTertiary w-10">S{index + 1}</Text>
      <Text className="text-base font-medium text-textPrimary flex-1">
        {set.weight}kg × {formatReps(set.reps)}
      </Text>
      {set.muscle_failure && <Text className="mr-1">💀</Text>}
      <StatusBadge status={set.status} size="sm" />
      <Pressable onPress={onRemove} className="ml-3 p-1">
        <Text className="text-textTertiary text-lg">✕</Text>
      </Pressable>
    </View>
  );
}
