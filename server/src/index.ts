import { cors, fehler, gleich, hash, istEmail, json, tokenBauen, tokenPruefen, zufall, type Umgebung } from './hilfen'
import { checkoutAnlegen, ereignisPruefen, rechnungen, sitzungLesen, type Produkt, type Zahlungsart } from './stripe'
import { evaluateMrg } from '../../src/lib/mrgEngine'
import { alsApiAntwort } from '../../src/lib/api'
import { berechneIndex } from '../../src/lib/wertsicherung'
import { pruefeBetriebskosten } from '../../src/lib/betriebskosten'
import { leereMerkmale } from '../../src/lib/pricingData'
import type { MietobjektInput, MietzinsArt } from '../../src/lib/types'

// Server für Konto, Zahlung und Schnittstelle (Cloudflare Worker).
//
// Bewusst klein gehalten: Anmeldung ohne Passwort über einen Einmal-Link,
// Zahlung über Stripe Checkout, Schnittstelle mit API-Schlüssel und Kontingent.
// Die Rechenlogik ist dieselbe wie in der Oberfläche – sie wird aus src/lib
// eingebunden, damit Ergebnisse nicht auseinanderlaufen.

const ANMELDUNG_GUELTIG_MINUTEN = 15

interface KontoZeile {
  id: string
  email: string
  tarif: string
  firma: string | null
  uid: string | null
  land: string | null
  guthaben_berichte: number
  api_schluessel: string | null
  stripe_kunde: string | null
  laufzeit_bis: string | null
}

function alsKonto(zeile: KontoZeile) {
  return {
    email: zeile.email,
    tarif: zeile.tarif,
    firma: zeile.firma ?? undefined,
    uid: zeile.uid ?? undefined,
    land: zeile.land ?? undefined,
    guthabenBerichte: zeile.guthaben_berichte,
    apiSchluessel: zeile.api_schluessel ?? undefined,
    laufzeitBis: zeile.laufzeit_bis ?? undefined,
  }
}

async function kontoNachEmail(env: Umgebung, email: string): Promise<KontoZeile> {
  const vorhanden = await env.DB.prepare('SELECT * FROM konten WHERE email = ?').bind(email).first<KontoZeile>()
  if (vorhanden) return vorhanden
  const id = zufall(16)
  await env.DB.prepare(
    'INSERT INTO konten (id, email, tarif, guthaben_berichte, erstellt) VALUES (?, ?, ?, 0, ?)',
  )
    .bind(id, email, 'frei', new Date().toISOString())
    .run()
  return (await env.DB.prepare('SELECT * FROM konten WHERE id = ?').bind(id).first<KontoZeile>())!
}

async function angemeldetesKonto(env: Umgebung, anfrage: Request): Promise<KontoZeile | null> {
  const kopf = anfrage.headers.get('Authorization') ?? ''
  const token = kopf.startsWith('Bearer ') ? kopf.slice(7) : ''
  if (!token) return null
  const nutzlast = await tokenPruefen(token, env.SITZUNG_GEHEIMNIS)
  if (!nutzlast || typeof nutzlast.konto !== 'string') return null
  return env.DB.prepare('SELECT * FROM konten WHERE id = ?').bind(nutzlast.konto).first<KontoZeile>()
}

interface Anhang {
  filename: string
  /** Inhalt als Base64 – so nehmen es die gängigen Versanddienste entgegen. */
  content: string
}

async function mailSenden(env: Umgebung, an: string, betreff: string, text: string, anhang?: Anhang): Promise<void> {
  if (!env.MAIL_ENDPUNKT) {
    console.log(`[mail an ${an}] ${betreff}${anhang ? ` (+ ${anhang.filename})` : ''}\n${text}`)
    return
  }
  await fetch(env.MAIL_ENDPUNKT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.MAIL_SCHLUESSEL}` },
    body: JSON.stringify({
      from: env.MAIL_ABSENDER,
      to: [an],
      subject: betreff,
      text,
      ...(anhang ? { attachments: [anhang] } : {}),
    }),
  })
}

/** Objektdaten der Schnittstelle in die Eingabe der Rechenlogik umwandeln. */
function alsEingabe(objekt: Record<string, unknown>): MietobjektInput | string {
  const flaeche = Number(objekt.flaeche)
  if (!Number.isFinite(flaeche) || flaeche <= 0 || flaeche > 2000) return 'flaeche muss zwischen 1 und 2000 liegen'
  const bezirk = Number(objekt.bezirk ?? 7)
  if (!Number.isInteger(bezirk) || bezirk < 1 || bezirk > 23) return 'bezirk muss zwischen 1 und 23 liegen'
  const vertragsdatum = typeof objekt.vertragsdatum === 'string' ? objekt.vertragsdatum : ''
  if (vertragsdatum && !/^\d{4}-\d{2}-\d{2}$/.test(vertragsdatum)) return 'vertragsdatum muss im Format JJJJ-MM-TT stehen'

  return {
    objektart: (objekt.objektart as MietobjektInput['objektart']) ?? 'wohnung',
    baubewilligungGebaeude: (objekt.baubewilligung as MietobjektInput['baubewilligungGebaeude']) ?? 'vor_1945',
    dgAusbauNachStichtag: Boolean(objekt.dachbodenausbau),
    zubauNachStichtag: Boolean(objekt.zubau),
    anschrift: typeof objekt.anschrift === 'string' ? objekt.anschrift.slice(0, 200) : '',
    anschriftBezirk: bezirk,
    anschriftKoords: null,
    gemeindebau: Boolean(objekt.gemeindebau),
    flaeche,
    bezirk,
    eigentumswohnung: Boolean(objekt.eigentumswohnung),
    befristet: Boolean(objekt.befristet),
    vertragsdatum,
    gruenderzeitviertel: (objekt.gruenderzeitviertel as MietobjektInput['gruenderzeitviertel']) ?? 'unbekannt',
    denkmalschutzAufwand: Boolean(objekt.denkmalschutz),
    kriegsschadenWiederaufbau: Boolean(objekt.kriegsschaden),
    foerderungProgramm: (objekt.foerderung as MietobjektInput['foerderungProgramm']) ?? 'keine',
    tilgungsstatus: (objekt.tilgungsstatus as MietobjektInput['tilgungsstatus']) ?? 'offen',
    kategorie: (objekt.kategorie as MietobjektInput['kategorie']) ?? 'A',
    zustandHaus: (objekt.zustand as MietobjektInput['zustandHaus']) ?? 'durchschnittlich',
    heizung: (objekt.heizung as MietobjektInput['heizung']) ?? 'zentral_etage',
    stockwerk: (objekt.stockwerk as MietobjektInput['stockwerk']) ?? 'normal',
    merkmale: leereMerkmale(),
  }
}

/** Schlüssel prüfen, Kontingent zählen. */
async function schluesselPruefen(env: Umgebung, anfrage: Request): Promise<KontoZeile | Response> {
  const kopf = anfrage.headers.get('Authorization') ?? ''
  const schluessel = kopf.startsWith('Bearer ') ? kopf.slice(7) : ''
  if (!schluessel.startsWith('sk_')) return fehler('schluessel_fehlt', 'Kein gültiger API-Schlüssel.', 401)
  const konto = await env.DB.prepare('SELECT * FROM konten WHERE api_schluessel = ?').bind(schluessel).first<KontoZeile>()
  if (!konto) return fehler('schluessel_fehlt', 'Kein gültiger API-Schlüssel.', 401)

  const monat = new Date().toISOString().slice(0, 7)
  const zeile = await env.DB.prepare('SELECT anzahl FROM verbrauch WHERE konto = ? AND monat = ?')
    .bind(konto.id, monat)
    .first<{ anzahl: number }>()
  const bisher = zeile?.anzahl ?? 0
  const grenze = konto.tarif === 'api' ? 2000 : 100
  if (bisher >= grenze) return fehler('kontingent_erschoepft', 'Das Kontingent dieses Monats ist aufgebraucht.', 402)
  await env.DB.prepare(
    'INSERT INTO verbrauch (konto, monat, anzahl) VALUES (?, ?, 1) ON CONFLICT(konto, monat) DO UPDATE SET anzahl = anzahl + 1',
  )
    .bind(konto.id, monat)
    .run()
  return konto
}

async function webhook(anfrage: Request, env: Umgebung): Promise<Response> {
  const koerper = await anfrage.text()
  const signatur = anfrage.headers.get('Stripe-Signature') ?? ''
  if (!(await ereignisPruefen(koerper, signatur, env.STRIPE_WEBHOOK_GEHEIMNIS))) {
    return fehler('signatur_ungueltig', 'Signatur konnte nicht bestätigt werden.', 400)
  }
  const ereignis = JSON.parse(koerper) as { type: string; data: { object: Record<string, unknown> } }
  const gegenstand = ereignis.data.object

  if (ereignis.type === 'checkout.session.completed') {
    const metadaten = (gegenstand.metadata ?? {}) as Record<string, string>
    const kontoId = metadaten.konto
    const produkt = metadaten.produkt as Produkt
    if (!kontoId) return json({ ok: true })

    await env.DB.prepare(
      'INSERT INTO kaeufe (id, konto, produkt, betrag, waehrung, sofort_start, zustimmung_am, stripe_sitzung, erstellt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        zufall(12),
        kontoId,
        produkt,
        Number(gegenstand.amount_total ?? 0),
        String(gegenstand.currency ?? 'eur'),
        metadaten.sofort_start === 'ja' ? 1 : 0,
        metadaten.zustimmung_am ?? new Date().toISOString(),
        String(gegenstand.id ?? ''),
        new Date().toISOString(),
      )
      .run()

    if (produkt === 'bericht') {
      await env.DB.prepare('UPDATE konten SET guthaben_berichte = guthaben_berichte + 1, stripe_kunde = ? WHERE id = ?')
        .bind(String(gegenstand.customer ?? ''), kontoId)
        .run()
    } else {
      const bis = new Date()
      bis.setMonth(bis.getMonth() + 1)
      const schluessel = produkt === 'api' ? `sk_live_${zufall(24)}` : null
      await env.DB.prepare(
        'UPDATE konten SET tarif = ?, laufzeit_bis = ?, stripe_kunde = ?, api_schluessel = COALESCE(api_schluessel, ?) WHERE id = ?',
      )
        .bind(produkt, bis.toISOString(), String(gegenstand.customer ?? ''), schluessel, kontoId)
        .run()
    }
  }

  if (ereignis.type === 'customer.subscription.deleted') {
    await env.DB.prepare("UPDATE konten SET tarif = 'frei', laufzeit_bis = NULL WHERE stripe_kunde = ?")
      .bind(String(gegenstand.customer ?? ''))
      .run()
  }

  return json({ ok: true })
}

export default {
  async fetch(anfrage: Request, env: Umgebung): Promise<Response> {
    const url = new URL(anfrage.url)
    const pfad = url.pathname
    const herkunft = anfrage.headers.get('Origin') ?? ''
    const erlaubt = env.ERLAUBTE_HERKUNFT.split(',').map((h) => h.trim())
    const kopf = cors(erlaubt.includes(herkunft) ? herkunft : erlaubt[0] ?? '')

    if (anfrage.method === 'OPTIONS') return new Response(null, { status: 204, headers: kopf })

    // Stripe meldet Ereignisse ohne Herkunft und mit eigener Signatur.
    if (pfad === '/zahlung/webhook' && anfrage.method === 'POST') return webhook(anfrage, env)

    try {
      // ---- Anmeldung ohne Passwort -------------------------------------
      if (pfad === '/auth/magic-link' && anfrage.method === 'POST') {
        const daten = (await anfrage.json()) as { email?: string; ziel?: string; zweck?: string }
        if (!istEmail(daten.email)) return fehler('eingabe_ungueltig', 'Bitte gib eine gültige E-Mail-Adresse an.', 422, kopf)
        const ziel = typeof daten.ziel === 'string' && erlaubt.some((h) => daten.ziel!.startsWith(h)) ? daten.ziel : erlaubt[0]

        const token = zufall(24)
        const ablauf = new Date(Date.now() + ANMELDUNG_GUELTIG_MINUTEN * 60_000).toISOString()
        await env.DB.prepare('INSERT INTO anmeldungen (token_hash, email, ablauf, verwendet) VALUES (?, ?, ?, 0)')
          .bind(await hash(token), daten.email, ablauf)
          .run()

        const link = `${ziel}?anmeldung=${token}`
        await mailSenden(
          env,
          daten.email,
          'Dein Anmeldelink für den Mietzins-Check',
          `Hallo,\n\nmit diesem Link meldest du dich an – ohne Passwort:\n\n${link}\n\nDer Link gilt ${ANMELDUNG_GUELTIG_MINUTEN} Minuten und lässt sich nur einmal verwenden.\nWenn du dich nicht angemeldet hast, ignoriere diese Nachricht einfach.\n\nMietzins-Check in Wien`,
        )
        return json({ ok: true }, 200, kopf)
      }

      if (pfad === '/auth/sitzung' && anfrage.method === 'POST') {
        const daten = (await anfrage.json()) as { token?: string }
        if (!daten.token) return fehler('eingabe_ungueltig', 'Es fehlt der Anmeldelink.', 422, kopf)
        const gehasht = await hash(daten.token)
        const zeile = await env.DB.prepare('SELECT * FROM anmeldungen WHERE token_hash = ?')
          .bind(gehasht)
          .first<{ token_hash: string; email: string; ablauf: string; verwendet: number }>()
        if (!zeile || zeile.verwendet === 1 || new Date(zeile.ablauf) < new Date() || !gleich(zeile.token_hash, gehasht)) {
          return fehler('anmeldung_abgelaufen', 'Dieser Anmeldelink gilt nicht mehr. Bitte fordere einen neuen an.', 401, kopf)
        }
        await env.DB.prepare('DELETE FROM anmeldungen WHERE token_hash = ?').bind(gehasht).run()

        const konto = await kontoNachEmail(env, zeile.email)
        const sitzung = await tokenBauen({ konto: konto.id }, env.SITZUNG_GEHEIMNIS)
        return json({ sitzung, konto: alsKonto(konto) }, 200, kopf)
      }

      // ---- Konto --------------------------------------------------------
      if (pfad === '/konto') {
        const konto = await angemeldetesKonto(env, anfrage)
        if (!konto) return fehler('nicht_angemeldet', 'Bitte melde dich an.', 401, kopf)

        if (anfrage.method === 'PATCH') {
          const daten = (await anfrage.json()) as { firma?: string; uid?: string; land?: string }
          await env.DB.prepare('UPDATE konten SET firma = ?, uid = ?, land = ? WHERE id = ?')
            .bind((daten.firma ?? '').slice(0, 120), (daten.uid ?? '').slice(0, 20), (daten.land ?? 'AT').slice(0, 2), konto.id)
            .run()
          const neu = await env.DB.prepare('SELECT * FROM konten WHERE id = ?').bind(konto.id).first<KontoZeile>()
          return json(alsKonto(neu!), 200, kopf)
        }
        return json(alsKonto(konto), 200, kopf)
      }

      // ---- Zahlung ------------------------------------------------------
      if (pfad === '/zahlung/checkout' && anfrage.method === 'POST') {
        const daten = (await anfrage.json()) as {
          produkt?: Produkt
          sofortStart?: boolean
          zahlungsart?: Zahlungsart
          name?: string
          email?: string
          erfolg?: string
          abbruch?: string
        }
        if (!daten.produkt || !['bericht', 'profi', 'api'].includes(daten.produkt)) {
          return fehler('eingabe_ungueltig', 'Unbekannte Leistung.', 422, kopf)
        }
        // Gekauft wird auch ohne Anmeldung: Die E-Mail-Adresse aus dem
        // Bestellfenster legt bei Bedarf das Konto an, an das der Kauf hängt.
        let konto = await angemeldetesKonto(env, anfrage)
        if (!konto) {
          if (!istEmail(daten.email)) {
            return fehler('eingabe_ungueltig', 'Bitte gib eine gültige E-Mail-Adresse an.', 422, kopf)
          }
          konto = await kontoNachEmail(env, daten.email)
        }
        const ziel = (wert: string | undefined, ersatz: string) =>
          typeof wert === 'string' && erlaubt.some((h) => wert.startsWith(h)) ? wert : ersatz
        const url = await checkoutAnlegen(env, {
          kontoId: konto.id,
          email: konto.email,
          produkt: daten.produkt,
          sofortStart: Boolean(daten.sofortStart),
          zahlungsart: daten.zahlungsart,
          kaeuferName: (daten.name ?? '').slice(0, 120),
          erfolg: ziel(daten.erfolg, `${erlaubt[0]}?kauf=ok`),
          abbruch: ziel(daten.abbruch, `${erlaubt[0]}?kauf=abbruch`),
        })
        return json({ url }, 200, kopf)
      }

      // Prüfbericht zustellen. Der Bericht entsteht im Browser der Käuferin;
      // verschickt wird er erst, wenn Stripe die Zahlung bestätigt.
      if (pfad === '/bericht/senden' && anfrage.method === 'POST') {
        const daten = (await anfrage.json()) as {
          sitzung?: string
          email?: string
          name?: string
          dateiname?: string
          pdf?: string
        }
        if (!daten.sitzung || !istEmail(daten.email) || !daten.pdf) {
          return fehler('eingabe_ungueltig', 'Angaben unvollständig.', 422, kopf)
        }
        if (daten.pdf.length > 8_000_000) {
          return fehler('eingabe_ungueltig', 'Die Datei ist zu groß.', 422, kopf)
        }
        const sitzung = await sitzungLesen(env, daten.sitzung)
        if (sitzung.payment_status !== 'paid') {
          return fehler('nicht_bezahlt', 'Zu diesem Vorgang liegt keine abgeschlossene Zahlung vor.', 402, kopf)
        }
        await mailSenden(
          env,
          daten.email,
          'Dein Prüfbericht',
          `Hallo${daten.name ? ` ${daten.name}` : ''},\n\nanbei der bestellte Prüfbericht als PDF. Die Rechnung kommt separat vom Zahlungsdienstleister.\n\nDer Bericht ist eine automatisierte Ersteinschätzung – kein Gutachten und keine Rechtsauskunft.\n\nMietzins-Check in Wien`,
          { filename: daten.dateiname ?? 'Pruefbericht.pdf', content: daten.pdf },
        )
        return json({ ok: true }, 200, kopf)
      }

      if (pfad === '/zahlung/rechnungen' && anfrage.method === 'GET') {
        const konto = await angemeldetesKonto(env, anfrage)
        if (!konto) return fehler('nicht_angemeldet', 'Bitte melde dich an.', 401, kopf)
        if (!konto.stripe_kunde) return json([], 200, kopf)
        const liste = await rechnungen(env, konto.stripe_kunde)
        return json(
          liste.map((r) => ({
            nummer: String(r.number ?? ''),
            datum: new Date(Number(r.created ?? 0) * 1000).toISOString().slice(0, 10),
            betrag: `${((Number(r.total ?? 0) / 100).toFixed(2))} €`,
            url: String(r.hosted_invoice_url ?? ''),
          })),
          200,
          kopf,
        )
      }

      // ---- Schnittstelle -------------------------------------------------
      if (pfad.startsWith('/v1/')) {
        const konto = await schluesselPruefen(env, anfrage)
        if (konto instanceof Response) return konto

        if (pfad === '/v1/kontingent') {
          const monat = new Date().toISOString().slice(0, 7)
          const zeile = await env.DB.prepare('SELECT anzahl FROM verbrauch WHERE konto = ? AND monat = ?')
            .bind(konto.id, monat)
            .first<{ anzahl: number }>()
          const grenze = konto.tarif === 'api' ? 2000 : 100
          return json({ monat, verbraucht: zeile?.anzahl ?? 0, grenze }, 200, kopf)
        }

        if (pfad === '/v1/einschaetzung' && anfrage.method === 'POST') {
          const daten = (await anfrage.json()) as Record<string, unknown>
          const eingabe = alsEingabe(daten)
          if (typeof eingabe === 'string') return fehler('eingabe_ungueltig', eingabe, 422, kopf)
          return json(alsApiAntwort(eingabe, evaluateMrg(eingabe)), 200, kopf)
        }

        if (pfad === '/v1/bestand' && anfrage.method === 'POST') {
          const daten = (await anfrage.json()) as { objekte?: Record<string, unknown>[] }
          const objekte = daten.objekte ?? []
          if (!Array.isArray(objekte) || objekte.length === 0 || objekte.length > 500) {
            return fehler('eingabe_ungueltig', 'objekte muss eine Liste mit 1 bis 500 Einträgen sein.', 422, kopf)
          }
          const ergebnisse = objekte.map((o) => {
            const eingabe = alsEingabe(o)
            if (typeof eingabe === 'string') return { fehler: 'eingabe_ungueltig', meldung: eingabe }
            return alsApiAntwort(eingabe, evaluateMrg(eingabe))
          })
          return json({ ergebnisse }, 200, kopf)
        }

        if (pfad === '/v1/wertsicherung' && anfrage.method === 'POST') {
          const daten = (await anfrage.json()) as Record<string, unknown>
          const aktuell = Number(daten.aktuell)
          if (!Number.isFinite(aktuell) || aktuell <= 0) return fehler('eingabe_ungueltig', 'aktuell muss größer als 0 sein.', 422, kopf)
          const arten: MietzinsArt[] = ['richtwert', 'kategorie', 'kategorie_d', 'altvertrag', 'angemessen', 'frei', 'wgg', 'foerderungsrechtlich']
          const art = arten.find((a) => a === daten.mietzinsArt)
          if (!art) return fehler('eingabe_ungueltig', `mietzinsArt muss eine von: ${arten.join(', ')} sein.`, 422, kopf)
          return json(
            berechneIndex({
              mietzinsArt: art,
              aktuell,
              letzteAnpassung: typeof daten.letzteAnpassung === 'string' ? daten.letzteAnpassung : '',
              jahr: Number(daten.jahr) || new Date().getFullYear(),
              indexSteigerung: Number(daten.indexSteigerung) || 0,
              schwelle: Number(daten.schwelle) || 0,
            }),
            200,
            kopf,
          )
        }

        if (pfad === '/v1/betriebskosten' && anfrage.method === 'POST') {
          const daten = (await anfrage.json()) as {
            betraege?: Record<string, number>
            hausflaeche?: number
            wohnungsflaeche?: number
            vorschreibung?: number
          }
          if (!daten.betraege || Object.keys(daten.betraege).length === 0) {
            return fehler('eingabe_ungueltig', 'betraege darf nicht leer sein.', 422, kopf)
          }
          const hausflaeche = Number(daten.hausflaeche)
          const wohnungsflaeche = Number(daten.wohnungsflaeche)
          if (!(hausflaeche > 0) || !(wohnungsflaeche > 0)) {
            return fehler('eingabe_ungueltig', 'hausflaeche und wohnungsflaeche müssen größer als 0 sein.', 422, kopf)
          }
          return json(
            pruefeBetriebskosten({
              betraege: daten.betraege,
              hausflaeche,
              wohnungsflaeche,
              vorschreibung: Number(daten.vorschreibung) || 0,
            }),
            200,
            kopf,
          )
        }

        return fehler('unbekannter_endpunkt', 'Diesen Aufruf gibt es nicht.', 404, kopf)
      }

      return fehler('unbekannter_endpunkt', 'Diesen Aufruf gibt es nicht.', 404, kopf)
    } catch (e) {
      console.error(e)
      return fehler('serverfehler', 'Unerwarteter Fehler. Bitte später noch einmal versuchen.', 500, kopf)
    }
  },
}
