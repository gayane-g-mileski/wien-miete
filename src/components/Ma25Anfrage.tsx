import { useState } from 'react'
import { Field, TextInput, Textarea } from './ui'

const MA25_EMAIL = 'post@ma25.wien.gv.at'
const MAX_MB = 5
const OK_TYPEN = ['application/pdf', 'image/jpeg', 'image/png']

function standardText(anschrift: string): string {
  const adr = anschrift.trim() || '[Anschrift bitte ergänzen]'
  return (
    'Sehr geehrte Damen und Herren,\n\n' +
    'ich möchte den zulässigen Mietzins für meine Wohnung einschätzen und benötige dafür das Jahr der ' +
    'Baubewilligung des Gebäudes. Könnten Sie mir diese Information bitte mitteilen?\n\n' +
    `Anschrift: ${adr}\n\n` +
    'Die erforderlichen Unterlagen (z.B. Meldezettel, Eigentumsnachweis, Vollmacht) habe ich angehängt.\n\n' +
    'Vielen Dank für Ihre Unterstützung!\n\n' +
    'Mit freundlichen Grüßen'
  )
}

export function Ma25Anfrage({ anschrift }: { anschrift: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [text, setText] = useState(() => standardText(anschrift))
  const [dateien, setDateien] = useState<File[]>([])
  const [fehler, setFehler] = useState<string | null>(null)
  const [gesendet, setGesendet] = useState(false)

  const addDateien = (list: FileList | null) => {
    if (!list) return
    const neu: File[] = []
    for (const f of Array.from(list)) {
      if (!OK_TYPEN.includes(f.type)) {
        setFehler(`"${f.name}" hat ein ungültiges Format. Erlaubt sind PDF, JPG und PNG.`)
        continue
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setFehler(`"${f.name}" ist größer als ${MAX_MB} MB.`)
        continue
      }
      neu.push(f)
    }
    if (neu.length) {
      setFehler(null)
      setDateien((d) => [...d, ...neu])
    }
  }

  const entferne = (i: number) => setDateien((d) => d.filter((_, idx) => idx !== i))

  const senden = () => {
    if (!name.trim() || !email.trim()) {
      setFehler('Bitte gib deinen Namen und deine E-Mail-Adresse an.')
      return
    }
    setFehler(null)
    const body = `${text}\n\n---\nName: ${name}\nE-Mail: ${email}`
    const href = `mailto:${MA25_EMAIL}?subject=${encodeURIComponent('Anfrage: Jahr der Baubewilligung')}&body=${encodeURIComponent(body)}`
    window.location.href = href
    setGesendet(true)
  }

  const labelCls = 'mb-1.5 block text-sm font-medium text-neutral-800'
  const btnUpload =
    'inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100'

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-neutral-300 bg-neutral-50 p-4">
      <div className="rounded-md bg-neutral-900 px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-white">
        Diese Anfrage ist kostenlos
      </div>

      <p className="text-sm text-neutral-600">
        Die MA 25 kann dir das Jahr der Baubewilligung nennen. Wenn du alle Infos beisammen hast, komm einfach zurück und
        lass die Miete hier neu berechnen.
      </p>

      <Field label="Name" htmlFor="ma25-name">
        <TextInput id="ma25-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vor- und Nachname" />
      </Field>

      <Field label="E-Mail-Adresse" htmlFor="ma25-email">
        <TextInput
          id="ma25-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@beispiel.at"
        />
      </Field>

      <Field label="Nachricht" htmlFor="ma25-text">
        <Textarea id="ma25-text" rows={7} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>

      <div>
        <span className={labelCls}>Unterlagen (Meldezettel, Eigentumsnachweis, Vollmacht …)</span>
        <label className={btnUpload}>
          Dateien auswählen
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              addDateien(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
        <p className="mt-1 text-xs text-neutral-500">Mehrere möglich. PDF, JPG oder PNG, je max. {MAX_MB} MB.</p>

        {dateien.length > 0 && (
          <ul className="mt-2 space-y-1">
            {dateien.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700">
                <span className="truncate">
                  {f.name} <span className="text-neutral-400">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                </span>
                <button type="button" onClick={() => entferne(i)} className="shrink-0 text-neutral-400 hover:text-neutral-800" aria-label="Entfernen">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {fehler && <p className="text-sm font-medium text-red-700">{fehler}</p>}

      <button
        type="button"
        onClick={senden}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
      >
        Anfrage senden
      </button>

      {gesendet && (
        <p className="text-sm text-neutral-600">
          Deine E-Mail an die MA 25 wurde vorbereitet und in deinem E-Mail-Programm geöffnet. Bitte hänge die ausgewählten
          Dateien dort noch an und schick sie ab.
        </p>
      )}
    </div>
  )
}
