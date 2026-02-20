import { Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: "bg-accent active:opacity-80", text: "text-white" },
  secondary: { bg: "bg-fill active:opacity-80", text: "text-accent" },
  destructive: { bg: "bg-destructive active:opacity-80", text: "text-white" },
  ghost: { bg: "bg-transparent active:opacity-60", text: "text-accent" },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  fullWidth = false,
  compact = false,
}: ButtonProps) {
  const { bg, text } = variantStyles[variant];
  const heightClass = compact ? "py-3.5" : "h-btn";

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled}
      className={`rounded-pill px-6 items-center justify-center ${bg} ${heightClass} ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50" : ""}`}
    >
      <Text className={`text-base font-semibold ${text}`}>{title}</Text>
    </Pressable>
  );
}
