import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Zwei Ziele aus derselben Quelle:
//  - Web (GitHub Pages) unter /wien-miete/, mit Service Worker als PWA
//  - App (Capacitor, App Store / Play Store): relative Pfade, kein Service
//    Worker, weil die Dateien dort ohnehin lokal im Bundle liegen.
// Der App-Build läuft über `vite build --mode native` (npm run build:app).
export default defineConfig(({ mode }) => {
  const nativ = mode === 'native'
  const base = nativ ? './' : '/wien-miete/'

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      ...(nativ
        ? []
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.svg'],
              manifest: {
                name: 'Mietzins-Check in Wien',
                short_name: 'Mietzins-Check',
                description:
                  'Schnelle Ersteinschätzung von Mietzinsart, MRG-Anwendungsbereich und Preisbandbreite für Wiener Mietobjekte.',
                theme_color: '#607456',
                background_color: '#f5f1ea',
                display: 'standalone',
                start_url: base,
                scope: base,
                icons: [
                  {
                    src: 'icons/icon-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                  },
                  {
                    src: 'icons/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                  },
                  {
                    src: 'icons/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                  },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
              },
            }),
          ]),
    ],
  }
})
