# Google Ads: Einrichtung, Keywords, Messung

**Was ich nicht tun kann:** Ein Google-Ads-Konto lässt sich nur mit deinen
Zugangsdaten, deiner Rechnungsanschrift und einem Zahlungsmittel anlegen; die
Anmeldung verlangt außerdem eine Bestätigung per Telefon oder E-Mail. Diesen
Schritt musst du selbst machen. Alles, was danach kommt – Kontostruktur,
Keywords, Anzeigentexte, Messung – steht hier fertig zum Übernehmen.

## Konto anlegen (10 Minuten)

1. ads.google.com öffnen, mit dem Google-Konto anmelden, das später auch für
   die Search Console verwendet wird.
2. Beim Einstieg auf **„Zum Expertenmodus wechseln“** klicken, sonst landet man
   in „Smart“-Kampagnen ohne Keyword-Steuerung.
3. Land Österreich, Währung EUR, Zeitzone Europe/Vienna. Diese drei Angaben
   lassen sich später **nicht** ändern.
4. Rechnungsdaten eintragen (Name, Anschrift, UID falls vorhanden – dann stellt
   Google ohne Umsatzsteuer aus, Reverse Charge).
5. Erste Kampagne pausiert anlegen, damit nichts ungewollt startet.
6. Optional den **Keyword-Planer** freischalten: Er zeigt echte Suchvolumina,
   verlangt aber ein aktives Konto mit mindestens einer laufenden Kampagne;
   ohne Ausgaben zeigt er nur Spannen („100–1.000“).

## Kontostruktur

| Kampagne | Zielseite | Tagesbudget (Vorschlag) |
|---|---|---|
| K1 Richtwert & Mietzins | `/richtwert-wien/` | 10 € |
| K2 Lagezuschlag | `/lagezuschlag-wien/` | 6 € |
| K3 Betriebskosten | `/betriebskosten-pruefen/` | 6 € |
| K4 Mieterhöhung & Wertsicherung | `/mieterhoehung-wertsicherung/` | 8 € |
| K5 Hausverwaltung (B2B) | `/hausverwaltung-mietzinspruefung/` | 12 € |

Je Kampagne zwei bis drei Anzeigengruppen mit eng verwandten Keywords, dazu
passende Anzeigentexte. Standort: Wien plus 30 km, Sprache Deutsch.

## Keywords (Startliste)

**K1** richtwertmietzins wien · richtwert wien 2026 · miete berechnen wien ·
zulässige miete wien · mietzins prüfen wien · altbau miete wien · wie hoch darf
die miete sein · mietzinsobergrenze wien

**K2** lagezuschlag wien · lagezuschlagskarte wien · gründerzeitviertel wien
miete · lagezuschlag berechnen

**K3** betriebskosten prüfen wien · betriebskostenabrechnung falsch ·
betriebskosten mrg · welche betriebskosten sind zulässig

**K4** mieterhöhung 2027 · wertsicherung miete · indexanpassung miete
österreich · mieterhöhung ankündigen

**K5** hausverwaltung software mietzins · mietzinsprüfung bestand ·
mietrecht api · immobilien bewertung schnittstelle

**Auszuschließen** (spart Budget sofort): gratis wohnung, wohnung mieten,
wohnung kaufen, gemeindewohnung, wohnbeihilfe, jobs, ausbildung, mietvertrag
muster kostenlos, anwalt kostenlos.

Match-Typen: mit „Phrase“ starten, „weitgehend passend“ erst nach vier Wochen
und nur mit gepflegter Ausschlussliste.

## Anzeigentexte (responsive Suchanzeigen)

Titel: „Mietzins-Check für Wien“ · „Richtwert, Zuschläge, Bandbreite“ ·
„In einer Minute eingeschätzt“ · „Mit Rechenweg und Fundstellen“ ·
„Kostenlos und ohne Konto“ · „Prüfbericht PRO ab 24 €“

Beschreibungen: „Automatisierte Ersteinschätzung nach MRG: Mietzinsart,
Schutzumfang und Preisbandbreite – mit nachvollziehbarer Herleitung.“ ·
„Für Vermieter:innen, Mieter:innen und Hausverwaltungen. Keine Rechtsauskunft,
aber ein belastbarer erster Überblick.“

Sprachregel auch hier: **Ersteinschätzung**, nie „Gutachten“ oder
„Rechtsberatung“ (siehe `docs/compliance/berufsrecht.md`). Google prüft
Anzeigen im Finanz- und Rechtsumfeld genauer; irreführende Versprechen führen
zur Ablehnung.

## Messung ohne Einwilligungsdialog

Das Conversion-Tracking von Google speichert im Endgerät und braucht deshalb
eine Einwilligung. Solange es keinen Einwilligungsdialog gibt, gilt:

1. Anzeigen ohne Google-Tag schalten, Zielseiten mit `?utm_source=google&
   utm_medium=cpc&utm_campaign=<kampagne>` versehen.
2. Erfolg über die eigene, cookielose Messung beurteilen: Die Ereignisse
   `checkout_gestartet` und `kauf_abgeschlossen` liegen bereits in
   `src/lib/analytics.ts` und lassen sich nach Quelle auswerten.
3. Erst wenn Google-Conversions nötig werden, einen Einwilligungsdialog mit
   Consent Mode v2 ergänzen – dann auch `datenschutz.html` und
   `docs/compliance/cookies-tracking.md` nachziehen.

## Vor dem ersten Euro

Search Console einrichten und die Sitemap `…/wien-miete/sitemap.xml`
einreichen; organische Rankings zeigen, welche Begriffe überhaupt tragen.
Suchvolumina aus dem Keyword-Planer erst danach gegenprüfen – bezahlte Klicks
auf Begriffe, die organisch schon auf Seite 1 stehen, sind Geldverschwendung.
