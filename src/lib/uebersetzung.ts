// Automatische Übersetzung der Oberfläche.
//
// Grundlage ist der eingebaute Übersetzer des Browsers (Chrome/Edge ab Version
// 138, `Translator`). Er läuft lokal auf dem Gerät – es werden keine Texte an
// einen Server geschickt. Übersetzt wird nur die Oberfläche: Texte in Bereichen
// mit translate="no" (z.B. die Anfrage-Texte an Ämter) bleiben unangetastet.

export type Verfuegbarkeit = 'available' | 'downloadable' | 'downloading' | 'unavailable'

interface TranslatorInstanz {
  translate(text: string): Promise<string>
  destroy?(): void
}

interface TranslatorApi {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<Verfuegbarkeit>
  create(o: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorInstanz>
}

export const QUELL_SPRACHE = 'de'

function api(): TranslatorApi | null {
  const t = (globalThis as { Translator?: TranslatorApi }).Translator
  return t && typeof t.availability === 'function' && typeof t.create === 'function' ? t : null
}

export function uebersetzerVorhanden(): boolean {
  return api() !== null
}

/** Sprache des Browsers, z.B. "en". Leerer String, wenn Deutsch eingestellt ist. */
export function browserSprache(): string {
  const roh = (typeof navigator !== 'undefined' && navigator.language) || QUELL_SPRACHE
  const basis = roh.split('-')[0].toLowerCase()
  return basis === QUELL_SPRACHE ? '' : basis
}

export async function verfuegbarkeit(ziel: string): Promise<Verfuegbarkeit> {
  const t = api()
  if (!t || !ziel) return 'unavailable'
  try {
    return await t.availability({ sourceLanguage: QUELL_SPRACHE, targetLanguage: ziel })
  } catch {
    return 'unavailable'
  }
}

// ---------------------------------------------------------------------------
// DOM-Durchlauf
// ---------------------------------------------------------------------------

const TAGS_AUS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'TEXTAREA', 'CODE'])
// Mindestens zwei Buchstaben – reine Zahlen, „€“ oder „—“ brauchen keine Übersetzung.
const HAT_WORT = /\p{L}{2,}/u
const ATTRIBUTE = ['title', 'aria-label', 'placeholder'] as const

type TextKnoten = Text & { __orig?: string; __ziel?: string }

interface AttrEintrag {
  el: Element
  attr: string
  orig: string
}

const textKnoten = new Set<TextKnoten>()
const attrKnoten: AttrEintrag[] = []
const cache = new Map<string, string>()

function erlaubt(start: Element | null): boolean {
  for (let el: Element | null = start; el; el = el.parentElement) {
    if (TAGS_AUS.has(el.tagName.toUpperCase())) return false
    if (el.getAttribute('translate') === 'no') return false
    if (el.classList.contains('notranslate')) return false
  }
  return true
}

function zerlege(roh: string): { pre: string; kern: string; post: string } {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(roh)
  return m ? { pre: m[1], kern: m[2], post: m[3] } : { pre: '', kern: roh, post: '' }
}

function sammleTexte(): TextKnoten[] {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const treffer: TextKnoten[] = []
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as TextKnoten
    if (t.__ziel !== undefined && t.data === t.__ziel) continue // schon übersetzt
    if (!HAT_WORT.test(t.data)) continue
    if (!erlaubt(t.parentElement)) continue
    treffer.push(t)
  }
  return treffer
}

function sammleAttribute(): AttrEintrag[] {
  const treffer: AttrEintrag[] = []
  for (const attr of ATTRIBUTE) {
    for (const el of Array.from(document.body.querySelectorAll(`[${attr}]`))) {
      const wert = el.getAttribute(attr) ?? ''
      if (!HAT_WORT.test(wert)) continue
      if (!erlaubt(el)) continue
      if (cache.get(wert) === wert) continue
      // Bereits übersetzt? Dann steht der aktuelle Wert nicht mehr im Cache-Schlüssel.
      if (attrKnoten.some((a) => a.el === el && a.attr === attr && cache.get(a.orig) === wert)) continue
      treffer.push({ el, attr, orig: wert })
    }
  }
  return treffer
}

// ---------------------------------------------------------------------------
// Übersetzen & Anwenden
// ---------------------------------------------------------------------------

let uebersetzer: TranslatorInstanz | null = null
let aktiveSprache = ''
let beobachter: MutationObserver | null = null
let laeuftGerade = false
let nachlegen = false
let timer: number | null = null

async function fuelleCache(texte: string[]): Promise<void> {
  if (!uebersetzer) return
  const offen = Array.from(new Set(texte)).filter((t) => !cache.has(t))
  const GRUPPE = 8
  for (let i = 0; i < offen.length; i += GRUPPE) {
    const teil = offen.slice(i, i + GRUPPE)
    await Promise.all(
      teil.map(async (text) => {
        try {
          cache.set(text, await uebersetzer!.translate(text))
        } catch {
          cache.set(text, text) // im Fehlerfall Original stehen lassen
        }
      }),
    )
  }
}

async function durchlauf(): Promise<void> {
  if (!uebersetzer) return
  if (laeuftGerade) {
    nachlegen = true
    return
  }
  laeuftGerade = true
  try {
    const knoten = sammleTexte()
    const attrs = sammleAttribute()
    if (knoten.length === 0 && attrs.length === 0) return

    const kerne = knoten.map((t) => zerlege(t.data).kern)
    await fuelleCache([...kerne, ...attrs.map((a) => a.orig)])

    beobachter?.disconnect()
    for (const t of knoten) {
      if (!t.isConnected) continue
      const { pre, kern, post } = zerlege(t.data)
      const uebersetzt = cache.get(kern)
      if (uebersetzt === undefined || uebersetzt === kern) continue
      t.__orig = t.data
      t.__ziel = pre + uebersetzt + post
      t.data = t.__ziel
      textKnoten.add(t)
    }
    for (const a of attrs) {
      if (!a.el.isConnected) continue
      const uebersetzt = cache.get(a.orig)
      if (uebersetzt === undefined || uebersetzt === a.orig) continue
      a.el.setAttribute(a.attr, uebersetzt)
      attrKnoten.push(a)
    }
    beobachter?.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTE],
    })
  } finally {
    laeuftGerade = false
    if (nachlegen) {
      nachlegen = false
      void durchlauf()
    }
  }
}

function planeDurchlauf(): void {
  if (timer !== null) window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    timer = null
    void durchlauf()
  }, 150)
}

/**
 * Übersetzt die Oberfläche in `ziel` und hält sie bei React-Updates aktuell.
 * Gibt `false` zurück, wenn der Browser keinen Übersetzer für diese Sprache hat.
 */
export async function uebersetzeOberflaeche(ziel: string): Promise<boolean> {
  const t = api()
  if (!t || !ziel || ziel === QUELL_SPRACHE) return false
  if (aktiveSprache === ziel && uebersetzer) return true

  try {
    uebersetzer = await t.create({ sourceLanguage: QUELL_SPRACHE, targetLanguage: ziel })
  } catch {
    uebersetzer = null
    return false
  }
  aktiveSprache = ziel
  cache.clear()

  beobachter = new MutationObserver(planeDurchlauf)
  await durchlauf()
  beobachter.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTE],
    })
  document.documentElement.lang = ziel
  return true
}

/** Stellt den deutschen Originaltext wieder her. */
export function zeigeOriginal(): void {
  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
  beobachter?.disconnect()
  beobachter = null

  for (const t of textKnoten) {
    if (t.isConnected && t.__orig !== undefined) t.data = t.__orig
    delete t.__orig
    delete t.__ziel
  }
  textKnoten.clear()

  for (const a of attrKnoten) {
    if (a.el.isConnected) a.el.setAttribute(a.attr, a.orig)
  }
  attrKnoten.length = 0

  uebersetzer?.destroy?.()
  uebersetzer = null
  aktiveSprache = ''
  cache.clear()
  document.documentElement.lang = QUELL_SPRACHE
}
