const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist/index.js',
    format: 'cjs',
    external: ['@aws-sdk/*', 'aws-sdk'],
    banner: {
      js: 'exports.handler = exports.handler || {};',
    },
  })
  .catch(() => process.exit(1));
