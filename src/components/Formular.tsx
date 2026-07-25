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
import { FOERDERUNG_PROGRAMM_LABEL, TILGUNGSSTATUS_LABEL, foerderungenFuer, statusRelevant } from '../lib/foerderung'
import { BEZIRKE, MERKMAL_GRUPPEN, MERKMAL_KATALOG, bezirkAusAnschrift } from '../lib/pricingData'
import { Checkbox, NumberField, Section, SelectField } from './ui'
import { AnschriftFeld } from './AnschriftFeld'
import { Ma25Anfrage } from './Ma25Anfrage'
import { WwafHinweis } from './WwafHinweis'

interface Props {
  value: MietobjektInput
  onChange: (next: MietobjektInput) => void
  mietzinsArt: MietzinsArt
}

export function Formular({ value, onChange, mietzinsArt }: Props) {
  const [ma25Offen, setMa25Offen] = useState(false)
  const [rueckzahlungUnbekannt, setRueckzahlungUnbekannt] = useState(false)
  const [anschriftFehler, setAnschriftFehler] = useState(false)
  const valueRef = useRef(value)
  valueRef.current = value

  const istRichtwert = mietzinsArt === 'richtwert'
  const zeigeKat = istRichtwert || mietzinsArt === 'kategorie_d'
  // Bezirk aus der Anschrift (gewählte Adresse oder erkannte PLZ)
  const bezirkErkannt = value.anschriftBezirk ?? bezirkAusAnschrift(value.anschrift)

  const set = <K extends keyof MietobjektInput>(key: K, v: MietobjektInput[K]) => onChange({ ...value, [key]: v })
  const setMerkmal = (key: MerkmalKey, v: boolean) => onChange({ ...value, merkmale: { ...value.merkmale, [key]: v } })

  return (
    <div className="flex flex-col gap-5">
      {/* --- Angaben zum Mietobjekt --- */}
      <Section title="Angaben zum Mietobjekt">
        <SelectField
          label="Art des Mietgegenstands"
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
        </SelectField>

        {/* Bezirk links, Anschrift rechts + gemeinsamer Hinweis */}
        <div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_2fr]">
            <SelectField
              label="Bezirk"
              id="bezirk"
              value={bezirkErkannt ?? value.bezirk}
              disabled={bezirkErkannt != null}
              onChange={(e) => set('bezirk', Number(e.target.value))}
            >
              {BEZIRKE.map((b) => (
                <option key={b.nr} value={b.nr}>
                  {b.nr}. {b.name}
                </option>
              ))}
            </SelectField>
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
              onBaujahr={(periode) => {
                const erlaubt = foerderungenFuer(periode)
                const prog = erlaubt.includes(valueRef.current.foerderungProgramm)
                  ? valueRef.current.foerderungProgramm
                  : 'keine'
                onChange({ ...valueRef.current, baubewilligungGebaeude: periode, foerderungProgramm: prog })
              }}
              onFehlerChange={setAnschriftFehler}
            />
          </div>
          <p className="mt-1 px-1 text-[12px] text-neutral-500">
            {anschriftFehler
              ? 'Adresssuche gerade nicht erreichbar – du kannst die Adresse trotzdem eintippen (mit Wiener PLZ wird die Lage erkannt).'
              : 'Nach dem 3. Zeichen erscheinen Vorschläge. Ohne Anschrift wird die Lage nicht berücksichtigt.'}
          </p>
        </div>

        <NumberField
          label="Nutzfläche (m²)"
          id="flaeche"
          min={1}
          step={1}
          value={value.flaeche}
          onChange={(e) => set('flaeche', Math.max(0, Number(e.target.value)))}
        />

        <div className="space-y-2">
          <Checkbox checked={value.eigentumswohnung} onChange={(v) => set('eigentumswohnung', v)} label="Eigentumswohnung" />
          {istRichtwert && (
            <Checkbox checked={value.befristet} onChange={(v) => set('befristet', v)} label="Befristeter Mietvertrag" />
          )}
        </div>
      </Section>

      {/* --- Förderung (inkl. Baubewilligung + MA25) --- */}
      <Section title="Förderung">
        {zeigeBaujahr(value.objektart) && (
          <SelectField
            label="Baubewilligung des Gebäudes"
            id="baubewilligung"
            value={value.baubewilligungGebaeude}
            disabled={ma25Offen}
            onChange={(e) => {
              const b = e.target.value as MietobjektInput['baubewilligungGebaeude']
              const erlaubt = foerderungenFuer(b)
              const prog = erlaubt.includes(value.foerderungProgramm) ? value.foerderungProgramm : 'keine'
              onChange({ ...value, baubewilligungGebaeude: b, foerderungProgramm: prog })
            }}
          >
            {(Object.keys(BAUBEWILLIGUNG_LABEL) as (keyof typeof BAUBEWILLIGUNG_LABEL)[]).map((k) => (
              <option key={k} value={k}>
                {BAUBEWILLIGUNG_LABEL[k]}
              </option>
            ))}
          </SelectField>
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
            {value.baubewilligungGebaeude === 'vor_1945' ? (
              <p className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
                Bei einem Altbau (Baubewilligung bis 8.5.1945) ist die öffentliche Förderung für die Einstufung ohne
                Bedeutung.
              </p>
            ) : (
              <>
                <SelectField
                  label="Öffentliche Wohnbauförderung"
                  id="foerderung"
                  hint='Datensätze laut Unterlage „Förderungen".'
                  value={value.foerderungProgramm}
                  disabled={ma25Offen}
                  onChange={(e) => set('foerderungProgramm', e.target.value as MietobjektInput['foerderungProgramm'])}
                >
                  {foerderungenFuer(value.baubewilligungGebaeude).map((k) => (
                    <option key={k} value={k}>
                      {FOERDERUNG_PROGRAMM_LABEL[k]}
                    </option>
                  ))}
                </SelectField>

                {/* Stand der Rückzahlung: Dropdown sofort sichtbar (wenn relevant) */}
                {statusRelevant(value.foerderungProgramm) && !ma25Offen && (
              <>
                <SelectField
                  label="Stand der Rückzahlung"
                  id="tilgung"
                  value={value.tilgungsstatus}
                  disabled={rueckzahlungUnbekannt}
                  onChange={(e) => set('tilgungsstatus', e.target.value as MietobjektInput['tilgungsstatus'])}
                >
                  {(Object.keys(TILGUNGSSTATUS_LABEL) as (keyof typeof TILGUNGSSTATUS_LABEL)[]).map((k) => (
                    <option key={k} value={k}>
                      {TILGUNGSSTATUS_LABEL[k]}
                    </option>
                  ))}
                </SelectField>

                {/* Nur der unbekannte Status: Anfrage beim Bundeswohnbaufonds */}
                {value.foerderungProgramm === 'wwg1948' && (
                  <div>
                    <Checkbox
                      checked={rueckzahlungUnbekannt}
                      onChange={setRueckzahlungUnbekannt}
                      label="Stand der Rückzahlung unbekannt? Beim Bundeswohnbaufonds anfragen"
                    />
                    {rueckzahlungUnbekannt && (
                      <div className="mt-5">
                        <WwafHinweis anschrift={value.anschrift} />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
              </>
            )}

            {/* MA25-Anfrage: Baujahr UND Förderung unbekannt */}
            <div>
              <Checkbox
                checked={ma25Offen}
                onChange={setMa25Offen}
                label="Baujahr und öffentliche Förderung unbekannt? Kostenlos bei der MA 25 anfragen"
              />
              {ma25Offen && (
                <div className="mt-5">
                  <Ma25Anfrage anschrift={value.anschrift} />
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-base text-neutral-500">Bei dieser Objektart ist die Förderung für die Einstufung ohne Bedeutung.</p>
        )}
      </Section>

      {/* --- Ausstattung, Zustand & Zu-/Abschläge --- */}
      {zeigeAusstattung(value.objektart) && (
        <Section title="Ausstattung, Zustand & Zu-/Abschläge">
          {zeigeKategorie(value.objektart) && zeigeKat && (
            <SelectField
              label="Ausstattungskategorie"
              id="kategorie"
              value={value.kategorie}
              onChange={(e) => set('kategorie', e.target.value as MietobjektInput['kategorie'])}
            >
              {(Object.keys(KATEGORIE_LABEL) as (keyof typeof KATEGORIE_LABEL)[]).map((k) => (
                <option key={k} value={k}>
                  {KATEGORIE_LABEL[k]}
                </option>
              ))}
            </SelectField>
          )}

          {!istRichtwert && (
            <p className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
              Für diese Wohnung gilt kein Richtwert – daher sind hier keine Zu- und Abschläge anzugeben. Beim freien oder
              angemessenen Mietzins zählt die Marktbandbreite je Bezirk (Ausstattung ist dort bereits im Marktpreis
              enthalten).
            </p>
          )}

          {istRichtwert && (
            <>
              <SelectField
                label="Erhaltungszustand des Hauses"
                id="zustand"
                value={value.zustandHaus}
                onChange={(e) => set('zustandHaus', e.target.value as MietobjektInput['zustandHaus'])}
              >
                {(Object.keys(ZUSTAND_HAUS_LABEL) as (keyof typeof ZUSTAND_HAUS_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {ZUSTAND_HAUS_LABEL[k]}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Geschoss"
                id="stockwerk"
                value={value.stockwerk}
                onChange={(e) => set('stockwerk', e.target.value as MietobjektInput['stockwerk'])}
              >
                {(Object.keys(STOCKWERK_LABEL) as (keyof typeof STOCKWERK_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {STOCKWERK_LABEL[k]}
                  </option>
                ))}
              </SelectField>

              <Checkbox
                checked={value.heizung === 'zentral_etage'}
                onChange={(v) => set('heizung', v ? 'zentral_etage' : 'keine')}
                label="Zentral- oder Etagenheizung"
              />

              {MERKMAL_GRUPPEN.map((gruppe) => (
                <div key={gruppe} className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{gruppe}</p>
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
