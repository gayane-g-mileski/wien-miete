import { useState } from 'react'
import { Wertsicherung } from './Wertsicherung'
import { Betriebskosten } from './Betriebskosten'
import { Rendite } from './Rendite'

const REITER = [
  { id: 'wertsicherung', titel: 'Wertsicherung', unter: 'MieWeG · § 16 Abs 9 MRG' },
  { id: 'betriebskosten', titel: 'Betriebskosten', unter: '§ 21 MRG' },
  { id: 'rendite', titel: 'Rendite', unter: 'Vorsorgewohnung' },
] as const

type ReiterId = (typeof REITER)[number]['id']

export function Werkzeuge() {
  const [aktiv, setAktiv] = useState<ReiterId>('wertsicherung')

  return (
    <section id="werkzeuge" className="scroll-mt-4 border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">Weitere Rechner</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          Drei Fragen, die sich an die Miethöhe anschließen: Wie viel darf erhöht werden, was gehört in die
          Betriebskosten, und was bleibt als Rendite übrig?
        </p>

        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Rechner">
          {REITER.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={aktiv === r.id}
              onClick={() => setAktiv(r.id)}
              className={`rounded-lg px-4 py-2.5 text-left transition-colors ${
                aktiv === r.id
                  ? 'bg-accent text-on-accent'
                  : 'border border-line bg-surface text-ink hover:border-accent/50 hover:text-accent'
              }`}
            >
              <span className="block text-base font-semibold">{r.titel}</span>
              <span className={`block text-[12px] ${aktiv === r.id ? 'opacity-80' : 'text-ink-faint'}`}>{r.unter}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
          {aktiv === 'wertsicherung' && <Wertsicherung />}
          {aktiv === 'betriebskosten' && <Betriebskosten />}
          {aktiv === 'rendite' && <Rendite />}
        </div>
      </div>
    </section>
  )
}
