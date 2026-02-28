import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Force immediate service worker activation - no waiting
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Acervo - Biblioteca Digital',
        short_name: 'Acervo',
        description: 'Sua biblioteca pessoal de e-books e audiobooks',
        theme_color: '#f5f2eb',
        background_color: '#f5f2eb',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Skip waiting — new SW takes control immediately without user needing to close tabs
        skipWaiting: true,
        clientsClaim: true,
        // Don't cache HTML — always fetch fresh so updates are instant
        navigateFallback: null,
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        // JS and CSS: network first so updates are always loaded
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            // Google Drive API calls — never cache, always network
            urlPattern: /^https:\/\/www\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
})
