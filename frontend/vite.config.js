import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Geliştirmede /api ve /media istekleri Django'ya yönlendirilir. Böylece ön yüz ile
// API aynı kökenden (origin) çalışır; production'da da Django ikisini birlikte sunar.
const backend = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
      '/media': backend,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
})
