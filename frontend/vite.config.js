import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // PWA: se puede "instalar" en el celular y abre aunque la red falle (la tienda, no los datos)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'tema.js', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Voltec · Tecnología',
        short_name: 'Voltec',
        description: 'Laptops, celulares y accesorios con stock en tiempo real',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        theme_color: '#0b0f17',
        background_color: '#0b0f17',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico}'],
        runtimeCaching: [
          // Fotos de productos servidas por Voltec: rara vez cambian
          { urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/img/'), handler: 'CacheFirst',
            options: { cacheName: 'imagenes', expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 3600 } } },
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: 'StaleWhileRevalidate', options: { cacheName: 'fuentes' } },
          // La API NUNCA se guarda en caché: precios y stock deben ser siempre los reales
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
