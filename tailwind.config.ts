import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F14",
        card: "#101826",
        card2: "#0E1622",
        text: "#E6EEF8",
        muted: "#93A4B7",
        accent: "#5EEAD4",
        danger: "#FB7185",
        warning: "#FBBF24"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;



