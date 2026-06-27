import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./state/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        paper: "#f7f8fa",
        paytmBlue: "#00baf2",
        trustBlue: "#0f4a8a",
        mint: "#1bbf89",
        saffron: "#f59e0b"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
