/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          50: '#e6ffe6',
          100: '#b3ffb3',
          200: '#80ff80',
          300: '#4dff4d',
          400: '#26ff26',
          500: '#00ff41',
          600: '#00cc34',
          700: '#009926',
          800: '#006619',
          900: '#00330d',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(0,255,65,0.5), 0 0 30px rgba(0,255,65,0.25)',
        'neon-lg': '0 0 25px rgba(0,255,65,0.55), 0 0 80px rgba(0,255,65,0.25)',
      },
      animation: {
        scanline: 'scanline 6s linear infinite',
        flicker: 'flicker 3s linear infinite',
        breathe: 'breathe 4s ease-in-out infinite',
        slowspin: 'slowspin 60s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%,19%,21%,23%,25%,54%,56%,100%': { opacity: '1' },
          '20%,24%,55%': { opacity: '0.35' },
        },
        breathe: {
          '0%,100%': { opacity: '0.55', filter: 'blur(40px)' },
          '50%': { opacity: '0.9', filter: 'blur(60px)' },
        },
        slowspin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
