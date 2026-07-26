import type { LageStatus, MrgErgebnis } from '../lib/types'
import { flaechenwidmungLink, laerminfoLink } from '../lib/geo'
import { Collapsible } from './ui'

const LAGE_STYLE: Record<LageStatus, string> = {
  unbekannt: 'text-ink-soft',
  zuschlag: 'text-accent',
  neutral: 'text-ink-soft',
  abschlag: 'text-accent',
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
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  )
}

function Preiswert({ min, max }: { min: number; max: number }) {
  return (
    <span className="shrink-0 tabular-nums">
      <span className="text-2xl font-bold text-accent">{formatEuro(min)}</span>
      <span className="px-1.5 text-2xl font-light text-accent/50">—</span>
      <span className="text-2xl font-bold text-accent">{formatEuro(max)}</span>
      <span className="ml-1 text-2xl font-semibold text-accent">€</span>
    </span>
  )
}

export function Ergebnis({ ergebnis }: { ergebnis: MrgErgebnis }) {
  const { lage } = ergebnis

  return (
    <div>
      <h2 className="mb-1 px-1 text-[2rem] font-semibold leading-tight tracking-tight text-accent">Ergebnis der Ersteinschätzung</h2>
      <p className="mb-2 px-1 text-sm text-ink-soft">Basierend auf den eingegebenen Objektmerkmalen.</p>

      <div className="rounded-2xl border border-line bg-surface-2 p-5 shadow-sm ring-1 ring-accent/15 sm:p-6">
        <div className="space-y-1">
          <Zeile label="Mietzinsart">
            <span className="text-2xl font-semibold text-ink">{ergebnis.mietzinsArtLabel}</span>
          </Zeile>

          <Zeile label="Schutz & Preisgrenze">
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-semibold text-accent">{ergebnis.anwendungLabel}</span>
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
                <div className="space-y-2 rounded-xl bg-surface px-4 py-3 ring-1 ring-line">
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
                        <li key={b.label} className="flex justify-between gap-4 border-b border-line pb-1 text-ink-soft">
                          <span>{b.label}</span>
                          <span className={`font-medium tabular-nums ${b.wert < 0 ? 'text-accent' : 'text-ink'}`}>
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

        <div className="mt-5 space-y-3 rounded-xl bg-surface p-4 text-sm ring-1 ring-line">
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
                <a className="text-accent underline hover:text-accent-strong" href={laerminfoLink(lage.koords, lage.adresse)} target="_blank" rel="noreferrer">
                  Lärm an dieser Adresse prüfen (laerminfo.at)
                </a>
                <a className="text-accent underline hover:text-accent-strong" href={flaechenwidmungLink(lage.koords, lage.adresse)} target="_blank" rel="noreferrer">
                  Flächenwidmung ansehen (Stadt Wien)
                </a>
              </div>
            )}
          </div>

          {ergebnis.hinweise.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-accent">Zu beachten</p>
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
                <a key={g.url} className="text-accent underline hover:text-accent-strong" href={g.url} target="_blank" rel="noreferrer">
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
