import { AnschriftFeld } from './AnschriftFeld'
import { RICHTWERT_WIEN } from '../lib/pricingData'
import type { BaubewilligungGebaeude, Koordinaten } from '../lib/types'
import type { BaujahrInfo } from '../lib/geo'
import { IconSuche } from './Icons'

interface Props {
  anschrift: string
  onAnschrift: (text: string, bezirk: number | null, koords: Koordinaten | null) => void
  onGemeindebau: (erkannt: boolean) => void
  onBaujahr: (periode: BaubewilligungGebaeude | null) => void
  onBaujahrGefunden: (info: BaujahrInfo | null) => void
}

/** Einstieg: Frage, Einordnung und sofort das erste Eingabefeld. */
export function Hero({ anschrift, onAnschrift, onGemeindebau, onBaujahr, onBaujahrGefunden }: Props) {
  const richtwert = RICHTWERT_WIEN.toLocaleString('de-AT', { minimumFractionDigits: 2 })

  return (
    <div className="mx-auto flex max-w-6xl flex-col justify-center px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
      <div className="hero-rise">
        <div className="max-w-2xl">
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          Jede Einheit im Bestand sauber eingeordnet.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
          Für Hausverwaltungen und Immobilientreuhänder in Wien: Richtwert, Kategorie, angemessen oder frei — in einer
          Minute, mit Paragraf, Herleitung und Prüfbericht für den Akt. Richtwert seit 1. April 2026:{' '}
          <span className="font-semibold text-ink">{richtwert} €/m²</span>.
        </p>

        </div>

        <div className="mt-7 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr] sm:items-start">
            <div>
          <AnschriftFeld
            id="hero-anschrift"
            label="Anschrift in Wien"
            value={anschrift}
            onChange={onAnschrift}
            onGemeindebau={onGemeindebau}
            onBaujahr={onBaujahr}
            onBaujahrGefunden={onBaujahrGefunden}
          />
          <p className="mt-2 px-1 text-[12px] text-ink-faint">
            Ab dem 3. Zeichen erscheinen Vorschläge. Ohne Anschrift geht es auch – dann bleibt die Lage außen vor.
          </p>
            </div>
            <a
              href="#rechner"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3.5 text-center text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
            >
              <IconSuche />
              Einheit prüfen
            </a>
          </div>
        </div>

        <p className="mt-5 text-sm font-medium text-ink-soft">
          Einzelprüfung kostenlos · kein Konto nötig · Berechnung läuft im Browser, Objektdaten bleiben im Haus
        </p>
      </div>
    </div>
  )
}
