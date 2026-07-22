import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// Einheitliche Basis-Styles für alle Eingabefelder (Schwarz-Weiß-Formular).
const control =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm ' +
  'placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 ' +
  'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-70'

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
      <label className="mb-1.5 block text-sm font-medium text-neutral-800" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" {...props} className={control} />
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" {...props} className={control} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={control} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={control} />
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
    <label className="flex cursor-pointer items-start gap-2 text-sm text-neutral-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-400 bg-white text-neutral-800 accent-neutral-800 focus:ring-2 focus:ring-neutral-300"
      />
      <span>{label}</span>
    </label>
  )
}

/** Abschnitts-Container mit Titel (weißes Karten-Layout). */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</legend>
      {children}
    </fieldset>
  )
}
