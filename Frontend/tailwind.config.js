/** @type {import('tailwindcss').Config} */
// PrepTrack theme: near-black neutrals + ONE accent (electric yellow).
// Colour carries meaning only: accent = primary action / highlight,
// emerald = good, rose = problem. Everything else is greyscale.
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        // electric yellow
        accent: {
          DEFAULT: "#FFD60A",
          soft: "#FFE566",
          deep: "#E6BE00",
        },
        // backgrounds and surfaces, darkest to lightest
        ink: {
          950: "#09090B",
          900: "#0F0F12",
          800: "#16161A",
          700: "#1F1F24",
          600: "#2A2A30",
        },
      },
      boxShadow: {
        // kept for older class names; no more coloured glows
        glow: "0 0 0 1px rgba(255,214,10,0.35)",
        "glow-cyan": "0 0 0 1px rgba(255,255,255,0.12)",
        card: "0 1px 2px rgba(0,0,0,0.4)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
