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
        // Deep cosmic canvas
        night: {
          950: "#07050D",
          900: "#0B0713",
          800: "#120C1F",
          700: "#1A1330",
          600: "#241A42",
          500: "#322553",
        },
        // Refined premium gold (not neon)
        gold: {
          100: "#F7ECC9",
          200: "#EDD9A3",
          300: "#E2C77C",
          400: "#D4AF37", // primary
          500: "#C9A24B",
          600: "#A9822F",
        },
        // Muted amethyst accent (used sparingly)
        amethyst: {
          300: "#B7A6F0",
          400: "#9B86E6",
          500: "#7C5CFF",
          600: "#5D43C9",
        },
        ink: {
          50: "#F6F4FF", // headings
          100: "#E8E4F5",
          200: "#D7D2E8",
          300: "#C4BEDA",
          400: "#A9A2C0", // body
          600: "#726B8C", // muted
        },
        // Legacy aliases kept so existing classes don't break mid-migration
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
        mystical: { dark: "#0B0713", purple: "#7C5CFF", gold: "#D4AF37" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        "4xl": "2rem",
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(212,175,55,0.25), 0 8px 40px -12px rgba(212,175,55,0.35)",
        glass: "0 8px 32px -8px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg,#F7ECC9 0%,#D4AF37 45%,#A9822F 100%)",
        "radial-night":
          "radial-gradient(ellipse at top, rgba(124,92,255,0.12), transparent 60%)",
      },
      animation: {
        glow: "glow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 1px rgba(212,175,55,0.25)" },
          "50%": { boxShadow: "0 0 24px -2px rgba(212,175,55,0.45)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
