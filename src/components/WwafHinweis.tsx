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

export function WwafHinweis({ anschrift }: { anschrift: string }) {
  const [text, setText] = useState(() => anfrageText(anschrift))

  const senden = () => {
    const href = `mailto:${EMPFAENGER}?subject=${encodeURIComponent('Anfrage Bundeswohnbaufonds – Stand der Rückzahlung')}&body=${encodeURIComponent(text)}`
    window.location.href = href
  }

  return (
    <div className="space-y-4 rounded-xl border border-neutral-300 bg-neutral-50 p-4 text-base text-neutral-700">
      <div>
        <p className="font-semibold text-neutral-800">Stand der Rückzahlung unbekannt?</p>
        <p className="mt-1">Diese Auskunft bekommst du über eine Anfrage an das</p>
        <address className="mt-1 not-italic leading-relaxed text-neutral-600">
          Bundesministerium für Wissenschaft, Forschung und Wirtschaft
          <br />
          Verwaltungsstelle Bundeswohnbaufonds
          <br />
          Stubenring 1
          <br />
          1010 Wien
        </address>
        <p className="mt-1">oder mittels E-Mail.</p>
      </div>

      <div>
        <TextareaField label="Anfrage-Text" id="wwaf-text" rows={11} value={text} onChange={(e) => setText(e.target.value)} />
        <button
          type="button"
          onClick={senden}
          className="mt-3 w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-base font-semibold text-white hover:bg-neutral-700"
        >
          Anfrage per E-Mail senden
        </button>
      </div>

      <div>
        <p className="font-semibold text-neutral-800">Was die Antwort für deine Miete bedeutet</p>
        <ul className="mt-1 space-y-2">
          <li>
            <span className="font-medium text-neutral-800">Darlehen planmäßig zurückgezahlt:</span> Es gilt in der Regel
            die Richtwert-Obergrenze. In bestimmten Fällen darf die Miete auch marktüblich sein – etwa bei
            Geschäftsräumen, neu geschaffenem Wohnraum, Denkmalschutz oder großen A/B-Wohnungen über 130 m².{' '}
            <span className="font-semibold text-neutral-900">→ Richtwertmietzins (in bestimmten Fällen angemessener Mietzins)</span>
          </li>
          <li>
            <span className="font-medium text-neutral-800">Vorzeitig bis Ende 1988 zurückgezahlt:</span> Die Miete darf so
            hoch sein wie bei vergleichbaren Wohnungen üblich.{' '}
            <span className="font-semibold text-neutral-900">→ angemessener Mietzins</span>
          </li>
          <li>
            <span className="font-medium text-neutral-800">Vorzeitig bis Ende 1982 zurückgezahlt:</span> Die Miethöhe ist
            frei vereinbar. <span className="font-semibold text-neutral-900">→ freier Mietzins</span>
          </li>
        </ul>
      </div>

      <p className="text-sm text-neutral-500">
        Das gilt aber nur, wenn gerade deine Wohnung mit Mitteln des Wiederaufbaufonds saniert wurde. Wurde das Darlehen
        nach dem 31.8.1952 bewilligt, genügt es, dass allgemeine Teile des Hauses wiederhergestellt wurden – zum Beispiel
        Stiegenhaus, Dach oder Außenmauern.
      </p>
    </div>
  )
}
