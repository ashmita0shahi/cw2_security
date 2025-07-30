/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],

  daisyui: {
    themes: ["light", "dark"], // Available themes
    darkTheme: "dark", // Explicitly set dark theme
    baseTheme: "light", // Explicitly set light mode as default
  },
};
