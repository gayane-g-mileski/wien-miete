import { MethodikInhalt, UeberInhalt } from './Ueber'
import { KontaktInhalt } from './Kontakt'

/** „Wer dahintersteht“ und „Kontakt“ nebeneinander. */
export function UeberKontakt() {
  return (
    <section id="ueber" className="scroll-mt-4 border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <UeberInhalt />
          <div id="kontakt" className="scroll-mt-4">
            <KontaktInhalt />
          </div>
        </div>

        {/* Methodik darunter, 1024 px breit */}
        <div className="mx-auto mt-14 max-w-5xl border-t border-line pt-10">
          <MethodikInhalt />
        </div>
      </div>
    </section>
  )
}
