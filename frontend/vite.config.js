import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy IMS API
      '/api/ims': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy Clinic API
      '/api/clinic': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy WebSocket connections for clinic
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
