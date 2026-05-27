/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        docuverve: {
          50:  '#f0f0ff',
          100: '#e2e2ff',
          200: '#c8c8ff',
          300: '#a3a3ff',
          400: '#7c7cf8',
          500: '#6060ef',
          600: '#5050e3',
          700: '#4242c8',
          800: '#3838a0',
          900: '#2f2f7a',
          950: '#1e1e52',
        },
      },
      animation: {
        'fade-in':        'fadeIn 0.3s ease-out',
        'slide-up':       'slideUp 0.35s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow':     'pulse 3s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'float':          'float 6s ease-in-out infinite',
        'glow':           'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:      { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float:        { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        glow:         { '0%': { boxShadow: '0 0 20px rgba(96,96,239,0.3)' }, '100%': { boxShadow: '0 0 40px rgba(96,96,239,0.6)' } },
      },
      backgroundImage: {
        'grid-pattern':     'linear-gradient(rgba(96,96,239,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(96,96,239,0.05) 1px, transparent 1px)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      },
      backgroundSize: {
        'grid':    '40px 40px',
        'shimmer': '200% 100%',
      },
    },
  },
  plugins: [],
};
