/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        workbench: {
          bg: "#0d1117",
          rail: "#0a0e14",
          panel: "#141a23",
          panel2: "#1a2230",
          line: "#273244",
          text: "#edf4ff",
          muted: "#94a3b8",
          accent: "#52d6c5",
          blue: "#7aa2ff",
          warn: "#f4c95d",
          danger: "#ff6b6b"
        }
      },
      boxShadow: {
        soft: "0 24px 80px rgba(0, 0, 0, 0.24)"
      },
      borderRadius: {
        workbench: "8px"
      },
      animation: {
        "fade-in": "fadeIn 180ms ease-out",
        "slide-up": "slideUp 220ms ease-out"
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};
