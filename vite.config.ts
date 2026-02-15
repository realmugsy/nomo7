import { defineConfig } from 'vite'
//import sitemap from 'vite-plugin-sitemap'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3100',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3100',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    //sitemap({
    //  hostname: "https://nonogramworld.com",
    // Optional: exclude specific pages
    //  exclude: ['/thank-you.html'],
    // Optional: change sitemap.xml location
    // sitemap: 'public/sitemap.xml',
    //}),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        map: resolve(__dirname, 'map.html'),
        rules: resolve(__dirname, 'rules.html'),
        contacts: resolve(__dirname, 'contacts.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        leaderboard: resolve(__dirname, 'leaderboard.html'),
      },
    },
  },
})