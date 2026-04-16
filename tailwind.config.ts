import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0B0F1A',
          surface: '#141B2D',
          'surface-light': '#1E293B',
          border: '#2D3748',
          gold: '#C8A951',
          'gold-hover': '#D4B96A',
          'gold-muted': '#A68B3C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
