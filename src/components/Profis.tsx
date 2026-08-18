import { kontaktVorbelegen } from '../lib/kontaktEvent'
import { Portfolio } from './Portfolio'

const PUNKTE = [
  {
    titel: '400 Einheiten in 20 Minuten prüfen',
    text: 'Lade deine Bestandsliste hoch – die Auswertung sagt dir, welche Einheiten mutmaßlich über der Grenze liegen. Gleich hier ausprobieren.',
  },
  {
    titel: 'CSV-Import',
    text: 'Anschrift, Fläche, Kategorie, Baujahr, Vertragsdatum und Ist-Miete genügen; das Ergebnis kommt als Tabelle und als CSV zurück.',
  },
  {
    titel: 'Indexierung',
    text: 'Wertsicherung nachrechnen: Welche Einheit ist wann und um wie viel anpassbar, und welche Schwelle ist erreicht?',
  },
  {
    titel: 'Team-Zugänge',
    text: 'Mehrere Personen, gemeinsame Objektlisten, nachvollziehbare Prüfberichte für Hausverwaltung und Eigentümer:innen.',
  },
]

export function Profis() {
  return (
    <section id="profis" className="scroll-mt-4 border-t border-line bg-surface-2">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Für Profis</p>
        <h2 className="mt-3 max-w-2xl text-[2rem] font-semibold leading-tight tracking-tight text-ink">
          Hausverwaltung, Bestandshalter, Makler:innen
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          Dieselbe Logik wie im kostenlosen Rechner, nur für viele Einheiten auf einmal.
        </p>

        <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PUNKTE.map((p) => (
            <div key={p.titel} className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
              <p className="text-base font-semibold text-ink">{p.titel}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-9">
          <Portfolio />
        </div>

        <div className="mt-9">
          <button
            type="button"
            onClick={() =>
              kontaktVorbelegen(
                'Ich interessiere mich für den Profi-Zugang (Mehrfachprüfung, CSV-Import, Indexierung, Team-Zugänge) und möchte ihn 14 Tage testen.',
              )
            }
            className="rounded-lg bg-accent px-5 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
          >
            14 Tage testen
          </button>
          <p className="mt-3 text-sm text-ink-faint">
            Der Profi-Zugang ist in Vorbereitung. Wir melden uns, sobald der Test-Zugang bereitsteht.
          </p>
        </div>
      </div>
    </section>
  )
}
