import { Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import type { SetStatus } from "@/types";

interface StatusBadgeProps {
  status: SetStatus;
  selected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
}

const config: Record<SetStatus, { emoji: string; bg: string; selectedBg: string }> = {
  success: { emoji: "✅", bg: "bg-fill", selectedBg: "bg-success/15 border-success" },
  partial: { emoji: "🟨", bg: "bg-fill", selectedBg: "bg-warning/15 border-warning" },
  fail: { emoji: "🟥", bg: "bg-fill", selectedBg: "bg-destructive/15 border-destructive" },
};

export function StatusBadge({ status, selected = false, onPress, size = "md" }: StatusBadgeProps) {
  const { emoji, bg, selectedBg } = config[status];
  const sizeClass = size === "sm" ? "w-8 h-8" : "w-12 h-12";
  const textSize = size === "sm" ? "text-sm" : "text-lg";

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        className={`${sizeClass} rounded-xl items-center justify-center border ${
          selected ? selectedBg : `${bg} border-transparent`
        }`}
      >
        <Text className={textSize}>{emoji}</Text>
      </Pressable>
    );
  }

  return (
    <Text className={textSize}>{emoji}</Text>
  );
}
