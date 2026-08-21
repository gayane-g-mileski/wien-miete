import { useEffect, useMemo, useState } from 'react'
import { Formular } from './components/Formular'
import { Hero } from './components/Hero'
import { Profis } from './components/Profis'
import { Vergleich } from './components/Vergleich'
import { Faq } from './components/Faq'
import { Ergebnis } from './components/Ergebnis'
import { ErgebnisReiter } from './components/ErgebnisReiter'
import { Ergebnisleiste } from './components/Ergebnisleiste'
import { SprachSchalter } from './components/SprachSchalter'
import { UeberKontakt } from './components/UeberKontakt'
import { Preise } from './components/Preise'
import { Konto } from './components/Konto'
import { ThemaSchalter } from './components/ThemaSchalter'
import { Ratgeber, RatgeberIndex } from './components/Ratgeber'
import { ApiSeite } from './components/ApiSeite'
import { kontoOeffnen } from './lib/kontoEvent'
import { evaluateMrg } from './lib/mrgEngine'
import { leereMerkmale } from './lib/pricingData'
import { ladeVerlauf, speichereVerlauf, type VerlaufEintrag } from './lib/verlauf'
import { useRoute } from './lib/router'
import { BASIS, MARKE, RATGEBER, href } from './lib/seo'
import { analytikStarten, ereignis, seitenaufruf } from './lib/analytics'
import { anmeldungAusUrlUebernehmen, useKonto } from './lib/konto'
import type { MietobjektInput } from './lib/types'

const quelleLink = 'text-accent underline hover:text-accent-strong'

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

function Navigation({ imHero }: { imHero: boolean }) {
  const { konto } = useKonto()
  return (
    <nav
      className={`mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 ${
        imHero ? '' : 'border-b border-line'
      }`}
    >
      <a href={href('')} className="text-base font-semibold tracking-tight text-ink sm:text-lg">
        {MARKE}
      </a>
      <div className="flex shrink-0 items-center gap-3 text-sm font-medium text-ink sm:gap-5">
        {/* Auf dem Handy bleiben oben nur die beiden Icons */}
        <a className="hidden transition-colors hover:text-accent sm:inline" href={imHero ? '#rechner' : href('')}>
          Rechner
        </a>
        <a className="hidden transition-colors hover:text-accent sm:inline" href={href('ratgeber/')}>
          Ratgeber
        </a>
        <a className="hidden transition-colors hover:text-accent sm:inline" href={imHero ? '#profis' : href('')}>
          Für Profis
        </a>
        <a className="hidden transition-colors hover:text-accent sm:inline" href={href('api/')}>
          API
        </a>
        <a className="hidden transition-colors hover:text-accent sm:inline" href={imHero ? '#preise' : `${href('')}#preise`}>
          Preise
        </a>
        <button
          type="button"
          onClick={() => kontoOeffnen(undefined, 'anmelden')}
          className="rounded-lg border border-accent/50 px-3 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
        >
          {konto ? 'Konto' : 'Anmelden'}
        </button>
        <SprachSchalter />
        <ThemaSchalter />
      </div>
    </nav>
  )
}

function Startseite() {
  const [input, setInput] = useState<MietobjektInput>(initialInput)
  const ergebnis = useMemo(() => evaluateMrg(input), [input])
  const [verlauf, setVerlauf] = useState<VerlaufEintrag[]>(() => ladeVerlauf())
  // Zählt Adresswechsel aus dem Hero, damit das Formular seine Baujahr-Auswahl
  // zurücksetzt – die gehört zur alten Adresse.
  const [adressWechsel, setAdressWechsel] = useState(0)

  // Verlauf immer aktuell halten: sobald eine echte (ausgewählte) Adresse
  // vorliegt, den zugehörigen Eintrag mit dem aktuellen Stand anlegen/aktualisieren.
  useEffect(() => {
    const adr = input.anschrift.trim()
    const ausgewaehlt = adr.length > 0 && (input.anschriftKoords != null || input.anschriftBezirk != null)
    if (!ausgewaehlt) return
    setVerlauf((prev) => {
      const bestehend = prev.find((e) => e.adresse === adr)
      const eintrag: VerlaufEintrag = { adresse: adr, input, ts: bestehend?.ts ?? Date.now() }
      return [eintrag, ...prev.filter((e) => e.adresse !== adr)]
    })
  }, [input])

  useEffect(() => {
    speichereVerlauf(verlauf)
  }, [verlauf])

  return (
    <>
      {/* Hero-Banner: echtes Foto (public/hero.jpg), sonst sonnendurchflutete CSS-Szene */}
      <header className="hero">
        <div
          aria-hidden="true"
          className="hero-photo pointer-events-none"
          // Absolute URL, weil relative Pfade in einer CSS-Variablen sonst
          // gegen die Stylesheet-Adresse aufgelöst werden.
          style={
            {
              '--hero-photo': `url("${new URL(`${BASIS}hero.jpg`, document.baseURI).href}")`,
            } as React.CSSProperties
          }
        />
        {/* Scrim für Textlesbarkeit (links) */}
        <div className="pointer-events-none absolute inset-0 z-[-1] bg-gradient-to-r from-paper via-paper/90 to-paper/55 sm:via-paper/70 sm:to-transparent" />

        <Navigation imHero />

        <Hero
          anschrift={input.anschrift}
          onAnschrift={(text, bezirk, koords) => {
            setAdressWechsel((n) => n + 1)
            // Ohne Anschrift, nur der Bezirk – die Messung bleibt anonym.
            ereignis('adresse_gewaehlt', { bezirk: bezirk ?? 0 })
            setInput((prev) => ({
              ...prev,
              anschrift: text,
              anschriftBezirk: bezirk,
              anschriftKoords: koords,
              gemeindebau: false,
            }))
          }}
          onGemeindebau={(erkannt) => setInput((prev) => ({ ...prev, gemeindebau: erkannt }))}
          onBaujahr={() => {}}
          onBaujahrGefunden={() => {}}
        />
      </header>

      <main id="rechner" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Links: alle Eingaben untereinander */}
          <section>
            <Formular
              value={input}
              onChange={setInput}
              mietzinsArt={ergebnis.mietzinsArt}
              adressWechsel={adressWechsel}
            />
          </section>

          {/* Rechts: Ergebnis, die darauf aufbauenden Rechner, dann die Aktionen */}
          <section>
            <Ergebnis ergebnis={ergebnis} />
            <ErgebnisReiter ergebnis={ergebnis} />
            <Ergebnisleiste
              ergebnis={ergebnis}
              adresse={input.anschrift}
              verlauf={verlauf}
              onSelect={(e) => setInput(e.input)}
              onClear={() => setVerlauf([])}
            />
          </section>
        </div>
      </main>

      <Profis />
      <Vergleich />
      <Faq />
      <Preise />
      <UeberKontakt />
    </>
  )
}

function Fusszeile() {
  return (
    <footer id="quellen" className="scroll-mt-4 border-t border-line bg-surface-2">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-xs leading-relaxed text-ink-soft sm:px-6">
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-ink-soft">
          <strong className="text-base font-bold text-danger">Kein Rechtsrat.</strong> Dieses Informationswerkzeug
          liefert eine automatisierte Ersteinschätzung auf Basis vereinfachter Regeln und hinterlegter Näherungswerte
          für Marktmiete und Lagezuschlag je Bezirk. Es ersetzt keine rechtliche oder immobilienwirtschaftliche
          Beratung im Einzelfall (z.B. Mietervereinigung, Rechtsanwält:in, Sachverständige) und keine verbindliche
          Auskunft der Schlichtungsstelle.
        </div>

        {/* 36px Abstand zum Disclaimer (24px Padding + 12px space-y) */}
        <div className="pt-6">
          <p className="mb-1 font-semibold text-ink">Ratgeber</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            {RATGEBER.map((s) => (
              <a key={s.pfad} className={quelleLink} href={href(`${s.pfad}/`)}>
                {s.kicker}
              </a>
            ))}
            <a className={quelleLink} href={href('api/')}>
              Schnittstelle
            </a>
          </p>
        </div>

        <div className="pt-6">
          <p className="mb-1 font-semibold text-ink">Genutzte Schnittstellen (APIs) &amp; Datenquellen</p>
          <ul className="space-y-0.5">
            <li>
              Adressdienst der Stadt Wien – OGDAddressService:{' '}
              <a className={quelleLink} href="https://www.data.gv.at/katalog/dataset/c223b93a-2634-4f06-ac73-8709b9e16888" target="_blank" rel="noreferrer">
                data.gv.at
              </a>
            </li>
            <li>
              Gebäudedaten Wien (Baujahr, zum Nachschlagen):{' '}
              <a className={quelleLink} href="https://www.wien.gv.at/kultur/kulturgut-gebaeudedaten" target="_blank" rel="noreferrer">
                wien.gv.at
              </a>
            </li>
            <li>
              Grundstücksgrenzen und Katastralgemeinden (BEV-Kataster):{' '}
              <a className={quelleLink} href="https://kataster.bev.gv.at/#/center/13.35,47.77/zoom/7.6/vermv/0.6" target="_blank" rel="noreferrer">
                kataster.bev.gv.at
              </a>
            </li>
            <li>
              Lagezuschlagskarte Wien (Lagezuschlag je Liegenschaft):{' '}
              <a className={quelleLink} href="https://mein.wien.gv.at/Richtwert/ui/lagezuschlag/#/LagezuschlagImInternet/Adresse" target="_blank" rel="noreferrer">
                mein.wien.gv.at
              </a>
            </li>
            <li>
              Flächenwidmungs- und Bebauungsplan Wien:{' '}
              <a className={quelleLink} href="https://www.wien.gv.at/flaechenwidmung/public/" target="_blank" rel="noreferrer">
                wien.gv.at
              </a>
            </li>
            <li>
              Lärmkarte Wien:{' '}
              <a className={quelleLink} href="https://www.laerminfo.at/" target="_blank" rel="noreferrer">
                laerminfo.at
              </a>
            </li>
            <li>
              Rechtsinformationssystem des Bundes – MRG:{' '}
              <a className={quelleLink} href="https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002531" target="_blank" rel="noreferrer">
                RIS (MRG)
              </a>
            </li>
            <li>
              Marktmiet- und Zuschlagswerte:{' '}
              <a className={quelleLink} href="https://mietervereinigung.at/" target="_blank" rel="noreferrer">
                mietervereinigung.at
              </a>
            </li>
          </ul>
        </div>

        <div className="border-t border-line pt-4 text-ink-faint">
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a className={quelleLink} href={`${BASIS}impressum.html`} target="_blank" rel="noreferrer">
              Impressum
            </a>
            <a className={quelleLink} href={`${BASIS}datenschutz.html`} target="_blank" rel="noreferrer">
              Datenschutz
            </a>
            <a className={quelleLink} href={`${BASIS}agb.html`} target="_blank" rel="noreferrer">
              AGB
            </a>
            <a className={quelleLink} href={`${BASIS}widerruf.html`} target="_blank" rel="noreferrer">
              Rücktrittsrecht
            </a>
            <a className={quelleLink} href={`${BASIS}avv.html`} target="_blank" rel="noreferrer">
              Auftragsverarbeitung
            </a>
            <a className={quelleLink} href={`${href('')}#kontakt`}>
              Kontakt
            </a>
          </p>
          <p className="mt-2">© 2026 Gayane G. Mileski. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  )
}

function App() {
  const route = useRoute()

  useEffect(() => {
    analytikStarten()
    void anmeldungAusUrlUebernehmen()
  }, [])

  useEffect(() => {
    seitenaufruf()
  }, [route])

  return (
    <div className="min-h-screen bg-paper text-ink">
      {route.art !== 'start' && <Navigation imHero={false} />}
      {route.art === 'start' && <Startseite />}
      {route.art === 'ratgeber' && <Ratgeber seite={route.seite} />}
      {route.art === 'ratgeberIndex' && <RatgeberIndex />}
      {route.art === 'api' && <ApiSeite />}
      <Fusszeile />
      <Konto />
    </div>
  )
}

export default App
