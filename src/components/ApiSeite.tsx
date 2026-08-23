import { useMemo, useState } from 'react'
import { ENDPUNKTE, FEHLERCODES, apiBasis, beispielAntwort, beispielAufruf } from '../lib/api'
import { einbettungsSchnipsel, einbettungsUrl } from '../lib/whitelabel'
import { leereMerkmale } from '../lib/pricingData'
import { BASIS, HERKUNFT, href } from '../lib/seo'
import { kaufOeffnen } from '../lib/kaufEvent'
import { TextField } from './ui'
import type { MietobjektInput } from '../lib/types'

// Dokumentation der Schnittstelle und des eingebetteten Rechners.
// Die Beispielantwort entsteht aus derselben Rechenlogik wie das Ergebnis in
// der Oberfläche – damit stimmt sie immer.

const BEISPIEL: MietobjektInput = {
  objektart: 'wohnung',
  baubewilligungGebaeude: 'vor_1945',
  dgAusbauNachStichtag: false,
  zubauNachStichtag: false,
  anschrift: 'Neubaugasse 1, 1070 Wien',
  anschriftBezirk: 7,
  anschriftKoords: null,
  gemeindebau: false,
  flaeche: 75,
  bezirk: 7,
  eigentumswohnung: false,
  befristet: false,
  vertragsdatum: '2024-05-01',
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

const codeStil =
  'overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 text-[13px] leading-relaxed text-ink-soft'

export function ApiSeite() {
  const antwort = useMemo(() => JSON.stringify(beispielAntwort(BEISPIEL), null, 2), [])
  const [name, setName] = useState('Hausverwaltung Muster')
  const [farbe, setFarbe] = useState('#1f4f82')
  const [kontakt, setKontakt] = useState('office@muster.at')

  const url = einbettungsUrl(`${HERKUNFT}${BASIS}embed.html`, {
    mandant: 'demo',
    name,
    farbe,
    kontakt,
  })

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Brotkrumen" className="text-sm text-ink-faint">
        <a className="text-accent underline hover:text-accent-strong" href={href('')}>
          Start
        </a>
        <span className="px-2">/</span>
        <span>Schnittstelle</span>
      </nav>

      <h1 className="mt-8 max-w-3xl text-[2.2rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.6rem]">
        Schnittstelle und White-Label
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ink-soft">
        Dieselbe Prüflogik wie in der Oberfläche – als REST-Schnittstelle für die eigene Software und als
        eingebetteter Rechner im eigenen Erscheinungsbild. Verarbeitung in der EU, Auftragsverarbeitungsvertrag nach
        Art. 28 DSGVO inklusive.
      </p>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">Anmeldung am Dienst</h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Jede Anfrage trägt den API-Schlüssel im Kopf <code>Authorization: Bearer sk_live_…</code>. Der Schlüssel steht
          im Konto und lässt sich dort jederzeit erneuern. Ohne gültigen Schlüssel antwortet der Dienst mit 401.
        </p>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Grundadresse: <code>{apiBasis() || 'https://api.mietzins-check.at'}</code>. Es gilt eine Grenze von 60
          Anfragen pro Minute je Schlüssel; das monatliche Kontingent richtet sich nach dem Tarif.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">Endpunkte</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-semibold text-ink">Aufruf</th>
                <th className="px-4 py-3 font-semibold text-ink">Zweck</th>
                <th className="px-4 py-3 font-semibold text-ink">Abrechnung</th>
              </tr>
            </thead>
            <tbody>
              {ENDPUNKTE.map((e) => (
                <tr key={e.pfad} className="border-b border-line last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-ink">
                    <code>
                      {e.methode} {e.pfad}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {e.zweck}
                    {e.koerper && <span className="mt-1 block text-ink-faint">Körper: {e.koerper}</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{e.tarif}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">Beispielaufruf</h2>
        <pre className={`mt-6 ${codeStil}`}>{beispielAufruf()}</pre>
        <h3 className="mt-8 text-base font-semibold text-ink">Antwort</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-faint">
          Erzeugt aus der laufenden Rechenlogik dieser Seite – Zeitstempel und Version wie im echten Betrieb.
        </p>
        <pre className={`mt-4 max-h-[28rem] ${codeStil}`}>{antwort}</pre>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">Fehler</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-semibold text-ink">Status</th>
                <th className="px-4 py-3 font-semibold text-ink">Code</th>
                <th className="px-4 py-3 font-semibold text-ink">Bedeutung</th>
              </tr>
            </thead>
            <tbody>
              {FEHLERCODES.map((f) => (
                <tr key={f.code} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{f.status}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    <code>{f.code}</code>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{f.bedeutung}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">Rechner einbetten</h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Der eingebettete Rechner übernimmt Name, Farbe und Logo aus der Adresse. Trage die Werte ein und kopiere den
          Schnipsel in die eigene Seite.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <TextField label="Anzeigename" id="wl-name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="Akzentfarbe (Hex)"
            id="wl-farbe"
            value={farbe}
            hint="z.B. #1f4f82"
            onChange={(e) => setFarbe(e.target.value)}
          />
          <TextField
            label="Kontaktadresse für Anfragen"
            id="wl-kontakt"
            value={kontakt}
            onChange={(e) => setKontakt(e.target.value)}
          />
        </div>

        <pre className={`mt-6 ${codeStil}`}>{einbettungsSchnipsel(url, name)}</pre>
        <p className="mt-4 text-sm leading-relaxed text-ink-faint">
          <a className="text-accent underline" href={url} target="_blank" rel="noreferrer">
            Vorschau in einem neuen Tab öffnen
          </a>
        </p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">Datenschutz und Haftung</h2>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Werden über die Schnittstelle personenbezogene Daten Dritter verarbeitet – etwa Anschriften mit Bezug zu
          Mietverhältnissen –, handeln wir als Auftragsverarbeiter. Der{' '}
          <a className="text-accent underline" href={`${BASIS}avv.html`} target="_blank" rel="noreferrer">
            Auftragsverarbeitungsvertrag
          </a>{' '}
          gehört zum Zugang; die eingesetzten Unterauftragsverarbeiter sind dort benannt.
        </p>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Die Antworten sind eine automatisierte Ersteinschätzung. Sie sind kein Gutachten, keine Rechtsauskunft und
          keine Bewertung im Sinne des Liegenschaftsbewertungsgesetzes; wer sie weitergibt, muss das kenntlich machen.
        </p>
      </section>

      <div className="mt-12 max-w-3xl rounded-2xl border border-accent/40 bg-accent/5 p-6">
        <p className="text-lg font-semibold text-ink">Zugang einrichten</p>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          Schlüssel, Kontingent und Auftragsverarbeitungsvertrag richten wir gemeinsam ein.
        </p>
        <button
          type="button"
          onClick={() => kaufOeffnen('api')}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
        >
          Zugang bestellen
        </button>
      </div>
    </main>
  )
}
