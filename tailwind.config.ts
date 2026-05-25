import type { Config } from "tailwindcss";

// Tokens herdados do mockup: paleta grafite (neutros) + gold (amarelo Live)
// Variante B (Editorial) usa gold como cor primária.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          50:  "#ffffff",
          100: "#f7f7f5",
          200: "#ebebe8",
          300: "#d6d6d2",
          400: "#9a9a96",
          500: "#6e6e6a",
          600: "#4a4a47",
          700: "#2e2e2c",
          800: "#161614",
          900: "#0a0a09",
        },
        gold: {
          50:  "#fffbe6",
          100: "#fff3b0",
          200: "#ffe680",
          300: "#ffd64d",
          400: "#ffcc00", // amarelo Live — primary
          500: "#d9a800",
          600: "#a37c00",
          700: "#6e5500",
        },
        emerald: {
          50:  "#ecfbf1",
          100: "#cbf2d6",
          600: "#0e8a4a",
          700: "#0a6e3b",
        },
        danger: {
          50:  "#fdf1ef",
          500: "#d9483a",
          600: "#b8392c",
          700: "#92281d",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        sm:  "0 1px 2px 0 rgb(10 10 9 / 0.06)",
        md:  "0 4px 6px -1px rgb(10 10 9 / 0.10), 0 2px 4px -2px rgb(10 10 9 / 0.08)",
        lg:  "0 10px 15px -3px rgb(10 10 9 / 0.10), 0 4px 6px -4px rgb(10 10 9 / 0.08)",
        xl:  "0 20px 25px -5px rgb(10 10 9 / 0.14), 0 8px 10px -6px rgb(10 10 9 / 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
