import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        mystical: {
          dark: "#1a0b2e",
          purple: "#6f42c1",
          gold: "#ffd700",
        },
      },
      animation: {
        "card-flip": "flip 0.6s ease-in-out",
        "card-glow": "glow 2s ease-in-out infinite",
      },
      keyframes: {
        flip: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px #ffd700, 0 0 10px #ffd700" },
          "50%": { boxShadow: "0 0 20px #ffd700, 0 0 30px #ffd700" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
