import { Collapsible } from './ui'
import { GLOSSAR, href, type GlossarSeite } from '../lib/seo'

// Glossarseiten: eigener Pfad, eigener Titel, eigene strukturierte Daten.
// Der Inhalt kommt aus src/inhalte/seiten.json und wird beim Pre-Rendering in
// fertiges HTML geschrieben, damit Suchmaschinen ihn ohne JavaScript lesen.

const linkStil = 'text-accent underline hover:text-accent-strong'

export function Glossar({ seite }: { seite: GlossarSeite }) {
  const verwandt = seite.verwandt
    .map((p) => GLOSSAR.find((s) => s.pfad === p))
    .filter((s): s is GlossarSeite => Boolean(s))

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Brotkrumen" className="text-sm text-ink-faint">
        <a className={linkStil} href={href('')}>
          Start
        </a>
        <span className="px-2">/</span>
        <a className={linkStil} href={href('glossar/')}>
          Glossar
        </a>
        <span className="px-2">/</span>
        <span>{seite.kicker}</span>
      </nav>

      <article className="mt-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{seite.kicker}</p>
        <h1 className="mt-3 text-[2.2rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.6rem]">
          {seite.h1}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">{seite.einleitung}</p>

        {seite.abschnitte.map((a) => (
          <section key={a.ueberschrift} className="mt-12">
            <h2 className="text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">{a.ueberschrift}</h2>
            {a.absaetze.map((t) => (
              <p key={t.slice(0, 40)} className="mt-4 text-base leading-relaxed text-ink-soft">
                {t}
              </p>
            ))}
            {a.tabelle && (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
                <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      {a.tabelle.kopf.map((k) => (
                        <th key={k} className="px-4 py-3 font-semibold text-ink">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {a.tabelle.zeilen.map((z) => (
                      <tr key={z.join('|')} className="border-b border-line last:border-0">
                        {z.map((zelle, i) => (
                          <td key={zelle + i} className={i === 0 ? 'px-4 py-3 font-medium text-ink' : 'px-4 py-3 text-ink-soft'}>
                            {zelle}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        <section className="mt-12">
          <h2 className="text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">Häufige Fragen</h2>
          {/* Ausklappbare Karten wie auf der Startseite; der Text bleibt im
              Dokument, damit Suchmaschinen ihn lesen. */}
          <div className="mt-6 space-y-4">
            {seite.faq.map((f) => (
              <div key={f.frage} className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
                <Collapsible title={f.frage} immerImDom>
                  <p className="text-sm leading-relaxed text-ink-soft">{f.antwort}</p>
                </Collapsible>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 rounded-2xl border border-accent/40 bg-accent/5 p-6">
          <p className="text-lg font-semibold text-ink">Für eine Einheit im Bestand nachrechnen</p>
          <p className="mt-2 text-base leading-relaxed text-ink-soft">
            Die Prüfung ordnet Mietzinsart und Anwendungsbereich des MRG ein und zeigt die Bandbreite mit Herleitung –
            die Einzelprüfung kostenlos und ohne Konto.
          </p>
          <a
            href={href('')}
            className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong"
          >
            Zur Prüfung
          </a>
        </div>

        {verwandt.length > 0 && (
          <section className="mt-12 border-t border-line pt-8">
            <h2 className="text-base font-semibold text-ink">Weiterlesen</h2>
            <div className="mt-4 space-y-3">
              {verwandt.map((s) => (
                <p key={s.pfad}>
                  <a className={linkStil} href={href(`${s.pfad}/`)}>
                    {s.titel}
                  </a>
                </p>
              ))}
            </div>
          </section>
        )}

        <p className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-ink-faint">
          Dieser Text ist eine allgemeine Information und eine automatisierte Ersteinschätzung – kein Gutachten und
          keine Rechtsauskunft im Einzelfall. Verbindliche Auskünfte geben die Schlichtungsstelle, die
          Mietervereinigung, die Arbeiterkammer oder eine Rechtsanwältin bzw. ein Rechtsanwalt.
        </p>
      </article>
    </main>
  )
}

export function GlossarIndex() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Brotkrumen" className="text-sm text-ink-faint">
        <a className={linkStil} href={href('')}>
          Start
        </a>
        <span className="px-2">/</span>
        <span>Glossar</span>
      </nav>

      <h1 className="mt-8 max-w-3xl text-[2.2rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.6rem]">
        Glossar: Mietrecht und Mietzins in Wien
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ink-soft">
        Die wichtigsten Begriffe rund um Richtwert, Lagezuschlag, Betriebskosten und Wertsicherung – kurz erklärt, mit
        Fundstellen und einem Rechner für den eigenen Fall.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {GLOSSAR.map((s) => (
          <a
            key={s.pfad}
            href={href(`${s.pfad}/`)}
            className="block rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:border-accent"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">{s.kicker}</p>
            <p className="mt-3 text-lg font-semibold leading-snug text-ink">{s.h1}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.beschreibung}</p>
          </a>
        ))}
      </div>
    </main>
  )
}
