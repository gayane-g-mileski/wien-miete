import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Reine Web-App. Ausgeliefert wird statisch (GitHub Pages) unter /wien-miete/;
// die Vorab-Erzeugung der HTML-Seiten (Pre-Rendering) läuft nach dem Build über
// `npm run prerender`. Für eigene Domains lässt sich der Pfad über die
// Umgebungsvariable BASIS_PFAD überschreiben (z.B. BASIS_PFAD=/ npm run build).
export default defineConfig(() => ({
  base: process.env.BASIS_PFAD ?? '/wien-miete/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        embed: 'embed.html',
      },
    },
  },
}))
