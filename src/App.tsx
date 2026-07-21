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
  foerderung: 'keine',
  kategorie: 'A',
  flaeche: 75,
  bezirk: 1,
  lagequalitaet: 'sehr_gut',
  zustand: 'durchschnittlich',
  balkonTerrasse: false,
  lift: false,
  befristet: false,
  marktmieteM2Override: null,
}

function App() {
  const [input, setInput] = useState<MietobjektInput>(initialInput)
  const ergebnis = useMemo(() => evaluateMrg(input), [input])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">MZ</span>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Mietzins-Check Wien</h1>
          </div>
          <p className="max-w-2xl text-sm text-slate-400">
            Ersteinschätzung von Mietzinsart, MRG-Anwendungsbereich und marktüblicher Preisbandbreite – für Vermieter:innen und
            Immobilien-Anleger:innen in Wien.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <section>
            <h2 className="mb-4 text-base font-semibold text-slate-200">Angaben zum Mietobjekt</h2>
            <Formular value={input} onChange={setInput} />
          </section>

          <section className="lg:sticky lg:top-6">
            <h2 className="mb-4 text-base font-semibold text-slate-200">Ergebnis</h2>
            <Ergebnis ergebnis={ergebnis} />
          </section>
        </div>

        <footer className="mt-12 space-y-3 border-t border-slate-800 pt-6 text-xs leading-relaxed text-slate-500">
          <p>
            <strong className="text-slate-400">Kein Rechtsrat.</strong> Dieses Tool bietet eine automatisierte Ersteinschätzung auf
            Basis vereinfachter Regeln des Mietrechtsgesetzes (MRG) und grober, hinterlegter Marktmiet-Näherungen je Bezirk. Es
            ersetzt keine rechtliche oder immobilienwirtschaftliche Beratung im Einzelfall (z.B. durch Mietervereinigung,
            Rechtsanwalt:in oder Sachverständige:n).
          </p>
          <p>
            Quellen: Mietrechtsgesetz (MRG),{' '}
            <a
              className="underline hover:text-slate-300"
              href="https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002531"
              target="_blank"
              rel="noreferrer"
            >
              RIS – Bundesrecht konsolidiert
            </a>
            , mietervereinigung.at ("Richtwert und Richtwertmiete", "Zuschläge und Abschläge im Mietrecht", "Lagezuschlag Wien").
            Richtwert Wien seit 1.4.2026: 6,74 €/m².
          </p>
        </footer>
      </main>
    </div>
  )
}

export default App
