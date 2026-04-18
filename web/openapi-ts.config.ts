import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:3333/api-json',
  output: {
    path: 'src/api/gen',
    postProcess: ['biome:format'],
  },
  plugins: ['@hey-api/typescript'],
});
