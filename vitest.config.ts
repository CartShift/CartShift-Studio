import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '**/node_modules/**', 'functions/node_modules', '.next', 'out', 'build_out'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  ssr: {
    noExternal: ['next-intl'],
  },
});
