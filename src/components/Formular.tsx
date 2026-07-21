import type { ChangeEvent } from 'react'
import type { MietobjektInput } from '../lib/types'
import {
  BAUBEWILLIGUNG_LABEL,
  FOERDERUNG_LABEL,
  KATEGORIE_LABEL,
  LAGE_LABEL,
  OBJEKTART_GRUPPEN,
  ZUSTAND_LABEL,
  zeigeBaujahr,
  zeigeFoerderung,
  zeigeKategorie,
} from '../lib/labels'
import { BEZIRKE, getBezirk } from '../lib/pricingData'

interface Props {
  value: MietobjektInput
  onChange: (next: MietobjektInput) => void
}

const fieldLabel = 'block text-sm font-medium text-slate-200 mb-1.5'
const controlBase =
  'w-full rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-sm text-slate-50 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500'
const hint = 'mt-1 text-xs text-slate-400'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-slate-700/70 bg-slate-800/40 p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-red-400">{title}</legend>
      {children}
    </fieldset>
  )
}

export function Formular({ value, onChange }: Props) {
  const set = <K extends keyof MietobjektInput>(key: K, v: MietobjektInput[K]) => onChange({ ...value, [key]: v })

  const onBezirkChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nr = Number(e.target.value)
    const b = getBezirk(nr)
    onChange({ ...value, bezirk: nr, lagequalitaet: b.typischeLage })
  }

  const bezirk = getBezirk(value.bezirk)

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Section title="Objekt">
        <div>
          <label className={fieldLabel} htmlFor="objektart">
            Art des Mietgegenstands
          </label>
          <select
            id="objektart"
            className={controlBase}
            value={value.objektart}
            onChange={(e) => set('objektart', e.target.value as MietobjektInput['objektart'])}
          >
            {OBJEKTART_GRUPPEN.map((gruppe) => (
              <optgroup key={gruppe.label} label={gruppe.label}>
                {gruppe.optionen.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {zeigeBaujahr(value.objektart) && (
          <div>
            <label className={fieldLabel} htmlFor="baubewilligung">
              Baubewilligung des Gebäudes
            </label>
            <select
              id="baubewilligung"
              className={controlBase}
              value={value.baubewilligungGebaeude}
              onChange={(e) => set('baubewilligungGebaeude', e.target.value as MietobjektInput['baubewilligungGebaeude'])}
            >
              {(Object.keys(BAUBEWILLIGUNG_LABEL) as (keyof typeof BAUBEWILLIGUNG_LABEL)[]).map((k) => (
                <option key={k} value={k}>
                  {BAUBEWILLIGUNG_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
        )}

        {value.objektart === 'dg_ausbau' && (
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-red-500 focus:ring-red-500"
              checked={value.dgAusbauNachStichtag}
              onChange={(e) => set('dgAusbauNachStichtag', e.target.checked)}
            />
            Baubewilligung/Mietvertrag nach dem 31.12.2001
          </label>
        )}

        {value.objektart === 'zubau' && (
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-red-500 focus:ring-red-500"
              checked={value.zubauNachStichtag}
              onChange={(e) => set('zubauNachStichtag', e.target.checked)}
            />
            Baubewilligung nach dem 30.9.2006
          </label>
        )}

        <div>
          <label className={fieldLabel} htmlFor="flaeche">
            Nutzfläche (m²)
          </label>
          <input
            id="flaeche"
            type="number"
            min={1}
            step={1}
            className={controlBase}
            value={value.flaeche}
            onChange={(e) => set('flaeche', Math.max(0, Number(e.target.value)))}
          />
        </div>

        <div>
          <label className={fieldLabel} htmlFor="bezirk">
            Wiener Gemeindebezirk
          </label>
          <select id="bezirk" className={controlBase} value={value.bezirk} onChange={onBezirkChange}>
            {BEZIRKE.map((b) => (
              <option key={b.nr} value={b.nr}>
                {b.nr}. {b.name}
              </option>
            ))}
          </select>
          <p className={hint}>
            Richtwert-Näherung Marktmiete: {bezirk.marktmieteMin}–{bezirk.marktmieteMax} €/m²
          </p>
        </div>
      </Section>

      <Section title="Förderung">
        {zeigeFoerderung(value.objektart) ? (
          <div>
            <label className={fieldLabel} htmlFor="foerderung">
              Öffentliche Wohnbauförderung
            </label>
            <select
              id="foerderung"
              className={controlBase}
              value={value.foerderung}
              onChange={(e) => set('foerderung', e.target.value as MietobjektInput['foerderung'])}
            >
              {(Object.keys(FOERDERUNG_LABEL) as (keyof typeof FOERDERUNG_LABEL)[]).map((k) => (
                <option key={k} value={k}>
                  {FOERDERUNG_LABEL[k]}
                </option>
              ))}
            </select>
            <p className={hint}>Betrifft z.B. WWG 1948, WFG 1954/1968/1984, WWFSG 1989 oder gemeinnützige Bauvereinigungen (WGG).</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Bei dieser Objektart ist die Förderung für die Einstufung ohne Bedeutung.</p>
        )}

        <div>
          <label className={fieldLabel} htmlFor="befristet">
            Mietvertrag
          </label>
          <div className="flex items-center gap-2">
            <input
              id="befristet"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-red-500 focus:ring-red-500"
              checked={value.befristet}
              onChange={(e) => set('befristet', e.target.checked)}
            />
            <label htmlFor="befristet" className="text-sm text-slate-200">
              befristet (schriftlich)
            </label>
          </div>
          <p className={hint}>In Vollanwendung führt ein schriftlich befristeter Vertrag zu einem 25 % Befristungsabschlag.</p>
        </div>
      </Section>

      <Section title="Ausstattung & Zustand">
        {zeigeKategorie(value.objektart) && (
          <div>
            <label className={fieldLabel} htmlFor="kategorie">
              Ausstattungskategorie
            </label>
            <select
              id="kategorie"
              className={controlBase}
              value={value.kategorie}
              onChange={(e) => set('kategorie', e.target.value as MietobjektInput['kategorie'])}
            >
              {(Object.keys(KATEGORIE_LABEL) as (keyof typeof KATEGORIE_LABEL)[]).map((k) => (
                <option key={k} value={k}>
                  {KATEGORIE_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={fieldLabel} htmlFor="zustand">
            Erhaltungszustand
          </label>
          <select
            id="zustand"
            className={controlBase}
            value={value.zustand}
            onChange={(e) => set('zustand', e.target.value as MietobjektInput['zustand'])}
          >
            {(Object.keys(ZUSTAND_LABEL) as (keyof typeof ZUSTAND_LABEL)[]).map((k) => (
              <option key={k} value={k}>
                {ZUSTAND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-red-500 focus:ring-red-500"
              checked={value.balkonTerrasse}
              onChange={(e) => set('balkonTerrasse', e.target.checked)}
            />
            Balkon/Terrasse/Loggia
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-red-500 focus:ring-red-500"
              checked={value.lift}
              onChange={(e) => set('lift', e.target.checked)}
            />
            Lift im Haus
          </label>
        </div>
      </Section>

      <Section title="Lage">
        <div>
          <label className={fieldLabel} htmlFor="lage">
            Lagequalität
          </label>
          <select
            id="lage"
            className={controlBase}
            value={value.lagequalitaet}
            onChange={(e) => set('lagequalitaet', e.target.value as MietobjektInput['lagequalitaet'])}
          >
            {(Object.keys(LAGE_LABEL) as (keyof typeof LAGE_LABEL)[]).map((k) => (
              <option key={k} value={k}>
                {LAGE_LABEL[k]}
              </option>
            ))}
          </select>
          <p className={hint}>Voreinstellung nach Bezirk; laut Wiener Lagezuschlagskarte auf Zählgebiets-Ebene genauer zu prüfen.</p>
        </div>

        <div>
          <label className={fieldLabel} htmlFor="marktmiete">
            Vergleichs-/Marktmiete manuell (€/m², optional)
          </label>
          <input
            id="marktmiete"
            type="number"
            min={0}
            step={0.1}
            placeholder={`${bezirk.marktmieteMin}–${bezirk.marktmieteMax}`}
            className={controlBase}
            value={value.marktmieteM2Override ?? ''}
            onChange={(e) => set('marktmieteM2Override', e.target.value === '' ? null : Number(e.target.value))}
          />
          <p className={hint}>Überschreibt die hinterlegte Bezirks-Schätzung, z.B. nach Recherche vergleichbarer Inserate.</p>
        </div>
      </Section>
    </div>
  )
}
