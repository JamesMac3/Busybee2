import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from the root of the custom domain productoffer2.jamesmcgonigal.com,
// so assets use base '/'. (A github.io/<repo>/ URL would need base '/<repo>/'.)
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { port: 5192 },
  preview: { port: 5193 },
});
