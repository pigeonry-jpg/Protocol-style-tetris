import { defineConfig } from 'vite';

const githubPagesBase = '/Protocol-style-tetris/';

export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? githubPagesBase : '/',
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
}));
