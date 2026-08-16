import { useCallback, useEffect, useMemo, useState } from 'react'
import { browserSprache, uebersetzeOberflaeche, verfuegbarkeit, zeigeOriginal } from '../lib/uebersetzung'

// Die Oberfläche stellt sich beim Laden automatisch auf die Sprache des
// Browsers um. Der Globus erscheint nur, solange übersetzt ist – ein Klick
// bringt alles zurück auf Deutsch.

function GlobusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
    </svg>
  )
}

export function SprachSchalter() {
  const ziel = useMemo(() => browserSprache(), [])
  const [uebersetzt, setUebersetzt] = useState(false)
  const [zurueckgestellt, setZurueckgestellt] = useState(false)

  const starte = useCallback(async () => {
    const ok = await uebersetzeOberflaeche(ziel)
    setUebersetzt(ok)
    return ok
  }, [ziel])

  useEffect(() => {
    if (!ziel || zurueckgestellt) return
    let abgebrochen = false
    let abmelden: (() => void) | null = null

    void (async () => {
      const stand = await verfuegbarkeit(ziel)
      if (abgebrochen || stand === 'unavailable') return
      if (await starte()) return
      if (abgebrochen) return
      // Muss der Browser das Sprachmodell erst laden, darf das nur nach einer
      // Nutzeraktion beginnen – dann eben beim ersten Klick oder Tastendruck.
      const beiGeste = () => {
        abmelden?.()
        abmelden = null
        void starte()
      }
      abmelden = () => {
        document.removeEventListener('pointerdown', beiGeste)
        document.removeEventListener('keydown', beiGeste)
      }
      document.addEventListener('pointerdown', beiGeste)
      document.addEventListener('keydown', beiGeste)
    })()

    return () => {
      abgebrochen = true
      abmelden?.()
    }
  }, [ziel, zurueckgestellt, starte])

  if (!uebersetzt) return null

  return (
    <button
      type="button"
      onClick={() => {
        zeigeOriginal()
        setUebersetzt(false)
        setZurueckgestellt(true)
      }}
      aria-label="Zurück zum deutschen Original"
      title="Zurück zum deutschen Original"
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-ink transition-colors hover:text-accent"
    >
      <GlobusIcon />
      <span translate="no">DE</span>
    </button>
  )
}
