import { kontoOeffnen } from '../lib/kontoEvent'
import { href } from '../lib/seo'
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
  {
    titel: 'Schnittstelle für die eigene Software',
    text: 'Dieselbe Einschätzung als JSON: Mietzinsart, Anwendungsbereich, Bandbreite und Herleitung – mit API-Schlüssel und versionierter Rechenlogik.',
  },
  {
    titel: 'White-Label für die eigene Website',
    text: 'Der Rechner als iframe im eigenen Erscheinungsbild, ohne fremde Marke. Anfragen landen in Ihrem Postfach.',
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

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => kontoOeffnen('Der Profi-Zugang kostet ab 49,00 € pro Monat inklusive Umsatzsteuer.', 'registrieren', 'profi')}
            className="rounded-lg bg-accent px-5 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
          >
            Profi-Zugang bestellen
          </button>
          <a
            href={href('api/')}
            className="rounded-lg border border-accent/50 px-5 py-2.5 text-base font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            Schnittstelle und White-Label
          </a>
        </div>
        <p className="mt-3 text-sm text-ink-faint">
          Monatlich kündbar, Preise inklusive Umsatzsteuer. Für Bestände mit personenbezogenen Daten Dritter liegt ein
          Auftragsverarbeitungsvertrag nach Art. 28 DSGVO bereit.
        </p>
      </div>
    </section>
  )
}
