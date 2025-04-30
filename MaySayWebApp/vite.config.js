import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/status': 'https://maysayiot.onrender.com',
      '/set-threshold': 'https://maysayiot.onrender.com',
      '/set-fan-status': 'https://maysayiot.onrender.com',
      '/set-fan-mode': 'https://maysayiot.onrender.com',
      '/set-fan-schedule': 'https://maysayiot.onrender.com',
    }
  }
})
