import { View, StyleSheet } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useTheme } from "@/hooks/useTheme";
import type { ReactNode } from "react";

type CardVariant = "default" | "elevated" | "glow";

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
  variant?: CardVariant;
}

const glassAvailable = isLiquidGlassAvailable();

export function Card({
  children,
  className = "",
  glass = false,
  variant = "default",
}: CardProps) {
  const { colors } = useTheme();

  if (glass && glassAvailable) {
    return (
      <GlassView
        glassEffectStyle="regular"
        style={styles.glass}
        className={`rounded-2.5xl p-4 ${className}`}
      >
        {children}
      </GlassView>
    );
  }

  const variantStyle =
    variant === "glow"
      ? {
        borderColor: colors.accent + "30",
        backgroundColor: colors.cardHighlight,
        shadowColor: colors.accent,
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }
      : variant === "elevated"
        ? {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }
        : {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        };

  return (
    <View
      style={[styles.card, variantStyle]}
      className={`rounded-2.5xl p-4 ${className}`}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: "hidden",
  },
  card: {
    borderWidth: 1,
  },
});
