import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/s3-proxy': {
        target: 'https://minioapi.deltathings.synology.me:1983',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/s3-proxy/, '')
      }
    }
  }
})
