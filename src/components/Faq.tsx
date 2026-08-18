import { Collapsible } from './ui'
import { FAQ } from '../lib/faq'

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-4 border-t border-line bg-surface-2">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">Häufige Fragen</h2>

        <div className="mt-8 space-y-4">
          {FAQ.map((f) => (
            <div key={f.frage} className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
              <Collapsible title={f.frage}>
                <p className="text-sm leading-relaxed text-ink-soft">{f.antwort}</p>
              </Collapsible>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
