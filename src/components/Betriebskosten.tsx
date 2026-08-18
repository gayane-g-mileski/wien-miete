import { useMemo, useState } from 'react'
import { NumberField } from './ui'
import { BK_KATALOG, pruefeBetriebskosten } from '../lib/betriebskosten'

function euro(n: number): string {
  return n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function Betriebskosten() {
  const [betraege, setBetraege] = useState<Record<string, number>>({})
  const [hausflaeche, setHausflaeche] = useState(1200)
  const [wohnungsflaeche, setWohnungsflaeche] = useState(75)
  const [vorschreibung, setVorschreibung] = useState(0)

  const ergebnis = useMemo(
    () => pruefeBetriebskosten({ betraege, hausflaeche, wohnungsflaeche, vorschreibung }),
    [betraege, hausflaeche, wohnungsflaeche, vorschreibung],
  )

  const setzeBetrag = (key: string, wert: number) => setBetraege((b) => ({ ...b, [key]: wert }))
  const zulaessig = BK_KATALOG.filter((p) => p.zulaessig)
  const unzulaessig = BK_KATALOG.filter((p) => !p.zulaessig)

  const feld = (p: (typeof BK_KATALOG)[number]) => (
    <div key={p.key} className="flex flex-col gap-1 border-b border-line py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm text-ink">{p.label}</p>
        <p className="text-[12px] text-ink-faint">
          {p.fundstelle}
          {p.hinweis ? ` · ${p.hinweis}` : ''}
        </p>
      </div>
      <input
        type="number"
        min={0}
        step={10}
        inputMode="decimal"
        aria-label={`${p.label} – Betrag pro Jahr in Euro`}
        value={betraege[p.key] ?? ''}
        placeholder="0"
        onChange={(e) => setzeBetrag(p.key, Math.max(0, Number(e.target.value)))}
        className="h-11 w-full shrink-0 rounded-lg border border-line bg-transparent px-3 text-base tabular-nums text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent sm:w-40"
      />
    </div>
  )

  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-ink-soft">
        § 21 MRG zählt abschließend auf, was als Betriebskosten weitergegeben werden darf. Trag die Jahresbeträge aus
        der Abrechnung ein – die Prüfung rechnet den Anteil der Wohnung und benennt Posten, die nicht hineingehören.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <NumberField
          label="Nutzfläche des Hauses (m²)"
          id="bk-haus"
          min={1}
          value={hausflaeche}
          onChange={(e) => setHausflaeche(Math.max(1, Number(e.target.value)))}
        />
        <NumberField
          label="Nutzfläche der Wohnung (m²)"
          id="bk-wohnung"
          min={1}
          value={wohnungsflaeche}
          onChange={(e) => setWohnungsflaeche(Math.max(1, Number(e.target.value)))}
        />
        <NumberField
          label="Vorschreibung pro Monat (€)"
          id="bk-vorschreibung"
          min={0}
          value={vorschreibung}
          hint="Was aktuell verrechnet wird – optional."
          onChange={(e) => setVorschreibung(Math.max(0, Number(e.target.value)))}
        />
      </div>

      <div>
        <p className="mb-2 text-base font-semibold text-accent">Zulässige Positionen</p>
        <div className="rounded-xl bg-surface-2 px-4">{zulaessig.map(feld)}</div>
      </div>

      <div>
        <p className="mb-2 text-base font-semibold text-danger">Nicht überwälzbar – nur zum Gegenrechnen</p>
        <div className="rounded-xl bg-surface-2 px-4">{unzulaessig.map(feld)}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-2 px-4 py-3">
          <p className="text-2xl font-bold tabular-nums text-coffee">{euro(ergebnis.anteilMonat)} €</p>
          <p className="mt-1 text-sm text-ink-faint">Anteil der Wohnung pro Monat</p>
        </div>
        <div className="rounded-xl bg-surface-2 px-4 py-3">
          <p className="text-2xl font-bold tabular-nums text-ink">{euro(ergebnis.proM2Monat)} €</p>
          <p className="mt-1 text-sm text-ink-faint">pro m² und Monat</p>
        </div>
        <div className="rounded-xl bg-surface-2 px-4 py-3">
          <p className={`text-2xl font-bold tabular-nums ${ergebnis.unzulaessigJahr > 0 ? 'text-danger' : 'text-accent'}`}>
            {euro(ergebnis.unzulaessigJahr)} €
          </p>
          <p className="mt-1 text-sm text-ink-faint">nicht überwälzbar im Jahr</p>
        </div>
      </div>

      {ergebnis.differenz != null && (
        <p className={`text-base font-semibold ${ergebnis.differenz > 0 ? 'text-danger' : 'text-accent'}`}>
          {ergebnis.differenz > 0
            ? `Die Vorschreibung liegt um ${euro(ergebnis.differenz)} € pro Monat über dem errechneten Anteil.`
            : `Die Vorschreibung liegt um ${euro(Math.abs(ergebnis.differenz))} € pro Monat unter dem errechneten Anteil.`}
        </p>
      )}

      {ergebnis.beanstandet.length > 0 && (
        <div className="space-y-2">
          <p className="text-base font-semibold text-ink">Zu beanstanden</p>
          {ergebnis.beanstandet.map((b) => (
            <p key={b.posten.key} className="text-sm text-ink-soft">
              <span className="font-medium text-ink">{b.posten.label}</span> mit {euro(b.betrag)} € gehört nicht in die
              Betriebskosten ({b.posten.fundstelle}).
            </p>
          ))}
        </div>
      )}

      <p className="text-[12px] leading-relaxed text-ink-faint">
        Die Abrechnung ist bis 30. Juni des Folgejahres zu legen und im Haus aufzulegen; Einsicht in die Belege steht
        jeder Mieterin und jedem Mieter zu (§ 21 Abs 3 MRG). Über Streitfälle entscheidet die Schlichtungsstelle.
      </p>
    </div>
  )
}
