import { useState } from 'react'
import { TextareaField } from './ui'

// Empfänger beim Bundeswohnbaufonds – eine Adresse hinterlegt.
const EMPFAENGER = 'gerlinde.weiss@bmdw.gv.at'

function anfrageText(anschrift: string): string {
  const adr = anschrift.trim() || 'Wien …'
  return (
    'Sehr geehrte Damen und Herren,\n\n' +
    `ich bin Eigentümer des Hauses ${adr} bzw. der Wohnung Top-Nr. … in diesem Haus und ersuche um Auskunft ` +
    'zu folgenden Fragen:\n\n' +
    'Hat der Wohnhauswiederaufbaufonds bzw. der Bundeswohn- und Siedlungsfonds für die Wiederherstellung dieses ' +
    'Hauses ein Darlehen gewährt? Falls ja, wann wurde es bewilligt?\n\n' +
    'Bezogen sich die geförderten Bauarbeiten auch auf meine Wohnung, oder nur auf allgemeine Teile des Hauses wie ' +
    'Stiegenhaus, Dach oder Außenmauern?\n\n' +
    'Wurde dieses Darlehen bereits vollständig zurückgezahlt? Falls ja, wann und nach welcher Regelung?\n\n' +
    'Vielen Dank für Ihre Auskunft.\n\n' +
    'Mit freundlichen Grüßen'
  )
}

const FAELLE = [
  {
    titel: 'Darlehen planmäßig zurückgezahlt',
    text:
      'Es gilt in der Regel die Richtwert-Obergrenze. In bestimmten Fällen darf die Miete auch marktüblich sein – ' +
      'etwa bei Geschäftsräumen, neu geschaffenem Wohnraum, Denkmalschutz oder großen A/B-Wohnungen über 130 m².',
    ergebnis: '→ Richtwertmietzins (in bestimmten Fällen angemessener Mietzins)',
  },
  {
    titel: 'Vorzeitig bis Ende 1988 zurückgezahlt',
    text: 'Die Miete darf so hoch sein wie bei vergleichbaren Wohnungen üblich.',
    ergebnis: '→ angemessener Mietzins',
  },
  {
    titel: 'Vorzeitig bis Ende 1982 zurückgezahlt',
    text: 'Die Miethöhe ist frei vereinbar.',
    ergebnis: '→ freier Mietzins',
  },
]

export function WwafHinweis({ anschrift }: { anschrift: string }) {
  const [text, setText] = useState(() => anfrageText(anschrift))
  const [bedeutungOffen, setBedeutungOffen] = useState(false)

  const senden = () => {
    const href = `mailto:${EMPFAENGER}?subject=${encodeURIComponent('Anfrage Bundeswohnbaufonds – Stand der Rückzahlung')}&body=${encodeURIComponent(text)}`
    window.location.href = href
  }

  return (
    <div className="space-y-5 rounded-xl border border-sage/30 bg-cream-50 p-5 text-base text-neutral-700">
      <p className="text-sm font-semibold uppercase tracking-wide text-sage-700">Diese Anfrage ist kostenlos</p>

      <div>
        <p>Diese Auskunft bekommst du über eine Anfrage an das</p>
        <address className="my-4 border-l-2 border-sage pl-3 not-italic font-medium leading-relaxed text-sage-700">
          Bundesministerium für Wissenschaft, Forschung und Wirtschaft
          <br />
          Verwaltungsstelle Bundeswohnbaufonds
          <br />
          Stubenring 1
          <br />
          1010 Wien
        </address>
        <p>oder mittels E-Mail.</p>
      </div>

      <div>
        <TextareaField label="Anfrage-Text" id="wwaf-text" rows={11} value={text} onChange={(e) => setText(e.target.value)} />
        <button
          type="button"
          onClick={senden}
          className="mt-3 w-full rounded-lg bg-sage px-4 py-2.5 text-base font-semibold text-cream-50 hover:bg-sage-600"
        >
          Anfrage per E-Mail senden
        </button>
      </div>

      <div className="border-t border-sand-line/70 pt-4">
        <button
          type="button"
          onClick={() => setBedeutungOffen((o) => !o)}
          aria-expanded={bedeutungOffen}
          className="flex w-full items-center justify-between gap-2 text-left text-base font-semibold text-neutral-800"
        >
          <span>Was die Antwort für deine Miete bedeutet</span>
          <svg
            viewBox="0 0 24 24"
            className={`h-5 w-5 shrink-0 text-sage-700 transition-transform ${bedeutungOffen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {bedeutungOffen && (
          <div className="mt-4 space-y-3">
            {FAELLE.map((f) => (
              <div key={f.titel} className="rounded-lg border border-sand-line/70 bg-white p-3">
                <p className="font-semibold text-neutral-800">{f.titel}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{f.text}</p>
                <p className="mt-2 text-sm font-semibold text-sage-700">{f.ergebnis}</p>
              </div>
            ))}
            <p className="text-sm leading-relaxed text-neutral-500">
              Das gilt aber nur, wenn gerade deine Wohnung mit Mitteln des Wiederaufbaufonds saniert wurde. Wurde das
              Darlehen nach dem 31.8.1952 bewilligt, genügt es, dass allgemeine Teile des Hauses wiederhergestellt wurden
              – zum Beispiel Stiegenhaus, Dach oder Außenmauern. Ist diese Voraussetzung erfüllt, gilt einer der drei
              Fälle oben. Ist sie nicht erfüllt, wird die Wohnung wie ein gewöhnlicher Altbau behandelt – dann gilt der{' '}
              <span className="font-semibold text-neutral-800">Richtwertmietzins</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
