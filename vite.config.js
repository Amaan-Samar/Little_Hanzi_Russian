import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon-196.png',
        'icons/apple-icon-180.png'
      ],
      manifest: {
        name: 'Little Hanzi Russian',
        short_name: 'Russian',
        description: 'Russian reading tool with romanization below each word',
        theme_color: '#eaf7ff',
        background_color: '#eaf7ff',
        display: 'standalone',
        scope: '/Little_Hanzi_Russian/',
        start_url: '/Little_Hanzi_Russian/',
        icons: [
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  base: '/Little_Hanzi_Russian/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    timeout: 120000,
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0'
  },
})