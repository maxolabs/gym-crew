import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0B",
        card: "#141416",
        card2: "#1C1C1F",
        text: "#FAFAFA",
        muted: "#71717A",
        accent: "#6366F1",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0, 0, 0, 0.35)"
      },
      keyframes: {
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" }
        }
      },
      animation: {
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out"
      }
    }
  },
  plugins: []
} satisfies Config;



