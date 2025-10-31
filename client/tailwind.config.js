/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "var(--color-base)",
        surface: "var(--color-surface)",
        surfaceSoft: "var(--color-surface-soft)",
        surfaceAlt: "var(--color-surface-alt)",
        border: "var(--color-border)",
        textPrimary: "var(--color-text-primary)",
        textMuted: "var(--color-text-muted)",
        accent: "var(--color-accent)",
      },
      boxShadow: {
        card: "0 18px 40px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

