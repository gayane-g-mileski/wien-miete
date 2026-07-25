import { useEffect, useRef, useState } from 'react'
import type { AdressTreffer } from '../lib/geo'
import { istGemeindebau, sucheAdressen } from '../lib/geo'
import type { Koordinaten } from '../lib/types'

interface Props {
  value: string
  onChange: (text: string, bezirk: number | null, koords: Koordinaten | null) => void
  onGemeindebau?: (detected: boolean) => void
  onFehlerChange?: (fehler: boolean) => void
}

const box =
  'peer h-14 w-full rounded-md border border-neutral-400 bg-transparent px-3 pt-4 pb-1 text-base text-neutral-900 ' +
  'outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'

const floatLabel =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-neutral-500 transition-all ' +
  'peer-focus:top-0 peer-focus:text-sm peer-focus:text-neutral-900 peer-focus:bg-white peer-focus:px-1 ' +
  'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-sm ' +
  'peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1'

export function AnschriftFeld({ value, onChange, onGemeindebau, onFehlerChange }: Props) {
  const [treffer, setTreffer] = useState<AdressTreffer[]>([])
  const [offen, setOffen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const q = value.trim()
    if (q.length < 3) {
      setTreffer([])
      onFehlerChange?.(false)
      return
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      onFehlerChange?.(false)
      try {
        const res = await sucheAdressen(q, ctrl.signal)
        setTreffer(res)
        setOffen(true)
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          setTreffer([])
          onFehlerChange?.(true)
        }
      }
    }, 250)
    return () => clearTimeout(t)
  }, [value, onFehlerChange])

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
    if (t.koords && onGemeindebau) {
      istGemeindebau(t.koords).then((gb) => {
        if (gb != null) onGemeindebau(gb)
      })
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        id="anschrift"
        type="text"
        autoComplete="off"
        placeholder=" "
        className={box}
        value={value}
        onChange={(e) => {
          onChange(e.target.value, null, null)
          setOffen(true)
        }}
        onFocus={() => treffer.length > 0 && setOffen(true)}
      />
      <label htmlFor="anschrift" className={floatLabel}>
        Anschrift (optional)
      </label>
      {offen && treffer.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-neutral-300 bg-white py-1 shadow-lg">
          {treffer.map((t) => (
            <li key={t.label}>
              <button
                type="button"
                onClick={() => waehle(t)}
                className="block w-full px-3 py-2 text-left text-base text-neutral-800 hover:bg-neutral-100"
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
