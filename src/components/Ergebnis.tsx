import { useState } from 'react'
import type { LageStatus, MrgErgebnis } from '../lib/types'
import { flaechenwidmungLink, laerminfoLink, lagezuschlagLink } from '../lib/geo'
import { Collapsible } from './ui'
import { RICHTWERT_WIEN } from '../lib/pricingData'
import { ENGINE_VERSION, RECHTSGRUNDLAGE, RICHTWERT_QUELLE } from '../lib/version'
import { pruefberichtOeffnen } from '../lib/kaufEvent'
import type { MietobjektInput } from '../lib/types'

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

/** Karte über den Reitern: Welche Art von Mietzins gilt – und warum. */
export function ErgebnisArt({ ergebnis }: { ergebnis: MrgErgebnis }) {
  const [erklaerungOffen, setErklaerungOffen] = useState(false)

  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-5 shadow-sm ring-1 ring-accent/15 sm:p-6">
      <Zeile label="Mietzinsart">
        {/* Die ganze Zeile klappt die Erklärung auf, nicht nur das Chevron. */}
        {ergebnis.begruendung.length > 0 ? (
          <button
            type="button"
            onClick={() => setErklaerungOffen((o) => !o)}
            aria-expanded={erklaerungOffen}
            aria-label={erklaerungOffen ? 'Erklärung ausblenden' : 'Erklärung anzeigen'}
            className="group flex w-full items-start justify-between gap-3 text-left"
          >
            <span className="text-2xl font-semibold text-ink">{ergebnis.mietzinsArtLabel}</span>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={`mt-1 h-5 w-5 shrink-0 text-accent transition-transform group-hover:text-accent-strong ${
                erklaerungOffen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        ) : (
          <span className="block text-2xl font-semibold text-ink">{ergebnis.mietzinsArtLabel}</span>
        )}
        {ergebnis.mietzinsArt === 'richtwert' && (
          <p className="mt-1 text-sm text-ink-soft">
            Richtwert Wien seit 1.4.2026:{' '}
            <span className="font-semibold text-ink">
              {RICHTWERT_WIEN.toLocaleString('de-AT', { minimumFractionDigits: 2 })} €/m²
            </span>
          </p>
        )}
        {erklaerungOffen && ergebnis.begruendung.length > 0 && (
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">
            {ergebnis.begruendung.map((b) => (
              <p key={b}>{b}</p>
            ))}
          </div>
        )}
      </Zeile>
    </div>
  )
}

/** Karte unter den Reitern: Schutzumfang, Fundstellen, Lage, Prüfbericht. */
export function ErgebnisDetails({
  ergebnis,
  input,
  adresse,
}: {
  ergebnis: MrgErgebnis
  /** Ohne Eingabe – etwa im eingebetteten Rechner – wird nichts verkauft. */
  input?: MietobjektInput
  adresse?: string
}) {
  const { lage } = ergebnis
  // Lage nur zeigen, wenn tatsächlich eine Anschrift eingegeben wurde.
  const zeigeLage = lage.adresse.trim().length > 0

  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-5 shadow-sm ring-1 ring-accent/15 sm:p-6">
      <div className="space-y-1">
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
          {/* Gesetzestitel bleiben im Original */}
          <div translate="no" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
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
                <a className="text-accent underline hover:text-accent-strong" href={lagezuschlagLink()} target="_blank" rel="noreferrer">
                  Lagezuschlag für diese Liegenschaft prüfen (Lagezuschlagskarte)
                </a>
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
              <div className="space-y-2 leading-relaxed text-ink-soft">
                {ergebnis.hinweise.map((h) => (
                  <p key={h}>{h}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Herleitung: worauf die Einschätzung beruht */}
      <p className="mt-6 px-1 text-[12px] leading-relaxed text-ink-faint">
        Rechtsgrundlage: <span className="font-semibold text-ink-soft">{RECHTSGRUNDLAGE}</span> · {RICHTWERT_QUELLE} ·
        Engine v{ENGINE_VERSION}
      </p>

      {input && (
        <>
          <button
            type="button"
            onClick={() => pruefberichtOeffnen(input, adresse ?? input.anschrift)}
            className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
          >
            Prüfbericht PRO als PDF – 24,00 € inkl. USt
          </button>
          <p className="mt-2 px-1 text-[12px] leading-relaxed text-ink-faint">
            Der Prüfbericht ordnet das Objekt Punkt für Punkt ein, mit Fundstellen und Rechenweg. Die kostenlose
            Ersteinschätzung lässt sich unverändert als PDF sichern.
          </p>
        </>
      )}
    </div>
  )
}

/** Beide Karten mit der Preisbandbreite dazwischen – für den eingebetteten Rechner. */
export function Ergebnis({ ergebnis }: { ergebnis: MrgErgebnis }) {
  return (
    <div className="space-y-6">
      <ErgebnisArt ergebnis={ergebnis} />
      <Preisbandbreite ergebnis={ergebnis} />
      <ErgebnisDetails ergebnis={ergebnis} />
    </div>
  )
}

/**
 * Preisbandbreite – erster Reiter unter dem Ergebnis. Steht bewusst außerhalb
 * der Ergebniskarte, damit sie sich mit den übrigen Rechnern abwechseln kann.
 */
export function Preisbandbreite({ ergebnis }: { ergebnis: MrgErgebnis }) {
  // Ohne gesetzliche Obergrenze zeigt die Bandbreite den Markt, keine Grenze.
  const freierPreis = ergebnis.mietzinsArt === 'frei'

  if (!ergebnis.preis) {
    return <p className="text-sm text-ink-faint">Für dieses Objekt gibt es keine Preisschätzung.</p>
  }

  return (
    <div className="space-y-3">
      {freierPreis && <p className="text-xs font-semibold text-ink-faint">Marktübliche Bandbreite</p>}

      <div className="space-y-4 rounded-xl bg-surface px-4 py-3 ring-1 ring-line">
        {/* Label oben, Wert darunter – auf jeder Breite gleich */}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-ink-faint">Monatlich pro m², netto</span>
          <Preiswert min={ergebnis.preis.proM2Min} max={ergebnis.preis.proM2Max} color="text-wert" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-ink-faint">
            Monat gesamt für {ergebnis.preis.flaeche.toLocaleString('de-AT')} m²
          </span>
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

      {/* Drei Sichten auf dieselbe Wohnung */}
      {ergebnis.preis.sichten && ergebnis.preis.sichten.length > 0 && (
        <div className="rounded-xl bg-surface px-4 py-3 ring-1 ring-line">
          <Collapsible title="Judikatur · Schlichtungsstelle · Markt">
            <div className="space-y-4">
              {ergebnis.preis.sichten.map((si) => (
                <div key={si.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <span className="text-sm font-semibold text-ink">{si.titel}</span>
                    <span className="tabular-nums text-base font-semibold text-wert">
                      {formatEuro(si.proM2Min)} — {formatEuro(si.proM2Max)} €/m²
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-faint">{si.erklaerung}</p>
                </div>
              ))}
            </div>
          </Collapsible>
        </div>
      )}

      {/* Herleitung des Lagezuschlags */}
      {ergebnis.lagezuschlag && ergebnis.lagezuschlag.schritte.length > 1 && (
        <div className="rounded-xl bg-surface px-4 py-3 ring-1 ring-line">
          <Collapsible title="Lagezuschlag – wie er zustande kommt">
            <div className="space-y-3">
              {ergebnis.lagezuschlag.schritte.map((sch) => (
                <div key={sch.was}>
                  <p className="text-sm font-medium text-ink">{sch.was}</p>
                  <p className="text-sm text-ink-soft">{sch.ergebnis}</p>
                  <p className="text-[12px] text-ink-faint">Quelle: {sch.quelle}</p>
                </div>
              ))}
            </div>
          </Collapsible>
        </div>
      )}

      {freierPreis && (
        <p className="px-1 text-sm text-ink-soft">
          Es gibt keine gesetzliche Obergrenze – die Werte zeigen, was in dieser Gegend üblich ist.
        </p>
      )}
    </div>
  )
}
