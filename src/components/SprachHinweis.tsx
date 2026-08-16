import { useEffect, useRef, useState } from 'react'

// Die Seite ist auf Deutsch verfasst. Statt eigener Übersetzungen nutzt sie die
// eingebaute Übersetzung der Browser – die deckt viele Sprachen ab und lässt
// sich jederzeit wieder auf das Original zurückstellen. Dieser Button erklärt,
// wo die Funktion im jeweiligen Browser sitzt.

const ANLEITUNGEN: { browser: string; einschalten: string }[] = [
  { browser: 'Chrome, Edge, Brave', einschalten: 'Rechtsklick auf die Seite → „Übersetzen in …“ (oder das Übersetzen-Symbol rechts in der Adressleiste).' },
  { browser: 'Safari (Mac, iPhone, iPad)', einschalten: 'Symbol links in der Adressleiste (aA bzw. Seitenmenü) → „Übersetzen in …“.' },
  { browser: 'Firefox', einschalten: 'Übersetzen-Symbol in der Adressleiste → Sprache wählen.' },
  { browser: 'Android', einschalten: 'Browser-Menü (⋮) → „Übersetzen“.' },
]

function GlobusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
    </svg>
  )
}

export function SprachHinweis() {
  const [offen, setOffen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        aria-haspopup="dialog"
        title="Seite übersetzen"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-ink transition-colors hover:text-accent"
      >
        <GlobusIcon />
        <span className="hidden sm:inline">Sprache</span>
      </button>

      {offen && (
        <div
          role="dialog"
          aria-label="Seite übersetzen"
          className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-4 text-left shadow-lg"
        >
          <p className="text-sm font-semibold text-ink">Seite übersetzen</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            Diese Seite ist auf Deutsch verfasst. Dein Browser kann sie in viele Sprachen übersetzen – so bleiben die
            Rechtsbegriffe im Original erhalten und du siehst trotzdem eine Übersetzung.
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
