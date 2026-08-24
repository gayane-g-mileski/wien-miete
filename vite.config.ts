import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Reine Web-App, ausgeliefert als statische Dateien (GitHub Pages) unter
// /wien-miete/. Die HTML-Seiten entstehen nach dem Build über
// `npm run prerender`. Für eigene Domains lässt sich der Pfad über die
// Umgebungsvariable BASIS_PFAD überschreiben (z.B. BASIS_PFAD=/ npm run build).
//
// Als PWA ist die Seite installierbar und funktioniert offline. Die Anmeldung
// des Service Workers passiert bewusst von Hand in src/main.tsx, damit der
// eingebettete Rechner (embed.html) auf fremden Seiten keinen Service Worker
// im Browser der Besucherinnen und Besucher hinterlässt.
export default defineConfig(() => {
  const basis = process.env.BASIS_PFAD ?? '/wien-miete/'

  return {
    base: basis,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Mietzins-Check in Wien',
          short_name: 'Mietzins-Check',
          description:
            'Automatisierte Ersteinschätzung von Mietzinsart, MRG-Anwendungsbereich und Preisbandbreite für Wiener Mietobjekte.',
          lang: 'de-AT',
          theme_color: '#006c63',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: basis,
          scope: basis,
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          // Adressen, die es beim Build noch nicht als Datei gibt (die
          // vorgerenderten Glossarseiten entstehen erst danach), fallen auf
          // die Startseite zurück – die Anwendung zeigt dann dieselbe Seite.
          navigateFallback: `${basis}index.html`,
          // Die alte Adresse des Glossars ist eine Weiterleitung und darf nicht
          // auf die Startseite fallen – sie geht ans Netz.
          navigateFallbackDenylist: [/embed\.html/, /\.(?:xml|txt)$/, /\/ratgeber\//],
        },
      }),
    ],
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          embed: 'embed.html',
        },
      },
    },
  }
})
