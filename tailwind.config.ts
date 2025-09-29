import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./store/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-poppins)",
          "Poppins",
          "Arial",
          "Helvetica",
          "sans-serif",
        ],
      },
      boxShadow: {
        "explode-red": "0 0 40px 20px rgba(220,38,38,0.7)",
      },
    },
  },
  important: true,
  plugins: [],
};

export default config;
