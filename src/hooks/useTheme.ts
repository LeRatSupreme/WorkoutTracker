import { useColorScheme } from "nativewind";
import { usePreferences } from "@/hooks/usePreferences";
import { ACCENT_PRESETS } from "@/lib/constants";

const lightColors = {
  accent: "#007AFF",
  background: "#F2F2F7",
  card: "#FFFFFF",
  cardBorder: "transparent",
  textPrimary: "#000000",
  textSecondary: "#8E8E93",
  textTertiary: "#C7C7CC",
  fill: "rgba(120,120,128,0.12)",
  separator: "rgba(60,60,67,0.12)",
  success: "#34C759",
  warning: "#FF9500",
  destructive: "#FF3B30",
};

const darkColors: typeof lightColors = {
  accent: "#0A84FF",
  background: "#000000",
  card: "#1C1C1E",
  cardBorder: "rgba(255,255,255,0.1)",
  textPrimary: "#FFFFFF",
  textSecondary: "#8E8E93",
  textTertiary: "#48484A",
  fill: "rgba(120,120,128,0.24)",
  separator: "rgba(255,255,255,0.1)",
  success: "#30D158",
  warning: "#FF9F0A",
  destructive: "#FF453A",
};

export function useTheme() {
  const { colorScheme } = useColorScheme();
  const { accentKey } = usePreferences();
  const isDark = colorScheme === "dark";
  const base = isDark ? darkColors : lightColors;
  const accent = ACCENT_PRESETS[accentKey][isDark ? "dark" : "light"];
  return { colors: { ...base, accent }, isDark };
}
