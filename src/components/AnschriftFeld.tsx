import { useEffect, useRef, useState } from 'react'
import type { AdressTreffer } from '../lib/geo'
import { istGemeindebau, sucheAdressen } from '../lib/geo'
import type { Koordinaten } from '../lib/types'
import { Field } from './ui'

interface Props {
  value: string
  onChange: (text: string, bezirk: number | null, koords: Koordinaten | null) => void
  onGemeindebau?: (detected: boolean) => void
}

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm ' +
  'placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300'

export function AnschriftFeld({ value, onChange, onGemeindebau }: Props) {
  const [treffer, setTreffer] = useState<AdressTreffer[]>([])
  const [offen, setOffen] = useState(false)
  const [laedt, setLaedt] = useState(false)
  const [fehler, setFehler] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Autocomplete ab dem 3. Zeichen (debounced).
  useEffect(() => {
    const q = value.trim()
    if (q.length < 3) {
      setTreffer([])
      setFehler(false)
      return
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLaedt(true)
      setFehler(false)
      try {
        const res = await sucheAdressen(q, ctrl.signal)
        setTreffer(res)
        setOffen(true)
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          setTreffer([])
          setFehler(true)
        }
      } finally {
        setLaedt(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [value])

  // Klick außerhalb schließt die Vorschlagsliste.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOffen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const waehle = (t: AdressTreffer) => {
    onChange(t.label, t.bezirk, t.koords)
    setOffen(false)
    setTreffer([])
    // Gemeindebau best-effort erkennen (nur bei bekannten Koordinaten)
    if (t.koords && onGemeindebau) {
      istGemeindebau(t.koords).then((gb) => {
        if (gb != null) onGemeindebau(gb)
      })
    }
  }

  return (
    <Field
      label={
        <>
          Anschrift <span className="font-normal text-neutral-400">(optional)</span>
        </>
      }
      htmlFor="anschrift"
      hint={
        fehler
          ? 'Adresssuche gerade nicht erreichbar – du kannst die Adresse trotzdem eintippen (mit Wiener PLZ wird die Lage erkannt).'
          : 'Nach dem 3. Zeichen erscheinen Vorschläge. Ohne Anschrift wird die Lage nicht berücksichtigt.'
      }
    >
      <div ref={boxRef} className="relative">
        <input
          id="anschrift"
          type="text"
          autoComplete="off"
          className={inputClass}
          placeholder="z.B. Lindengasse 12, 1070 Wien"
          value={value}
          onChange={(e) => {
            onChange(e.target.value, null, null)
            setOffen(true)
          }}
          onFocus={() => treffer.length > 0 && setOffen(true)}
        />
        {laedt && <span className="absolute right-3 top-2.5 text-xs text-neutral-400">…</span>}
        {offen && treffer.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-neutral-300 bg-white py-1 shadow-lg">
            {treffer.map((t) => (
              <li key={t.label}>
                <button
                  type="button"
                  onClick={() => waehle(t)}
                  className="block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-100"
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  )
}
