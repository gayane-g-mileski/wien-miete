import type { MietobjektInput, MerkmalKey } from '../lib/types'
import {
  BAUBEWILLIGUNG_LABEL,
  HEIZUNG_LABEL,
  KATEGORIE_LABEL,
  OBJEKTART_GRUPPEN,
  STOCKWERK_LABEL,
  ZUSTAND_HAUS_LABEL,
  zeigeAusstattung,
  zeigeBaujahr,
  zeigeFoerderung,
  zeigeKategorie,
} from '../lib/labels'
import { FOERDERUNG_PROGRAMM_LABEL, TILGUNGSSTATUS_LABEL, statusRelevant } from '../lib/foerderung'
import { BEZIRKE, MERKMAL_GRUPPEN, MERKMAL_KATALOG, bezirkAusAnschrift, getBezirk } from '../lib/pricingData'
import { Checkbox, Field, NumberInput, Section, Select, TextInput } from './ui'

interface Props {
  value: MietobjektInput
  onChange: (next: MietobjektInput) => void
}

export function Formular({ value, onChange }: Props) {
  const set = <K extends keyof MietobjektInput>(key: K, v: MietobjektInput[K]) => onChange({ ...value, [key]: v })
  const setMerkmal = (key: MerkmalKey, v: boolean) => onChange({ ...value, merkmale: { ...value.merkmale, [key]: v } })

  const bezirkAusAdresse = bezirkAusAnschrift(value.anschrift)
  const bezirk = getBezirk(bezirkAusAdresse ?? value.bezirk)

  return (
    <div className="flex flex-col gap-5">
      {/* --- Angaben zum Mietobjekt --- */}
      <Section title="Angaben zum Mietobjekt">
        <Field label="Art des Mietgegenstands" htmlFor="objektart">
          <Select
            id="objektart"
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
          </Select>
        </Field>

        <Field
          label={
            <>
              Anschrift <span className="font-normal text-ink-faint">(optional)</span>
            </>
          }
          htmlFor="anschrift"
          hint={
            bezirkAusAdresse
              ? `Erkannt: ${bezirkAusAdresse}. Bezirk (${bezirk.name}) – Lagezuschlag wird geschätzt.`
              : 'Für die Lagezuschlag-Schätzung. Ohne Anschrift wird die Lage nicht berücksichtigt.'
          }
        >
          <TextInput
            id="anschrift"
            placeholder="z.B. Lindengasse 12, 1070 Wien"
            value={value.anschrift}
            onChange={(e) => set('anschrift', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nutzfläche (m²)" htmlFor="flaeche">
            <NumberInput
              id="flaeche"
              min={1}
              step={1}
              value={value.flaeche}
              onChange={(e) => set('flaeche', Math.max(0, Number(e.target.value)))}
            />
          </Field>
          <Field label="Bezirk (Marktpreis)" htmlFor="bezirk">
            <Select
              id="bezirk"
              value={value.bezirk}
              disabled={bezirkAusAdresse != null}
              onChange={(e) => set('bezirk', Number(e.target.value))}
            >
              {BEZIRKE.map((b) => (
                <option key={b.nr} value={b.nr}>
                  {b.nr}. {b.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Checkbox
            checked={value.eigentumswohnung}
            onChange={(v) => set('eigentumswohnung', v)}
            label="Eigentumswohnung"
          />
          <Checkbox checked={value.befristet} onChange={(v) => set('befristet', v)} label="befristeter Mietvertrag" />
        </div>
      </Section>

      {/* --- Förderung (inkl. Baubewilligung) --- */}
      <Section title="Förderung">
        {zeigeBaujahr(value.objektart) && (
          <Field label="Baubewilligung des Gebäudes" htmlFor="baubewilligung">
            <Select
              id="baubewilligung"
              value={value.baubewilligungGebaeude}
              onChange={(e) => set('baubewilligungGebaeude', e.target.value as MietobjektInput['baubewilligungGebaeude'])}
            >
              {(Object.keys(BAUBEWILLIGUNG_LABEL) as (keyof typeof BAUBEWILLIGUNG_LABEL)[]).map((k) => (
                <option key={k} value={k}>
                  {BAUBEWILLIGUNG_LABEL[k]}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {value.objektart === 'dg_ausbau' && (
          <Checkbox
            checked={value.dgAusbauNachStichtag}
            onChange={(v) => set('dgAusbauNachStichtag', v)}
            label="Baubewilligung/Mietvertrag nach dem 31.12.2001"
          />
        )}
        {value.objektart === 'zubau' && (
          <Checkbox
            checked={value.zubauNachStichtag}
            onChange={(v) => set('zubauNachStichtag', v)}
            label="Baubewilligung nach dem 30.9.2006"
          />
        )}

        {zeigeFoerderung(value.objektart) ? (
          <>
            <Field
              label="Öffentliche Wohnbauförderung"
              htmlFor="foerderung"
              hint='Datensätze laut Unterlage „Förderungen" (WWG 1948, WFG 1954/1968/1984, WWFSG 1989, gemeinnützige Bauvereinigung).'
            >
              <Select
                id="foerderung"
                value={value.foerderungProgramm}
                onChange={(e) => set('foerderungProgramm', e.target.value as MietobjektInput['foerderungProgramm'])}
              >
                {(Object.keys(FOERDERUNG_PROGRAMM_LABEL) as (keyof typeof FOERDERUNG_PROGRAMM_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {FOERDERUNG_PROGRAMM_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>

            {statusRelevant(value.foerderungProgramm) && (
              <Field label="Tilgungsstatus des Förderungsdarlehens" htmlFor="tilgung">
                <Select
                  id="tilgung"
                  value={value.tilgungsstatus}
                  onChange={(e) => set('tilgungsstatus', e.target.value as MietobjektInput['tilgungsstatus'])}
                >
                  {(Object.keys(TILGUNGSSTATUS_LABEL) as (keyof typeof TILGUNGSSTATUS_LABEL)[]).map((k) => (
                    <option key={k} value={k}>
                      {TILGUNGSSTATUS_LABEL[k]}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-soft">Bei dieser Objektart ist die Förderung für die Einstufung ohne Bedeutung.</p>
        )}
      </Section>

      {/* --- Ausstattung, Zustand & Zu-/Abschläge --- */}
      {zeigeAusstattung(value.objektart) && (
        <Section title="Ausstattung, Zustand & Zu-/Abschläge">
          {zeigeKategorie(value.objektart) && (
            <Field label="Ausstattungskategorie" htmlFor="kategorie">
              <Select
                id="kategorie"
                value={value.kategorie}
                onChange={(e) => set('kategorie', e.target.value as MietobjektInput['kategorie'])}
              >
                {(Object.keys(KATEGORIE_LABEL) as (keyof typeof KATEGORIE_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {KATEGORIE_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Erhaltungszustand" htmlFor="zustand">
              <Select
                id="zustand"
                value={value.zustandHaus}
                onChange={(e) => set('zustandHaus', e.target.value as MietobjektInput['zustandHaus'])}
              >
                {(Object.keys(ZUSTAND_HAUS_LABEL) as (keyof typeof ZUSTAND_HAUS_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {ZUSTAND_HAUS_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Geschoss" htmlFor="stockwerk">
              <Select
                id="stockwerk"
                value={value.stockwerk}
                onChange={(e) => set('stockwerk', e.target.value as MietobjektInput['stockwerk'])}
              >
                {(Object.keys(STOCKWERK_LABEL) as (keyof typeof STOCKWERK_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {STOCKWERK_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Heizung" htmlFor="heizung">
              <Select
                id="heizung"
                value={value.heizung}
                onChange={(e) => set('heizung', e.target.value as MietobjektInput['heizung'])}
              >
                {(Object.keys(HEIZUNG_LABEL) as (keyof typeof HEIZUNG_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {HEIZUNG_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {MERKMAL_GRUPPEN.map((gruppe) => (
            <div key={gruppe} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-sage-700">{gruppe}</p>
              <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {MERKMAL_KATALOG.filter((m) => m.gruppe === gruppe).map((m) => (
                  <Checkbox
                    key={m.key}
                    checked={value.merkmale[m.key]}
                    onChange={(v) => setMerkmal(m.key, v)}
                    label={m.label}
                  />
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}
