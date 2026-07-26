import type { LageStatus, MrgAnwendung, MrgErgebnis } from '../lib/types'
import { flaechenwidmungLink, laerminfoLink } from '../lib/geo'
import { Collapsible } from './ui'

const ANWENDUNG_STYLE: Record<MrgAnwendung, { text: string; ring: string }> = {
  voll: { text: 'text-wine', ring: 'ring-wine/20' },
  teil: { text: 'text-terracotta-600', ring: 'ring-terracotta/25' },
  ausnahme: { text: 'text-sage-700', ring: 'ring-sage/25' },
}

const LAGE_STYLE: Record<LageStatus, string> = {
  unbekannt: 'text-ink-soft',
  zuschlag: 'text-wine',
  neutral: 'text-ink-soft',
  abschlag: 'text-terracotta-600',
}

function formatEuro(n: number): string {
  return n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Zeile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-4">
      <span className="text-xs font-semibold text-ink-faint">{label}</span>
      <div>{children}</div>
    </div>
  )
}

function SchutzZeile({ label, aktiv }: { label: string; aktiv: boolean }) {
  if (!aktiv) return null
  return (
    <span className="flex items-center justify-between gap-3 text-base text-ink-soft">
      {label}
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-sage" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  )
}

function Preiswert({ min, max }: { min: number; max: number }) {
  return (
    <span className="shrink-0 tabular-nums">
      <span className="text-2xl font-bold text-wine">{formatEuro(min)}</span>
      <span className="px-1.5 text-2xl font-light text-wine/50">—</span>
      <span className="text-2xl font-bold text-wine">{formatEuro(max)}</span>
      <span className="ml-1 text-2xl font-semibold text-wine">€</span>
    </span>
  )
}

export function Ergebnis({ ergebnis }: { ergebnis: MrgErgebnis }) {
  const style = ANWENDUNG_STYLE[ergebnis.anwendung]
  const { lage } = ergebnis

  return (
    <div>
      <h2 className="mb-1 px-1 text-2xl font-semibold text-wine">Ergebnis der Ersteinschätzung</h2>
      <p className="mb-2 px-1 text-sm text-ink-soft">Basierend auf den eingegebenen Objektmerkmalen.</p>

      <div className={`rounded-2xl border border-sand-line bg-cream-50 p-5 shadow-sm ring-1 sm:p-6 ${style.ring}`}>
        <div className="space-y-1">
          <Zeile label="Mietzinsart">
            <span className="text-2xl font-semibold text-ink">{ergebnis.mietzinsArtLabel}</span>
          </Zeile>

          <Zeile label="Schutz & Preisgrenze">
            <div className="flex flex-col gap-2">
              <span className={`text-2xl font-semibold ${style.text}`}>{ergebnis.anwendungLabel}</span>
              {ergebnis.kuendigungsschutz || ergebnis.preisschutz ? (
                <div className="flex flex-col gap-1">
                  <SchutzZeile label="Kündigungsschutz" aktiv={ergebnis.kuendigungsschutz} />
                  <SchutzZeile label="Gesetzliche Preisgrenze" aktiv={ergebnis.preisschutz} />
                </div>
              ) : (
                <span className="text-base text-ink-faint">Kein Kündigungsschutz, keine gesetzliche Preisgrenze</span>
              )}
            </div>
          </Zeile>

          <Zeile label="Preisbandbreite">
            {ergebnis.preis ? (
              <div className="space-y-3">
                <div className="space-y-2 rounded-xl bg-cream-100 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-ink-soft">Monatlich pro m², netto</span>
                    <Preiswert min={ergebnis.preis.proM2Min} max={ergebnis.preis.proM2Max} />
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-ink-soft">Monat gesamt</span>
                    <Preiswert min={ergebnis.preis.monatlichMin} max={ergebnis.preis.monatlichMax} />
                  </div>
                </div>
                {ergebnis.preis.bestandteile && ergebnis.preis.bestandteile.length > 0 && (
                  <Collapsible title="Aufschlüsselung">
                    <ul className="space-y-1 text-sm">
                      {ergebnis.preis.bestandteile.map((b) => (
                        <li key={b.label} className="flex justify-between gap-4 border-b border-sand-line/50 pb-1 text-ink-soft">
                          <span>{b.label}</span>
                          <span className={`font-medium tabular-nums ${b.wert < 0 ? 'text-terracotta-600' : 'text-ink'}`}>
                            {b.wert > 0 ? '+' : ''}
                            {formatEuro(b.wert)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Collapsible>
                )}
              </div>
            ) : (
              <span className="text-sm text-ink-faint">Keine Preisschätzung verfügbar.</span>
            )}
          </Zeile>
        </div>

        <div className="mt-5 space-y-3 rounded-xl bg-cream-100 p-4 text-sm">
          <Collapsible title="Was bedeutet das?">
            <ul className="space-y-1 text-ink-soft">
              {ergebnis.begruendung.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </Collapsible>

          <div>
            <p className="mb-1 font-semibold text-ink">Lage</p>
            <p className={LAGE_STYLE[lage.status]}>{lage.text}</p>
            {lage.bezirk != null && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <a className="text-sage-700 underline hover:text-sage" href={laerminfoLink(lage.koords, lage.adresse)} target="_blank" rel="noreferrer">
                  Lärm an dieser Adresse prüfen (laerminfo.at)
                </a>
                <a className="text-sage-700 underline hover:text-sage" href={flaechenwidmungLink(lage.koords, lage.adresse)} target="_blank" rel="noreferrer">
                  Flächenwidmung ansehen (Stadt Wien)
                </a>
              </div>
            )}
          </div>

          {ergebnis.hinweise.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-terracotta-600">Zu beachten</p>
              <ul className="list-inside list-disc space-y-1 text-ink-soft">
                {ergebnis.hinweise.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="mb-1 font-semibold text-ink">Gesetze zum Nachlesen</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {ergebnis.gesetze.map((g) => (
                <a key={g.url} className="text-sage-700 underline hover:text-sage" href={g.url} target="_blank" rel="noreferrer">
                  {g.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
