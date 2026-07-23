import { useRef, useState } from 'react'
import type { MerkmalKey, MietobjektInput, MietzinsArt } from '../lib/types'
import {
  BAUBEWILLIGUNG_LABEL,
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
import { BEZIRKE, MERKMAL_GRUPPEN, MERKMAL_KATALOG } from '../lib/pricingData'
import { Checkbox, Field, NumberInput, Section, Select } from './ui'
import { AnschriftFeld } from './AnschriftFeld'
import { Ma25Anfrage } from './Ma25Anfrage'
import { WwafHinweis } from './WwafHinweis'

interface Props {
  value: MietobjektInput
  onChange: (next: MietobjektInput) => void
  mietzinsArt: MietzinsArt
}

export function Formular({ value, onChange, mietzinsArt }: Props) {
  const istRichtwert = mietzinsArt === 'richtwert'
  const zeigeKat = istRichtwert || mietzinsArt === 'kategorie_d'
  const [ma25Offen, setMa25Offen] = useState(false)
  const valueRef = useRef(value)
  valueRef.current = value

  const set = <K extends keyof MietobjektInput>(key: K, v: MietobjektInput[K]) => onChange({ ...value, [key]: v })
  const setMerkmal = (key: MerkmalKey, v: boolean) => onChange({ ...value, merkmale: { ...value.merkmale, [key]: v } })

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

        {/* Anschrift + Bezirk nebeneinander */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
          <AnschriftFeld
            value={value.anschrift}
            onChange={(text, bezirk, koords) =>
              onChange({
                ...valueRef.current,
                anschrift: text,
                anschriftBezirk: bezirk,
                anschriftKoords: koords,
                gemeindebau: false,
              })
            }
            onGemeindebau={(detected) => onChange({ ...valueRef.current, gemeindebau: detected })}
          />
          <Field label="Bezirk" htmlFor="bezirk">
            <Select
              id="bezirk"
              value={value.bezirk}
              disabled={value.anschriftBezirk != null}
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

        <Field label="Nutzfläche (m²)" htmlFor="flaeche">
          <NumberInput
            id="flaeche"
            min={1}
            step={1}
            value={value.flaeche}
            onChange={(e) => set('flaeche', Math.max(0, Number(e.target.value)))}
          />
        </Field>

        <Checkbox checked={value.eigentumswohnung} onChange={(v) => set('eigentumswohnung', v)} label="Eigentumswohnung" />
        <Checkbox checked={value.befristet} onChange={(v) => set('befristet', v)} label="befristeter Mietvertrag" />
      </Section>

      {/* --- Förderung (inkl. Baubewilligung + MA25) --- */}
      <Section title="Förderung">
        {zeigeBaujahr(value.objektart) && (
          <Field label="Baubewilligung des Gebäudes" htmlFor="baubewilligung">
            <Select
              id="baubewilligung"
              value={value.baubewilligungGebaeude}
              disabled={ma25Offen}
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
              hint='Datensätze laut Unterlage „Förderungen".'
            >
              <Select
                id="foerderung"
                value={value.foerderungProgramm}
                disabled={ma25Offen}
                onChange={(e) => set('foerderungProgramm', e.target.value as MietobjektInput['foerderungProgramm'])}
              >
                {(Object.keys(FOERDERUNG_PROGRAMM_LABEL) as (keyof typeof FOERDERUNG_PROGRAMM_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {FOERDERUNG_PROGRAMM_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>

            {statusRelevant(value.foerderungProgramm) && !ma25Offen && (
              <Field label="Stand der Rückzahlung" htmlFor="tilgung">
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

            {value.foerderungProgramm === 'wwg1948' && !ma25Offen && <WwafHinweis anschrift={value.anschrift} />}

            {/* MA25-Anfrage: Baujahr UND Förderung unbekannt */}
            <div>
              <Checkbox
                checked={ma25Offen}
                onChange={setMa25Offen}
                label="Baujahr und öffentliche Förderung unbekannt? Kostenlos bei der MA 25 anfragen"
              />
              {ma25Offen && <Ma25Anfrage anschrift={value.anschrift} />}
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-500">Bei dieser Objektart ist die Förderung für die Einstufung ohne Bedeutung.</p>
        )}
      </Section>

      {/* --- Ausstattung, Zustand & Zu-/Abschläge --- */}
      {zeigeAusstattung(value.objektart) && (
        <Section title="Ausstattung, Zustand & Zu-/Abschläge">
          {zeigeKategorie(value.objektart) && zeigeKat && (
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

          {!istRichtwert && (
            <p className="rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
              Für diese Wohnung gilt kein Richtwert – daher sind hier keine Zu- und Abschläge anzugeben. Beim freien oder
              angemessenen Mietzins zählt die Marktbandbreite je Bezirk (Ausstattung ist dort bereits im Marktpreis
              enthalten).
            </p>
          )}

          {istRichtwert && (
            <>
          <Field label="Erhaltungszustand des Hauses" htmlFor="zustand">
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

          <Checkbox
            checked={value.heizung === 'zentral_etage'}
            onChange={(v) => set('heizung', v ? 'zentral_etage' : 'keine')}
            label="Zentral- oder Etagenheizung"
          />

          {MERKMAL_GRUPPEN.map((gruppe) => (
            <div key={gruppe} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{gruppe}</p>
              <div className="flex flex-col gap-2">
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
            </>
          )}
        </Section>
      )}
    </div>
  )
}
