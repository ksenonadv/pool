const plugin = require('tailwindcss/plugin');
const { join } = require('path');

module.exports = {
  content: [
    join(__dirname, "./src/index.html"),
    join(__dirname, "./src/**/*.{html,ts}"),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    }
  },
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    }),
  ],
}
