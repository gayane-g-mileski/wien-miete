import type { MrgAnwendung, MrgErgebnis } from '../lib/types'

const ANWENDUNG_STYLE: Record<MrgAnwendung, { badge: string; ring: string; dot: string }> = {
  voll: { badge: 'bg-rose-500/15 text-rose-300 ring-rose-500/40', ring: 'ring-rose-500/30', dot: 'bg-rose-400' },
  teil: { badge: 'bg-amber-500/15 text-amber-300 ring-amber-500/40', ring: 'ring-amber-500/30', dot: 'bg-amber-400' },
  ausnahme: { badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' },
}

function formatEuro(n: number): string {
  return n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Zeile({ nr, label, children }: { nr: number; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-700/60 py-4 last:border-0 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-2 sm:w-56 sm:shrink-0">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">
          {nr}
        </span>
        <span className="text-sm font-medium text-slate-300">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function Ergebnis({ ergebnis }: { ergebnis: MrgErgebnis }) {
  const style = ANWENDUNG_STYLE[ergebnis.anwendung]

  return (
    <div className={`rounded-2xl border border-slate-700 bg-slate-800/60 p-5 shadow-xl ring-1 sm:p-6 ${style.ring}`}>
      <h2 className="mb-1 text-lg font-semibold text-white">Ergebnis der Ersteinschätzung</h2>
      <p className="mb-4 text-sm text-slate-400">Basierend auf den eingegebenen Objektmerkmalen.</p>

      <div>
        <Zeile nr={1} label="Mietzinsart">
          <span className="inline-flex items-center rounded-lg bg-slate-700/60 px-3 py-1.5 text-sm font-semibold text-slate-50 ring-1 ring-slate-600">
            {ergebnis.mietzinsArtLabel}
          </span>
        </Zeile>

        <Zeile nr={2} label="MRG-Anwendungsbereich">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ${style.badge}`}>
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              {ergebnis.anwendungLabel}
            </span>
            <span className="text-xs text-slate-400">
              Kündigungsschutz: <strong className="text-slate-200">{ergebnis.kuendigungsschutz ? 'ja' : 'nein'}</strong> · Preisschutz:{' '}
              <strong className="text-slate-200">{ergebnis.preisschutz ? 'ja' : 'nein'}</strong>
            </span>
          </div>
        </Zeile>

        <Zeile nr={3} label="Preisbandbreite">
          {ergebnis.preis ? (
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <div>
                <span className="text-2xl font-bold text-white">
                  {formatEuro(ergebnis.preis.proM2Min)}–{formatEuro(ergebnis.preis.proM2Max)} €
                </span>
                <span className="ml-1 text-sm text-slate-400">/ m² monatlich, netto</span>
              </div>
              <div>
                <span className="text-lg font-semibold text-slate-100">
                  {formatEuro(ergebnis.preis.monatlichMin)}–{formatEuro(ergebnis.preis.monatlichMax)} €
                </span>
                <span className="ml-1 text-sm text-slate-400">/ Monat gesamt, netto</span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-slate-400">Keine Preisschätzung verfügbar.</span>
          )}
        </Zeile>
      </div>

      <div className="mt-5 space-y-3 rounded-xl bg-slate-900/50 p-4 text-sm">
        <div>
          <p className="mb-1 font-semibold text-slate-200">Begründung</p>
          <ul className="list-inside list-disc space-y-1 text-slate-400">
            {ergebnis.begruendung.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 font-semibold text-slate-200">Rechtsgrundlage(n)</p>
          <p className="text-slate-400">{ergebnis.rechtsgrundlagen.join(' · ')}</p>
        </div>
        {ergebnis.hinweise.length > 0 && (
          <div>
            <p className="mb-1 font-semibold text-amber-300">Zu beachten</p>
            <ul className="list-inside list-disc space-y-1 text-slate-400">
              {ergebnis.hinweise.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
