import { useEffect, useState } from 'react'
import { Checkbox, TextField } from './ui'
import { aufKontoOeffnen, type KontoAnlass } from '../lib/kontoEvent'
import { kontaktVorbelegen } from '../lib/kontaktEvent'
import {
  abmelden,
  bezahlenStarten,
  kontoAktualisieren,
  magicLinkAnfordern,
  serverVorhanden,
  useKonto,
  type Produkt,
} from '../lib/konto'
import { euro, netto, tarifFuer } from '../lib/tarife'
import { BASIS } from '../lib/seo'

// Anmeldung ohne Passwort (Magic-Link) und Bezahlung.
//
// Vor einem kostenpflichtigen Schritt stehen die Angaben, die das
// Fern- und Auswärtsgeschäfte-Gesetz verlangt: Leistung, Gesamtpreis inklusive
// Umsatzsteuer, Laufzeit, Kündigung – und die ausdrückliche Zustimmung zum
// sofortigen Beginn samt Kenntnisnahme, dass damit das Rücktrittsrecht erlischt
// (§ 18 Abs 1 Z 11 FAGG). Ohne diese Zustimmung bleibt der Bestellknopf gesperrt.

interface Fehler {
  email?: string
  zustimmung?: string
  allgemein?: string
}

const linkStil = 'text-accent underline'

export function Konto() {
  const [offen, setOffen] = useState(false)
  const [modus, setModus] = useState<KontoAnlass['modus']>('anmelden')
  const [anlass, setAnlass] = useState<string | undefined>()
  const [produkt, setProdukt] = useState<Produkt | undefined>()
  const [email, setEmail] = useState('')
  const [firma, setFirma] = useState('')
  const [uid, setUid] = useState('')
  const [sofortStart, setSofortStart] = useState(false)
  const [agbOk, setAgbOk] = useState(false)
  const [fehler, setFehler] = useState<Fehler>({})
  const [linkGeschickt, setLinkGeschickt] = useState(false)
  const [laeuft, setLaeuft] = useState(false)
  const { konto } = useKonto()

  useEffect(
    () =>
      aufKontoOeffnen((a) => {
        setModus(a.modus)
        setAnlass(a.anlass)
        setProdukt(a.produkt)
        setFehler({})
        setLinkGeschickt(false)
        setSofortStart(false)
        setAgbOk(false)
        setOffen(true)
      }),
    [],
  )

  useEffect(() => {
    if (!offen) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOffen(false)
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [offen])

  useEffect(() => {
    if (konto) {
      setFirma(konto.firma ?? '')
      setUid(konto.uid ?? '')
    }
  }, [konto])

  if (!offen) return null

  const tarif = produkt ? tarifFuer(produkt) : undefined
  const emailGueltig = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const anmeldelinkSchicken = async () => {
    if (!email.trim()) return setFehler({ email: 'Bitte geben Sie Ihre E-Mail-Adresse an.' })
    if (!emailGueltig) return setFehler({ email: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' })
    setFehler({})
    setLaeuft(true)
    try {
      await magicLinkAnfordern(email.trim(), anlass)
      setLinkGeschickt(true)
    } catch (e) {
      setFehler({ allgemein: e instanceof Error ? e.message : 'Der Anmeldelink konnte nicht verschickt werden.' })
    } finally {
      setLaeuft(false)
    }
  }

  const kaufen = async () => {
    if (!produkt) return
    if (!sofortStart || !agbOk) {
      return setFehler({ zustimmung: 'Bitte bestätigen Sie beide Punkte, dann geht es weiter zur Zahlung.' })
    }
    setFehler({})
    setLaeuft(true)
    try {
      if (firma.trim() || uid.trim()) await kontoAktualisieren({ firma: firma.trim(), uid: uid.trim(), land: 'AT' })
      await bezahlenStarten(produkt, sofortStart)
    } catch (e) {
      setFehler({ allgemein: e instanceof Error ? e.message : 'Der Bezahlvorgang ließ sich nicht starten.' })
      setLaeuft(false)
    }
  }

  const zurWarteliste = () => {
    setOffen(false)
    kontaktVorbelegen(
      `Bitte informiert mich, sobald Konten freigeschaltet sind.${anlass ? ` Anlass: ${anlass}` : ''}\nE-Mail: ${email.trim() || '[E-Mail bitte ergänzen]'}`,
    )
  }

  const kopf = konto ? 'Ihr Konto' : produkt ? 'Bestellung' : modus === 'anmelden' ? 'Anmelden' : 'Konto anlegen'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOffen(false)
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={kopf}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-lg sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-[1.35rem] font-semibold leading-tight text-ink">{kopf}</p>
          <button
            type="button"
            onClick={() => setOffen(false)}
            aria-label="Schließen"
            className="shrink-0 rounded-lg px-2 py-1 text-ink-faint transition-colors hover:text-accent"
          >
            ✕
          </button>
        </div>

        {anlass && !konto && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{anlass}</p>}

        {/* 1. Angemeldet: Kontostand, Rechnungsangaben, Kauf */}
        {konto ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed text-ink-soft">
              <p className="font-semibold text-ink">{konto.email}</p>
              <p className="mt-1">
                Tarif: {konto.tarif === 'frei' ? 'Rechner (kostenlos)' : konto.tarif}
                {konto.laufzeitBis ? ` · läuft bis ${new Date(konto.laufzeitBis).toLocaleDateString('de-AT')}` : ''}
              </p>
              {konto.guthabenBerichte > 0 && <p className="mt-1">Offene Prüfberichte: {konto.guthabenBerichte}</p>}
              {konto.apiSchluessel && (
                <p className="mt-1 break-all">
                  API-Schlüssel: <code className="text-ink">{konto.apiSchluessel}</code>
                </p>
              )}
            </div>

            <TextField label="Firma (für die Rechnung)" id="konto-firma" value={firma} onChange={(e) => setFirma(e.target.value)} />
            <TextField
              label="UID-Nummer (optional)"
              id="konto-uid"
              value={uid}
              hint="Bei einer gültigen UID aus einem anderen EU-Staat wird ohne Umsatzsteuer verrechnet (Reverse Charge)."
              onChange={(e) => setUid(e.target.value)}
            />

            {tarif && (
              <>
                <Bestellangaben tarifName={tarif.name} brutto={tarif.brutto} einheit={tarif.einheit} laufzeit={tarif.laufzeit} />
                <div className="space-y-4">
                  <Checkbox
                    checked={sofortStart}
                    onChange={setSofortStart}
                    label={
                      <span className="text-sm leading-relaxed text-ink-soft">
                        Ich verlange ausdrücklich, dass mit der Leistung sofort begonnen wird, und nehme zur Kenntnis,
                        dass ich mit vollständiger Erfüllung mein Rücktrittsrecht verliere.
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
                  onClick={() => void kaufen()}
                  disabled={laeuft}
                  className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-60"
                >
                  {laeuft ? 'Einen Moment …' : 'Zahlungspflichtig bestellen'}
                </button>
              </>
            )}

            {fehler.allgemein && <p className="text-sm text-danger">{fehler.allgemein}</p>}

            <button
              type="button"
              onClick={() => {
                abmelden()
                setOffen(false)
              }}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-base font-semibold text-ink transition-colors hover:text-accent"
            >
              Abmelden
            </button>
          </div>
        ) : linkGeschickt ? (
          /* 2. Anmeldelink unterwegs */
          <div className="mt-6 space-y-4">
            <p className="text-base leading-relaxed text-ink-soft">
              Wir haben einen Anmeldelink an <strong className="text-ink">{email.trim()}</strong> geschickt. Der Link
              gilt 15 Minuten und meldet Sie ohne Passwort an.
            </p>
            <button
              type="button"
              onClick={() => setLinkGeschickt(false)}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-base font-semibold text-ink transition-colors hover:text-accent"
            >
              Andere E-Mail-Adresse
            </button>
          </div>
        ) : !serverVorhanden() ? (
          /* 3. Vorschau-Betrieb: kein Server hinterlegt */
          <div className="mt-6 space-y-5">
            {tarif && <Bestellangaben tarifName={tarif.name} brutto={tarif.brutto} einheit={tarif.einheit} laufzeit={tarif.laufzeit} />}
            <p className="text-base leading-relaxed text-ink-soft">
              Konten und Zahlung sind noch nicht freigeschaltet – der Rechner bleibt ohne Anmeldung vollständig nutzbar.
              Tragen Sie sich ein, dann melden wir uns, sobald es losgeht.
            </p>
            <TextField
              label="E-Mail-Adresse"
              id="konto-email"
              type="email"
              autoComplete="email"
              value={email}
              fehler={fehler.email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="button"
              onClick={zurWarteliste}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
            >
              Auf die Warteliste
            </button>
          </div>
        ) : (
          /* 4. Anmeldung per Magic-Link */
          <div className="mt-6 space-y-6">
            {tarif && <Bestellangaben tarifName={tarif.name} brutto={tarif.brutto} einheit={tarif.einheit} laufzeit={tarif.laufzeit} />}
            <TextField
              label="E-Mail-Adresse"
              id="konto-email"
              type="email"
              autoComplete="email"
              value={email}
              fehler={fehler.email}
              hint="Wir schicken einen Anmeldelink – kein Passwort nötig."
              onChange={(e) => setEmail(e.target.value)}
            />
            {fehler.allgemein && <p className="text-sm text-danger">{fehler.allgemein}</p>}
            <button
              type="button"
              onClick={() => void anmeldelinkSchicken()}
              disabled={laeuft}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-60"
            >
              {laeuft ? 'Einen Moment …' : 'Anmeldelink schicken'}
            </button>
            <p className="text-[12px] leading-relaxed text-ink-faint">
              Mit der Anmeldung gelten die{' '}
              <a className={linkStil} href={`${BASIS}agb.html`} target="_blank" rel="noreferrer">
                AGB
              </a>{' '}
              und die{' '}
              <a className={linkStil} href={`${BASIS}datenschutz.html`} target="_blank" rel="noreferrer">
                Datenschutzerklärung
              </a>
              . Der Rechner selbst bleibt ohne Konto nutzbar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/** Pflichtangaben vor der Bestellung (§ 4 FAGG, § 6 Abs 1 KSchG, § 4 PrAG). */
function Bestellangaben({
  tarifName,
  brutto,
  einheit,
  laufzeit,
}: {
  tarifName: string
  brutto: number
  einheit: string
  laufzeit?: string
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed text-ink-soft">
      <p className="font-semibold text-ink">{tarifName}</p>
      <p className="mt-1">
        Gesamtpreis {euro(brutto)} {einheit} – inklusive 20 % Umsatzsteuer ({euro(netto(brutto))} netto). Keine
        weiteren Kosten.
      </p>
      {laufzeit && <p className="mt-1">{laufzeit}</p>}
      <p className="mt-1">Leistung: automatisierte Ersteinschätzung als digitaler Inhalt, sofort verfügbar.</p>
    </div>
  )
}
