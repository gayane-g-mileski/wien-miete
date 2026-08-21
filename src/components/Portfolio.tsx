import { useState } from 'react'
import { BEISPIEL_CSV, portfolioAlsCsv, pruefePortfolio, type PortfolioZeile } from '../lib/csv'
import { dateiSpeichern } from '../lib/speichern'

const zelle = 'px-3 py-2 align-top text-sm'

function euro(n: number): string {
  return n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** ISO-Datum als 15.03.1990; ohne Angabe ein Gedankenstrich. */
function datumKurz(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '–'
  const [j, m, t] = iso.split('-')
  return `${t}.${m}.${j}`
}

export function Portfolio() {
  const [zeilen, setZeilen] = useState<PortfolioZeile[]>([])
  const [fehler, setFehler] = useState<string[]>([])
  const [meldung, setMeldung] = useState<string | null>(null)

  const auswerten = (text: string) => {
    const r = pruefePortfolio(text)
    setZeilen(r.zeilen)
    setFehler(r.fehler)
    setMeldung(r.zeilen.length === 0 ? 'Keine auswertbaren Zeilen gefunden.' : null)
  }

  const datei = async (f: File | null) => {
    if (!f) return
    try {
      auswerten(await f.text())
    } catch {
      setMeldung('Die Datei konnte nicht gelesen werden.')
    }
  }

  const exportieren = async () => {
    try {
      const blob = new Blob(['﻿' + portfolioAlsCsv(zeilen)], { type: 'text/csv;charset=utf-8' })
      await dateiSpeichern(blob, 'Mietzins-Portfolio.csv', 'text/csv')
    } catch {
      setMeldung('Der Export hat nicht geklappt.')
    }
  }

  const knopf =
    'inline-flex cursor-pointer items-center gap-2 rounded-lg border border-accent/50 bg-surface px-4 py-2.5 text-base font-semibold text-accent transition-colors hover:bg-accent/10'

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <p className="text-base font-semibold text-ink">Bestandsliste prüfen</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        CSV mit Anschrift, Fläche, Kategorie, Baujahr, Vertragsdatum und Hauptmietzins hochladen. Die Auswertung läuft
        vollständig im Browser – die Liste verlässt dieses Gerät nicht.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className={knopf}>
          CSV auswählen
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              void datei(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />
        </label>
        <button type="button" className={knopf} onClick={() => auswerten(BEISPIEL_CSV)}>
          Beispiel ausprobieren
        </button>
        {zeilen.length > 0 && (
          <button
            type="button"
            onClick={exportieren}
            className="rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
          >
            Ergebnis als CSV
          </button>
        )}
      </div>

      {meldung && (
        <p role="alert" className="mt-3 text-[12px] text-danger">
          {meldung}
        </p>
      )}

      {zeilen.length > 0 && (
        <>
          <div className="mt-8 overflow-x-auto rounded-xl ring-1 ring-line">
            <table className="w-full min-w-[50rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  {['Einheit', 'm²', 'Mietvertrag', 'Mietzinsart', 'Obergrenze/Monat', 'Ist-Miete', 'Differenz', 'Nach Wertsicherung'].map((h) => (
                    <th key={h} className={`${zelle} font-semibold text-ink`} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zeilen.map((z) => (
                  <tr key={z.nr} className="border-b border-line last:border-0">
                    <th scope="row" className={`${zelle} font-medium text-ink`}>
                      {z.bezeichnung}
                      {z.unsicher.length > 0 && (
                        <span className="block text-[12px] font-normal text-ink-faint">
                          ohne Angabe: {z.unsicher.join(', ')}
                        </span>
                      )}
                    </th>
                    <td className={`${zelle} tabular-nums text-ink-soft`}>{z.flaeche}</td>
                    {/* Das Vertragsdatum steht neben der Mietzinsart, weil es sie bestimmt. */}
                    <td className={`${zelle} tabular-nums text-ink-soft`}>{datumKurz(z.vertragsdatum)}</td>
                    <td className={`${zelle} text-ink-soft`}>{z.ergebnis.mietzinsArtLabel}</td>
                    <td className={`${zelle} tabular-nums text-ink-soft`}>
                      {z.ergebnis.preisschutz && z.ergebnis.preis ? `${euro(z.ergebnis.preis.monatlichMax)} €` : 'keine'}
                    </td>
                    <td className={`${zelle} tabular-nums text-ink-soft`}>{z.istMiete != null ? `${euro(z.istMiete)} €` : '–'}</td>
                    <td className={`${zelle} tabular-nums font-semibold ${z.ueberGrenze ? 'text-danger' : 'text-accent'}`}>
                      {z.differenz != null ? `${z.differenz > 0 ? '+' : ''}${euro(z.differenz)} €` : '–'}
                    </td>
                    <td className={`${zelle} tabular-nums text-ink-soft`}>
                      {z.indexNeu != null && z.indexSatz > 0
                        ? `${euro(z.indexNeu)} € (+${(z.indexSatz * 100).toLocaleString('de-AT', { maximumFractionDigits: 2 })} %)`
                        : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {fehler.length > 0 && (
            <div className="mt-3 space-y-1">
              {fehler.slice(0, 5).map((f) => (
                <p key={f} className="text-[12px] text-danger">
                  {f}
                </p>
              ))}
            </div>
          )}

          <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
            Die Sammelprüfung rechnet mit den Angaben aus der Datei und ohne Zu- und Abschläge für Ausstattung, Lage
            oder Zustand. Die Spalte „Nach Wertsicherung“ zeigt, was im kommenden Jahr nach dem
            Mieten-Wertsicherungsgesetz zulässig wäre. Sie zeigt, welche Einheiten sich lohnen, genauer angesehen zu
            werden – die Einzelprüfung oben bleibt maßgeblich.
          </p>
        </>
      )}
    </div>
  )
}
