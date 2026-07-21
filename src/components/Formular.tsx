import type { MietobjektInput } from '../lib/types'
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
import { BEZIRKE, bezirkAusAnschrift, getBezirk } from '../lib/pricingData'

interface Props {
  value: MietobjektInput
  onChange: (next: MietobjektInput) => void
}

const fieldLabel = 'block text-sm font-medium text-ink mb-1.5'
const controlBase =
  'w-full rounded-lg border border-sand-line bg-cream-50 px-3 py-2 text-sm text-ink shadow-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/40'
const hint = 'mt-1 text-xs text-ink-faint'
const checkbox = 'h-4 w-4 rounded border-sand-line bg-cream-50 text-sage focus:ring-sage/40'
const checkLabel = 'flex items-center gap-2 text-sm text-ink'

function Section({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={`space-y-4 rounded-xl border border-sand-line bg-cream-100 p-4 sm:p-5 ${className}`}>
      <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-wine">{title}</legend>
      {children}
    </fieldset>
  )
}

export function Formular({ value, onChange }: Props) {
  const set = <K extends keyof MietobjektInput>(key: K, v: MietobjektInput[K]) => onChange({ ...value, [key]: v })

  const bezirkAusAdresse = bezirkAusAnschrift(value.anschrift)
  const bezirk = getBezirk(bezirkAusAdresse ?? value.bezirk)

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Section title="Angaben zum Mietobjekt">
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
          <label className={checkLabel}>
            <input
              type="checkbox"
              className={checkbox}
              checked={value.dgAusbauNachStichtag}
              onChange={(e) => set('dgAusbauNachStichtag', e.target.checked)}
            />
            Baubewilligung/Mietvertrag nach dem 31.12.2001
          </label>
        )}

        {value.objektart === 'zubau' && (
          <label className={checkLabel}>
            <input
              type="checkbox"
              className={checkbox}
              checked={value.zubauNachStichtag}
              onChange={(e) => set('zubauNachStichtag', e.target.checked)}
            />
            Baubewilligung nach dem 30.9.2006
          </label>
        )}

        <div>
          <label className={fieldLabel} htmlFor="anschrift">
            Anschrift <span className="font-normal text-ink-faint">(optional)</span>
          </label>
          <input
            id="anschrift"
            type="text"
            className={controlBase}
            placeholder="z.B. Lindengasse 12, 1070 Wien"
            value={value.anschrift}
            onChange={(e) => set('anschrift', e.target.value)}
          />
          <p className={hint}>
            {bezirkAusAdresse
              ? `Erkannt: ${bezirkAusAdresse}. Bezirk (${bezirk.name}) – Lagezuschlag wird geschätzt.`
              : 'Für die Lagezuschlag-Schätzung. Ohne Anschrift wird die Lage nicht berücksichtigt.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              Bezirk (Marktpreis)
            </label>
            <select
              id="bezirk"
              className={controlBase}
              value={value.bezirk}
              onChange={(e) => set('bezirk', Number(e.target.value))}
              disabled={bezirkAusAdresse != null}
            >
              {BEZIRKE.map((b) => (
                <option key={b.nr} value={b.nr}>
                  {b.nr}. {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className={checkLabel}>
            <input
              type="checkbox"
              className={checkbox}
              checked={value.eigentumswohnung}
              onChange={(e) => set('eigentumswohnung', e.target.checked)}
            />
            Eigentumswohnung
          </label>
          <label className={checkLabel}>
            <input
              type="checkbox"
              className={checkbox}
              checked={value.befristet}
              onChange={(e) => set('befristet', e.target.checked)}
            />
            befristeter Mietvertrag
          </label>
        </div>
      </Section>

      <Section title="Förderung">
        {zeigeFoerderung(value.objektart) ? (
          <>
            <div>
              <label className={fieldLabel} htmlFor="foerderung">
                Öffentliche Wohnbauförderung
              </label>
              <select
                id="foerderung"
                className={controlBase}
                value={value.foerderungProgramm}
                onChange={(e) => set('foerderungProgramm', e.target.value as MietobjektInput['foerderungProgramm'])}
              >
                {(Object.keys(FOERDERUNG_PROGRAMM_LABEL) as (keyof typeof FOERDERUNG_PROGRAMM_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {FOERDERUNG_PROGRAMM_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>

            {statusRelevant(value.foerderungProgramm) && (
              <div>
                <label className={fieldLabel} htmlFor="tilgung">
                  Tilgungsstatus des Förderungsdarlehens
                </label>
                <select
                  id="tilgung"
                  className={controlBase}
                  value={value.tilgungsstatus}
                  onChange={(e) => set('tilgungsstatus', e.target.value as MietobjektInput['tilgungsstatus'])}
                >
                  {(Object.keys(TILGUNGSSTATUS_LABEL) as (keyof typeof TILGUNGSSTATUS_LABEL)[]).map((k) => (
                    <option key={k} value={k}>
                      {TILGUNGSSTATUS_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className={hint}>
              Datensätze laut Unterlage „Förderungen" (WWG 1948, WFG 1954/1968/1984, WWFSG 1989, gemeinnützige
              Bauvereinigung).
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-soft">Bei dieser Objektart ist die Förderung für die Einstufung ohne Bedeutung.</p>
        )}
      </Section>

      {zeigeAusstattung(value.objektart) && (
        <Section title="Ausstattung, Zustand & Zu-/Abschläge" className="md:col-span-2">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="zustand">
                Erhaltungszustand des Hauses
              </label>
              <select
                id="zustand"
                className={controlBase}
                value={value.zustandHaus}
                onChange={(e) => set('zustandHaus', e.target.value as MietobjektInput['zustandHaus'])}
              >
                {(Object.keys(ZUSTAND_HAUS_LABEL) as (keyof typeof ZUSTAND_HAUS_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {ZUSTAND_HAUS_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabel} htmlFor="stockwerk">
                Geschoss
              </label>
              <select
                id="stockwerk"
                className={controlBase}
                value={value.stockwerk}
                onChange={(e) => set('stockwerk', e.target.value as MietobjektInput['stockwerk'])}
              >
                {(Object.keys(STOCKWERK_LABEL) as (keyof typeof STOCKWERK_LABEL)[]).map((k) => (
                  <option key={k} value={k}>
                    {STOCKWERK_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="heizung">
              Heizung
            </label>
            <select
              id="heizung"
              className={controlBase}
              value={value.heizung}
              onChange={(e) => set('heizung', e.target.value as MietobjektInput['heizung'])}
            >
              {(Object.keys(HEIZUNG_LABEL) as (keyof typeof HEIZUNG_LABEL)[]).map((k) => (
                <option key={k} value={k}>
                  {HEIZUNG_LABEL[k]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ['lift', 'Lift im Haus'],
                ['balkonTerrasse', 'Balkon/Terrasse/Loggia'],
                ['garten', 'Eigengarten'],
                ['ruhelage', 'Besonders ruhige Lage'],
                ['ausblick', 'Guter Ausblick'],
                ['hochwertigeAusstattung', 'Hochwertige Ausstattung'],
                ['keller', 'Keller/Kellerabteil'],
                ['garage', 'Garage/Stellplatz'],
                ['gemeinschaft', 'Gemeinschaftseinrichtungen'],
                ['strassenlaerm', 'Straßenlärm/laute Lage (Abschlag)'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className={checkLabel}>
                <input
                  type="checkbox"
                  className={checkbox}
                  checked={value[key] as boolean}
                  onChange={(e) => set(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
