import type { Config } from "tailwindcss";

const config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter var", "Inter", "system-ui", "sans-serif"],
        display: ["Inter var", "Inter", "system-ui", "sans-serif"],
        jakarta: ["Inter var", "Inter", "system-ui", "sans-serif"],
        sora: ["Inter var", "Inter", "system-ui", "sans-serif"],
        mono: ["Inter var", "Inter", "system-ui", "sans-serif"],
        heading: ["Inter var", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ─── Brand: Violet ───
        brand: {
          50:  "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        // ─── Surfaces ───
        surface: {
          DEFAULT: "#FFFFFF",
          subtle:  "#F8F7FF",
          raised:  "#FFFFFF",
          overlay: "rgba(248,247,255,0.85)",
        },
        // ─── Semantic ───
        gain:  { DEFAULT: "#059669", subtle: "#ECFDF5", text: "#065F46" },
        loss:  { DEFAULT: "#DC2626", subtle: "#FEF2F2", text: "#991B1B" },
        warn:  { DEFAULT: "#D97706", subtle: "#FFFBEB", text: "#92400E" },
        // ─── Ink palette ───
        ink: {
          primary:   "#0F0E17",
          secondary: "#4B4963",
          tertiary:  "#8B89A0",
          disabled:  "#C4C2D4",
        },
        // ─── Edges ───
        edge: {
          subtle: "rgba(0,0,0,0.06)",
          base:   "rgba(0,0,0,0.10)",
          strong: "rgba(0,0,0,0.18)",
        },
      },
      fontSize: {
        "display-lg": ["2.75rem", { lineHeight: "1.1",  letterSpacing: "-0.04em",  fontWeight: "600" }],
        "display-md": ["2rem",    { lineHeight: "1.15", letterSpacing: "-0.03em",  fontWeight: "600" }],
        "display-sm": ["1.375rem",{ lineHeight: "1.2",  letterSpacing: "-0.025em", fontWeight: "550" }],
        "label-xs":   ["0.6875rem",{ lineHeight: "1.4", letterSpacing: "0.07em",  fontWeight: "500" }],
      },
      boxShadow: {
        card:     "0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)",
        elevated: "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
        focus:    "0 0 0 3px rgba(124,58,237,0.18)",
      },
      borderRadius: {
        sm:   "6px",
        md:   "10px",
        lg:   "14px",
        xl:   "20px",
        pill: "999px",
        // Keep shadcn compat aliases
        "2xl": "20px",
        "3xl": "20px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
