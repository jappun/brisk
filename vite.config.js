import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { parseEnv } from 'node:util'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In production Vercel serves api/*.ts as functions. Locally, this
// plugin runs the same handlers inside the Vite dev server so `npm run dev`
// is the only command needed.
function vercelApiDev() {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const url = new URL(req.originalUrl, `http://${req.headers.host}`)
        const route = url.pathname.replace(/^\/api\/?/, '')
        if (!route || route.startsWith('_') || route.includes('.')) return next()

        let mod
        try {
          mod = await server.ssrLoadModule(`/api/${route}.ts`)
        } catch {
          return next()
        }
        const handler = mod[req.method]
        if (!handler) {
          res.statusCode = 405
          return res.end()
        }

        const hasBody = !['GET', 'HEAD'].includes(req.method)
        const request = new Request(url, {
          method: req.method,
          headers: req.headers,
          body: hasBody ? Readable.toWeb(req) : undefined,
          duplex: hasBody ? 'half' : undefined,
        })
        const response = await handler(request)
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}

// Expose .env to the API handlers (Vite only exposes VITE_* to the client).
// Read the files directly and overwrite, so editing .env takes effect when
// Vite restarts the server — loadEnv would keep the stale process.env values.
function loadServerEnv(mode) {
  for (const name of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    const file = path.join(import.meta.dirname, name)
    if (!fs.existsSync(file)) continue
    Object.assign(process.env, parseEnv(fs.readFileSync(file, 'utf8')))
  }
}

export default defineConfig(({ mode }) => {
  loadServerEnv(mode)

  return {
    plugins: [react(), tailwindcss(), vercelApiDev()],
  }
})
