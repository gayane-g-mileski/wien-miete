import { useEffect, useState } from 'react'
import { statusleisteAnpassen } from '../lib/nativ'

// Umschalter zwischen hellem und dunklem Design. Ohne Auswahl folgt die Seite
// der Systemeinstellung; eine getroffene Wahl bleibt gespeichert.

const SPEICHER = 'wien-miete:thema'

function systemDunkel(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

function startwert(): boolean {
  const gesetzt = document.documentElement.dataset.theme
  if (gesetzt === 'dark') return true
  if (gesetzt === 'light') return false
  return systemDunkel()
}

function SonneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" />
    </svg>
  )
}

function MondIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />
    </svg>
  )
}

export function ThemaSchalter() {
  const [dunkel, setDunkel] = useState(startwert)

  useEffect(() => {
    document.documentElement.dataset.theme = dunkel ? 'dark' : 'light'
    try {
      localStorage.setItem(SPEICHER, dunkel ? 'dark' : 'light')
    } catch {
      // Speichern ist optional (z.B. im privaten Modus).
    }
    void statusleisteAnpassen(dunkel)
  }, [dunkel])

  const titel = dunkel ? 'Helles Design' : 'Dunkles Design'

  return (
    <button
      type="button"
      onClick={() => setDunkel((d) => !d)}
      aria-label={titel}
      aria-pressed={dunkel}
      title={titel}
      className="inline-flex items-center rounded-lg px-2 py-1 text-ink transition-colors hover:text-accent"
    >
      {dunkel ? <SonneIcon /> : <MondIcon />}
    </button>
  )
}
