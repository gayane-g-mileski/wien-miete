import { useMemo, useState } from 'react'
import { Formular } from './Formular'
import { Ergebnis } from './Ergebnis'
import { evaluateMrg } from '../lib/mrgEngine'
import { leereMerkmale } from '../lib/pricingData'
import { HERKUNFT, BASIS, MARKE } from '../lib/seo'
import type { WhiteLabel } from '../lib/whitelabel'
import type { MietobjektInput } from '../lib/types'

// Eingebetteter Rechner für fremde Websites.
// Keine Navigation, keine Preise, kein Konto – Eingabe, Ergebnis, Hinweis.

const START: MietobjektInput = {
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
  vertragsdatum: '',
  gruenderzeitviertel: 'unbekannt',
  denkmalschutzAufwand: false,
  kriegsschadenWiederaufbau: false,
  foerderungProgramm: 'keine',
  tilgungsstatus: 'offen',
  kategorie: 'A',
  zustandHaus: 'durchschnittlich',
  heizung: 'zentral_etage',
  stockwerk: 'normal',
  merkmale: leereMerkmale(),
}

export function EmbedApp({ wl }: { wl: WhiteLabel }) {
  const [input, setInput] = useState<MietobjektInput>(START)
  const ergebnis = useMemo(() => evaluateMrg(input), [input])

  return (
    <div className="min-h-screen bg-paper px-4 py-8 text-ink sm:px-6">
      <div className="mx-auto max-w-5xl">
        {(wl.name || wl.logo) && (
          <div className="mb-8 flex items-center gap-4 border-b border-line pb-6">
            {wl.logo && <img src={wl.logo} alt="" className="h-10 w-auto" />}
            {wl.name && <p className="text-lg font-semibold tracking-tight text-ink">{wl.name}</p>}
          </div>
        )}

        <h1 className="text-[1.8rem] font-semibold leading-tight tracking-tight text-ink">
          Was darf diese Wohnung kosten?
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          Automatisierte Ersteinschätzung zu Mietzinsart, Anwendungsbereich des Mietrechtsgesetzes und Preisbandbreite.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Formular value={input} onChange={setInput} mietzinsArt={ergebnis.mietzinsArt} adressWechsel={0} />
          <div className="lg:sticky lg:top-6">
            <h2 className="mb-5 px-1 text-[1.6rem] font-semibold leading-tight tracking-tight text-accent">Ergebnis</h2>
            <Ergebnis ergebnis={ergebnis} />
            {wl.kontakt && (
              <a
                href={`mailto:${wl.kontakt}?subject=${encodeURIComponent('Anfrage zur Mietzinsprüfung')}`}
                className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
              >
                Anfrage schicken
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-danger/30 bg-surface">
          <div className="bg-danger/10 p-4 text-sm leading-relaxed text-ink-soft">
            <strong className="font-bold text-danger">Kein Rechtsrat.</strong> Automatisierte Ersteinschätzung auf
            Basis vereinfachter Regeln und hinterlegter Näherungswerte. Sie ersetzt keine rechtliche oder
            immobilienwirtschaftliche Beratung im Einzelfall und keine verbindliche Auskunft der Schlichtungsstelle.
          </div>
        </div>

        {!wl.ohneHinweis && (
          <p className="mt-6 text-xs text-ink-faint">
            Rechenlogik von{' '}
            <a className="text-accent underline" href={`${HERKUNFT}${BASIS}`} target="_blank" rel="noreferrer">
              {MARKE}
            </a>
            .
          </p>
        )}
      </div>
    </div>
  )
}
