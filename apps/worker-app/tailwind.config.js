const tokens = require('./src/utils/theme.tokens.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        secondary: tokens.colors.secondary,
        accent: tokens.colors.accent,
        surfaceSoft: tokens.colors.surfaceSoft,
        textPrimary: tokens.colors.textPrimary,
        baseDark: tokens.colors.baseDark,
        positive: tokens.colors.positive,
        caution: tokens.colors.caution,
        negative: tokens.colors.negative,
      },
    },
  },
  plugins: [],
};
