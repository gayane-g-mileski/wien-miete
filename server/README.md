# Server: Konto, Zahlung, Schnittstelle

Cloudflare Worker mit D1-Datenbank. Er beantwortet die Aufrufe, die die
Oberfläche und die öffentliche Schnittstelle brauchen. Die Rechenlogik wird aus
`src/lib` eingebunden – es gibt sie also nur einmal.

## Was er kann

| Aufruf | Zweck |
|---|---|
| `POST /auth/magic-link` | Anmeldelink an eine E-Mail-Adresse schicken (gültig 15 Minuten, einmal verwendbar) |
| `POST /auth/sitzung` | Link gegen ein Sitzungstoken tauschen (JWT, HS256, 30 Tage) |
| `GET/PATCH /konto` | Kontostand lesen, Rechnungsangaben ändern |
| `POST /zahlung/checkout` | Stripe-Bezahlseite anlegen (Einmalkauf oder Abonnement) |
| `POST /zahlung/webhook` | Stripe-Ereignisse verarbeiten, Freischaltung, Kaufnachweis |
| `GET /zahlung/rechnungen` | Belege aus Stripe auflisten |
| `POST /v1/einschaetzung`, `/v1/bestand`, `/v1/wertsicherung`, `/v1/betriebskosten` | Schnittstelle mit API-Schlüssel |
| `GET /v1/kontingent` | verbrauchte und verbleibende Abfragen |

## Einrichten

```bash
cd server
npm i -g wrangler                       # falls noch nicht vorhanden
npx wrangler d1 create mietzins         # Kennung in wrangler.toml eintragen
npx wrangler d1 execute mietzins --file=schema.sql
```

Geheimnisse setzen:

```bash
npx wrangler secret put SITZUNG_GEHEIMNIS        # langer Zufallswert
npx wrangler secret put STRIPE_SCHLUESSEL        # sk_live_… bzw. sk_test_…
npx wrangler secret put STRIPE_WEBHOOK_GEHEIMNIS # whsec_…
npx wrangler secret put STRIPE_PREIS_BERICHT     # price_… (24,00 € einmalig)
npx wrangler secret put STRIPE_PREIS_PROFI       # price_… (49,00 € monatlich)
npx wrangler secret put STRIPE_PREIS_API         # price_… (149,00 € monatlich)
npx wrangler secret put MAIL_SCHLUESSEL          # Schlüssel des Mail-Anbieters
npx wrangler deploy
```

`MAIL_ENDPUNKT` in `wrangler.toml` auf die Sende-Adresse des Mail-Anbieters
setzen (erwartet wird ein JSON-Aufruf mit `from`, `to`, `subject`, `text` und
einem Bearer-Token). Bleibt der Wert leer, wird der Anmeldelink nur ins
Protokoll geschrieben – praktisch für den Testbetrieb.

In Stripe anlegen: drei Preise (einmalig 24,00 €, monatlich 49,00 €, monatlich
149,00 €, jeweils inklusive Umsatzsteuer), automatische Steuerberechnung
aktivieren, Rechnungsvorlage mit den Merkmalen des § 11 UStG hinterlegen und
einen Webhook auf `https://…/zahlung/webhook` für die Ereignisse
`checkout.session.completed` und `customer.subscription.deleted` einrichten.

## Oberfläche verbinden

In der Anwendung `VITE_API_BASIS` auf die Adresse des Workers setzen, zum
Beispiel in `.env.production`:

```
VITE_API_BASIS=https://mietzins-check-api.<konto>.workers.dev
```

Ohne diese Variable läuft die Anwendung im Vorschau-Betrieb: Der Rechner bleibt
vollständig nutzbar, kostenpflichtige Schritte führen sichtbar auf die
Warteliste statt eine Anmeldung vorzutäuschen.

## Datenschutz

Gespeichert werden nur E-Mail-Adresse, Rechnungsangaben, Käufe und der
Verbrauch der Schnittstelle. Anmeldelinks liegen ausschließlich als Hash vor und
werden beim Einlösen gelöscht. Zahlungsdaten liegen bei Stripe, nicht hier.
Fristen und Löschläufe stehen in `docs/compliance/loeschkonzept.md`.
