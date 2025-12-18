import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:6263',
        changeOrigin: true,
        secure: false
      },
      '/s3-proxy': {
        target: `http://${process.env.VITE_MINIO_ENDPOINT || '192.168.86.3:8031'}`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/s3-proxy/, '')
      }
    }
  },
  define: {
    __MINIO_ENDPOINT__: JSON.stringify(process.env.VITE_MINIO_ENDPOINT || '192.168.86.3:8031')
  }
})
