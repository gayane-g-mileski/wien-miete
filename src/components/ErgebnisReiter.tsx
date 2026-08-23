import { useState } from 'react'
import { Preisbandbreite } from './Ergebnis'
import { Wertsicherung } from './Wertsicherung'
import { Rendite } from './Rendite'
import { Betriebskosten } from './Betriebskosten'
import { ereignis } from '../lib/analytics'
import type { MrgErgebnis } from '../lib/types'

// Alles, was auf dem Ergebnis aufbaut, über der Ergebniskarte: Preisbandbreite,
// Wertsicherung, Rendite und Betriebskosten als Reiter.
//
// Die Preisbandbreite bringt ihre eigenen Karten mit und steht deshalb ohne
// zusätzlichen Rahmen; die drei Rechner bekommen einen. Die Tafel trägt
// `@container`, damit sich die Rechner nach der Breite dieser Spalte richten
// und nicht nach der Breite des Fensters.

const REITER = [
  { id: 'preis', titel: 'Preisbandbreite', unter: '§ 16 MRG' },
  { id: 'wertsicherung', titel: 'Wertsicherung', unter: 'MieWeG · § 16 Abs 9 MRG' },
  { id: 'rendite', titel: 'Rendite', unter: 'Vorsorgewohnung' },
  { id: 'betriebskosten', titel: 'Betriebskosten', unter: '§ 21 MRG' },
] as const

type ReiterId = (typeof REITER)[number]['id']

export function ErgebnisReiter({ ergebnis }: { ergebnis: MrgErgebnis }) {
  const [aktiv, setAktiv] = useState<ReiterId>('preis')
  const gewaehlt = REITER.find((r) => r.id === aktiv)!

  return (
    <section id="werkzeuge" className="scroll-mt-4">
      {/* Auf schmalen Displays lässt sich die Reihe seitlich schieben. */}
      <div
        role="tablist"
        aria-label="Rechner zum Ergebnis"
        className="flex gap-6 overflow-x-auto border-b border-line"
      >
        {REITER.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            id={`reiter-${r.id}`}
            aria-selected={aktiv === r.id}
            aria-controls={`tafel-${r.id}`}
            onClick={() => {
              setAktiv(r.id)
              ereignis('rechner_gewechselt', { rechner: r.id })
            }}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-1 pb-3 text-base transition-colors ${
              aktiv === r.id
                ? 'border-accent font-semibold text-accent'
                : 'border-transparent text-ink hover:text-accent'
            }`}
          >
            {r.titel}
          </button>
        ))}
      </div>

      <div id={`tafel-${aktiv}`} role="tabpanel" aria-labelledby={`reiter-${aktiv}`} className="@container">
        <p className="mb-4 mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">{gewaehlt.unter}</p>
        {aktiv === 'preis' ? (
          <Preisbandbreite ergebnis={ergebnis} />
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            {aktiv === 'wertsicherung' && <Wertsicherung />}
            {aktiv === 'rendite' && <Rendite />}
            {aktiv === 'betriebskosten' && <Betriebskosten />}
          </div>
        )}
      </div>
    </section>
  )
}
