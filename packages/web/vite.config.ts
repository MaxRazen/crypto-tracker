import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { heyApiPlugin } from '@hey-api/vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    heyApiPlugin({
      config: {
        input: 'http://localhost:3333/api-json',
        output: {
          path: 'src/api/gen',
          postProcess: ['biome:format'],
        },
        plugins: ['@hey-api/typescript'],
      },
    }),
  ],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
});
