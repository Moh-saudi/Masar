/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sovereign: {
          darkest: '#0B1120',
          navy: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          light: '#F8FAFC',
        },
        health: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          900: '#0C4A6E',
        },
        safety: {
          green: '#10B981',
          light: '#DCFCE7',
        },
        alert: {
          red: '#E11D48',
          light: '#FEE2E2',
        },
        warn: {
          amber: '#D97706',
          light: '#FEF3C7',
        }
      },
      fontFamily: {
        arabic: ['"Almarai"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
