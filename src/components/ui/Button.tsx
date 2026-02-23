import { View, Pressable, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  fullWidth = false,
  compact = false,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const heightClass = compact ? "py-3.5" : "h-btn";

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (variant === "primary") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
            shadowColor: colors.accent,
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          },
        ]}
        className={`${fullWidth ? "w-full" : ""}`}
      >
        <LinearGradient
          colors={[colors.accent, adjustColor(colors.accent, -30)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={`rounded-pill px-6 items-center justify-center flex-row gap-2 ${heightClass}`}
        >
          {icon}
          <Text className="text-base font-bold text-white">{title}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  const variantStyles: Record<
    Exclude<ButtonVariant, "primary">,
    { bg: string; text: string }
  > = {
    secondary: { bg: "bg-fill active:opacity-80", text: "text-accent" },
    destructive: {
      bg: "bg-destructive active:opacity-80",
      text: "text-white",
    },
    ghost: { bg: "bg-transparent active:opacity-60", text: "text-accent" },
  };

  const { bg, text } = variantStyles[variant];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={`rounded-pill px-6 items-center justify-center flex-row gap-2 ${bg} ${heightClass} ${fullWidth ? "w-full" : ""
        } ${disabled ? "opacity-50" : ""}`}
    >
      {icon}
      <Text className={`text-base font-semibold ${text}`}>{title}</Text>
    </Pressable>
  );
}

/** Darken or lighten a hex color */
function adjustColor(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
