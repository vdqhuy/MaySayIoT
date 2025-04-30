import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/status': 'http://localhost:3000',
      '/set-threshold': 'http://localhost:3000',
      '/set-fan-status': 'http://localhost:3000',
      '/set-fan-mode': 'http://localhost:3000',
    }
  }
})
