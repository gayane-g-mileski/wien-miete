import { useState } from 'react'
import { DateField, TextField, TextareaField } from './ui'
import { href } from '../lib/seo'

// Rücktrittsbelehrung samt Muster-Rücktrittsformular.
//
// Das Formular ist nicht vorgeschrieben (§ 13 FAGG), muss aber bereitgestellt
// werden. Damit der Rücktritt ohne Umweg über ein E-Mail-Programm möglich ist,
// geht die Erklärung über denselben Versandweg wie das Kontaktformular; die
// erklärende Person bekommt eine Kopie an die angegebene Adresse.

const EMPFAENGER = 'gayane.mileski@gmail.com'
const VERSAND_URL = `https://formsubmit.co/ajax/${EMPFAENGER}`

type Status = 'bereit' | 'sendet' | 'ok'

interface Fehler {
  name?: string
  email?: string
  leistung?: string
  bestellt?: string
  versand?: string
}

const linkStil = 'text-accent underline hover:text-accent-strong'

export function Widerruf() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [anschrift, setAnschrift] = useState('')
  const [leistung, setLeistung] = useState('Prüfbericht PRO')
  const [bestellt, setBestellt] = useState('')
  const [bemerkung, setBemerkung] = useState('')
  const [fehler, setFehler] = useState<Fehler>({})
  const [status, setStatus] = useState<Status>('bereit')

  const senden = async () => {
    // Jede Meldung steht bei dem Feld, zu dem sie gehört.
    const neu: Fehler = {}
    if (!name.trim()) neu.name = 'Bitte geben Sie Ihren Namen an.'
    if (!email.trim()) neu.email = 'Bitte geben Sie Ihre E-Mail-Adresse an.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      neu.email = 'Bitte geben Sie eine gültige E-Mail-Adresse an.'
    if (!leistung.trim()) neu.leistung = 'Bitte geben Sie an, worum es geht.'
    if (!bestellt.trim()) neu.bestellt = 'Bitte geben Sie das Bestelldatum an.'
    setFehler(neu)
    if (Object.keys(neu).length > 0) return

    setStatus('sendet')
    try {
      const antwort = await fetch(VERSAND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          anschrift: anschrift.trim(),
          leistung: leistung.trim(),
          bestellt_am: bestellt,
          bemerkung: bemerkung.trim(),
          erklaerung:
            'Hiermit trete ich von dem von mir abgeschlossenen Vertrag über die oben genannte Leistung zurück.',
          erklaert_am: new Date().toISOString(),
          _subject: 'Rücktritt vom Vertrag (FAGG)',
          _template: 'table',
          _captcha: 'false',
          _cc: email.trim(),
        }),
      })
      if (!antwort.ok) throw new Error(String(antwort.status))
      setStatus('ok')
    } catch {
      setStatus('bereit')
      setFehler({
        versand: `Senden hat gerade nicht geklappt. Bitte versuchen Sie es später noch einmal oder schreiben Sie an ${EMPFAENGER}.`,
      })
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Brotkrumen" className="text-sm text-ink-faint">
        <a className={linkStil} href={href('')}>
          Start
        </a>
        <span className="px-2">/</span>
        <span>Rücktrittsrecht</span>
      </nav>

      <h1 className="mt-8 text-[2.2rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.6rem]">
        Rücktrittsbelehrung
      </h1>
      <p className="mt-4 text-sm text-ink-faint">
        Für Verbraucherinnen und Verbraucher nach dem Fern- und Auswärtsgeschäfte-Gesetz (FAGG)
      </p>

      <section className="mt-10 space-y-4 text-base leading-relaxed text-ink-soft">
        <h2 className="text-[1.4rem] font-semibold leading-tight text-ink">Rücktrittsrecht</h2>
        <p>
          Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen von diesem Vertrag zurückzutreten. Die
          Frist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
        </p>
        <p>
          Um Ihr Rücktrittsrecht auszuüben, müssen Sie uns – Gayane G. Mileski, [Anschrift bitte ergänzen], Wien,{' '}
          <a className={linkStil} href={`mailto:${EMPFAENGER}`}>
            {EMPFAENGER}
          </a>{' '}
          – mittels einer eindeutigen Erklärung über Ihren Entschluss informieren. Dafür können Sie das Formular auf
          dieser Seite verwenden; vorgeschrieben ist es nicht. Zur Wahrung der Frist genügt es, die Mitteilung vor
          Ablauf der Frist abzusenden.
        </p>

        <h2 className="pt-4 text-[1.4rem] font-semibold leading-tight text-ink">Folgen des Rücktritts</h2>
        <p>
          Treten Sie zurück, erstatten wir Ihnen alle Zahlungen unverzüglich und spätestens binnen vierzehn Tagen ab
          dem Tag, an dem die Mitteilung bei uns eingegangen ist. Für die Rückzahlung verwenden wir dasselbe
          Zahlungsmittel wie bei der ursprünglichen Zahlung; dafür fallen keine Entgelte an.
        </p>

        <h2 className="pt-4 text-[1.4rem] font-semibold leading-tight text-ink">
          Vorzeitiges Erlöschen des Rücktrittsrechts
        </h2>
        <p>
          Bei digitalen Inhalten, die nicht auf einem körperlichen Datenträger geliefert werden – dazu zählen der
          Prüfbericht und die kostenpflichtigen Zugänge –, erlischt das Rücktrittsrecht vorzeitig, wenn wir mit der
          Ausführung begonnen haben, nachdem Sie ausdrücklich verlangt haben, dass wir vor Ablauf der Rücktrittsfrist
          beginnen, und zur Kenntnis genommen haben, dass Sie dadurch Ihr Rücktrittsrecht verlieren
          (§ 18 Abs 1 Z 11 FAGG). Beides wird im Bestellvorgang gesondert bestätigt und mit Zeitpunkt festgehalten.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 px-1 text-[2rem] font-semibold leading-tight tracking-tight text-accent">
          Muster-Rücktrittsformular
        </h2>
        <p className="mb-8 px-1 text-sm font-semibold text-ink-faint">
          Ausfüllen und absenden – eine Kopie geht an Ihre E-Mail-Adresse.
        </p>

        {status === 'ok' ? (
          <div className="space-y-4 px-1">
            <p className="text-base font-medium text-accent">
              Danke, Ihre Rücktrittserklärung ist eingegangen. Eine Kopie ist an {email.trim()} unterwegs.
            </p>
            <p className="text-sm leading-relaxed text-ink-soft">
              Wir bestätigen den Eingang gesondert und erstatten die Zahlung binnen vierzehn Tagen über dasselbe
              Zahlungsmittel.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <p className="px-1 text-sm leading-relaxed text-ink-soft">
              Hiermit trete ich von dem von mir abgeschlossenen Vertrag über die folgende Leistung zurück:
            </p>

            <TextField
              label="Leistung"
              id="widerruf-leistung"
              value={leistung}
              fehler={fehler.leistung}
              hint="Zum Beispiel Prüfbericht PRO oder Profi-Zugang."
              onChange={(e) => setLeistung(e.target.value)}
            />
            <DateField
              label="Bestellt am"
              id="widerruf-bestellt"
              value={bestellt}
              fehler={fehler.bestellt}
              onChange={(e) => setBestellt(e.target.value)}
            />
            <TextField
              label="Name"
              id="widerruf-name"
              autoComplete="name"
              value={name}
              fehler={fehler.name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="E-Mail-Adresse"
              id="widerruf-email"
              type="email"
              autoComplete="email"
              value={email}
              fehler={fehler.email}
              hint="An diese Adresse geht die Kopie der Erklärung."
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Anschrift (optional)"
              id="widerruf-anschrift"
              autoComplete="street-address"
              value={anschrift}
              onChange={(e) => setAnschrift(e.target.value)}
            />
            <TextareaField
              label="Bemerkung (optional)"
              id="widerruf-bemerkung"
              rows={4}
              value={bemerkung}
              onChange={(e) => setBemerkung(e.target.value)}
            />

            {fehler.versand && (
              <p role="alert" className="px-1 text-[12px] text-danger">
                {fehler.versand}
              </p>
            )}

            <button
              type="button"
              onClick={() => void senden()}
              disabled={status === 'sendet'}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'sendet' ? 'Wird gesendet …' : 'Rücktritt erklären'}
            </button>

            <p className="px-1 text-[12px] leading-relaxed text-ink-faint">
              Die Angaben werden ausschließlich zur Bearbeitung des Rücktritts verwendet. Zeitpunkt des Absendens gilt
              als Zeitpunkt der Erklärung.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
