import { useState } from 'react'
import { TextField, TextareaField } from './ui'

// Empfänger der Nachrichten aus dem Kontaktformular.
const KONTAKT_EMAIL = 'gayane.mileski@gmail.com'
// Die Seite läuft ohne eigenen Server (GitHub Pages). Der Versand geht daher
// über den Formular-Dienst FormSubmit, der die Nachricht per E-Mail zustellt –
// ohne dass sich beim Absender ein E-Mail-Programm öffnet.
const VERSAND_URL = `https://formsubmit.co/ajax/${KONTAKT_EMAIL}`

type Status = 'bereit' | 'sendet' | 'ok'

interface Fehler {
  name?: string
  email?: string
  nachricht?: string
  versand?: string
}

export function Kontakt() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nachricht, setNachricht] = useState('')
  const [fehler, setFehler] = useState<Fehler>({})
  const [status, setStatus] = useState<Status>('bereit')

  const senden = async () => {
    // Jede Meldung steht bei dem Feld, zu dem sie gehört.
    const neu: Fehler = {}
    if (!name.trim()) neu.name = 'Bitte gib deinen Namen an.'
    if (!email.trim()) neu.email = 'Bitte gib deine E-Mail-Adresse an.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) neu.email = 'Bitte gib eine gültige E-Mail-Adresse an.'
    if (!nachricht.trim()) neu.nachricht = 'Bitte schreib eine Nachricht.'
    setFehler(neu)
    if (Object.keys(neu).length > 0) return
    setStatus('sendet')
    try {
      const antwort = await fetch(VERSAND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: nachricht.trim(),
          _subject: 'Nachricht über den Mietzins-Check',
          _template: 'table',
          _captcha: 'false',
        }),
      })
      if (!antwort.ok) throw new Error(String(antwort.status))
      setStatus('ok')
      setName('')
      setEmail('')
      setNachricht('')
    } catch {
      setStatus('bereit')
      setFehler({
        versand: `Senden hat gerade nicht geklappt. Bitte versuch es später noch einmal oder schreib an ${KONTAKT_EMAIL}.`,
      })
    }
  }

  return (
    <section id="kontakt" className="scroll-mt-4 border-t border-line bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="mb-1 px-1 text-[2rem] font-semibold leading-tight tracking-tight text-accent">Kontakt</h2>
        <p className="mb-8 px-1 text-sm font-semibold text-ink-faint">Fragen, Hinweise oder Fehler gefunden?</p>

        <div className="space-y-8">
          <TextField
            label="Name"
            id="kontakt-name"
            value={name}
            fehler={fehler.name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="E-Mail-Adresse"
            id="kontakt-email"
            type="email"
            value={email}
            fehler={fehler.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextareaField
            label="Nachricht"
            id="kontakt-nachricht"
            rows={7}
            value={nachricht}
            fehler={fehler.nachricht}
            onChange={(e) => setNachricht(e.target.value)}
          />

          {fehler.versand && (
            <p role="alert" className="px-1 text-[12px] text-danger">
              {fehler.versand}
            </p>
          )}

          <button
            type="button"
            onClick={senden}
            disabled={status === 'sendet'}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'sendet' ? 'Wird gesendet …' : 'Senden'}
          </button>

          {status === 'ok' && <p className="text-base font-medium text-accent">Danke, deine Nachricht ist angekommen.</p>}
        </div>
      </div>
    </section>
  )
}
