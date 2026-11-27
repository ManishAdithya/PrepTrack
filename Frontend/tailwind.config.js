/** @type {import('tailwindcss').Config} */
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
        ink: {
          950: "#05070f",
          900: "#090d1a",
          800: "#0f1526",
          700: "#161e34",
          600: "#222b45",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139,92,246,0.35), 0 8px 40px -8px rgba(139,92,246,0.55)",
        "glow-cyan": "0 0 0 1px rgba(34,211,238,0.35), 0 8px 40px -8px rgba(34,211,238,0.5)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -20px rgba(0,0,0,0.7)",
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(6%, -8%, 0) scale(1.12)" },
          "66%": { transform: "translate3d(-6%, 6%, 0) scale(0.92)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-14deg)" },
          "40%": { transform: "rotate(12deg)" },
          "60%": { transform: "rotate(-8deg)" },
          "80%": { transform: "rotate(5deg)" },
        },
        flicker: {
          "0%, 100%": { transform: "scale(1) rotate(-2deg)", filter: "brightness(1)" },
          "50%": { transform: "scale(1.12) rotate(3deg)", filter: "brightness(1.25)" },
        },
      },
      animation: {
        aurora: "aurora 22s ease-in-out infinite",
        "aurora-slow": "aurora 32s ease-in-out infinite reverse",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        flicker: "flicker 1.4s ease-in-out infinite",
        "spin-slow": "spin 12s linear infinite",
      },
    },
  },
  plugins: [],
};
