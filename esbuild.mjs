import * as esbuild from 'esbuild';

await esbuild.build({
  format: 'cjs',
  platform: 'node',
  minify: true,
  outdir: 'dist',
  bundle: true,
  target: 'node20',
  entryPoints: [
    'build/src/main.js',
  ],
});
