import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function iconApiPlugin() {
  const iconsDir = path.resolve('public/icons')

  function getIconList() {
    return fs.readdirSync(iconsDir)
      .filter(f => f.endsWith('.svg'))
      .map(f => ({
        name: f.replace('.svg', ''),
        url: `/icons/${encodeURIComponent(f)}`,
      }))
  }

  return {
    name: 'icon-api',
    configureServer(server) {
      // GET /icons-manifest.json
      server.middlewares.use('/icons-manifest.json', (req, res, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(getIconList()))
          return
        }
        next()
      })

      // POST/DELETE /api/icons (dev only)
      server.middlewares.use('/api/icons', (req, res, next) => {

        // DELETE /api/icons/name
        if (req.method === 'DELETE') {
          const name = decodeURIComponent(req.url.replace(/^\//, ''))
          const safeName = path.basename(name)
          const filePath = path.join(iconsDir, safeName.endsWith('.svg') ? safeName : `${safeName}.svg`)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            res.end(JSON.stringify({ ok: true }))
          } else {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'not found' }))
          }
          return
        }

        // POST /api/icons — save an SVG
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const { name, svg } = JSON.parse(body)
              const safeName = path.basename(name).replace(/[^a-zA-Z0-9_-]/g, '_')
              const filePath = path.join(iconsDir, `${safeName}.svg`)
              fs.writeFileSync(filePath, svg)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ name: safeName, url: `/icons/${safeName}.svg` }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid request' }))
            }
          })
          return
        }

        next()
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'icons-manifest.json',
        source: JSON.stringify(getIconList()),
      })
    },
  }
}

function fontApiPlugin() {
  const fontsDir = path.resolve('public/fonts')
  const fontExts = ['.woff2', '.woff', '.ttf', '.otf']

  function getFontList() {
    return fs.readdirSync(fontsDir)
      .filter(f => fontExts.some(ext => f.toLowerCase().endsWith(ext)))
      .map(f => {
        const ext = path.extname(f).toLowerCase()
        const name = path.basename(f, ext)
        const format = ext === '.ttf' ? 'truetype' : ext === '.otf' ? 'opentype' : ext.replace('.', '')
        return { name, url: `/fonts/${f}`, format }
      })
  }

  return {
    name: 'font-api',
    configureServer(server) {
      // GET /fonts-manifest.json
      server.middlewares.use('/fonts-manifest.json', (req, res, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(getFontList()))
          return
        }
        next()
      })

      // POST /api/fonts (dev only)
      server.middlewares.use('/api/fonts', (req, res, next) => {

        // POST /api/fonts — save an uploaded font
        if (req.method === 'POST') {
          const chunks = []
          req.on('data', chunk => chunks.push(chunk))
          req.on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString())
              const safeName = path.basename(body.fileName).replace(/[^a-zA-Z0-9_.\-]/g, '_')
              const filePath = path.join(fontsDir, safeName)
              // body.data is base64-encoded
              fs.writeFileSync(filePath, Buffer.from(body.data, 'base64'))
              const ext = path.extname(safeName).toLowerCase()
              const name = path.basename(safeName, ext)
              const format = ext === '.ttf' ? 'truetype' : ext === '.otf' ? 'opentype' : ext.replace('.', '')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ name, url: `/fonts/${safeName}`, format }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid request' }))
            }
          })
          return
        }

        next()
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'fonts-manifest.json',
        source: JSON.stringify(getFontList()),
      })
    },
  }
}

function iconTitlesPlugin() {
  const titlesFile = path.resolve('public/icon-titles.json')

  return {
    name: 'icon-titles-api',
    configureServer(server) {
      // GET /icon-titles.json — served as static file, but also handle explicit route
      server.middlewares.use('/api/icon-titles', (req, res, next) => {
        if (req.method === 'POST') {
          const chunks = []
          req.on('data', chunk => chunks.push(chunk))
          req.on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString())
              fs.writeFileSync(titlesFile, JSON.stringify(body, null, 2))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid request' }))
            }
          })
          return
        }
        next()
      })
    },
    generateBundle() {
      if (fs.existsSync(titlesFile)) {
        this.emitFile({
          type: 'asset',
          fileName: 'icon-titles.json',
          source: fs.readFileSync(titlesFile, 'utf-8'),
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), iconApiPlugin(), fontApiPlugin(), iconTitlesPlugin()],
})
