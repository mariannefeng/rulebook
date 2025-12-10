// tailwind.config.js
const { heroui, colors } = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/components/input.js",
    "./node_modules/@heroui/theme/dist/components/(input|form).js",
  ],
  theme: {},
  darkMode: "class",
  plugins: [heroui()],
};
