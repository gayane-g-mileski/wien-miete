// Ehrlicher Vergleich: Was dieses Werkzeug leistet – und wo die amtliche Stelle
// besser ist. Angaben zu fremden Angeboten stammen aus deren öffentlicher
// Beschreibung und können sich ändern.

interface Zeile {
  frage: string
  hier: string
  stadt: string
  anderer: string
}

const ZEILEN: Zeile[] = [
  {
    frage: 'Gilt das MRG überhaupt? (Voll-, Teilanwendung, Vollausnahme)',
    hier: 'Ja, inklusive Kündigungsschutz und Preisgrenze',
    stadt: 'Setzt eine Richtwert- oder Kategoriewohnung voraus',
    anderer: 'selbst prüfen',
  },
  {
    frage: 'Öffentliche Förderungen von 1948 bis heute samt Stand der Rückzahlung',
    hier: 'Ja, mit fertigen Anfragen an MA 25, MA 50 und Bundeswohnbaufonds',
    stadt: 'Nicht Teil des Rechners',
    anderer: 'selbst prüfen',
  },
  {
    frage: 'Vertragsdatum entscheidet über Richtwert, Kategorie oder Altvertrag',
    hier: 'Ja',
    stadt: 'Ja',
    anderer: 'selbst prüfen',
  },
  {
    frage: 'Lagezuschlag',
    hier: 'Bezirksnäherung, mit Link auf die amtliche Karte',
    stadt: 'Amtlich, je Liegenschaft (Lagezuschlagskarte)',
    anderer: 'selbst prüfen',
  },
  {
    frage: 'Verbindliche Auskunft oder Überprüfung des Mietzinses',
    hier: 'Nein – reines Informationswerkzeug',
    stadt: 'Ja, über die Schlichtungsstelle (MA 50)',
    anderer: 'Nein',
  },
  {
    frage: 'Ergebnis als PDF, Verlauf mehrerer Adressen, offline nutzbar',
    hier: 'Ja',
    stadt: 'Nein',
    anderer: 'selbst prüfen',
  },
]

const zelle = 'px-3 py-3 align-top text-sm leading-relaxed'

export function Vergleich() {
  return (
    <section id="vergleich" className="scroll-mt-4 border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
          Was dieses Werkzeug kann – und was nicht
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          Für eine verbindliche Überprüfung ist die Schlichtungsstelle der Stadt Wien zuständig. Dieses Werkzeug ordnet
          ein, bereitet vor und rechnet nach – mehr nicht.
        </p>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface shadow-sm">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th className={`${zelle} font-semibold text-ink`} scope="col">
                  Frage
                </th>
                <th className={`${zelle} font-semibold text-accent`} scope="col">
                  Mietzins-Check in Wien
                </th>
                <th className={`${zelle} font-semibold text-ink`} scope="col">
                  Mietzinsrechner der Stadt Wien
                </th>
                <th className={`${zelle} font-semibold text-ink`} scope="col">
                  wiener-mietenrechner.at
                </th>
              </tr>
            </thead>
            <tbody>
              {ZEILEN.map((z) => (
                <tr key={z.frage} className="border-b border-line last:border-0">
                  <th scope="row" className={`${zelle} font-medium text-ink`}>
                    {z.frage}
                  </th>
                  <td className={`${zelle} text-ink-soft`}>{z.hier}</td>
                  <td className={`${zelle} text-ink-soft`}>{z.stadt}</td>
                  <td className={`${zelle} text-ink-faint`}>{z.anderer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-faint">
          Angaben zu fremden Angeboten nach deren öffentlicher Beschreibung, Stand August 2026, ohne Gewähr – die
          Rechner ändern sich. Am besten selbst ansehen:{' '}
          <a className="text-accent underline hover:text-accent-strong" href="https://mein.wien.gv.at/Richtwert/" target="_blank" rel="noreferrer">
            Mietzinsrechner der Stadt Wien
          </a>{' '}
          und{' '}
          <a className="text-accent underline hover:text-accent-strong" href="https://wiener-mietenrechner.at/" target="_blank" rel="noreferrer">
            wiener-mietenrechner.at
          </a>
          .
        </p>
      </div>
    </section>
  )
}
