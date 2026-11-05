import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    host: true,
    proxy: (process.env.VITE_API_URL || process.env.VITE_API_BACKEND_URL) ? {
      '/api': {
        target: process.env.VITE_API_URL || process.env.VITE_API_BACKEND_URL,
        changeOrigin: true,
      },
    } : undefined,
  },
  preview: {
    port: 5273,
    host: true,
  },
});
