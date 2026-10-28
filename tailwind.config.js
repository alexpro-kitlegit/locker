/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        locker: { DEFAULT: "#2A5BD7", dark: "#1E46B0", soft: "#EEF3FD" },
        ink: "#141414",
        tile: "#F3F3F1",
        // Set per surface: Locker blue in the fan app, the club's colours in a club store.
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-2": "rgb(var(--accent-2) / <alpha-value>)",
        "on-accent": "rgb(var(--on-accent) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
