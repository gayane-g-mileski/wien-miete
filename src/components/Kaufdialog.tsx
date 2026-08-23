import { useEffect, useState } from 'react'
import { Checkbox, TextField } from './ui'
import { bezahlenStarten, serverVorhanden } from '../lib/konto'
import { kaufMerken, type Zahlungsart } from '../lib/kauf'
import { aufKaufOeffnen, type KaufAnlass } from '../lib/kaufEvent'
import { kontaktVorbelegen } from '../lib/kontaktEvent'
import { euro, netto, tarifFuer } from '../lib/tarife'
import { BASIS } from '../lib/seo'

// Kauf des Prüfberichts in einem Fenster: Name und E-Mail, dann Apple Pay,
// PayPal oder Karte. Bezahlt wird auf der gesicherten Seite des
// Zahlungsdienstleisters; danach kommt die Anwendung in den vorigen Zustand
// zurück und meldet unter dem Hero, dass der Bericht unterwegs ist.
//
// Vor der Zahlung stehen die Pflichtangaben nach dem Fern- und
// Auswärtsgeschäfte-Gesetz: Leistung, Gesamtpreis inklusive Umsatzsteuer und
// die ausdrückliche Zustimmung zum sofortigen Beginn samt Kenntnisnahme, dass
// damit das Rücktrittsrecht erlischt (§ 18 Abs 1 Z 11 FAGG).

const linkStil = 'text-accent underline'

function ApplePayZeichen() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M16.2 3c.1 1-.3 2-1 2.7-.6.7-1.6 1.3-2.6 1.2-.1-1 .4-2 1-2.7.7-.7 1.7-1.2 2.6-1.2zM19 17c-.4 1-.6 1.4-1.1 2.3-.7 1.2-1.7 2.7-3 2.7-1.1 0-1.4-.7-2.9-.7s-1.9.7-3 .7c-1.3 0-2.2-1.3-3-2.5-1.9-2.9-2.1-6.4-.9-8.2.8-1.3 2.1-2.1 3.4-2.1 1.3 0 2.1.7 3.2.7 1 0 1.7-.7 3.2-.7 1.1 0 2.3.6 3.2 1.7-2.8 1.5-2.4 5.6.9 6.1z" />
    </svg>
  )
}

function PaypalZeichen() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M7.6 21h-3l.5-3h2.6c3.6 0 6.3-1.6 7.2-5.3.3-1.2.3-2.2 0-3 .9.6 1.4 1.6 1.4 3 0 4.6-3.3 8.3-8.7 8.3zm-.9-5H4.2L6.4 3h5.3c2.9 0 4.8 1.3 4.8 3.8 0 4-2.8 6.2-6.7 6.2H7.9L7.6 16z" />
    </svg>
  )
}

function KarteZeichen() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19M6 15h3" strokeLinecap="round" />
    </svg>
  )
}

const ZAHLUNGSARTEN: { id: Zahlungsart; titel: string; zeichen: () => React.ReactElement }[] = [
  { id: 'applepay', titel: 'Apple Pay', zeichen: ApplePayZeichen },
  { id: 'paypal', titel: 'PayPal', zeichen: PaypalZeichen },
  { id: 'karte', titel: 'Karte', zeichen: KarteZeichen },
]

interface Fehler {
  name?: string
  email?: string
  zustimmung?: string
  allgemein?: string
}

export function Kaufdialog() {
  const [anlass, setAnlass] = useState<KaufAnlass | null>(null)
  const [schritt, setSchritt] = useState<'daten' | 'zahlung'>('daten')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sofortStart, setSofortStart] = useState(false)
  const [agbOk, setAgbOk] = useState(false)
  const [fehler, setFehler] = useState<Fehler>({})
  const [laeuft, setLaeuft] = useState<Zahlungsart | null>(null)

  useEffect(() => {
    return aufKaufOeffnen((a) => {
      setAnlass(a)
      setSchritt('daten')
      setFehler({})
      setSofortStart(false)
      setAgbOk(false)
      setLaeuft(null)
    })
  }, [])

  useEffect(() => {
    if (!anlass) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setAnlass(null)
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [anlass])

  if (!anlass) return null

  const tarif = tarifFuer(anlass.produkt)!
  const bericht = anlass.produkt === 'bericht'
  const bezahlbar = serverVorhanden()
  const schliessen = () => setAnlass(null)

  const weiter = () => {
    const neu: Fehler = {}
    if (!name.trim()) neu.name = 'Bitte geben Sie Ihren Namen an.'
    if (!email.trim()) neu.email = 'Bitte geben Sie Ihre E-Mail-Adresse an.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) neu.email = 'Bitte geben Sie eine gültige E-Mail-Adresse an.'
    if (!sofortStart || !agbOk) neu.zustimmung = 'Bitte bestätigen Sie beide Punkte, dann geht es weiter zur Zahlung.'
    setFehler(neu)
    if (Object.keys(neu).length === 0) setSchritt('zahlung')
  }

  const bezahlen = async (art: Zahlungsart) => {
    setFehler({})
    setLaeuft(art)
    if (bericht && anlass.input) {
      kaufMerken({
        input: anlass.input,
        adresse: anlass.adresse ?? '',
        name: name.trim(),
        email: email.trim(),
        art,
      })
    }
    try {
      await bezahlenStarten(anlass.produkt, sofortStart, { zahlungsart: art, name: name.trim(), email: email.trim() })
    } catch (e) {
      setFehler({ allgemein: e instanceof Error ? e.message : 'Der Bezahlvorgang ließ sich nicht starten.' })
      setLaeuft(null)
    }
  }

  const zurWarteliste = () => {
    schliessen()
    kontaktVorbelegen(
      `Ich möchte ${tarif.name} bestellen, sobald die Zahlung freigeschaltet ist.${
        bericht ? `\nObjekt: ${anlass.adresse || 'ohne Anschrift'}` : ''
      }\nName: ${name.trim() || '[bitte ergänzen]'}\nE-Mail: ${email.trim() || '[bitte ergänzen]'}`,
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) schliessen()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Prüfbericht kaufen"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-lg sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-[1.35rem] font-semibold leading-tight text-ink">{tarif.name}</p>
          <button
            type="button"
            onClick={schliessen}
            aria-label="Schließen"
            className="shrink-0 rounded-lg px-2 py-1 text-ink-faint transition-colors hover:text-accent"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">{bericht ? anlass.adresse || 'Objekt ohne Anschrift' : tarif.fuer}</p>
          <p className="mt-1">
            {bericht
              ? 'Ausführlicher Prüfbericht als PDF mit Rechenweg, Fundstellen, Herleitung des Lagezuschlags, Zeitstempel und Version der Rechenlogik.'
              : tarif.leistungen.join(' · ')}
          </p>
          <p className="mt-1">
            Gesamtpreis {euro(tarif.brutto)} {tarif.einheit} – inklusive 20 % Umsatzsteuer ({euro(netto(tarif.brutto))}{' '}
            netto). Keine weiteren Kosten.
          </p>
          {tarif.laufzeit && <p className="mt-1">{tarif.laufzeit}</p>}
        </div>

        {schritt === 'daten' ? (
          <div className="mt-6 space-y-6">
            <TextField
              label="Name"
              id="bericht-name"
              autoComplete="name"
              value={name}
              fehler={fehler.name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="E-Mail-Adresse"
              id="bericht-email"
              type="email"
              autoComplete="email"
              value={email}
              fehler={fehler.email}
              hint={bericht ? 'An diese Adresse gehen Bericht und Rechnung.' : 'An diese Adresse gehen Zugang und Rechnung.'}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="space-y-4">
              <Checkbox
                checked={sofortStart}
                onChange={setSofortStart}
                label={
                  <span className="text-sm leading-relaxed text-ink-soft">
                    Ich verlange ausdrücklich, dass mit der Leistung sofort begonnen wird, und nehme zur Kenntnis, dass
                    ich mit vollständiger Erfüllung mein Rücktrittsrecht verliere.
                  </span>
                }
              />
              <Checkbox
                checked={agbOk}
                onChange={setAgbOk}
                label={
                  <span className="text-sm leading-relaxed text-ink-soft">
                    Ich habe die{' '}
                    <a className={linkStil} href={`${BASIS}agb.html`} target="_blank" rel="noreferrer">
                      AGB
                    </a>
                    , die{' '}
                    <a className={linkStil} href={`${BASIS}widerruf.html`} target="_blank" rel="noreferrer">
                      Rücktrittsbelehrung
                    </a>{' '}
                    und die{' '}
                    <a className={linkStil} href={`${BASIS}datenschutz.html`} target="_blank" rel="noreferrer">
                      Datenschutzerklärung
                    </a>{' '}
                    gelesen.
                  </span>
                }
              />
            </div>
            {fehler.zustimmung && <p className="text-sm text-danger">{fehler.zustimmung}</p>}

            <button
              type="button"
              onClick={weiter}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
            >
              Weiter zur Zahlung
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-relaxed text-ink-soft">
              Bezahlt wird auf der gesicherten Seite unseres Zahlungsdienstleisters. Danach kommen Sie hierher zurück
              {bericht ? ' und bekommen den Bericht.' : ' und der Zugang ist freigeschaltet.'}
            </p>

            {/* Ohne verbundenen Zahlungsdienst bleiben die Schaltflächen sichtbar,
                aber gesperrt – so ist erkennbar, was kommt, ohne eine Zahlung
                vorzutäuschen. */}
            <div className="space-y-3">
              {ZAHLUNGSARTEN.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  disabled={!bezahlbar || laeuft !== null}
                  aria-disabled={!bezahlbar}
                  onClick={() => void bezahlen(z.id)}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-ink/15 bg-ink px-4 py-3 text-base font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  <z.zeichen />
                  {laeuft === z.id ? 'Einen Moment …' : `Zahlungspflichtig bestellen · ${z.titel}`}
                </button>
              ))}
            </div>

            {!bezahlbar && (
              <div className="space-y-4">
                <p className="rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed text-ink-soft">
                  Die Zahlung ist noch nicht freigeschaltet – Apple Pay, PayPal und Karte stehen bereit, sobald der
                  Zahlungsdienst verbunden ist. Tragen Sie sich ein, dann melden wir uns, sobald es losgeht.
                </p>
                <button
                  type="button"
                  onClick={zurWarteliste}
                  className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
                >
                  Auf die Warteliste
                </button>
              </div>
            )}

            {fehler.allgemein && <p className="text-sm text-danger">{fehler.allgemein}</p>}

            <button
              type="button"
              onClick={() => setSchritt('daten')}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-base font-semibold text-ink transition-colors hover:text-accent"
            >
              Zurück
            </button>

            <p className="text-[12px] leading-relaxed text-ink-faint">
              Kartendaten werden ausschließlich beim Zahlungsdienstleister verarbeitet, nie auf dieser Seite. Der
              Ergebnisse bleiben eine automatisierte Ersteinschätzung und sind kein Gutachten und keine Rechtsauskunft.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
