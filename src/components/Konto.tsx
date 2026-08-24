import { useEffect, useState } from 'react'
import { TextField } from './ui'
import { IconKonto } from './Icons'
import { aufKontoOeffnen } from '../lib/kontoEvent'
import { kontaktVorbelegen } from '../lib/kontaktEvent'
import { abmelden, kontoAktualisieren, magicLinkAnfordern, serverVorhanden, useKonto } from '../lib/konto'
import { BASIS } from '../lib/seo'

// Anmeldung ohne Passwort (Magic-Link) und Kontoverwaltung.
//
// Gekauft wird nicht hier, sondern im Kaufdialog (Kaufdialog.tsx) – für
// Prüfbericht und Zugänge auf demselben Weg, mit denselben Pflichtangaben nach
// dem Fern- und Auswärtsgeschäfte-Gesetz.

interface Fehler {
  name?: string
  email?: string
  allgemein?: string
}

const linkStil = 'text-accent underline'

export function Konto() {
  const [offen, setOffen] = useState(false)
  const [anlass, setAnlass] = useState<string | undefined>()
  // Vor- und Nachname in einem Feld: So steht der Name auf der Rechnung, ohne
  // dass jemand zwei Felder ausfüllen muss.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [firma, setFirma] = useState('')
  const [uid, setUid] = useState('')
  const [fehler, setFehler] = useState<Fehler>({})
  const [linkGeschickt, setLinkGeschickt] = useState(false)
  const [laeuft, setLaeuft] = useState(false)
  const { konto } = useKonto()

  useEffect(
    () =>
      aufKontoOeffnen((a) => {
        setAnlass(a.anlass)
        setFehler({})
        setLinkGeschickt(false)
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
      setName(konto.name ?? '')
      setFirma(konto.firma ?? '')
      setUid(konto.uid ?? '')
    }
  }, [konto])

  if (!offen) return null

  const emailGueltig = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const anmeldelinkSchicken = async () => {
    if (!name.trim()) return setFehler({ name: 'Bitte geben Sie Ihren Vor- und Nachnamen an.' })
    if (!email.trim()) return setFehler({ email: 'Bitte geben Sie Ihre E-Mail-Adresse an.' })
    if (!emailGueltig) return setFehler({ email: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' })
    setFehler({})
    setLaeuft(true)
    try {
      await magicLinkAnfordern(email.trim(), name.trim(), anlass)
      setLinkGeschickt(true)
    } catch (e) {
      setFehler({ allgemein: e instanceof Error ? e.message : 'Der Anmeldelink konnte nicht verschickt werden.' })
    } finally {
      setLaeuft(false)
    }
  }

  const zurWarteliste = () => {
    setOffen(false)
    kontaktVorbelegen(
      `Bitte informiert mich, sobald Konten freigeschaltet sind.${anlass ? ` Anlass: ${anlass}` : ''}\nName: ${name.trim() || '[Name bitte ergänzen]'}\nE-Mail: ${email.trim() || '[E-Mail bitte ergänzen]'}`,
    )
  }

  // Registrieren und Anmelden führen über denselben Link – deshalb eine Überschrift.
  const kopf = konto ? 'Ihr Konto' : 'Registrieren / Anmelden'

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

            <TextField label="Name" id="konto-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Firma (für die Rechnung)" id="konto-firma" value={firma} onChange={(e) => setFirma(e.target.value)} />
            <TextField
              label="UID-Nummer (optional)"
              id="konto-uid"
              value={uid}
              hint="Bei einer gültigen UID aus einem anderen EU-Staat wird ohne Umsatzsteuer verrechnet (Reverse Charge)."
              onChange={(e) => setUid(e.target.value)}
            />

            <button
              type="button"
              disabled={laeuft}
              onClick={() => {
                setLaeuft(true)
                void kontoAktualisieren({ name: name.trim(), firma: firma.trim(), uid: uid.trim(), land: 'AT' })
                  .catch((e: unknown) =>
                    setFehler({ allgemein: e instanceof Error ? e.message : 'Speichern hat nicht geklappt.' }),
                  )
                  .finally(() => setLaeuft(false))
              }}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-60"
            >
              {laeuft ? 'Einen Moment …' : 'Rechnungsangaben speichern'}
            </button>

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
          <div className="mt-6 space-y-6">
            <p className="text-base leading-relaxed text-ink-soft">
              Konten und Zahlung sind noch nicht freigeschaltet – der Rechner bleibt ohne Anmeldung vollständig nutzbar.
              Ihre Angaben werden vorgemerkt, wir melden uns, sobald es losgeht.
            </p>
            <TextField
              label="Name"
              id="konto-name"
              autoComplete="name"
              value={name}
              fehler={fehler.name}
              hint="Vor- und Nachname, wie er auf der Rechnung stehen soll."
              onChange={(e) => setName(e.target.value)}
            />
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
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
            >
              <IconKonto />
              Registrieren / Anmelden
            </button>
            <p className="-mt-3 text-center text-[12px] text-ink-faint">
              Bis zur Freischaltung wird die Registrierung vorgemerkt – der nächste Schritt führt zum Kontaktformular.
            </p>
          </div>
        ) : (
          /* 4. Registrieren und Anmelden – beides derselbe Weg per Magic-Link */
          <div className="mt-6 space-y-6">
            <TextField
              label="Name"
              id="konto-name"
              autoComplete="name"
              value={name}
              fehler={fehler.name}
              hint="Vor- und Nachname, wie er auf der Rechnung stehen soll."
              onChange={(e) => setName(e.target.value)}
            />
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
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-60"
            >
              <IconKonto />
              {laeuft ? 'Einen Moment …' : 'Registrieren / Anmelden'}
            </button>
            <p className="-mt-3 text-center text-[12px] text-ink-faint">
              Ein Weg für beides: Ist noch kein Konto vorhanden, wird es mit dem Link angelegt.
            </p>
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
