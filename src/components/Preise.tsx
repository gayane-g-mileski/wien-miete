import { kontoOeffnen } from '../lib/kontoEvent'
import { TARIFE, euro, netto, preisText } from '../lib/tarife'
import { BASIS, href } from '../lib/seo'

// Preise. Angegeben sind Endpreise inklusive Umsatzsteuer (§ 4 PrAG); der
// Nettobetrag steht daneben. Laufzeit und Verlängerung stehen bei jedem Tarif
// (§ 6 Abs 1 KSchG), das Rücktrittsrecht ist verlinkt.

export function Preise() {
  return (
    <section id="preise" className="scroll-mt-4 border-t border-line bg-surface-2">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">Preise</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          Der Rechner bleibt kostenlos. Bezahlt wird nur, was darüber hinausgeht – der ausführliche Prüfbericht, die
          Arbeit mit vielen Einheiten und der Zugang über die Schnittstelle.
        </p>

        <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-4">
          {TARIFE.map((t) => (
            <div
              key={t.id}
              className={`flex flex-col rounded-2xl border bg-surface p-5 shadow-sm sm:p-6 ${
                t.hervor ? 'border-accent ring-1 ring-accent/30' : 'border-line'
              }`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">{t.name}</p>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-[1.9rem] font-bold leading-none tracking-tight text-ink">{preisText(t)}</span>
                <span className="text-sm text-ink-faint">{t.einheit}</span>
              </p>
              {t.brutto > 0 && (
                <p className="mt-1 text-xs text-ink-faint">
                  inkl. 20 % USt · {euro(netto(t.brutto))} netto
                </p>
              )}
              <p className="mt-2 text-sm text-ink-soft">{t.fuer}</p>

              <div className="mt-5 flex-1 space-y-2">
                {t.leistungen.map((l) => (
                  <p key={l} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                    <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {l}
                  </p>
                ))}
              </div>

              {t.laufzeit && <p className="mt-5 text-xs leading-relaxed text-ink-faint">{t.laufzeit}</p>}

              <button
                type="button"
                onClick={() =>
                  t.produkt
                    ? kontoOeffnen(t.anlass, 'registrieren', t.produkt)
                    : document.getElementById('rechner')?.scrollIntoView({ behavior: 'smooth' })
                }
                className={`mt-6 w-full rounded-lg px-4 py-2.5 text-base font-semibold transition-colors ${
                  t.hervor
                    ? 'bg-accent text-on-accent hover:bg-accent-strong'
                    : 'border border-accent/50 text-accent hover:bg-accent/10'
                }`}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2 text-sm leading-relaxed text-ink-faint">
          <p>
            Alle Preise sind Endpreise inklusive 20 % Umsatzsteuer. Unternehmen mit gültiger UID aus einem anderen
            EU-Staat werden ohne Umsatzsteuer verrechnet. Die Rechnung kommt sofort nach der Zahlung als PDF.
          </p>
          <p>
            Für digitale Inhalte gilt ein Rücktrittsrecht von 14 Tagen; es erlischt, sobald die Leistung mit
            ausdrücklicher Zustimmung sofort erbracht wurde. Einzelheiten in der{' '}
            <a className="text-accent underline" href={`${BASIS}widerruf.html`} target="_blank" rel="noreferrer">
              Rücktrittsbelehrung
            </a>{' '}
            und in den{' '}
            <a className="text-accent underline" href={`${BASIS}agb.html`} target="_blank" rel="noreferrer">
              AGB
            </a>
            .
          </p>
          <p>
            Schnittstelle und eingebetteter Rechner sind unter{' '}
            <a className="text-accent underline" href={href('api/')}>
              Schnittstelle und White-Label
            </a>{' '}
            beschrieben.
          </p>
        </div>
      </div>
    </section>
  )
}
