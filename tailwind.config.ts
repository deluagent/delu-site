import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#0a0a0f",
        surface: "#111118",
        border:  "#1e1e2e",
        accent:  "#6366f1",
        green:   "#22c55e",
        red:     "#ef4444",
        muted:   "#6b7280",
        text:    "#e2e8f0",
      },
      fontFamily: { mono: ["JetBrains Mono", "Fira Code", "monospace"] }
    }
  },
  plugins: []
};
export default config;
