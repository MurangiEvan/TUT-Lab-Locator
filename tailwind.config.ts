import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './frontend/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tut-red': {
          50: '#fdecef',
          100: '#fbd2db',
          200: '#f6a3b4',
          300: '#ef6f8a',
          400: '#e23a5f',
          500: '#d12445',
          600: '#c8102e',
          700: '#a30d25',
          800: '#7e0a1c',
          900: '#5b0714',
          950: '#380409',
        },
        'tut-blue': {
          50: '#e6edf3',
          100: '#bccfdf',
          200: '#8aacc6',
          300: '#5889ac',
          400: '#346c93',
          500: '#1a547a',
          600: '#003366',
          700: '#002a52',
          800: '#00203d',
          900: '#00172a',
          950: '#000e19',
        },
      },
    },
  },
  plugins: [],
};

export default config;
