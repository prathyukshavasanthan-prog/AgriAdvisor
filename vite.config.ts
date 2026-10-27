import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    host: true, // Listen on all local IPs (0.0.0.0)
    proxy: {
      '/api': {
        target: process.env.VITE_API_BACKEND_URL || 'http://localhost:5900',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5273,
    host: true,
  },
});
