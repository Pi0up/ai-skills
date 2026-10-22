import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: false,
  plugins: [viteSingleFile()],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        preview: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  test: {
    root: resolve(__dirname),
    globals: true,
    environment: 'node',
  },
});
