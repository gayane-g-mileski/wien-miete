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

const sekundaerBtn =
  'inline-flex items-center gap-2 rounded-lg border border-accent/50 px-3 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-60'

/** Ionicons „document-text-outline“ */
function DokumentIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round">
      <path d="M416 221.25V416a48 48 0 01-48 48H144a48 48 0 01-48-48V96a48 48 0 0148-48h98.75a32 32 0 0122.62 9.37l141.26 141.26a32 32 0 019.37 22.62z" />
      <path d="M256 56v120a32 32 0 0032 32h120M176 288h160M176 368h160" />
    </svg>
  )
}

/** Ionicons „archive-outline“ (Sammel-Export) */
function ArchivIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round">
      <rect x="32" y="96" width="448" height="80" rx="16" />
      <path d="M64 176v240a32 32 0 0032 32h320a32 32 0 0032-32V176M208 272h96" />
    </svg>
  )
}

/** Ionicons „trash-outline“ */
function EimerIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round">
      <path d="M112 112l20 320a48 48 0 0048 48h152a48 48 0 0048-48l20-320M80 112h352" />
      <path d="M192 112V72a24 24 0 0124-24h80a24 24 0 0124 24v40M256 176v224M184 176l8 224M328 176l-8 224" />
    </svg>
  )
}

export function Ergebnisleiste({ ergebnis, adresse, verlauf, onSelect, onClear }: Props) {
  const [zipLaeuft, setZipLaeuft] = useState(false)

  // PDF-/ZIP-Bibliotheken erst bei Bedarf laden (hält das Startpaket klein).
  const exportEinzel = async () => {
    const { ergebnisPdf, dateiname } = await import('../lib/pdf')
    ergebnisPdf(ergebnis, adresse).save(`${dateiname(adresse)}.pdf`)
  }

  const exportEintrag = async (e: VerlaufEintrag) => {
    const { ergebnisPdf, dateiname } = await import('../lib/pdf')
    ergebnisPdf(evaluateMrg(e.input), e.adresse).save(`${dateiname(e.adresse)}.pdf`)
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

  // Ohne Verlauf: allgemeines Export-Icon für das aktuelle Ergebnis.
  if (verlauf.length === 0) {
    return (
      <div className="mt-9 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-ink">Als PDF speichern</span>
          <button
            type="button"
            onClick={exportEinzel}
            title="Als PDF speichern"
            aria-label="Als PDF speichern"
            className="shrink-0 text-accent transition-colors hover:text-accent-strong"
          >
            <DokumentIcon />
          </button>
        </div>
      </div>
    )
  }

  return (
    <section className="mt-9">
      {/* Titel außerhalb der Karte, 20px Abstand zur Karte */}
      <h3 className="mb-5 px-1 text-sm font-semibold text-ink-faint">Verlauf</h3>
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div>
          <ul className="space-y-6">
            {verlauf.map((e) => (
              <li key={e.adresse} className="flex min-w-0 items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelect(e)}
                  title={`Ergebnis für ${e.adresse} erneut anzeigen`}
                  className="min-w-0 flex-1 truncate text-left text-sm text-accent underline hover:text-accent-strong"
                >
                  {e.adresse}
                </button>
                <button
                  type="button"
                  onClick={() => exportEintrag(e)}
                  title={`${e.adresse} als PDF speichern`}
                  aria-label={`${e.adresse} als PDF speichern`}
                  className="shrink-0 text-accent transition-colors hover:text-accent-strong"
                >
                  <DokumentIcon />
                </button>
              </li>
            ))}
          </ul>

          {/* Eigene Zeile unter der Liste: links leeren, rechts alles exportieren */}
          <div className="mt-9 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-accent"
            >
              <EimerIcon />
              Verlauf leeren
            </button>
            {verlauf.length >= 2 && (
              <button type="button" onClick={exportAlle} disabled={zipLaeuft} className={sekundaerBtn}>
                <ArchivIcon />
                {zipLaeuft ? 'ZIP wird erstellt …' : 'Alles exportieren (ZIP)'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
