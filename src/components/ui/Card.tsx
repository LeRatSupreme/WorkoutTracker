import { View, StyleSheet } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
}

const glassAvailable = isLiquidGlassAvailable();

export function Card({ children, className = "", glass = false }: CardProps) {
  if (glass && glassAvailable) {
    return (
      <GlassView
        glassEffectStyle="regular"
        style={styles.glass}
        className={`rounded-2xl p-4 ${className}`}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      className={`bg-card rounded-2xl p-4 border border-cardBorder shadow-sm ${className}`}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: "hidden",
  },
});
