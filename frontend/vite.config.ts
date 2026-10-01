/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Chomin — RPG Camera Translator',
        short_name: 'Chomin',
        description:
          'Point your camera at a Japanese RPG and get a spoken English translation.',
        lang: 'en',
        theme_color: '#0b0f1a',
        background_color: '#0b0f1a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // OCR assets are large; cache them on first use instead of precaching.
        globIgnores: ['tesseract/**'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/tesseract/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-assets',
              expiration: { maxEntries: 10 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
  },
});
