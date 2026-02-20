/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        card: "var(--color-card)",
        cardBorder: "var(--color-card-border)",
        textPrimary: "var(--color-text-primary)",
        textSecondary: "var(--color-text-secondary)",
        textTertiary: "var(--color-text-tertiary)",
        fill: "var(--color-fill)",
        separator: "var(--color-separator)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        destructive: "var(--color-destructive)",
      },
      borderRadius: {
        pill: "28px",
      },
      height: {
        btn: "56px",
        input: "50px",
      },
    },
  },
  plugins: [],
};
