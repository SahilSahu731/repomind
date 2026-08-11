/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './extension/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)'
      },
      maxWidth: {
        '280': '70rem',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        28: '7rem'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    },
  },
  plugins: [],
};
