import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

/*
 * Tema claro/oscuro con variables CSS: cada color de estas escalas apunta a una variable.
 * En oscuro la variable tiene el tono normal; en claro tiene el tono "espejo" (300 ↔ 700, 100 ↔ 900...).
 * Así "text-slate-100" es texto claro en modo oscuro y texto oscuro en modo claro, sin tocar los componentes.
 */
const ESCALAS = ['slate', 'emerald', 'red', 'amber', 'sky', 'violet', 'cyan'];
const PASOS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const espejo = (paso) => PASOS[PASOS.length - 1 - PASOS.indexOf(paso)];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');
const v = (nombre) => `rgb(var(--c-${nombre}) / <alpha-value>)`;

const escalas = Object.fromEntries(ESCALAS.map((e) => [e, Object.fromEntries(PASOS.map((p) => [p, v(`${e}-${p}`)]))]));
const variables = (modo) => Object.fromEntries(ESCALAS.flatMap((e) =>
  PASOS.map((p) => [`--c-${e}-${p}`, rgb(colors[e][modo === 'oscuro' ? p : espejo(p)])])));

const MARCA = {
  oscuro: { fondo: '#0b0f17', panel: '#111726', borde: '#1f2937', acento: '#22d3ee', 'acento-fuerte': '#06b6d4', violeta: '#a78bfa', blanco: '#ffffff' },
  claro: { fondo: '#f4f7fb', panel: '#ffffff', borde: '#e2e8f0', acento: '#0891b2', 'acento-fuerte': '#0e7490', violeta: '#7c3aed', blanco: '#0f172a' },
};
const marca = (modo) => Object.fromEntries(Object.entries(MARCA[modo]).map(([k, hex]) => [`--c-${k}`, rgb(hex)]));

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...escalas,
        white: v('blanco'),
        fondo: v('fondo'),
        panel: v('panel'),
        borde: v('borde'),
        acento: { DEFAULT: v('acento'), fuerte: v('acento-fuerte') },
        violeta: v('violeta'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        brillo: '0 0 0 1px rgb(var(--c-acento) / .35), 0 8px 30px -8px rgb(var(--c-acento) / .35)',
      },
      keyframes: {
        aparecer: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { aparecer: 'aparecer .35s ease-out both' },
    },
  },
  plugins: [
    plugin(({ addBase }) => addBase({
      ':root': { ...variables('claro'), ...marca('claro'), colorScheme: 'light' },
      '.dark': { ...variables('oscuro'), ...marca('oscuro'), colorScheme: 'dark' },
    })),
  ],
};
