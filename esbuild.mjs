import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/index.ts'],
  platform: 'node',
  bundle: true,
  target: ['node16'],
  packages: 'external',
  tsconfig: './tsconfig.json',
  outfile: 'dist/index.js',
  format: 'esm',
})
