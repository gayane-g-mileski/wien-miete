import { useState } from 'react'
import { Preisbandbreite } from './Ergebnis'
import { Wertsicherung } from './Wertsicherung'
import { Rendite } from './Rendite'
import { Betriebskosten } from './Betriebskosten'
import { ereignis } from '../lib/analytics'
import type { MrgErgebnis } from '../lib/types'

// Alles, was auf dem Ergebnis aufbaut, in einer Karte unter dem Ergebnis:
// Preisbandbreite, Wertsicherung, Rendite und Betriebskosten als Reiter.
//
// Die Karte trägt `@container`, damit die Rechner sich nach der Breite dieser
// Spalte richten und nicht nach der Breite des Fensters – rechts neben dem
// Formular ist es enger als auf dem Handy im Hochformat.

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
    <section id="werkzeuge" className="mt-8 scroll-mt-4">
      {/* Zwei mal zwei – so bleibt die Reihe auf jeder Breite gleich hoch */}
      <div className="mb-5 grid grid-cols-2 gap-2" role="tablist" aria-label="Rechner zum Ergebnis">
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
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              aktiv === r.id
                ? 'bg-accent text-on-accent'
                : 'border border-line bg-surface text-ink hover:border-accent/50 hover:text-accent'
            }`}
          >
            {r.titel}
          </button>
        ))}
      </div>

      <div
        id={`tafel-${aktiv}`}
        role="tabpanel"
        aria-labelledby={`reiter-${aktiv}`}
        className="@container rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6"
      >
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">{gewaehlt.unter}</p>
        {aktiv === 'preis' && <Preisbandbreite ergebnis={ergebnis} />}
        {aktiv === 'wertsicherung' && <Wertsicherung />}
        {aktiv === 'rendite' && <Rendite />}
        {aktiv === 'betriebskosten' && <Betriebskosten />}
      </div>
    </section>
  )
}
