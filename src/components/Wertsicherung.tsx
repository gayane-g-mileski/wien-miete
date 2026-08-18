import { useMemo, useState } from 'react'
import { NumberField, SelectField, TextField, DateField } from './ui'
import { ANPASSUNGEN, berechneIndex } from '../lib/wertsicherung'
import { dateiSpeichern } from '../lib/speichern'
import type { MietzinsArt } from '../lib/types'

const ARTEN: { wert: MietzinsArt; label: string }[] = [
  { wert: 'richtwert', label: 'Richtwertmietzins' },
  { wert: 'kategorie', label: 'Kategoriemietzins' },
  { wert: 'angemessen', label: 'Angemessener Hauptmietzins' },
  { wert: 'frei', label: 'Freier Mietzins' },
]

function euro(n: number): string {
  return n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function Wertsicherung() {
  const [art, setArt] = useState<MietzinsArt>('richtwert')
  const [aktuell, setAktuell] = useState(780)
  const [letzteAnpassung, setLetzteAnpassung] = useState('2025-04-01')
  const [jahr, setJahr] = useState(2027)
  const [indexSteigerung, setIndexSteigerung] = useState(3)
  const [schwelle, setSchwelle] = useState(0)
  const [anschrift, setAnschrift] = useState('')
  const [mieter, setMieter] = useState('')
  const [vermieter, setVermieter] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)

  const frei = art === 'frei' || art === 'angemessen'

  const ergebnis = useMemo(
    () =>
      berechneIndex({
        mietzinsArt: art,
        aktuell,
        letzteAnpassung,
        jahr,
        indexSteigerung: indexSteigerung / 100,
        schwelle: schwelle / 100,
      }),
    [art, aktuell, letzteAnpassung, jahr, indexSteigerung, schwelle],
  )

  const schreiben = async () => {
    setFehler(null)
    try {
      const { erhoehungsschreibenBlob } = await import('../lib/pdf')
      const blob = erhoehungsschreibenBlob({
        anschrift,
        mieter,
        vermieter,
        alt: aktuell,
        neu: ergebnis.neu,
        satz: ergebnis.satz,
        wirksamAb: ergebnis.wirksamAb,
        grundlage: frei
          ? 'Wertsicherungsvereinbarung des Mietvertrags, begrenzt durch das Mieten-Wertsicherungsgesetz (MieWeG / 5. MILG).'
          : 'Mieten-Wertsicherungsgesetz (MieWeG / 5. MILG) und § 16 Abs 9 MRG – jährliche Anpassung seit 1.1.2026.',
        schritte: ergebnis.schritte,
      })
      await dateiSpeichern(blob, 'Erhoehungsschreiben.pdf')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      console.error(e)
      setFehler('Das Schreiben konnte nicht erzeugt werden. Bitte lade die Seite neu.')
    }
  }

  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-ink-soft">
        Seit dem Mieten-Wertsicherungsgesetz (MieWeG, 5. MILG) wird jährlich angepasst statt in mehrjährigen Sprüngen.
        Zuletzt stieg der Richtwert am 1.4.2026 um 1 %; für 2027 lässt das Gesetz höchstens 2 % zu.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SelectField label="Mietzinsart" id="ws-art" value={art} onChange={(e) => setArt(e.target.value as MietzinsArt)}>
          {ARTEN.map((a) => (
            <option key={a.wert} value={a.wert}>
              {a.label}
            </option>
          ))}
        </SelectField>
        <NumberField
          label="Hauptmietzins netto pro Monat (€)"
          id="ws-aktuell"
          min={0}
          step={1}
          value={aktuell}
          onChange={(e) => setAktuell(Math.max(0, Number(e.target.value)))}
        />
        <DateField
          label="Letzte Anpassung"
          id="ws-letzte"
          value={letzteAnpassung}
          onChange={(e) => setLetzteAnpassung(e.target.value)}
        />
        <SelectField label="Anpassung für das Jahr" id="ws-jahr" value={jahr} onChange={(e) => setJahr(Number(e.target.value))}>
          {[2026, 2027, 2028, 2029].map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </SelectField>
        {frei && (
          <>
            <NumberField
              label="Indexsteigerung laut Vertrag (%)"
              id="ws-index"
              min={0}
              step={0.1}
              value={indexSteigerung}
              hint="Steigerung des Verbraucherpreisindex seit der letzten Anpassung."
              onChange={(e) => setIndexSteigerung(Math.max(0, Number(e.target.value)))}
            />
            <NumberField
              label="Schwellenwert der Klausel (%)"
              id="ws-schwelle"
              min={0}
              step={0.5}
              value={schwelle}
              hint="0, wenn keine Schwelle vereinbart ist."
              onChange={(e) => setSchwelle(Math.max(0, Number(e.target.value)))}
            />
          </>
        )}
      </div>

      <div className="rounded-xl bg-surface-2 px-4 py-4">
        <p className="text-sm text-ink-faint">Zulässiger neuer Hauptmietzins</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-coffee">{euro(ergebnis.neu)} €</p>
        <p className="mt-1 text-sm text-ink-soft">
          {ergebnis.schwelleOffen
            ? 'Keine Erhöhung möglich – siehe Rechnung unten.'
            : `${(ergebnis.satz * 100).toLocaleString('de-AT', { maximumFractionDigits: 2 })} % ab ${ergebnis.wirksamAb
                .split('-')
                .reverse()
                .join('.')}, das sind ${euro(Math.round((ergebnis.neu - aktuell) * 100) / 100)} € mehr im Monat.`}
        </p>
      </div>

      <div className="space-y-3">
        {ergebnis.schritte.map((s) => (
          <div key={s.was}>
            <p className="text-sm font-medium text-ink">{s.was}</p>
            <p className="text-sm text-ink-soft">{s.ergebnis}</p>
            <p className="text-[12px] text-ink-faint">Quelle: {s.quelle}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-line pt-6">
        <p className="mb-4 text-base font-semibold text-ink">Erhöhungsschreiben erstellen</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <TextField label="Anschrift des Objekts" id="ws-anschrift" value={anschrift} onChange={(e) => setAnschrift(e.target.value)} />
          <TextField label="Mieter:in" id="ws-mieter" value={mieter} onChange={(e) => setMieter(e.target.value)} />
          <TextField label="Vermieter:in" id="ws-vermieter" value={vermieter} onChange={(e) => setVermieter(e.target.value)} />
        </div>
        {fehler && (
          <p role="alert" className="mt-3 text-[12px] text-danger">
            {fehler}
          </p>
        )}
        <button
          type="button"
          onClick={schreiben}
          disabled={ergebnis.schwelleOffen}
          className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Erhöhungsschreiben als PDF
        </button>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
          Hinterlegte Anpassungen: {ANPASSUNGEN.map((a) => `${a.stichtag.split('-').reverse().join('.')} ${(a.deckel * 100).toLocaleString('de-AT')} %`).join(' · ')}. Spätere Jahre
          werden fortgeschrieben, bis die Kundmachung vorliegt.
        </p>
      </div>
    </div>
  )
}
