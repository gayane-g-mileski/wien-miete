import { useState } from 'react'
import type { MrgErgebnis } from '../lib/types'
import { evaluateMrg } from '../lib/mrgEngine'
import type { VerlaufEintrag } from '../lib/verlauf'

interface Props {
  ergebnis: MrgErgebnis
  adresse: string
  verlauf: VerlaufEintrag[]
  onSelect: (eintrag: VerlaufEintrag) => void
  onClear: () => void
}

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

const primaerBtn =
  'inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-60'
const sekundaerBtn =
  'inline-flex items-center gap-2 rounded-lg border border-accent/50 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-60'

export function Ergebnisleiste({ ergebnis, adresse, verlauf, onSelect, onClear }: Props) {
  const [zipLaeuft, setZipLaeuft] = useState(false)

  // PDF-/ZIP-Bibliotheken erst bei Bedarf laden (hält das Startpaket klein).
  const exportEinzel = async () => {
    const { ergebnisPdf, dateiname } = await import('../lib/pdf')
    ergebnisPdf(ergebnis, adresse).save(`${dateiname(adresse)}.pdf`)
  }

  const exportAlle = async () => {
    setZipLaeuft(true)
    try {
      const [{ ergebnisPdfBlob, dateiname }, { default: JSZip }] = await Promise.all([
        import('../lib/pdf'),
        import('jszip'),
      ])
      const zip = new JSZip()
      const vergeben = new Set<string>()
      for (const e of verlauf) {
        const name = dateiname(e.adresse)
        let eindeutig = name
        let n = 2
        while (vergeben.has(eindeutig)) eindeutig = `${name}_${n++}`
        vergeben.add(eindeutig)
        zip.file(`${eindeutig}.pdf`, ergebnisPdfBlob(evaluateMrg(e.input), e.adresse))
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, 'Mietzins-Einschaetzungen.zip')
    } finally {
      setZipLaeuft(false)
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Links: Verlauf */}
        <div className="min-w-0">
          {verlauf.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-ink-faint">Verlauf</p>
              <ul className="mt-1.5 space-y-1">
                {verlauf.map((e) => (
                  <li key={e.adresse} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelect(e)}
                      title={`Ergebnis für ${e.adresse} erneut anzeigen`}
                      className="block max-w-full truncate text-left text-sm text-accent underline hover:text-accent-strong"
                    >
                      {e.adresse}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-xs text-ink-faint">Bewertete Adressen erscheinen hier als Verlauf.</p>
          )}
        </div>

        {/* Rechts: Export */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button type="button" onClick={exportEinzel} className={primaerBtn}>
            Als PDF exportieren
          </button>
          {verlauf.length >= 2 && (
            <button type="button" onClick={exportAlle} disabled={zipLaeuft} className={sekundaerBtn}>
              {zipLaeuft ? 'ZIP wird erstellt …' : 'Alles exportieren (ZIP)'}
            </button>
          )}
        </div>
      </div>

      {verlauf.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <button type="button" onClick={onClear} className="text-xs font-medium text-ink-faint underline hover:text-accent">
            Verlauf leeren
          </button>
        </div>
      )}
    </div>
  )
}
