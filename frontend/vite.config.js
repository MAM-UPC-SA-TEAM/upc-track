import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const nativo = mode === 'native'

  // El build nativo sirve la app desde https://localhost dentro de la WebView: una URL
  // relativa no llegaria al backend, asi que VITE_API_URL debe ser absoluta.
  if (nativo) {
    const api = (loadEnv(mode, '.', 'VITE_').VITE_API_URL || '').trim()
    if (!/^https?:[/][/]/.test(api)) {
      throw new Error('Build nativo: define VITE_API_URL con una URL absoluta (p. ej. https://upc-track.onrender.com)')
    }
  }

  return {
  plugins: [
    react(),

    // En nativo no hay service worker ni manifiesto: la app va empaquetada en el APK.
    ...(nativo ? [] : [VitePWA({
      // 'autoUpdate' registra el SW automáticamente y actualiza en segundo plano
      registerType: 'autoUpdate',

      // Incluir el SW en el build
      injectRegister: 'auto',

      // Archivos que Workbox pre-cachea (todos los assets del build)
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon-180x180.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png',
      ],

      // ── Web App Manifest ─────────────────────────────────────
      manifest: {
        name: 'UpcTrack · Tu ruta en tiempo real',
        short_name: 'UpcTrack',
        description: 'El bus universitario de la Universidad Popular del Cesar, seccional Aguachica, en tiempo real',
        theme_color: '#fbfaf4',
        background_color: '#fbfaf4',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/inicio',
        lang: 'es',
        categories: ['travel', 'utilities', 'education'],

        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'apple-touch-icon-180x180.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],

        // Atajos rápidos desde el ícono de la app (long-press en Android)
        shortcuts: [
          {
            name: 'Mapa en tiempo real',
            short_name: 'Mapa',
            description: 'Ver ubicación de buses en tiempo real',
            url: '/mapa',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Mis rutas',
            short_name: 'Rutas',
            description: 'Consultar rutas y horarios',
            url: '/rutas',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },

      // ── Workbox: estrategia de caché ─────────────────────────
      workbox: {
        // Pre-cachear todos los archivos generados por Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Rutas que NO se cachean (APIs en tiempo real y sockets)
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],

        runtimeCaching: [
          // Tiles de OpenStreetMap — Cache First (mapa funciona offline)
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // OSRM routing — Network First con fallback
          {
            urlPattern: /^https:\/\/router\.project-osrm\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'osrm-routes',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 día
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Google Fonts — Stale While Revalidate
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },

          // API del backend — Network First (siempre intenta servidor)
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }, // 5 min
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      // Dev: activar SW en desarrollo para probar
      devOptions: {
        enabled: false, // true solo si quieres testear el SW en dev
        type: 'module',
      },
    })]),
  ],

  build: {
    // En nativo se mantiene el aviso por defecto (500 kB): las paginas ya van en chunks lazy.
    ...(nativo ? {} : { chunkSizeWarningLimit: 900 }),
  },

  server: {
    port: 5173,
    allowedHosts: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  }
})
