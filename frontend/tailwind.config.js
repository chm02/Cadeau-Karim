/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Poppins"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        accent: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        neutral: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0,0,0,0.05)',
        'card': '0 8px 24px -10px rgba(249, 115, 22, 0.15), 0 2px 8px rgba(0,0,0,0.05)',
        'card-hover': '0 20px 40px -15px rgba(249, 115, 22, 0.30), 0 8px 20px rgba(0,0,0,0.08)',
        'glow-brand': '0 0 0 4px rgba(249, 115, 22, 0.15)',
        'drawer': '-20px 0 60px -20px rgba(0,0,0,0.25)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        'hero-gradient': 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fef3c7 100%)',
        'accent-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #fb923c 0%, #f97316 40%, #ec4899 100%)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-in-right': { '0%': { transform: 'translateX(110%)' }, '100%': { transform: 'translateX(0)' } },
        'slide-out-right': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(110%)' } },
        'slide-in-up': { '0%': { transform: 'translateY(24px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        'bounce-soft': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
        'shimmer': {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(.2,.8,.2,1)',
        'slide-out-right': 'slide-out-right 0.3s ease-in',
        'slide-in-up': 'slide-in-up 0.4s ease-out both',
        'bounce-soft': 'bounce-soft 0.4s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
