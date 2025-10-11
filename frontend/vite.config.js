import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 禁用缓存
            proxyRes.headers['cache-control'] = 'no-cache, no-store, must-revalidate'
            proxyRes.headers['pragma'] = 'no-cache'
            proxyRes.headers['expires'] = '0'
          })
        }
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
