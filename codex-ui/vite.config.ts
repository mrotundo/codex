import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4123,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4133',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:4133',
        ws: true,
      },
    },
  },
});