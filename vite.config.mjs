import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        tioAceite: resolve(import.meta.dirname, 'games/tio-aceite/index.html'),
        elTarro: resolve(import.meta.dirname, 'games/el-tarro/index.html'),
        elTiempoEsOro: resolve(import.meta.dirname, 'games/el-tiempo-es-oro/index.html'),
        elTesoroDeCoquimbo: resolve(import.meta.dirname, 'games/el-tesoro-de-coquimbo/index.html'),
      },
    },
  },
});
