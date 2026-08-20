// Pre-Rendering: erzeugt aus dem gebauten Bundle fertige HTML-Seiten.
//
// Suchmaschinen und Vorschaubilder bekommen damit vollständigen Text, Titel,
// Beschreibung und strukturierte Daten, ohne JavaScript ausführen zu müssen.
// Im Browser übernimmt danach dieselbe Anwendung.
//
//   npm run build && npm run prerender
//
// Der Browser wird über CHROMIUM_PFAD gesucht, sonst unter
// /opt/pw-browsers/chromium, sonst über die Auflösung von playwright-core.

import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright-core'

const WURZEL = resolve(import.meta.dirname, '..')
const DIST = join(WURZEL, 'dist')
const BASIS = process.env.BASIS_PFAD ?? '/wien-miete/'
const HERKUNFT = process.env.HERKUNFT ?? 'https://gayane-g-mileski.github.io'
const PORT = 4321

const { seiten } = JSON.parse(await readFile(join(WURZEL, 'src/inhalte/seiten.json'), 'utf8'))

/** Alle Adressen, die als eigene Datei ausgeliefert werden. */
const ROUTEN = [
  { pfad: '', prioritaet: '1.0', aenderung: 'weekly' },
  { pfad: 'ratgeber/', prioritaet: '0.7', aenderung: 'monthly' },
  { pfad: 'api/', prioritaet: '0.8', aenderung: 'monthly' },
  ...seiten.map((s) => ({ pfad: `${s.pfad}/`, prioritaet: '0.9', aenderung: 'monthly' })),
]

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}

function statischerServer() {
  return createServer(async (anfrage, antwort) => {
    const pfad = decodeURIComponent(new URL(anfrage.url, 'http://localhost').pathname)
    const ohneBasis = pfad.startsWith(BASIS) ? pfad.slice(BASIS.length) : pfad.replace(/^\//, '')
    let datei = join(DIST, ohneBasis)
    if (!extname(datei) || !existsSync(datei)) datei = join(DIST, 'index.html')
    try {
      const inhalt = await readFile(datei)
      antwort.writeHead(200, { 'Content-Type': TYPEN[extname(datei)] ?? 'application/octet-stream' })
      antwort.end(inhalt)
    } catch {
      antwort.writeHead(404).end('nicht gefunden')
    }
  })
}

async function browserPfad() {
  const kandidaten = [process.env.CHROMIUM_PFAD, '/opt/pw-browsers/chromium'].filter(Boolean)
  for (const k of kandidaten) {
    try {
      await access(k)
      return k
    } catch {
      // weiter mit dem nächsten Kandidaten
    }
  }
  return undefined
}

const server = statischerServer()
await new Promise((fertig) => server.listen(PORT, fertig))

const browser = await chromium.launch({ executablePath: await browserPfad(), args: ['--no-sandbox'] })
const seite = await browser.newPage()

for (const route of ROUTEN) {
  const url = `http://localhost:${PORT}${BASIS}${route.pfad}`
  await seite.goto(url, { waitUntil: 'networkidle' })
  // Auf die gesetzten Metadaten warten – sie kommen aus src/lib/seo.ts.
  await seite.waitForFunction(() => document.getElementById('ld-seite') !== null, null, { timeout: 15000 })
  const roh = await seite.evaluate(() => `<!doctype html>\n${document.documentElement.outerHTML}`)
  // Beim Rendern aufgelöste Adressen zeigen auf den lokalen Server dieses
  // Skripts (Vorladen von Bündeln, Hintergrundbild). Sie werden wieder auf
  // Pfade zurückgesetzt, sonst laufen sie im Betrieb ins Leere.
  const html = roh.replaceAll(`http://localhost:${PORT}`, '')

  const ziel = route.pfad ? join(DIST, route.pfad, 'index.html') : join(DIST, 'index.html')
  await mkdir(join(ziel, '..'), { recursive: true })
  await writeFile(ziel, html, 'utf8')
  console.log(`vorgerendert: ${BASIS}${route.pfad}`)
}

// Vorschaubild für geteilte Links (Open Graph, 1200 × 630).
const ogSeite = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await ogSeite.goto(`http://localhost:${PORT}${BASIS}`, { waitUntil: 'networkidle' })
await ogSeite.screenshot({ path: join(DIST, 'og-bild.png') })
await ogSeite.close()
console.log('og-bild.png geschrieben')

await browser.close()
server.close()

// GitHub Pages liefert bei unbekannten Adressen 404.html aus. Wir legen dort
// die Startseite ab, damit tiefe Links nicht ins Leere laufen.
await writeFile(join(DIST, '404.html'), await readFile(join(DIST, 'index.html'), 'utf8'), 'utf8')

// Sitemap und robots.txt aus derselben Liste erzeugen.
const heute = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTEN.map(
  (r) => `  <url>
    <loc>${HERKUNFT}${BASIS}${r.pfad}</loc>
    <lastmod>${heute}</lastmod>
    <changefreq>${r.aenderung}</changefreq>
    <priority>${r.prioritaet}</priority>
  </url>`,
).join('\n')}
</urlset>
`
await writeFile(join(DIST, 'sitemap.xml'), sitemap, 'utf8')

const robots = `User-agent: *
Allow: /
Disallow: ${BASIS}embed.html

Sitemap: ${HERKUNFT}${BASIS}sitemap.xml
`
await writeFile(join(DIST, 'robots.txt'), robots, 'utf8')
console.log('sitemap.xml und robots.txt geschrieben')
