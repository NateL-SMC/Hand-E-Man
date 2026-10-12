/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#F59E0B",
        navy: "#0F172A",
        surface: "#F8FAFC",
        line: "#E2E8F0",
        muted: "#64748B",
      },
    },
  },
  plugins: [],
};
