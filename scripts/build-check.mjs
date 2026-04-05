/**
 * Safe build script — aborts if the dev server is running.
 * Usage: npm run build:check
 *
 * Prevents the .next cache corruption that happens when
 * `next build` runs alongside `next dev` on Windows.
 */

import { execSync } from 'node:child_process'
import net from 'node:net'

const PORT = 3000

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(true))
    server.once('listening', () => {
      server.close()
      resolve(false)
    })
    server.listen(port)
  })
}

const inUse = await isPortInUse(PORT)

if (inUse) {
  console.error(`\n  ✗ Port ${PORT} is in use — stop the dev server before building.\n`)
  process.exit(1)
}

console.log(`  ✓ Port ${PORT} is free — running build...\n`)
execSync('next build', { stdio: 'inherit' })
