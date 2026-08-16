import { useState } from 'react'
import { TextField, TextareaField } from './ui'

// Empfänger der Nachrichten aus dem Kontaktformular.
const KONTAKT_EMAIL = 'gayane.mileski@gmail.com'
// Die Seite läuft ohne eigenen Server (GitHub Pages). Der Versand geht daher
// über den Formular-Dienst FormSubmit, der die Nachricht per E-Mail zustellt –
// ohne dass sich beim Absender ein E-Mail-Programm öffnet.
const VERSAND_URL = `https://formsubmit.co/ajax/${KONTAKT_EMAIL}`

type Status = 'bereit' | 'sendet' | 'ok'

export function Kontakt() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nachricht, setNachricht] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('bereit')

  const senden = async () => {
    if (!name.trim() || !email.trim() || !nachricht.trim()) {
      setFehler('Bitte fülle alle drei Felder aus.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFehler('Bitte gib eine gültige E-Mail-Adresse an.')
      return
    }
    setFehler(null)
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
      setFehler(`Senden hat gerade nicht geklappt. Bitte versuch es später noch einmal oder schreib an ${KONTAKT_EMAIL}.`)
    }
  }

  return (
    <section id="kontakt" className="scroll-mt-4 border-t border-line bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="mb-1 px-1 text-[2rem] font-semibold leading-tight tracking-tight text-accent">Kontakt</h2>
        <p className="mb-8 px-1 text-sm font-semibold text-ink-faint">Fragen, Hinweise oder Fehler gefunden?</p>

        <div className="space-y-8">
          <TextField label="Name" id="kontakt-name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="E-Mail-Adresse"
            id="kontakt-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextareaField
            label="Nachricht"
            id="kontakt-nachricht"
            rows={7}
            value={nachricht}
            onChange={(e) => setNachricht(e.target.value)}
          />

          {fehler && (
            <p role="alert" className="rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-base font-medium text-danger">
              {fehler}
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
