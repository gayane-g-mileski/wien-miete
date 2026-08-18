import { kontoOeffnen } from '../lib/kontoEvent'

// Platzhalter-Preise: Die Beträge stehen noch nicht fest, die Struktur schon.

interface Tarif {
  name: string
  preis: string
  einheit: string
  fuer: string
  leistungen: string[]
  cta: string
  anlass?: string
  hervor?: boolean
}

const TARIFE: Tarif[] = [
  {
    name: 'Rechner',
    preis: '0 €',
    einheit: 'dauerhaft',
    fuer: 'Einzelne Wohnung, eigene Einschätzung',
    leistungen: [
      'Mietzinsart, Schutzumfang und Preisbandbreite',
      'Judikatur-, Schlichtungsstellen- und Marktsicht',
      'Wertsicherung, Betriebskosten und Rendite',
      'Ergebnis als PDF, Verlauf auf dem Gerät',
    ],
    cta: 'Ohne Konto starten',
  },
  {
    name: 'Prüfbericht',
    preis: '24 €',
    einheit: 'je Bericht',
    fuer: 'Beilage zur Schlichtungsstelle oder zum Akt',
    leistungen: [
      'Alles aus dem Rechner',
      'Ausführlicher Bericht mit Fundstellen und Rechenweg',
      'Herleitung des Lagezuschlags mit Quellenangabe',
      'Zeitstempel und Versionsnummer der Rechenlogik',
    ],
    cta: 'Prüfbericht kaufen',
    anlass: 'Für den kostenpflichtigen Prüfbericht brauchst du ein Konto.',
    hervor: true,
  },
  {
    name: 'Profi',
    preis: 'ab 49 €',
    einheit: 'pro Monat',
    fuer: 'Hausverwaltung, Bestandshalter, Makler:innen',
    leistungen: [
      'Alles aus dem Prüfbericht',
      'Bestandslisten per CSV, ganze Häuser auf einmal',
      'Wertsicherung fürs Portfolio, Erhöhungsschreiben in Serie',
      'Team-Zugänge und gemeinsame Objektlisten',
    ],
    cta: '14 Tage testen',
    anlass: 'Der Profi-Zugang läuft über ein Konto – Testphase 14 Tage.',
  },
]

export function Preise() {
  return (
    <section id="preise" className="scroll-mt-4 border-t border-line bg-surface-2">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">Preise</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          Der Rechner bleibt kostenlos. Bezahlt wird nur, was darüber hinausgeht – der ausführliche Prüfbericht und die
          Arbeit mit vielen Einheiten.
        </p>

        <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TARIFE.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-2xl border bg-surface p-5 shadow-sm sm:p-6 ${
                t.hervor ? 'border-accent ring-1 ring-accent/30' : 'border-line'
              }`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">{t.name}</p>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-[2rem] font-bold leading-none tracking-tight text-ink">{t.preis}</span>
                <span className="text-sm text-ink-faint">{t.einheit}</span>
              </p>
              <p className="mt-2 text-sm text-ink-soft">{t.fuer}</p>

              <div className="mt-5 flex-1 space-y-2">
                {t.leistungen.map((l) => (
                  <p key={l} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                    <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {l}
                  </p>
                ))}
              </div>

              <button
                type="button"
                onClick={() => (t.anlass ? kontoOeffnen(t.anlass) : document.getElementById('rechner')?.scrollIntoView({ behavior: 'smooth' }))}
                className={`mt-6 w-full rounded-lg px-4 py-2.5 text-base font-semibold transition-colors ${
                  t.hervor
                    ? 'bg-accent text-on-accent hover:bg-accent-strong'
                    : 'border border-accent/50 text-accent hover:bg-accent/10'
                }`}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-ink-faint">
          Platzhalter-Preise, Stand August 2026: Die Beträge stehen noch nicht endgültig fest, Konten und Zahlung sind
          in Vorbereitung. Alle Preise verstehen sich inklusive Umsatzsteuer.
        </p>
      </div>
    </section>
  )
}
