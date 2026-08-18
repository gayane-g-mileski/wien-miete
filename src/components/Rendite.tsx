import { useMemo, useState } from 'react'
import { NumberField } from './ui'
import { berechneRendite } from '../lib/rendite'

function euro(n: number): string {
  return n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function prozent(n: number): string {
  return `${(n * 100).toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}

export function Rendite() {
  const [kaufpreis, setKaufpreis] = useState(320000)
  const [nebenkosten, setNebenkosten] = useState(12000)
  const [flaeche, setFlaeche] = useState(58)
  const [mieteMonat, setMieteMonat] = useState(890)
  const [leerstand, setLeerstand] = useState(4)
  const [bewirtschaftung, setBewirtschaftung] = useState(900)
  const [ruecklage, setRuecklage] = useState(700)
  const [instandsetzung, setInstandsetzung] = useState(0)
  const [steuersatz, setSteuersatz] = useState(42)
  const [kredit, setKredit] = useState(0)
  const [zinssatz, setZinssatz] = useState(3.5)

  const r = useMemo(
    () =>
      berechneRendite({
        kaufpreis,
        nebenkosten,
        flaeche,
        mieteMonat,
        leerstand: leerstand / 100,
        bewirtschaftung,
        ruecklage,
        instandsetzung,
        steuersatz: steuersatz / 100,
        kredit,
        zinssatz: zinssatz / 100,
      }),
    [kaufpreis, nebenkosten, flaeche, mieteMonat, leerstand, bewirtschaftung, ruecklage, instandsetzung, steuersatz, kredit, zinssatz],
  )

  const felder: { label: string; id: string; wert: number; setzen: (n: number) => void; schritt?: number; hint?: string }[] = [
    { label: 'Kaufpreis (€)', id: 're-kauf', wert: kaufpreis, setzen: setKaufpreis, schritt: 1000 },
    { label: 'Weitere Nebenkosten (€)', id: 're-neben', wert: nebenkosten, setzen: setNebenkosten, schritt: 500, hint: 'Makler, Vertrag, Bewertung – ohne Grunderwerbsteuer und Eintragung.' },
    { label: 'Nutzfläche (m²)', id: 're-flaeche', wert: flaeche, setzen: setFlaeche },
    { label: 'Netto-Miete pro Monat (€)', id: 're-miete', wert: mieteMonat, setzen: setMieteMonat, schritt: 10 },
    { label: 'Leerstand (%)', id: 're-leer', wert: leerstand, setzen: setLeerstand, schritt: 0.5 },
    { label: 'Bewirtschaftung pro Jahr (€)', id: 're-bewirt', wert: bewirtschaftung, setzen: setBewirtschaftung, schritt: 50, hint: 'Verwaltung, nicht überwälzbare Betriebskosten, Versicherung.' },
    { label: 'Instandhaltungsrücklage pro Jahr (€)', id: 're-ihr', wert: ruecklage, setzen: setRuecklage, schritt: 50 },
    { label: 'Instandsetzung einmalig (€)', id: 're-instand', wert: instandsetzung, setzen: setInstandsetzung, schritt: 500, hint: 'Wird nach § 28 Abs 2 EStG auf 15 Jahre verteilt.' },
    { label: 'Grenzsteuersatz (%)', id: 're-steuer', wert: steuersatz, setzen: setSteuersatz },
    { label: 'Fremdkapital (€)', id: 're-kredit', wert: kredit, setzen: setKredit, schritt: 1000 },
    { label: 'Zinssatz (%)', id: 're-zins', wert: zinssatz, setzen: setZinssatz, schritt: 0.1 },
  ]

  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-ink-soft">
        Rendite einer Vorsorgewohnung vor und nach Steuer – mit Leerstand, Instandhaltungsrücklage, Absetzung für
        Abnutzung nach § 16 Abs 1 Z 8 EStG und der Verteilung von Instandsetzungen auf fünfzehn Jahre nach § 28 Abs 2
        EStG.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {felder.map((f) => (
          <NumberField
            key={f.id}
            label={f.label}
            id={f.id}
            min={0}
            step={f.schritt ?? 1}
            hint={f.hint}
            value={f.wert}
            onChange={(e) => f.setzen(Math.max(0, Number(e.target.value)))}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { titel: 'Bruttorendite', wert: prozent(r.bruttorendite), farbe: 'text-ink' },
          { titel: 'Nettorendite vor Steuer', wert: prozent(r.nettorendite), farbe: 'text-coffee' },
          { titel: 'Rendite nach Steuer', wert: prozent(r.renditeNachSteuer), farbe: 'text-accent' },
        ].map((k) => (
          <div key={k.titel} className="rounded-xl bg-surface-2 px-4 py-3">
            <p className={`text-2xl font-bold tabular-nums ${k.farbe}`}>{k.wert}</p>
            <p className="mt-1 text-sm text-ink-faint">{k.titel}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {[
          ['Gesamtkosten des Erwerbs', `${euro(r.gesamtkosten)} €`],
          ['Kaufpreis pro m²', `${euro(r.kaufpreisProM2)} €`],
          ['Jahresmiete nach Leerstand', `${euro(r.jahresmieteNachLeerstand)} €`],
          ['Absetzung für Abnutzung', `${euro(r.afaJahr)} €`],
          ['Steuer pro Jahr', `${euro(r.steuer)} €`],
          ['Überschuss nach Steuer', `${euro(r.ueberschussNachSteuer)} €`],
          ['Zinsen pro Jahr', `${euro(r.zinsenJahr)} €`],
          ['Cashflow nach Steuer und Zinsen', `${euro(r.cashflowJahr)} €`],
        ].map(([label, wert]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-line py-1.5">
            <span className="text-ink-soft">{label}</span>
            <span className="tabular-nums font-medium text-ink">{wert}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {r.schritte.map((s) => (
          <div key={s.was}>
            <p className="text-sm font-medium text-ink">{s.was}</p>
            <p className="text-sm text-ink-soft">{s.ergebnis}</p>
            <p className="text-[12px] text-ink-faint">Quelle: {s.quelle}</p>
          </div>
        ))}
      </div>

      <p className="text-[12px] leading-relaxed text-ink-faint">
        Die Rechnung nimmt einen Gebäudeanteil von 60 % an; maßgeblich ist der tatsächliche Anteil laut Kaufvertrag oder
        Gutachten. Tilgung, Umsatzsteueroption, Vorsteuerabzug und Wertsteigerung bleiben außen vor. Keine
        Steuerberatung – für die Veranlagung ist die Steuerberatung zuständig.
      </p>
    </div>
  )
}
