/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#00ff88",
          dark: "#00cc6a",
          light: "#ccffe8",
        },
        ink: {
          DEFAULT: "#050b0f",
          2: "#0d1f18",
          3: "#1a3329",
        },
        muted: "#6b8f7a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Space Grotesk", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

module.exports = config;
