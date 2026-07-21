# Mietzins-Check Wien

Responsive Web-App (installierbar als PWA auf Desktop und Mobilgerät) für Vermieter:innen
und Immobilien-Anleger:innen in Wien. Anhand weniger Angaben zum Mietobjekt liefert das Tool
eine automatisierte Ersteinschätzung zu:

1. **Mietzinsart** – Richtwertmietzins, Kategorie-D-Hauptmietzins, angemessener Hauptmietzins,
   freier Mietzins, WGG-/Kategoriemietzins oder förderungsrechtlicher Hauptmietzins
2. **MRG-Anwendungsbereich** – Vollanwendung, Teilanwendung (Teilausnahme) oder Vollausnahme
   des Mietrechtsgesetzes (MRG), inkl. Kündigungs- und Preisschutz
3. **Preisbandbreite** – geschätzte €/m²- und Gesamt-Monatsmiete (netto)

Die Entscheidungslogik (`src/lib/mrgEngine.ts`) bildet die Prüfreihenfolge
Vollausnahme → Teilausnahme → Vollanwendung des MRG ab (§ 1, § 16 MRG u.a.). Die
Preisnäherung basiert auf dem aktuellen Richtwert Wien, Kategoriebeträgen sowie
hinterlegten, manuell überschreibbaren Bezirks-Marktmieten.

## Wichtiger Hinweis

Dieses Tool ersetzt keine Rechtsberatung. Es handelt sich um eine vereinfachte,
automatisierte Ersteinschätzung auf Basis öffentlich zugänglicher Informationen
(MRG, RIS, mietervereinigung.at). Für verbindliche Auskünfte im Einzelfall sind
Mietervereinigung, Rechtsanwält:in oder Sachverständige zu konsultieren.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build (dist/)
npm run lint     # oxlint
```

Tech-Stack: React + TypeScript + Vite, Tailwind CSS v4, vite-plugin-pwa.
