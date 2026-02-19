import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'], // Chemin vers le fichier créé ci-dessus
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});