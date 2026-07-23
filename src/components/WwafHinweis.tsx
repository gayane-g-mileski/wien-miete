import { useState } from 'react'
import { Textarea } from './ui'

/**
 * Hinweis-Box für den Wohnhauswiederaufbaufonds (WWG 1948): Wo man den Stand
 * der Rückzahlung erfragt, ein vorausgefüllter E-Mail-Text zur Anfrage und was
 * die drei möglichen Antworten bedeuten.
 */
function anfrageText(anschrift: string): string {
  const adr = anschrift.trim() || 'Wien XY, ………………….'
  return (
    `Ich bin Eigentümer des Hauses ${adr} bzw. der Wohnung Top Nr. XY, im Haus ${adr} ` +
    'und ersuche um Mitteilung,\n\n' +
    '• ob und falls ja, wann (Datum der Entscheidung/Bewilligung über das Fondsansuchen) der ' +
    'Wohnhauswiederaufbaufonds bzw. der Bundeswohn- und Siedlungsfonds für Wiederherstellungsmaßnahmen an diesem ' +
    'Haus ein Darlehen gewährt hat,\n' +
    '• ob sich die geförderten Baumaßnahmen (auch) auf das gegenständliche Mietobjekt Top Nr. XY oder nur auf ' +
    'allgemeine Teile des Hauses bezogen haben,\n' +
    '• ob und falls ja, wann dieses unter Inanspruchnahme des Rückzahlungsbegünstigungsgesetzes 1971 ' +
    '(RBG 1971, BGBl. Nr. 336/1971) und RBG 1987 (BGBl. Nr. 340/1987) in der geltenden Fassung gänzlich getilgt wurde.'
  )
}

const KONTAKTE = [
  { name: 'Gerlinde Weiss', email: 'gerlinde.weiss@bmdw.gv.at' },
  { name: 'Monika Kail', email: 'monika.kail@bmdw.gv.at' },
  { name: 'Ilse Kovacs', email: 'ilse.kovacs@bmdw.gv.at' },
]

export function WwafHinweis({ anschrift }: { anschrift: string }) {
  const [text, setText] = useState(() => anfrageText(anschrift))

  const senden = (email: string) => {
    const href = `mailto:${email}?subject=${encodeURIComponent('Anfrage Bundeswohnbaufonds – Stand der Rückzahlung')}&body=${encodeURIComponent(text)}`
    window.location.href = href
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700">
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
        <p className="mb-1.5 font-semibold text-neutral-800">Anfrage-Text</p>
        <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} />
        <p className="mt-2 text-xs text-neutral-500">Anfrage per E-Mail an eine zuständige Person senden:</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          {KONTAKTE.map((k) => (
            <button
              key={k.email}
              type="button"
              onClick={() => senden(k.email)}
              className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
            >
              {k.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold text-neutral-800">Drei mögliche Antworten:</p>
        <ul className="mt-1 space-y-2">
          <li>
            <span className="font-medium text-neutral-800">Tilgung laut Plan</span> (bzw. gemäß § 15 Abs. 7 WWG):
            Richtwertmietzins gemäß § 16 Abs. 2 MRG – bzw. angemessener Hauptmietzins, wenn die Voraussetzungen gemäß
            § 16 Abs. 1 Z 1–5 MRG vorliegen (Geschäftsraum, Neuschaffung, Denkmalschutz, Kategorie A/B über 130 m²).
          </li>
          <li>
            <span className="font-medium text-neutral-800">Tilgung nach dem RBG 1987</span>: angemessener Hauptmietzins
            gemäß § 9 Abs. 4 RBG 1987.
          </li>
          <li>
            <span className="font-medium text-neutral-800">Tilgung nach dem RBG 1971</span>: freier Mietzins gemäß
            § 12 Abs. 3 erster Satz RBG 1971.
          </li>
        </ul>
      </div>

      <p className="text-xs text-neutral-500">
        Das gilt aber nur, wenn die konkret angefragte Wohnung mit Mitteln des Wohnhaus-Wiederaufbaufonds (WWAF)
        wiederhergestellt wurde – es sei denn, die Bewilligung des WWAF-Darlehens erfolgte nach dem 31.8.1952: Dann
        genügt, dass allgemeine Teile wiederhergestellt wurden (z.B. Stiegenhaus, Dach, Außenmauer).
      </p>
    </div>
  )
}
