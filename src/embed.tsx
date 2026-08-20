import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import { EmbedApp } from './components/EmbedApp'
import { whiteLabelAnwenden, whiteLabelAusUrl } from './lib/whitelabel'

// Eigener Einstiegspunkt für den eingebetteten Rechner (iframe).
// Ohne Navigation, ohne Preise, ohne fremde Marke – nur Eingabe und Ergebnis.

const wl = whiteLabelAusUrl()
whiteLabelAnwenden(wl)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EmbedApp wl={wl} />
  </StrictMode>,
)
