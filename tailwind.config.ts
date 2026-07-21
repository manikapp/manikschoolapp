import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C1C1A",
        paper: "#FAFAF7",
        accent: "#0F6E56"
      }
    }
  },
  plugins: []
};
export default config;
