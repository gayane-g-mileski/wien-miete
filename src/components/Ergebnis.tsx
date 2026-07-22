import type { LageStatus, MrgAnwendung, MrgErgebnis } from '../lib/types'
import { flaechenwidmungLink, laerminfoLink } from '../lib/geo'

const ANWENDUNG_STYLE: Record<MrgAnwendung, { badge: string; ring: string; dot: string }> = {
  voll: { badge: 'bg-wine/10 text-wine ring-wine/30', ring: 'ring-wine/20', dot: 'bg-wine' },
  teil: { badge: 'bg-terracotta/15 text-terracotta-600 ring-terracotta/40', ring: 'ring-terracotta/25', dot: 'bg-terracotta' },
  ausnahme: { badge: 'bg-sage/15 text-sage-700 ring-sage/40', ring: 'ring-sage/25', dot: 'bg-sage' },
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

function Zeile({ nr, label, children }: { nr: number; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-sand-line/70 py-4 last:border-0 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-2 sm:w-48 sm:shrink-0">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-cream-50">
          {nr}
        </span>
        <span className="text-sm font-medium text-ink-soft">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function Ergebnis({ ergebnis }: { ergebnis: MrgErgebnis }) {
  const style = ANWENDUNG_STYLE[ergebnis.anwendung]
  const { lage } = ergebnis

  return (
    <div className={`rounded-2xl border border-sand-line bg-cream-50 p-5 shadow-sm ring-1 sm:p-6 ${style.ring}`}>
      <h2 className="mb-1 text-lg font-semibold text-wine">Ergebnis der Ersteinschätzung</h2>
      <p className="mb-4 text-sm text-ink-soft">Basierend auf den eingegebenen Objektmerkmalen.</p>

      <div>
        <Zeile nr={1} label="Mietzinsart">
          <span className="inline-flex items-center rounded-lg bg-cream-200 px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-sand-line">
            {ergebnis.mietzinsArtLabel}
          </span>
        </Zeile>

        <Zeile nr={2} label="Schutz & Preisgrenze">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ${style.badge}`}>
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              {ergebnis.anwendungLabel}
            </span>
            <span className="text-xs text-ink-faint">
              Kündigungsschutz: <strong className="text-ink-soft">{ergebnis.kuendigungsschutz ? 'ja' : 'nein'}</strong> ·
              gesetzliche Preisgrenze: <strong className="text-ink-soft">{ergebnis.preisschutz ? 'ja' : 'nein'}</strong>
            </span>
          </div>
        </Zeile>

        <Zeile nr={3} label="Preisbandbreite">
          {ergebnis.preis ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <div>
                  <span className="text-2xl font-bold text-wine">
                    {formatEuro(ergebnis.preis.proM2Min)}–{formatEuro(ergebnis.preis.proM2Max)} €
                  </span>
                  <span className="ml-1 text-sm text-ink-faint">/ m² monatlich, netto</span>
                </div>
                <div>
                  <span className="text-lg font-semibold text-ink">
                    {formatEuro(ergebnis.preis.monatlichMin)}–{formatEuro(ergebnis.preis.monatlichMax)} €
                  </span>
                  <span className="ml-1 text-sm text-ink-faint">/ Monat gesamt</span>
                </div>
              </div>
              {ergebnis.preis.bestandteile && ergebnis.preis.bestandteile.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-sage-700 hover:text-sage">Aufschlüsselung (€/m²)</summary>
                  <ul className="mt-2 space-y-1">
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
                </details>
              )}
            </div>
          ) : (
            <span className="text-sm text-ink-faint">Keine Preisschätzung verfügbar.</span>
          )}
        </Zeile>
      </div>

      <div className="mt-5 space-y-3 rounded-xl bg-cream-100 p-4 text-sm">
        <div>
          <p className="mb-1 font-semibold text-ink">Was bedeutet das?</p>
          <ul className="space-y-1 text-ink-soft">
            {ergebnis.begruendung.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>

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
  )
}
