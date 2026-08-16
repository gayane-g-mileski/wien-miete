import { chromium } from 'playwright-core'
import fs from 'node:fs'

const U = 'http://localhost:4309/wien-miete/'

// Geräteformate der Stores (Pixel, Hochformat)
const GERAETE = [
  { id: 'iphone-6.9', w: 1320, h: 2868, dsf: 3, mobil: true }, // iPhone 16 Pro Max
  { id: 'iphone-6.5', w: 1242, h: 2688, dsf: 3, mobil: true }, // iPhone 11 Pro Max
  { id: 'ipad-13', w: 2064, h: 2752, dsf: 2, mobil: false }, // iPad Pro 13"
  { id: 'android-phone', w: 1080, h: 1920, dsf: 3, mobil: true },
  { id: 'android-tablet-10', w: 1600, h: 2560, dsf: 2, mobil: false },
]

const EINGABE = {
  objektart: 'wohnung', baubewilligungGebaeude: 'vor_1945', dgAusbauNachStichtag: true, zubauNachStichtag: true,
  anschrift: '', anschriftBezirk: null, anschriftKoords: null, gemeindebau: false, flaeche: 82, bezirk: 6,
  eigentumswohnung: false, befristet: false, foerderungProgramm: 'keine', tilgungsstatus: 'offen', kategorie: 'A',
  zustandHaus: 'gut', heizung: 'zentral_etage', stockwerk: 'normal', merkmale: {},
}

/** Scrollt so, dass das gesuchte Element oben im Bild steht (mit etwas Luft). */
async function nachOben(p, marke, luft = 24) {
  await p.evaluate(
    ([ziel, abstand]) => {
      const ueberschrift = (tag, text) =>
        [...document.querySelectorAll(tag)].find((e) => e.textContent.trim() === text)
      const el =
        ziel === 'anfrage'
          ? document.querySelector('#wwaf-text')?.closest('.rounded-xl')
          : ziel === 'verlauf'
            ? ueberschrift('h3', 'Verlauf')
            : ueberschrift('h2', ziel === 'ergebnis' ? 'Ergebnis' : 'Mietobjekt')
      if (!el) return
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - abstand, behavior: 'instant' })
    },
    [marke, luft],
  )
}

const SZENEN = [
  { id: '1-start', schema: 'light', vorbereiten: async () => {} },
  {
    id: '2-eingabe',
    schema: 'light',
    vorbereiten: async (p) => nachOben(p, 'mietobjekt'),
  },
  {
    id: '3-ergebnis',
    schema: 'light',
    vorbereiten: async (p) => {
      const chevron = p.getByRole('button', { name: 'Erklärung anzeigen' })
      if (await chevron.count()) await chevron.first().click()
      await p.waitForTimeout(200)
      await nachOben(p, 'ergebnis')
    },
  },
  {
    id: '4-anfrage',
    schema: 'light',
    vorbereiten: async (p) => {
      await p.selectOption('#baubewilligung', '1945_1953')
      await p.waitForTimeout(250)
      await p.selectOption('#foerderung', 'wwg1948')
      await p.waitForTimeout(250)
      const cb = p.getByText('Stand der Rückzahlung unbekannt', { exact: false }).first()
      if (await cb.count()) await cb.click()
      await p.waitForTimeout(400)
      await nachOben(p, 'anfrage', 90)
    },
  },
  {
    id: '5-verlauf',
    schema: 'light',
    vorbereiten: async (p) => nachOben(p, 'verlauf'),
  },
  {
    id: '6-dunkel',
    schema: 'dark',
    vorbereiten: async (p) => nachOben(p, 'ergebnis'),
  },
]

fs.mkdirSync('store/screenshots', { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

for (const g of GERAETE) {
  for (const szene of SZENEN) {
    const ctx = await browser.newContext({
      viewport: { width: Math.round(g.w / g.dsf), height: Math.round(g.h / g.dsf) },
      deviceScaleFactor: g.dsf,
      isMobile: g.mobil,
      hasTouch: g.mobil,
      colorScheme: szene.schema,
      locale: 'de-AT',
    })
    await ctx.addInitScript((eingabe) => {
      localStorage.setItem(
        'wien-miete:verlauf',
        JSON.stringify([
          { adresse: 'Fillgradergasse 13, 1060 Wien', ts: 3, input: { ...eingabe, anschrift: 'Fillgradergasse 13, 1060 Wien', bezirk: 6 } },
          { adresse: 'Praterstraße 24, 1020 Wien', ts: 2, input: { ...eingabe, anschrift: 'Praterstraße 24, 1020 Wien', bezirk: 2, flaeche: 64 } },
          { adresse: 'Löblichgasse 13, 1090 Wien', ts: 1, input: { ...eingabe, anschrift: 'Löblichgasse 13, 1090 Wien', bezirk: 9, flaeche: 110 } },
        ]),
      )
    }, EINGABE)
    const p = await ctx.newPage()
    await p.goto(U, { waitUntil: 'networkidle' })
    await p.waitForTimeout(500)
    await szene.vorbereiten(p)
    await p.waitForTimeout(400)
    await p.screenshot({ path: `store/screenshots/${g.id}_${szene.id}.png` })
    await ctx.close()
  }
  console.log('fertig:', g.id)
}
await browser.close()
