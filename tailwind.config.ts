import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-nunito)",
          "Arial",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif"
        ]
      },
      colors: {
        cosmic: {
          void: "#070817",
          night: "#101226",
          glass: "rgba(18, 20, 42, 0.58)",
          mist: "#d8ddff",
          rose: "#ff7ab6",
          cyan: "#6ee7f9",
          gold: "#f7c66f"
        }
      },
      boxShadow: {
        glow: "0 0 42px rgba(255, 122, 182, 0.22)",
        panel: "0 24px 80px rgba(0, 0, 0, 0.38)"
      },
      backgroundImage: {
        "cosmic-radial": "radial-gradient(circle at top, rgba(255, 122, 182, 0.18), transparent 34%), radial-gradient(circle at 80% 20%, rgba(110, 231, 249, 0.2), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;
