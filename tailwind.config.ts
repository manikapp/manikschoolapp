import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#16283F",
          light: "#22364C",
          dark: "#0F1D30"
        },
        paper: {
          DEFAULT: "#ECEEE6",
          dark: "#E2E4D9"
        },
        brass: {
          DEFAULT: "#B8892B",
          light: "#D3A94D",
          dark: "#8C6A20"
        },
        verdant: {
          DEFAULT: "#1F6F4A",
          light: "#2E8A5F",
          dark: "#154F35"
        },
        margin: {
          DEFAULT: "#A83A2E",
          light: "#C24F41"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      }
    }
  },
  plugins: []
};
export default config;
