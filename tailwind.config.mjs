/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9333EA', // Purple
          hover: '#7E22CE',
        },
        secondary: {
          DEFAULT: '#10B981', // Green
          hover: '#059669',
        },
      },
      borderRadius: {
        'xl': '1rem',
      },
      boxShadow: {
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}

export default config 