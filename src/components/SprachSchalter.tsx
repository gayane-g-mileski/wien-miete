import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { browserSprache, uebersetzeOberflaeche, verfuegbarkeit, zeigeOriginal } from '../lib/uebersetzung'

// Die Oberfläche stellt sich automatisch auf die Sprache des Browsers um.
// Über den Globus-Button lässt sie sich mit einem Klick auf das deutsche
// Original zurückstellen (und wieder zurück).
//
// Kann der Browser nicht selbst übersetzen (Safari, Firefox, iOS), erklärt der
// Button stattdessen, wo die eingebaute Seitenübersetzung sitzt.

const SPEICHER = 'wien-miete:sprache'

const ANLEITUNGEN: { browser: string; einschalten: string }[] = [
  { browser: 'Safari (Mac, iPhone, iPad)', einschalten: 'Symbol links in der Adressleiste (aA bzw. Seitenmenü) → „Übersetzen in …“.' },
  { browser: 'Firefox', einschalten: 'Übersetzen-Symbol in der Adressleiste → Sprache wählen.' },
  { browser: 'Chrome, Edge, Brave', einschalten: 'Rechtsklick auf die Seite → „Übersetzen in …“.' },
  { browser: 'Android', einschalten: 'Browser-Menü (⋮) → „Übersetzen“.' },
]

function sprachName(code: string, sprache: string): string {
  try {
    return new Intl.DisplayNames([sprache], { type: 'language' }).of(code) ?? code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}

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
  const [laeuft, setLaeuft] = useState(false)
  const [moeglich, setMoeglich] = useState(false)
  const [offen, setOffen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const starte = useCallback(async () => {
    setLaeuft(true)
    const ok = await uebersetzeOberflaeche(ziel)
    setLaeuft(false)
    setUebersetzt(ok)
    if (!ok) setMoeglich(false)
  }, [ziel])

  // Beim Laden: Sprache des Browsers erkennen und – wenn möglich – sofort
  // übersetzen. Wer zuletzt das Original gewählt hat, bekommt weiter Deutsch.
  useEffect(() => {
    if (!ziel) return
    let abgebrochen = false
    void (async () => {
      const stand = await verfuegbarkeit(ziel)
      if (abgebrochen || stand === 'unavailable') return
      setMoeglich(true)
      // „downloadable“ braucht eine Nutzerinteraktion für den Modell-Download –
      // in dem Fall übersetzt erst ein Klick auf den Button.
      if (stand === 'available' && localStorage.getItem(SPEICHER) !== 'de') void starte()
    })()
    return () => {
      abgebrochen = true
    }
  }, [ziel, starte])

  useEffect(() => {
    if (!offen) return
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOffen(false)
    }
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOffen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [offen])

  const klick = () => {
    if (!moeglich) {
      setOffen((o) => !o)
      return
    }
    if (uebersetzt) {
      zeigeOriginal()
      setUebersetzt(false)
      localStorage.setItem(SPEICHER, 'de')
    } else {
      localStorage.setItem(SPEICHER, 'auto')
      void starte()
    }
  }

  const zielName = ziel ? sprachName(ziel, 'de') : ''
  const marke = laeuft ? '…' : uebersetzt ? 'DE' : moeglich ? ziel.toUpperCase() : 'DE'
  const titel = !moeglich
    ? 'Seite übersetzen'
    : uebersetzt
      ? 'Zurück zum Original (Deutsch)'
      : `Oberfläche auf ${zielName} übersetzen`

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={klick}
        aria-expanded={!moeglich ? offen : undefined}
        aria-haspopup={!moeglich ? 'dialog' : undefined}
        aria-label={titel}
        title={titel}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-ink transition-colors hover:text-accent"
      >
        <GlobusIcon />
        <span translate="no" className="tabular-nums">
          {marke}
        </span>
      </button>

      {offen && !moeglich && (
        <div
          role="dialog"
          aria-label="Seite übersetzen"
          className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-4 text-left shadow-lg"
        >
          <p className="text-sm font-semibold text-ink">Seite übersetzen</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            Dieser Browser kann die Oberfläche nicht automatisch übersetzen. Er bringt aber eine eigene
            Seitenübersetzung mit:
          </p>

          <ul className="mt-3 space-y-2">
            {ANLEITUNGEN.map((a) => (
              <li key={a.browser} className="text-[13px] leading-relaxed">
                <span className="font-semibold text-ink">{a.browser}</span>
                <br />
                <span className="text-ink-soft">{a.einschalten}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-ink-soft">
            <span className="font-semibold text-ink">Zurück zum Original:</span> dasselbe Menü öffnen und „Original
            anzeigen“ wählen.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
            Hinweis: Anfrage-Texte an Ämter bleiben immer auf Deutsch – sie werden nicht mitübersetzt.
          </p>
        </div>
      )}
    </div>
  )
}
