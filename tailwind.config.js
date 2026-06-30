/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#080d18",
          900: "#0b1220",
          800: "#111b2e",
        },
        lime: {
          300: "#bef264",
          400: "#a3e635",
          500: "#84cc16",
        },
      },
      boxShadow: {
        glow: "0 20px 60px -25px rgba(132, 204, 22, .35)",
        card: "0 10px 35px -18px rgba(15, 23, 42, .18)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
