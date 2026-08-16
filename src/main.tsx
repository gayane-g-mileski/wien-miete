import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
import { externeLinksAbfangen } from './lib/nativ'

// In der App: fremde Seiten im System-Browser öffnen (im Web ein No-op).
externeLinksAbfangen()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
