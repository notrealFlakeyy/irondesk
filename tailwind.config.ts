import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Barlow Condensed'", "sans-serif"],
        body: ["'Barlow'", "sans-serif"],
        mono: ["'Share Tech Mono'", "monospace"],
      },
      colors: {
        iron: {
          50:  "#e8e6e0",
          100: "#a8a69f",
          200: "#6b6960",
          300: "#363632",
          400: "#2e2e2b",
          500: "#272724",
          600: "#1f1f1d",
          700: "#181816",
          800: "#0f0f0e",
        },
        amber: {
          pos: "#e8a020",
          dim: "#c07010",
        },
      },
    },
  },
  plugins: [],
};
export default config;
