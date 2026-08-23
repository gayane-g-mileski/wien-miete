import { useState } from 'react'
import { Collapsible, TextareaField } from './ui'
import { FOERDERUNG_PROGRAMM_LABEL } from '../lib/foerderung'
import type { FoerderungProgramm } from '../lib/types'

// Anfrage zum Stand der Rückzahlung bei einer Wohnbauförderung des Landes Wien
// (WFG 1968, WFG 1984). Das Förderungsdarlehen verwaltet die MA 50.

const MA50_EMAIL = 'post@ma50.wien.gv.at'
const MA50_KONTAKT = 'https://www.wien.gv.at/kontakte/ma50/'

function anfrageText(anschrift: string, programm: FoerderungProgramm): string {
  const adr = anschrift.trim() || '[Anschrift bitte ergänzen]'
  return (
    'Sehr geehrte Damen und Herren,\n\n' +
    'für die Einschätzung des zulässigen Mietzinses benötige ich Auskunft über das Förderungsdarlehen ' +
    'für folgendes Objekt:\n\n' +
    `Anschrift: ${adr}\n` +
    `Förderung: ${FOERDERUNG_PROGRAMM_LABEL[programm]}\n\n` +
    'Bitte teilen Sie mir mit:\n\n' +
    '1. Besteht für dieses Haus bzw. diese Wohnung ein Förderungsdarlehen aus der Wohnbauförderung, ' +
    'und wann wurde es zugezählt?\n\n' +
    '2. Läuft das Darlehen noch oder ist es bereits vollständig zurückgezahlt?\n\n' +
    '3. Falls es zurückgezahlt ist: wann, und erfolgte die Rückzahlung planmäßig oder vorzeitig ' +
    '(insbesondere bis 31.12.1982 bzw. bis 31.12.1988)?\n\n' +
    '4. Bestehen aus der Förderung noch Bindungen für die Miethöhe?\n\n' +
    'Vielen Dank für Ihre Auskunft.\n\n' +
    'Mit freundlichen Grüßen'
  )
}

const FAELLE = [
  {
    titel: 'Darlehen läuft noch',
    text: 'Für die Miete gilt eine Obergrenze, die sich nach der Ausstattung richtet (Kategoriebetrag).',
    ergebnis: '→ Obergrenze nach Ausstattungskategorie',
  },
  {
    titel: 'Planmäßig zurückgezahlt',
    text: 'Die Miete darf so hoch sein wie bei vergleichbaren Wohnungen üblich.',
    ergebnis: '→ angemessener Mietzins',
  },
  {
    titel: 'Vorzeitig bis Ende 1988 zurückgezahlt',
    text: 'Auch hier gilt die ortsübliche Miete vergleichbarer Wohnungen.',
    ergebnis: '→ angemessener Mietzins',
  },
  {
    titel: 'Vorzeitig bis Ende 1982 zurückgezahlt',
    text: 'Die Miethöhe ist frei vereinbar; der Kündigungsschutz bleibt bestehen.',
    ergebnis: '→ freier Mietzins',
  },
]

export function RueckzahlungAnfrage({
  anschrift,
  programm,
  onGesendet,
}: {
  anschrift: string
  programm: FoerderungProgramm
  onGesendet?: () => void
}) {
  const [text, setText] = useState(() => anfrageText(anschrift, programm))

  const senden = () => {
    const href = `mailto:${MA50_EMAIL}?subject=${encodeURIComponent('Anfrage: Stand der Rückzahlung des Förderungsdarlehens')}&body=${encodeURIComponent(text)}`
    window.location.href = href
    onGesendet?.()
  }

  return (
    <div className="space-y-10 text-base text-ink-soft">
      <p className="text-sm font-semibold text-accent">Diese Anfrage ist kostenlos</p>

      <div>
        <p>Das Förderungsdarlehen des Landes Wien verwaltet die</p>
        <address translate="no" className="my-4 border-l-2 border-accent pl-3 not-italic leading-relaxed text-accent">
          <span className="font-semibold">Stadt Wien – Magistratsabteilung 50</span>
          <br />
          <span className="font-semibold">Wohnbauförderung</span>
          <br />
          <a className="underline hover:text-accent-strong" href={MA50_KONTAKT} target="_blank" rel="noreferrer">
            Anschrift und Öffnungszeiten (wien.gv.at)
          </a>
        </address>
        <p>
          Die Anfrage geht per E-Mail an <span className="font-semibold text-ink">{MA50_EMAIL}</span>.
        </p>
      </div>

      <div>
        <div translate="no">
          <TextareaField
            label="Anfrage-Text"
            id="tilgung-text"
            rows={13}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={senden}
          className="mt-3 w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent hover:bg-accent-strong"
        >
          Anfrage per E-Mail senden
        </button>
      </div>

      <div className="border-t border-line pt-4">
        <Collapsible title="Was die Antwort für den Mietzins bedeutet">
          <div className="space-y-3">
            {FAELLE.map((f) => (
              <div key={f.titel} className="rounded-lg border border-line bg-surface-2 p-3">
                <p className="font-semibold text-ink">{f.titel}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.text}</p>
                <p className="mt-2 text-sm font-semibold text-accent">{f.ergebnis}</p>
              </div>
            ))}
            <p className="text-sm leading-relaxed text-ink-faint">
              Bei einer geförderten Eigentumswohnung gilt schon während der laufenden Förderung der{' '}
              <span className="font-semibold text-ink">angemessene Mietzins</span> – dafür gibt es oben die Checkbox
              „Eigentumswohnung“.
            </p>
          </div>
        </Collapsible>
      </div>
    </div>
  )
}
