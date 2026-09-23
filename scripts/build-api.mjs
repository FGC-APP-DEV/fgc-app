import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
await build({
  entryPoints: ['apps/fgc-api/src/main.ts'],
  outfile: 'dist/apps/fgc-api/main.cjs',
  platform: 'node',
  target: 'node22',
  bundle: true,
  format: 'cjs',
  sourcemap: true,
  packages: 'external',
  plugins: [
    {
      name: 'workspace-sources',
      setup(builder) {
        builder.onResolve({ filter: /^@fgc\// }, (args) => ({
          path: fileURLToPath(
            new URL('../libs/' + args.path.slice(5) + '/src/index.ts', import.meta.url),
          ),
        }))
      },
    },
  ],
})
