import { useState } from 'react'
import type { LageStatus, MrgErgebnis } from '../lib/types'
import { flaechenwidmungLink, laerminfoLink } from '../lib/geo'
import { Collapsible } from './ui'
import { RICHTWERT_WIEN } from '../lib/pricingData'

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
    <span className="flex items-center justify-between gap-3 text-base text-ink-faint">
      {label}
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  )
}

function Preiswert({ min, max, color = 'text-accent' }: { min: number; max: number; color?: string }) {
  return (
    <span className={`shrink-0 tabular-nums ${color}`}>
      <span className="text-2xl font-bold">{formatEuro(min)}</span>
      <span className="px-1.5 text-2xl font-light opacity-50">—</span>
      <span className="text-2xl font-bold">{formatEuro(max)}</span>
      <span className="ml-1 text-2xl font-semibold">€</span>
    </span>
  )
}

export function Ergebnis({ ergebnis }: { ergebnis: MrgErgebnis }) {
  const { lage } = ergebnis
  const [erklaerungOffen, setErklaerungOffen] = useState(false)
  // Lage nur zeigen, wenn tatsächlich eine Anschrift eingegeben wurde.
  const zeigeLage = lage.adresse.trim().length > 0

  return (
    <div>
      <h2 className="mb-1 px-1 text-[2rem] font-semibold leading-tight tracking-tight text-accent">Ergebnis</h2>
      <p className="mb-5 px-1 text-sm font-semibold text-ink-faint">Ersteinschätzung nach den eingegebenen Angaben</p>

      <div className="rounded-2xl border border-line bg-surface-2 p-5 shadow-sm ring-1 ring-accent/15 sm:p-6">
        <div className="space-y-1">
          <Zeile label="Preisbandbreite">
            {ergebnis.preis ? (
              <div className="space-y-3">
                <div className="space-y-4 rounded-xl bg-surface px-4 py-3 ring-1 ring-line sm:space-y-2">
                  {/* Auf dem Handy steht der Wert unter dem Label, ab sm nebeneinander */}
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <span className="text-sm text-ink-faint">Monatlich pro m², netto</span>
                    <Preiswert min={ergebnis.preis.proM2Min} max={ergebnis.preis.proM2Max} color="text-coffee" />
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <span className="text-sm text-ink-faint">Monat gesamt</span>
                    <Preiswert min={ergebnis.preis.monatlichMin} max={ergebnis.preis.monatlichMax} />
                  </div>
                  {ergebnis.preis.bestandteile && ergebnis.preis.bestandteile.length > 0 && (
                    <div className="border-t border-line pt-2">
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
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-sm text-ink-faint">Keine Preisschätzung verfügbar.</span>
            )}
          </Zeile>

          <Zeile label="Mietzinsart">
            {/* Das Chevron sitzt direkt neben dem Wert und klappt die Erklärung auf */}
            <div className="flex items-start justify-between gap-3">
              <span className="text-2xl font-semibold text-ink">{ergebnis.mietzinsArtLabel}</span>
              {ergebnis.begruendung.length > 0 && (
                <button
                  type="button"
                  onClick={() => setErklaerungOffen((o) => !o)}
                  aria-expanded={erklaerungOffen}
                  aria-label={erklaerungOffen ? 'Erklärung ausblenden' : 'Erklärung anzeigen'}
                  className="mt-1 shrink-0 text-accent transition-colors hover:text-accent-strong"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-5 w-5 transition-transform ${erklaerungOffen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              )}
            </div>
            {ergebnis.mietzinsArt === 'richtwert' && (
              <p className="mt-1 text-sm text-ink-soft">
                Richtwert Wien seit 1.4.2026:{' '}
                <span className="font-semibold text-ink">
                  {RICHTWERT_WIEN.toLocaleString('de-AT', { minimumFractionDigits: 2 })} €/m²
                </span>
              </p>
            )}
            {erklaerungOffen && ergebnis.begruendung.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {ergebnis.begruendung.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
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

          {/* Direkt unter dem Schutz-Abschnitt */}
          <Zeile label="Gesetze zum Nachlesen">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {ergebnis.gesetze.map((g) => (
                <a key={g.url} className="text-accent underline hover:text-accent-strong" href={g.url} target="_blank" rel="noreferrer">
                  {g.label}
                </a>
              ))}
            </div>
          </Zeile>
        </div>

        {(zeigeLage || ergebnis.hinweise.length > 0) && (
          <div className="mt-6 space-y-8 rounded-xl bg-surface p-5 text-sm ring-1 ring-line">
            {zeigeLage && (
              <div>
                <p className="mb-1 font-semibold text-ink">Lage</p>
                <p className={LAGE_STYLE[lage.status]}>{lage.text}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <a className="text-accent underline hover:text-accent-strong" href={laerminfoLink(lage.koords, lage.adresse)} target="_blank" rel="noreferrer">
                    Lärm an dieser Adresse prüfen (laerminfo.at)
                  </a>
                  <a className="text-accent underline hover:text-accent-strong" href={flaechenwidmungLink(lage.koords, lage.adresse)} target="_blank" rel="noreferrer">
                    Flächenwidmung ansehen (Stadt Wien)
                  </a>
                </div>
              </div>
            )}

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
          </div>
        )}
      </div>
    </div>
  )
}
