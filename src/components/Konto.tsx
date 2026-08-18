import { useEffect, useState } from 'react'
import { TextField } from './ui'
import { aufKontoOeffnen, type KontoAnlass } from '../lib/kontoEvent'
import { kontaktVorbelegen } from '../lib/kontaktEvent'

// Anmeldung und Registrierung. Die Konten sind noch nicht freigeschaltet –
// das Formular sagt das offen und leitet auf die Warteliste um, statt eine
// Anmeldung vorzutäuschen.

interface Fehler {
  email?: string
  passwort?: string
}

export function Konto() {
  const [offen, setOffen] = useState(false)
  const [modus, setModus] = useState<KontoAnlass['modus']>('registrieren')
  const [anlass, setAnlass] = useState<string | undefined>()
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [fehler, setFehler] = useState<Fehler>({})
  const [gemerkt, setGemerkt] = useState(false)

  useEffect(
    () =>
      aufKontoOeffnen((a) => {
        setModus(a.modus)
        setAnlass(a.anlass)
        setFehler({})
        setGemerkt(false)
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

  if (!offen) return null

  const absenden = () => {
    const neu: Fehler = {}
    if (!email.trim()) neu.email = 'Bitte gib deine E-Mail-Adresse an.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) neu.email = 'Bitte gib eine gültige E-Mail-Adresse an.'
    if (passwort.length < 8) neu.passwort = 'Mindestens 8 Zeichen.'
    setFehler(neu)
    if (Object.keys(neu).length > 0) return
    setGemerkt(true)
  }

  const zurKontaktliste = () => {
    setOffen(false)
    kontaktVorbelegen(
      `Bitte informiert mich, sobald Konten freigeschaltet sind.${anlass ? ` Anlass: ${anlass}` : ''}\nE-Mail: ${email.trim() || '[E-Mail bitte ergänzen]'}`,
    )
  }

  const reiter = (id: KontoAnlass['modus'], text: string) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        setModus(id)
        setFehler({})
        setGemerkt(false)
      }}
      aria-selected={modus === id}
      role="tab"
      className={`flex-1 rounded-lg px-4 py-2 text-base font-semibold transition-colors ${
        modus === id ? 'bg-accent text-on-accent' : 'text-ink hover:text-accent'
      }`}
    >
      {text}
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOffen(false)
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Konto" className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[1.35rem] font-semibold leading-tight text-ink">
            {modus === 'anmelden' ? 'Anmelden' : 'Konto anlegen'}
          </p>
          <button
            type="button"
            onClick={() => setOffen(false)}
            aria-label="Schließen"
            className="shrink-0 rounded-lg px-2 py-1 text-ink-faint transition-colors hover:text-accent"
          >
            ✕
          </button>
        </div>

        {anlass && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{anlass}</p>}

        <div className="mt-5 flex gap-2 rounded-xl bg-surface-2 p-1" role="tablist" aria-label="Anmelden oder registrieren">
          {reiter('anmelden', 'Anmelden')}
          {reiter('registrieren', 'Registrieren')}
        </div>

        {gemerkt ? (
          <div className="mt-6 space-y-4">
            <p className="text-base leading-relaxed text-ink-soft">
              Konten sind noch nicht freigeschaltet – der Rechner bleibt ohne Anmeldung nutzbar. Trag dich ein, dann
              melden wir uns, sobald es losgeht.
            </p>
            <button
              type="button"
              onClick={zurKontaktliste}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
            >
              Auf die Warteliste
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <TextField
              label="E-Mail-Adresse"
              id="konto-email"
              type="email"
              autoComplete="email"
              value={email}
              fehler={fehler.email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Passwort"
              id="konto-passwort"
              type="password"
              autoComplete={modus === 'anmelden' ? 'current-password' : 'new-password'}
              value={passwort}
              fehler={fehler.passwort}
              hint={modus === 'registrieren' ? 'Mindestens 8 Zeichen.' : undefined}
              onChange={(e) => setPasswort(e.target.value)}
            />
            <button
              type="button"
              onClick={absenden}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
            >
              {modus === 'anmelden' ? 'Anmelden' : 'Konto anlegen'}
            </button>
            <p className="text-[12px] leading-relaxed text-ink-faint">
              Konten und Zahlung sind in Vorbereitung. Bis dahin bleibt der Rechner vollständig und ohne Anmeldung
              nutzbar. Mit dem Anlegen gelten die{' '}
              <a className="text-accent underline" href={`${import.meta.env.BASE_URL}agb.html`} target="_blank" rel="noreferrer">
                AGB
              </a>{' '}
              und die{' '}
              <a className="text-accent underline" href={`${import.meta.env.BASE_URL}datenschutz.html`} target="_blank" rel="noreferrer">
                Datenschutzerklärung
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
