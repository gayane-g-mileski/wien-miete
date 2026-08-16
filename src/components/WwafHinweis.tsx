import { useState } from 'react'
import { Collapsible, TextareaField } from './ui'

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

  const senden = () => {
    const href = `mailto:${EMPFAENGER}?subject=${encodeURIComponent('Anfrage Bundeswohnbaufonds – Stand der Rückzahlung')}&body=${encodeURIComponent(text)}`
    window.location.href = href
  }

  return (
    <div className="space-y-10 rounded-xl border border-accent/30 bg-surface p-6 text-base text-ink-soft shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-accent">Diese Anfrage ist kostenlos</p>

      <div>
        <p>Diese Auskunft bekommst du über eine Anfrage an das</p>
        <address className="my-4 border-l-2 border-accent pl-3 not-italic leading-relaxed text-accent">
          <span className="font-semibold">Bundesministerium für Wissenschaft, Forschung und Wirtschaft</span>
          <br />
          <span className="font-semibold">Verwaltungsstelle Bundeswohnbaufonds</span>
          <br />
          Stubenring 1, 1010 Wien
        </address>
        <p>oder mittels E-Mail.</p>
      </div>

      <div>
        <div translate="no">
          <TextareaField label="Anfrage-Text" id="wwaf-text" rows={11} value={text} onChange={(e) => setText(e.target.value)} />
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
        <Collapsible title="Was die Antwort für deine Miete bedeutet">
          <div className="space-y-3">
            {FAELLE.map((f) => (
              <div key={f.titel} className="rounded-lg border border-line bg-surface-2 p-3">
                <p className="font-semibold text-ink">{f.titel}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.text}</p>
                <p className="mt-2 text-sm font-semibold text-accent">{f.ergebnis}</p>
              </div>
            ))}
            <p className="text-sm leading-relaxed text-ink-faint">
              Das gilt aber nur, wenn gerade deine Wohnung mit Mitteln des Wiederaufbaufonds saniert wurde. Wurde das
              Darlehen nach dem 31.8.1952 bewilligt, genügt es, dass allgemeine Teile des Hauses wiederhergestellt wurden
              – zum Beispiel Stiegenhaus, Dach oder Außenmauern. Ist diese Voraussetzung erfüllt, gilt einer der drei
              Fälle oben. Ist sie nicht erfüllt, wird die Wohnung wie ein gewöhnlicher Altbau behandelt – dann gilt der{' '}
              <span className="font-semibold text-ink">Richtwertmietzins</span>.
            </p>
          </div>
        </Collapsible>
      </div>
    </div>
  )
}
