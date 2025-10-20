/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        secondary: "var(--secondary)",
        terciary: "var(--terciary)",
        border: "var(--border)",
        tag: "var(--tag)",
        "tag-back": "var(--tag-back)",
      },
      fontFamily: {
        inter: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 0 15px var(--shadow)",
      },
    },
  },
  plugins: [],
}
