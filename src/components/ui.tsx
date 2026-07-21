import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

// Einheitliche Basis-Styles, damit alle Eingabefelder überall gleich aussehen.
const control =
  'w-full rounded-lg border border-sand-line bg-cream-50 px-3 py-2 text-sm text-ink shadow-sm ' +
  'focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/40 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

/** Label + optionaler Hinweis um ein Eingabeelement. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  )
}

/** Einheitliches Textfeld. */
export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" {...props} className={control} />
}

/** Einheitliches Zahlenfeld. */
export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" {...props} className={control} />
}

/** Einheitliches Auswahlfeld. */
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={control} />
}

/** Einheitliche Checkbox mit fixer Größe – überall identisch. */
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
    <label className="flex cursor-pointer items-start gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-sand-line bg-cream-50 text-sage focus:ring-2 focus:ring-sage/40"
      />
      <span>{label}</span>
    </label>
  )
}

/** Abschnitts-Container mit Titel. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-sand-line bg-cream-100 p-4 sm:p-5">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-wine">{title}</legend>
      {children}
    </fieldset>
  )
}
