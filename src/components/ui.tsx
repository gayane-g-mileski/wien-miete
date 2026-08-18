import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// Material-Design-ähnliche Outlined-Felder mit schwebendem Label (Schwarz-Weiß).

const boxBasis =
  'peer w-full rounded-lg border bg-transparent text-base text-ink outline-none ' +
  'transition-colors focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60'

// Fehlerhafte Felder bekommen einen roten Rahmen (wie in Material Design),
// der Hinweistext darunter wird zur Fehlermeldung.
const box = (fehler?: string) =>
  `${boxBasis} ${fehler ? 'border-danger focus:border-danger focus:ring-danger' : 'border-line focus:border-accent focus:ring-accent'}`

// Label schwebt von der Mitte auf die obere Rahmenlinie (bei Fokus oder Inhalt).
const floatLabel =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-ink-faint transition-all ' +
  'peer-focus:top-0 peer-focus:text-xs peer-focus:text-accent peer-focus:bg-surface peer-focus:px-1 ' +
  'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs ' +
  'peer-[:not(:placeholder-shown)]:bg-surface peer-[:not(:placeholder-shown)]:px-1'

// Label dauerhaft oben (für Select/Textarea, die immer „gefüllt“ wirken).
const topLabel =
  'pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-surface px-1 text-xs text-ink-faint peer-focus:text-accent'

function Hint({ children, fehler, id }: { children?: ReactNode; fehler?: string; id?: string }) {
  if (fehler) {
    return (
      <p id={id} role="alert" className="mt-1 px-1 text-[12px] text-danger">
        {fehler}
      </p>
    )
  }
  return children ? <p className="mt-1 px-1 text-[12px] text-ink-faint">{children}</p> : null
}

interface FieldProps {
  label: string
  hint?: ReactNode
  /** Fehlermeldung – erscheint direkt unter dem Feld. */
  fehler?: string
}

export function TextField({ label, hint, fehler, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          aria-invalid={fehler ? true : undefined}
          aria-describedby={fehler && id ? `${id}-fehler` : undefined}
          {...props}
          className={`${box(fehler)} h-14 px-3 pt-4 pb-1`}
        />
        <label htmlFor={id} className={floatLabel}>
          {label}
        </label>
      </div>
      <Hint fehler={fehler} id={id ? `${id}-fehler` : undefined}>
        {hint}
      </Hint>
    </div>
  )
}

/** Datumsfeld – das Label steht dauerhaft oben, weil ein leeres Datumsfeld
 *  bereits das Format anzeigt. */
export function DateField({ label, hint, fehler, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="relative">
        <input id={id} type="date" {...props} className={`${box(fehler)} h-14 px-3 pt-3`} />
        <label htmlFor={id} className={topLabel}>
          {label}
        </label>
      </div>
      <Hint fehler={fehler}>{hint}</Hint>
    </div>
  )
}

export function NumberField({ label, hint, fehler, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="relative">
        <input id={id} type="number" placeholder=" " {...props} className={`${box(fehler)} h-14 px-3 pt-4 pb-1`} />
        <label htmlFor={id} className={floatLabel}>
          {label}
        </label>
      </div>
      <Hint fehler={fehler}>{hint}</Hint>
    </div>
  )
}

export function SelectField({
  label,
  hint,
  fehler,
  id,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  // Ohne Auswahl steht das Label im Feld (wie ein Platzhalter); sobald etwas
  // gewählt ist, rutscht es auf die obere Rahmenlinie.
  const leer = props.value === '' || props.value == null
  return (
    <div>
      <div className="relative">
        <select id={id} {...props} className={`${box(fehler)} select-chevron h-14 appearance-none px-3 pr-10 pt-2`}>
          {children}
        </select>
        <label
          htmlFor={id}
          className={
            leer
              ? 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-ink-faint'
              : topLabel
          }
        >
          {label}
        </label>
      </div>
      <Hint fehler={fehler}>{hint}</Hint>
    </div>
  )
}

export function TextareaField({
  label,
  hint,
  fehler,
  id,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <div className="relative">
        <textarea
          id={id}
          placeholder=" "
          aria-invalid={fehler ? true : undefined}
          aria-describedby={fehler && id ? `${id}-fehler` : undefined}
          {...props}
          className={`${box(fehler)} px-3 pb-2 pt-5`}
        />
        <label
          htmlFor={id}
          className={
            'pointer-events-none absolute left-3 top-5 text-base text-ink-faint transition-all ' +
            'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:bg-surface peer-focus:px-1 peer-focus:text-accent ' +
            'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 ' +
            'peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-surface peer-[:not(:placeholder-shown)]:px-1'
          }
        >
          {label}
        </label>
      </div>
      <Hint fehler={fehler} id={id ? `${id}-fehler` : undefined}>
        {hint}
      </Hint>
    </div>
  )
}

/** Einheitliche Checkbox mit fixer Größe. */
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-base text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-line accent-accent focus:ring-2 focus:ring-accent/40"
      />
      <span>{label}</span>
    </label>
  )
}

/** Abschnitts-Container – Titel steht außerhalb, oberhalb des Rahmens (20px Abstand). */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-5 px-1 text-sm font-semibold text-ink-faint">{title}</h3>
      <div className="space-y-8 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">{children}</div>
    </section>
  )
}

/** Spaltentitel (groß) mit kleiner Unterzeile – hält beide Spalten oben bündig. */
export function SpaltenTitel({ titel, unterzeile }: { titel: string; unterzeile: string }) {
  return (
    <div>
      <h2 className="mb-1 px-1 text-[2rem] font-semibold leading-tight tracking-tight text-ink">{titel}</h2>
      <p className="mb-5 px-1 text-sm font-semibold text-ink-faint">{unterzeile}</p>
    </div>
  )
}

/** Einklappbarer Abschnitt mit Chevron rechts (standardmäßig zugeklappt). */
export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [offen, setOffen] = useState(defaultOpen)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-ink"
      >
        <span>{title}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 shrink-0 text-accent transition-transform ${offen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {offen && <div className="mt-3">{children}</div>}
    </div>
  )
}
