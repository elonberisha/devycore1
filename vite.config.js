import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    manifest: true,
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
});
