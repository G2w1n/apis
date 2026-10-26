/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fondo: '#0b0f17',
        panel: '#111726',
        borde: '#1f2937',
        acento: { DEFAULT: '#22d3ee', fuerte: '#06b6d4' },
        violeta: '#a78bfa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        brillo: '0 0 0 1px rgba(34,211,238,.35), 0 8px 30px -8px rgba(34,211,238,.35)',
      },
      keyframes: {
        aparecer: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { aparecer: 'aparecer .35s ease-out both' },
    },
  },
  plugins: [],
};
