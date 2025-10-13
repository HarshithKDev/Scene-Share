import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/heartbeat': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Keep the existing rules
      '/create-room': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/get-agora-token': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/test-token': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});