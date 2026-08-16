import { useState } from 'react'
import { TextField, TextareaField } from './ui'

// Empfänger der Nachrichten aus dem Kontaktformular.
const KONTAKT_EMAIL = 'gayane.mileski@gmail.com'

export function Kontakt() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nachricht, setNachricht] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)
  const [gesendet, setGesendet] = useState(false)

  const senden = () => {
    if (!name.trim() || !email.trim() || !nachricht.trim()) {
      setFehler('Bitte fülle alle drei Felder aus.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFehler('Bitte gib eine gültige E-Mail-Adresse an.')
      return
    }
    setFehler(null)
    const body = `${nachricht}\n\n---\nName: ${name}\nE-Mail: ${email}`
    window.location.href = `mailto:${KONTAKT_EMAIL}?subject=${encodeURIComponent('Nachricht über den Mietzins-Check')}&body=${encodeURIComponent(body)}`
    setGesendet(true)
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
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent hover:bg-accent-strong"
          >
            Senden
          </button>

          {gesendet && (
            <p className="text-base text-ink-soft">
              Deine Nachricht wurde in deinem E-Mail-Programm geöffnet – bitte dort noch abschicken.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
