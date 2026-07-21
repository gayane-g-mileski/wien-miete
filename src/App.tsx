import { useMemo, useState } from 'react'
import { Formular } from './components/Formular'
import { Ergebnis } from './components/Ergebnis'
import { evaluateMrg } from './lib/mrgEngine'
import type { MietobjektInput } from './lib/types'

const initialInput: MietobjektInput = {
  objektart: 'wohnung',
  baubewilligungGebaeude: 'vor_1945',
  dgAusbauNachStichtag: true,
  zubauNachStichtag: true,
  anschrift: '',
  flaeche: 75,
  bezirk: 7,
  eigentumswohnung: false,
  befristet: false,
  foerderungProgramm: 'keine',
  tilgungsstatus: 'offen',
  kategorie: 'A',
  zustandHaus: 'durchschnittlich',
  heizung: 'zentral_etage',
  stockwerk: 'normal',
  lift: false,
  balkonTerrasse: false,
  garten: false,
  ruhelage: false,
  ausblick: false,
  hochwertigeAusstattung: false,
  keller: false,
  garage: false,
  gemeinschaft: false,
  strassenlaerm: false,
}

function App() {
  const [input, setInput] = useState<MietobjektInput>(initialInput)
  const ergebnis = useMemo(() => evaluateMrg(input), [input])

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b border-sand-line bg-cream-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage text-sm font-bold text-cream-50">
              MZ
            </span>
            <h1 className="text-xl font-bold tracking-tight text-wine sm:text-2xl">Mietzins-Check Wien</h1>
          </div>
          <p className="max-w-2xl text-sm text-ink-soft">
            Ersteinschätzung von Mietzinsart, MRG-Anwendungsbereich und marktüblicher Preisbandbreite – für Vermieter:innen
            und Immobilien-Anleger:innen in Wien.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <section>
            <h2 className="mb-4 text-base font-semibold text-ink">Eingabe</h2>
            <Formular value={input} onChange={setInput} />
          </section>

          <section className="lg:sticky lg:top-6">
            <h2 className="mb-4 text-base font-semibold text-ink">Ergebnis</h2>
            <Ergebnis ergebnis={ergebnis} />
          </section>
        </div>

        <footer className="mt-12 space-y-3 border-t border-sand-line pt-6 text-xs leading-relaxed text-ink-faint">
          <p>
            <strong className="text-ink-soft">Kein Rechtsrat.</strong> Dieses Tool bietet eine automatisierte
            Ersteinschätzung auf Basis vereinfachter Regeln des Mietrechtsgesetzes (MRG), der Unterlage „Förderungen" und
            grober, hinterlegter Marktmiet- und Lagezuschlag-Näherungen je Bezirk. Es ersetzt keine rechtliche oder
            immobilienwirtschaftliche Beratung im Einzelfall (z.B. Mietervereinigung, Rechtsanwält:in, Sachverständige).
          </p>
          <p>
            Quellen: Mietrechtsgesetz (MRG),{' '}
            <a
              className="text-sage-700 underline hover:text-sage"
              href="https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002531"
              target="_blank"
              rel="noreferrer"
            >
              RIS – Bundesrecht konsolidiert
            </a>
            , mietervereinigung.at (Richtwert, Zu-/Abschläge, Lagezuschlag Wien). Richtwert Wien seit 1.4.2026: 6,74 €/m².
          </p>
        </footer>
      </main>
    </div>
  )
}

export default App
