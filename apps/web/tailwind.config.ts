import type { Config } from "tailwindcss";

// Design tokens for NagarGo, pulled from the provided logo rather
// than generic defaults:
// - ink: the logo's dark navy/near-black strokes
// - route-green: the logo's road/route green, used sparingly as the
//   single accent (not as a wash or gradient decoration)
// - paper: a plain, slightly warm off-white — not the AI-cliché
//   cream (#F4F1EA) and not stark #FFFFFF either
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        "ink-soft": "#1B2536",
        "route-green": {
          DEFAULT: "#1FA24A",
          light: "#3DD673",
          dark: "#137A38",
        },
        paper: "#F6F7F5",
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
