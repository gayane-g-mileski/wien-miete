import { ENGINE_VERSION } from '../lib/version'

// TODO(Gayane): Der fachliche Hintergrund ist bewusst als Platzhalter angelegt –
// er gehört von dir ausgefüllt, ich kann und will keine Qualifikationen erfinden.
// Ein Porträtfoto unter public/portrait.jpg ersetzt automatisch die Initialen.
const HINTERGRUND = '[Fachlicher Hintergrund – bitte ergänzen: Ausbildung, Berufserfahrung, Bezug zu Mietrecht und Wiener Immobilienmarkt.]'

const METHODIK = [
  {
    titel: 'Woher die Regeln kommen',
    text: 'Die Einordnung folgt dem Mietrechtsgesetz samt Richtwertgesetz, Wohnungsgemeinnützigkeitsgesetz und den Wohnbauförderungen von 1948 bis heute. Jede Einschätzung nennt die Bestimmungen, auf denen sie beruht, und verlinkt sie im Rechtsinformationssystem des Bundes.',
  },
  {
    titel: 'Woher die Zahlen kommen',
    text: 'Richtwert und Kategoriebeträge sind die amtlich kundgemachten Werte. Lagezuschlag und Marktmieten sind hinterlegte Näherungen je Bezirk – amtlich gilt der Lagezuschlag je Liegenschaft laut Lagezuschlagskarte der Stadt Wien, die im Ergebnis verlinkt ist.',
  },
  {
    titel: 'Wie mit Zuschlägen umgegangen wird',
    text: 'Zu- und Abschläge werden nicht endlos aufaddiert. § 16 Abs 2 MRG verlangt eine Gesamtschau nach der Verkehrsauffassung, und der Oberste Gerichtshof lehnt es ab, jedes Ausstattungsdetail einzeln zu bewerten und die Beträge schlicht zusammenzuzählen (RIS-Justiz RS0117881). Die Summe bleibt daher in einem Korridor um den Grundwert.',
  },
  {
    titel: 'Wie oft aktualisiert wird',
    text: 'Richtwert und Kategoriebeträge werden mit jeder Kundmachung nachgezogen, die Marktnäherungen mindestens einmal jährlich überprüft. Änderungen an der Rechenlogik erhöhen die Version, die unter jedem Ergebnis steht – aktuell Engine v' + ENGINE_VERSION + '.',
  },
]

export function Ueber() {
  return (
    <section id="ueber" className="scroll-mt-4 border-t border-line bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">Wer dahintersteht</h2>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start">
          <img
            src={`${import.meta.env.BASE_URL}portrait.jpg`}
            alt=""
            width={112}
            height={112}
            className="h-28 w-28 shrink-0 rounded-2xl object-cover ring-1 ring-line"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div>
            <p className="text-lg font-semibold text-ink">Gayane G. Mileski</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{HINTERGRUND}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Dieses Werkzeug ist aus der eigenen Arbeit an Wiener Mietobjekten entstanden: Die Einordnung nach dem MRG
              kostet jedes Mal dieselben Handgriffe – Baualter, Förderung, Vertragsdatum, Ausstattung. Das nimmt der
              Rechner ab und legt offen, wie er zum Ergebnis kommt.
            </p>
          </div>
        </div>

        <h3 className="mt-12 text-sm font-semibold uppercase tracking-[0.14em] text-accent">Methodik</h3>
        <div className="mt-5 space-y-6">
          {METHODIK.map((m) => (
            <div key={m.titel}>
              <p className="text-base font-semibold text-ink">{m.titel}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{m.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
