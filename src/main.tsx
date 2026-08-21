import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'

// Service Worker nur für die eigene Seite anmelden – der eingebettete Rechner
// (embed.html) läuft ohne, damit er auf fremden Seiten nichts hinterlässt.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
