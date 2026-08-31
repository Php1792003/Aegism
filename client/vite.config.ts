import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  },
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3001,
    allowedHosts: ['aegism.online', 'www.aegism.online'],
    fs: {
      allow: ['..']
    }
  },
  preview: {
    allowedHosts: ['aegism.online', 'www.aegism.online'],
    host: '0.0.0.0',
    port: 3001,
  },
})
