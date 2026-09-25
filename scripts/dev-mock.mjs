// Starts the mock API (in-memory data, no external services) and the web dev server.
// Usage: npm run dev:mock   -> http://localhost:3000
import { spawn } from 'node:child_process'

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const children = [
  ['api', ['tsx', 'apps/fgc-api/src/mock/main.ts']],
  ['web', ['nx', 'serve', 'fgc-web']],
].map(([name, args]) => {
  const child = spawn(npx, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, NX_DAEMON: 'false', FGC_MOCK: '1' },
  })
  child.on('exit', (code) => {
    console.log(`[dev:mock] ${name} exited (${code ?? 'signal'})`)
    shutdown()
  })
  return child
})
let stopping = false
function shutdown() {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill()
  process.exit()
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, shutdown)
