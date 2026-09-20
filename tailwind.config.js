/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eatm: {
          green: {
            50: '#f2f9f5',
            100: '#e1f2e8',
            200: '#c3e4d1',
            300: '#96cfb2',
            400: '#5fae8a',
            500: '#389169',
            600: '#277452',
            700: '#1e5d42',
            800: '#0f5132', // standard dark emerald
            900: '#0b4627', // reference primary forest green
            950: '#052716',
          },
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            500: '#ef4444',
            600: '#dc2626', // reference crimson accent
            700: '#b91c1c',
            800: '#991b1b',
          },
          bg: '#f8faf9',
          surface: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'floating': '0 20px 25px -5px rgba(11, 70, 39, 0.1), 0 8px 10px -6px rgba(11, 70, 39, 0.1)',
      }
    },
  },
  plugins: [],
}
