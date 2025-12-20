/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#28a745',
          dark: '#218838',
          light: '#34ce57',
        },
        secondary: {
          DEFAULT: '#6c757d',
        },
        danger: {
          DEFAULT: '#dc3545',
        },
        success: {
          DEFAULT: '#28a745',
        },
        warning: {
          DEFAULT: '#ffc107',
        },
        info: {
          DEFAULT: '#17a2b8',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
    },
  },
  plugins: [],
}
