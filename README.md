# Mietzins-Check in Wien

Web-App für Vermieter:innen, Mieter:innen und Immobilienfachleute in Wien.
Anhand weniger Angaben zum Mietobjekt liefert sie eine automatisierte
Ersteinschätzung zu:

1. **Mietzinsart** – Richtwertmietzins, Kategoriemietzins, Kategorie-D-Hauptmietzins,
   angemessener Hauptmietzins, freier Mietzins, WGG- oder förderungsrechtlicher
   Hauptmietzins
2. **MRG-Anwendungsbereich** – Vollanwendung, Teilanwendung oder Vollausnahme,
   samt Kündigungs- und Preisschutz
3. **Preisbandbreite** – geschätzte €/m²- und Gesamt-Monatsmiete (netto), mit
   Herleitung, Fundstellen und drei Blickwinkeln (Judikatur, Schlichtungsstelle,
   Markt)

Dazu kommen Rechner für Wertsicherung, Betriebskosten (§ 21 MRG) und die Rendite
von Vorsorgewohnungen sowie ein Portfolio-Überblick mit CSV-Import.

## Wichtiger Hinweis

Dieses Werkzeug ersetzt keine Rechtsberatung. Es liefert eine vereinfachte,
automatisierte Ersteinschätzung auf Basis öffentlich zugänglicher Informationen
und hinterlegter Näherungswerte – kein Gutachten und keine Rechtsauskunft. Für
verbindliche Auskünfte im Einzelfall sind Schlichtungsstelle, Mietervereinigung,
Arbeiterkammer, Rechtsanwält:innen oder Sachverständige zuständig.

## Aufbau

| Ordner | Inhalt |
|---|---|
| `src/` | Oberfläche und Rechenlogik (React, TypeScript, Tailwind) |
| `src/inhalte/seiten.json` | Inhalte der Ratgeberseiten (Quelle für Oberfläche und Pre-Rendering) |
| `server/` | Cloudflare Worker: Konto, Zahlung (Stripe), öffentliche Schnittstelle |
| `scripts/prerender.mjs` | erzeugt fertiges HTML je Seite, Sitemap, robots.txt, Vorschaubild |
| `public/` | Rechtstexte (Impressum, Datenschutz, AGB, Rücktritt, Auftragsverarbeitung) |
| `docs/compliance/` | Datenschutz, Verbraucherrecht, Steuern, Berufsrecht, Haftung |
| `docs/marketing/` | Google Ads: Konto, Keywords, Messung |

## Entwicklung

```bash
npm install
npm run dev            # Entwicklungsserver
npm run build          # Produktions-Build nach dist/
npm run prerender      # HTML je Seite, Sitemap, robots.txt, og-Bild
npm run build:seiten   # beides hintereinander
npm run lint           # oxlint
```

Tech-Stack: React 19, TypeScript, Vite, Tailwind CSS v4. Ausgeliefert wird
statisch (GitHub Pages) unter `/wien-miete/`; für eine eigene Domain lässt sich
der Pfad über `BASIS_PFAD=/ npm run build` ändern.

## Konto, Zahlung und Schnittstelle

Ohne gesetzte Serveradresse läuft die Anwendung im Vorschau-Betrieb: Der Rechner
ist vollständig nutzbar, kostenpflichtige Schritte führen sichtbar auf die
Warteliste. Mit `VITE_API_BASIS` wird der Server aus `server/` eingebunden –
Anmeldung ohne Passwort (Magic-Link), Kauf über Stripe, Schnittstelle mit
API-Schlüssel. Einrichtung: `server/README.md`.

Der eingebettete Rechner (White-Label) liegt unter `embed.html` und übernimmt
Name, Farbe, Logo und Kontaktadresse aus der Adresse; den fertigen
iframe-Schnipsel erzeugt die Seite `/api/`.

## Reichweitenmessung

Ohne Cookies, abschaltbar, standardmäßig inaktiv. Aktiviert wird sie über
`VITE_PLAUSIBLE_DOMAIN` (empfohlen, ohne Speicherung im Endgerät) oder
`VITE_POSTHOG_KEY` mit `VITE_POSTHOG_HOST` (EU). Zur Einwilligungsfrage siehe
`docs/compliance/cookies-tracking.md`.
