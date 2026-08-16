# Als App in den App Store und zu Google Play

Die App ist dieselbe Anwendung wie die Website, verpackt mit
[Capacitor](https://capacitorjs.com/). Der Web-Build wandert dabei in ein
echtes iOS- bzw. Android-Projekt, das sich signieren und hochladen lässt.

```
Quellcode (src/)
   └── npm run build:app      → dist/ (relative Pfade, ohne Service Worker)
         └── npx cap sync     → android/  … Android-Studio-Projekt
                              → ios/      … Xcode-Projekt
```

## Einmalige Voraussetzungen

| | Android | iOS |
|---|---|---|
| Rechner | Windows, macOS oder Linux | **macOS zwingend** |
| Werkzeuge | [Android Studio](https://developer.android.com/studio), JDK 21 | Xcode (aktuelle Version), CocoaPods |
| Konto | Google Play Console, einmalig 25 USD | Apple Developer Program, 99 USD pro Jahr |

## Der übliche Ablauf

```bash
npm install
npm run android     # baut, synchronisiert und öffnet Android Studio
npm run ios         # baut, synchronisiert und öffnet Xcode
```

Nach jeder Code-Änderung genügt `npm run sync:app`, bevor du in Android Studio
oder Xcode neu baust.

## Android: Release bauen

1. **Signaturschlüssel erzeugen** (einmalig, gut aufbewahren – ohne ihn sind
   keine Updates mehr möglich):
   ```bash
   keytool -genkey -v -keystore wien-miete.keystore \
     -alias wienmiete -keyalg RSA -keysize 2048 -validity 10000
   ```
2. `android/keystore.properties` anlegen (steht in `.gitignore`, gehört **nicht**
   ins Repository):
   ```properties
   storeFile=/absoluter/pfad/wien-miete.keystore
   storePassword=…
   keyAlias=wienmiete
   keyPassword=…
   ```
3. In Android Studio: **Build → Generate Signed App Bundle** → `.aab`.
4. Play Console → neue App anlegen → Version hochladen. Erst als *Interner Test*,
   danach Produktion.
5. Vor jedem Update `versionCode` erhöhen und `versionName` anpassen in
   `android/app/build.gradle`.

## iOS: Release bauen

1. In Xcode unter *Signing & Capabilities* dein Developer-Team wählen.
2. Version und Build-Nummer setzen (*General → Identity*).
3. **Product → Archive**, dann **Distribute App → App Store Connect**.
4. In App Store Connect die Version anlegen, Screenshots und Texte eintragen und
   zur Prüfung einreichen.

## Was die Stores zusätzlich brauchen

- **Datenschutzerklärung (Pflicht bei beiden):**
  `https://gayane-g-mileski.github.io/wien-miete/datenschutz.html`
- **Screenshots:** iPhone 6,7″ und 6,5″ (App Store), Telefon und 7″/10″-Tablet
  (Play). Am einfachsten im Simulator/Emulator aufnehmen.
- **Kurzbeschreibung (Play, max. 80 Zeichen):**
  „Ersteinschätzung von Mietzins, MRG-Schutz und Preisbandbreite für Wien.“
- **Datensicherheit (Play) bzw. App-Datenschutz (Apple):** Es werden keine Daten
  zur Identifizierung gesammelt. Anzugeben ist lediglich, dass eingegebene
  Adressen an die Schnittstellen der Stadt Wien und Kontaktnachrichten per
  E-Mail übermittelt werden – beides ausgelöst durch die nutzende Person.
- **Alterseinstufung:** 0+ / „Keine Einschränkung“.
- **Kategorie:** Dienstprogramme bzw. Finanzen.

## Wichtig für die Apple-Prüfung

Apple lehnt Apps ab, die nur eine Website anzeigen (Richtlinie 4.2, *Minimum
Functionality*). Für diese App spricht, dass sie eigenständig rechnet, Ergebnisse
als PDF speichert, einen lokalen Verlauf führt und offline nutzbar ist – das
sollte in der Beschreibung und im Hinweis an die Prüfer:innen auch so stehen.
Ein Satz wie „Die Berechnung läuft vollständig auf dem Gerät; die Schnittstellen
der Stadt Wien werden nur für die Adresssuche verwendet“ hilft.

Der Haftungsausschluss („Kein Rechtsrat“) sollte auch in der Store-Beschreibung
auftauchen, damit die App nicht als Rechtsberatung eingestuft wird.

## Icons und Startbildschirm neu erzeugen

Quelle ist `assets/logo.svg`. Nach einer Änderung:

```bash
npx @capacitor/assets generate \
  --splashBackgroundColor '#f5f1ea' --splashBackgroundColorDark '#17130f' \
  --iconBackgroundColor '#607456' --iconBackgroundColorDark '#607456'
```
