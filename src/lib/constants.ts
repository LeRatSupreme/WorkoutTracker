export const ACCENT_PRESETS = {
  blue: { light: "#007AFF", dark: "#0A84FF" },
  red: { light: "#EF4444", dark: "#F87171" },
  purple: { light: "#8B5CF6", dark: "#A78BFA" },
  green: { light: "#10B981", dark: "#34D399" },
  orange: { light: "#F59E0B", dark: "#FBBF24" },
  pink: { light: "#EC4899", dark: "#F472B6" },
  teal: { light: "#14B8A6", dark: "#2DD4BF" },
  indigo: { light: "#6366F1", dark: "#818CF8" },
} as const;

export type AccentKey = keyof typeof ACCENT_PRESETS;

export const DEFAULT_ACCENT_KEY: AccentKey = "red";
