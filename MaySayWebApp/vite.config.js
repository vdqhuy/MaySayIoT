// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd()); // load biến môi trường
  const API_URL = env.VITE_API_URL;

  return {
    plugins: [react()],
    base: './',
    server: {
      proxy: {
        '/status': API_URL,
        '/set-threshold': API_URL,
        '/set-fan-status': API_URL,
        '/set-fan-mode': API_URL,
        '/set-fan-schedule': API_URL,
      }
    }
  }
});
