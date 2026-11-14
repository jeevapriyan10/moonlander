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
        space: {
          bg: "#05070D",
          panel: "#0B1020",
          "panel-elevated": "#0F162B",
          border: "#1B2440",
          "border-subtle": "#131A30",
          "border-active": "#2E3D66",
        },
        telemetry: {
          amber: "#FFB000",
          cyan: "#4FD1FF",
          green: "#4ADE80",
          orange: "#FF8A3D",
          red: "#FF4D4F",
        },
      },
      fontFamily: {
        heading: ["var(--font-barlow-condensed)", "sans-serif"],
        body: ["var(--font-inter-tight)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        "glow-amber": "0 0 12px -2px rgba(255, 176, 0, 0.35)",
        "glow-cyan": "0 0 12px -2px rgba(79, 209, 255, 0.35)",
        "glow-green": "0 0 12px -2px rgba(74, 222, 128, 0.35)",
        "glow-red": "0 0 12px -2px rgba(255, 77, 79, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
