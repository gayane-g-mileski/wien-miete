import { useEffect, useState, type ReactNode } from 'react'

// Fenster für die kostenlosen Anfragen an die Ämter (MA 25, MA 50,
// Bundeswohnbaufonds). Nach dem Absenden bleibt eine kurze Rückmeldung stehen;
// wer sie nicht selbst schließt, wird nach zehn Sekunden zurück auf die Seite
// gebracht – in genau den Zustand, aus dem das Fenster geöffnet wurde.

const SEKUNDEN = 10

export function AnfrageDialog({
  titel,
  offen,
  gesendet,
  hinweis,
  onSchliessen,
  children,
}: {
  titel: string
  offen: boolean
  /** Wurde die Anfrage an das E-Mail-Programm übergeben? */
  gesendet: boolean
  /** Zusatz zur Rückmeldung, etwa der Hinweis auf die Anhänge. */
  hinweis?: string
  onSchliessen: () => void
  children: ReactNode
}) {
  const [rest, setRest] = useState(SEKUNDEN)

  useEffect(() => {
    if (!offen) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onSchliessen()
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [offen, onSchliessen])

  // Countdown erst nach dem Absenden; er schließt das Fenster von selbst.
  useEffect(() => {
    if (!offen || !gesendet) return
    setRest(SEKUNDEN)
    const takt = setInterval(() => setRest((r) => r - 1), 1000)
    const schluss = setTimeout(onSchliessen, SEKUNDEN * 1000)
    return () => {
      clearInterval(takt)
      clearTimeout(schluss)
    }
  }, [offen, gesendet, onSchliessen])

  if (!offen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onSchliessen()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titel}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-lg sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-[1.35rem] font-semibold leading-tight text-ink">{titel}</p>
          <button
            type="button"
            onClick={onSchliessen}
            aria-label="Schließen"
            className="shrink-0 rounded-lg px-2 py-1 text-ink-faint transition-colors hover:text-accent"
          >
            ✕
          </button>
        </div>

        {gesendet ? (
          <div className="mt-6 space-y-4">
            <p role="status" className="text-lg font-semibold text-accent">
              Danke, die Anfrage ist im E-Mail-Programm geöffnet.
            </p>
            <p className="text-base leading-relaxed text-ink-soft">
              Bitte dort noch abschicken{hinweis ? ` – ${hinweis}` : '.'}
            </p>
            <button
              type="button"
              onClick={onSchliessen}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
            >
              Schließen
            </button>
            <p className="text-[12px] text-ink-faint">
              Dieses Fenster schließt sich in {Math.max(rest, 0)} Sekunden von selbst.
            </p>
          </div>
        ) : (
          <div className="mt-6">{children}</div>
        )}
      </div>
    </div>
  )
}
