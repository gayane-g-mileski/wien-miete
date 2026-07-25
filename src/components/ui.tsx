import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// Material-Design-ähnliche Outlined-Felder mit schwebendem Label (Schwarz-Weiß).

const box =
  'peer w-full rounded-md border border-neutral-400 bg-transparent text-base text-neutral-900 outline-none ' +
  'transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

// Label schwebt von der Mitte auf die obere Rahmenlinie (bei Fokus oder Inhalt).
const floatLabel =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-neutral-500 transition-all ' +
  'peer-focus:top-0 peer-focus:text-sm peer-focus:text-neutral-900 peer-focus:bg-white peer-focus:px-1 ' +
  'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-sm ' +
  'peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1'

// Label dauerhaft oben (für Select/Textarea, die immer „gefüllt“ wirken).
const topLabel =
  'pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-sm text-neutral-600 peer-focus:text-neutral-900'

// Eigener Chevron (24px) mit 12px Abstand rechts – native Select-Pfeile sind nicht stylbar.
const CHEVRON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23404040' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"

const selectChevronStyle = {
  backgroundImage: `url("${CHEVRON}")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '24px 24px',
} as const

function Hint({ children }: { children?: ReactNode }) {
  return children ? <p className="mt-1 px-1 text-[12px] text-neutral-500">{children}</p> : null
}

interface FieldProps {
  label: string
  hint?: ReactNode
}

export function TextField({ label, hint, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="relative">
        <input id={id} placeholder=" " {...props} className={`${box} h-14 px-3 pt-4 pb-1`} />
        <label htmlFor={id} className={floatLabel}>
          {label}
        </label>
      </div>
      <Hint>{hint}</Hint>
    </div>
  )
}

export function NumberField({ label, hint, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="relative">
        <input id={id} type="number" placeholder=" " {...props} className={`${box} h-14 px-3 pt-4 pb-1`} />
        <label htmlFor={id} className={floatLabel}>
          {label}
        </label>
      </div>
      <Hint>{hint}</Hint>
    </div>
  )
}

export function SelectField({
  label,
  hint,
  id,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <div className="relative">
        <select id={id} {...props} style={selectChevronStyle} className={`${box} h-14 appearance-none px-3 pr-10 pt-2`}>
          {children}
        </select>
        <label htmlFor={id} className={topLabel}>
          {label}
        </label>
      </div>
      <Hint>{hint}</Hint>
    </div>
  )
}

export function TextareaField({ label, hint, id, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <div className="relative">
        <textarea id={id} placeholder=" " {...props} className={`${box} px-3 pb-2 pt-5`} />
        <label
          htmlFor={id}
          className={
            'pointer-events-none absolute left-3 top-5 text-base text-neutral-500 transition-all ' +
            'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-sm peer-focus:bg-white peer-focus:px-1 peer-focus:text-neutral-900 ' +
            'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 ' +
            'peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1'
          }
        >
          {label}
        </label>
      </div>
      <Hint>{hint}</Hint>
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
    <label className="flex cursor-pointer items-start gap-2 text-base text-neutral-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-400 bg-white text-neutral-800 accent-neutral-800 focus:ring-2 focus:ring-neutral-300"
      />
      <span>{label}</span>
    </label>
  )
}

/** Abschnitts-Container – Titel steht außerhalb, oberhalb des Rahmens. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-neutral-500">{title}</h3>
      <div className="space-y-7 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">{children}</div>
    </section>
  )
}
