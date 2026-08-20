# Cookies, Speicherung im Endgerät und Messung

Maßgeblich ist nicht, ob etwas „Cookie“ heißt, sondern ob im Endgerät
**gespeichert oder ausgelesen** wird. § 165 Abs 3 TKG 2021 (Umsetzung von
Art. 5 Abs 3 ePrivacy-Richtlinie) verlangt dafür grundsätzlich eine
Einwilligung – mit Ausnahme dessen, was für einen ausdrücklich gewünschten
Dienst unbedingt erforderlich ist.

## Was im Endgerät gespeichert wird

| Eintrag | Zweck | Einwilligung nötig? |
|---|---|---|
| `wien-miete:verlauf` | zuletzt geprüfte Objekte | nein – ausdrücklich gewünschte Funktion |
| `wien-miete:thema` | helles oder dunkles Design | nein – Voreinstellung der nutzenden Person |
| `wien-miete:sitzung-token` | Anmeldung am Konto | nein – für den Dienst erforderlich |
| `wien-miete:analytik-aus` | Widerspruch gegen die Messung | nein – dient dem Widerspruch selbst |
| `wien-miete:sitzung` (nur bei PostHog) | Kennung für die Sitzung | **ja** – nicht erforderlich für den Dienst |

## Zwei Wege für die Messung

**Plausible (auch selbst gehostet) oder Umami.** Speichert nichts im Endgerät;
gezählt wird serverseitig ohne dauerhafte Kennung. Für diesen Weg ist nach
herrschender Ansicht keine Einwilligung nötig, weil weder gespeichert noch
ausgelesen wird. Rechtsgrundlage für die Verarbeitung der Zugriffsdaten:
Art. 6 Abs 1 lit f DSGVO. Das ist der empfohlene Weg – dann entfällt das Banner.

**PostHog EU.** Verwendet in der hier eingebauten Fassung `sessionStorage` für
eine Sitzungskennung. Das ist ein Zugriff auf das Endgerät, der nicht
erforderlich ist; er braucht daher eine Einwilligung und damit ein Banner mit
echter Wahlmöglichkeit (ablehnen so einfach wie zustimmen, keine Vorauswahl).

**Entscheidung.** Solange keine Produktkennzahlen je Sitzung nötig sind, wird
Plausible eingesetzt und auf ein Banner verzichtet. Wird PostHog aktiviert, ist
vorher ein Einwilligungsdialog zu ergänzen. Der Code liest beide Wege aus
Umgebungsvariablen und ist ohne Konfiguration vollständig inaktiv
(`src/lib/analytics.ts`).

## Unabhängig davon eingebaut

„Do Not Track“ wird beachtet. Ein Widerspruch lässt sich dauerhaft setzen. Es
werden keine Werbe-Kennungen, keine Wiedererkennung über Geräte hinweg und
keine Weitergabe an Werbenetze eingesetzt.

## Google Ads

Anzeigen führen Klicks auf die Seite; die Erfolgsmessung von Google (Conversion
Tracking, Remarketing) speichert im Endgerät und braucht deshalb eine
Einwilligung sowie den Einwilligungsmodus (Consent Mode). Solange kein
Einwilligungsdialog besteht, werden Anzeigen ohne Google-Messung geschaltet und
der Erfolg über die eigene, cookielose Messung beurteilt
(siehe `docs/marketing/google-ads.md`).
