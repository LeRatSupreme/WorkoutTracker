import { useColorScheme } from "nativewind";
import { usePreferences } from "@/hooks/usePreferences";
import { ACCENT_PRESETS } from "@/lib/constants";

const lightColors = {
  accent: "#007AFF",
  background: "#F2F2F7",
  card: "#FFFFFF",
  cardBorder: "rgba(0,0,0,0.04)",
  cardHighlight: "rgba(0,122,255,0.06)",
  glow: "rgba(0,122,255,0.15)",
  surface: "#F7F7FA",
  textPrimary: "#000000",
  textSecondary: "#6B6B80",
  textTertiary: "#AEAEB2",
  fill: "rgba(120,120,128,0.08)",
  separator: "rgba(60,60,67,0.08)",
  success: "#34C759",
  warning: "#FF9500",
  destructive: "#FF3B30",
};

const darkColors: typeof lightColors = {
  accent: "#0A84FF",
  background: "#0A0A0F",
  card: "#16161E",
  cardBorder: "rgba(255,255,255,0.06)",
  cardHighlight: "rgba(10,132,255,0.08)",
  glow: "rgba(10,132,255,0.2)",
  surface: "#1C1C26",
  textPrimary: "#F5F5F7",
  textSecondary: "#8E8E93",
  textTertiary: "#48484A",
  fill: "rgba(120,120,128,0.2)",
  separator: "rgba(255,255,255,0.06)",
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
