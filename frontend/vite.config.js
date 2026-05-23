import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Only proxy API calls — NOT the /ims frontend route
      '/api/clinic': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/ims/api': {
        // Only proxy /ims/api/* to backend, not /ims itself
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  }
})