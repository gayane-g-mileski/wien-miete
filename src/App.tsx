import { useMemo, useState } from 'react'
import { Formular } from './components/Formular'
import { Ergebnis } from './components/Ergebnis'
import { evaluateMrg } from './lib/mrgEngine'
import { leereMerkmale } from './lib/pricingData'
import type { MietobjektInput } from './lib/types'

const initialInput: MietobjektInput = {
  objektart: 'wohnung',
  baubewilligungGebaeude: 'vor_1945',
  dgAusbauNachStichtag: true,
  zubauNachStichtag: true,
  anschrift: '',
  anschriftBezirk: null,
  anschriftKoords: null,
  gemeindebau: false,
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
  merkmale: leereMerkmale(),
}

function App() {
  const [input, setInput] = useState<MietobjektInput>(initialInput)
  const ergebnis = useMemo(() => evaluateMrg(input), [input])

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* Farbiger Header */}
      <header className="bg-sage text-cream-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream-50 text-sm font-bold text-sage">
              MZ
            </span>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Mietzins-Check Wien</h1>
          </div>
          <p className="max-w-2xl text-sm text-cream-200">
            Ersteinschätzung von Mietzinsart, Schutzumfang und marktüblicher Preisbandbreite – für Vermieter:innen und
            Immobilien-Anleger:innen in Wien.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Links: alle Eingaben untereinander (schwarz-weiß) */}
          <section>
            <h2 className="mb-4 text-base font-semibold text-neutral-700">Eingabe</h2>
            <Formular value={input} onChange={setInput} istRichtwert={ergebnis.mietzinsArt === 'richtwert'} />
          </section>

          {/* Rechts: Ergebnis (farbig) */}
          <section className="lg:sticky lg:top-6">
            <h2 className="mb-4 text-base font-semibold text-neutral-700">Ergebnis</h2>
            <Ergebnis ergebnis={ergebnis} />
          </section>
        </div>
      </main>

      {/* Farbiger Footer */}
      <footer className="mt-4 border-t border-sand-line bg-cream">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-xs leading-relaxed text-ink-soft sm:px-6">
          <p>
            <strong className="text-wine">Kein Rechtsrat.</strong> Dieses Tool bietet eine automatisierte Ersteinschätzung
            auf Basis vereinfachter Regeln und grober, hinterlegter Marktmiet- und Lagezuschlag-Näherungen je Bezirk. Es
            ersetzt keine rechtliche oder immobilienwirtschaftliche Beratung im Einzelfall (z.B. Mietervereinigung,
            Rechtsanwält:in, Sachverständige).
          </p>
          <p>
            Quellen: Mietrechtsgesetz (MRG) über{' '}
            <a
              className="text-sage-700 underline hover:text-sage"
              href="https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002531"
              target="_blank"
              rel="noreferrer"
            >
              RIS
            </a>
            , Adressdaten & Flächenwidmung der Stadt Wien, Lärmkarte laerminfo.at, mietervereinigung.at. Richtwert Wien seit
            1.4.2026: 6,74 €/m².
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
