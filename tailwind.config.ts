import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        orange: "rgb(var(--orange) / <alpha-value>)",
        green: "rgb(var(--green) / <alpha-value>)",
        yellow: "rgb(var(--yellow) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)"
      },
      borderRadius: {
        xl: "var(--r-xl)",
        "2xl": "var(--r-2xl)",
        "3xl": "var(--r-3xl)"
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        glow: "var(--shadow-glow)"
      }
    },
  },
  plugins: [],
} satisfies Config;
