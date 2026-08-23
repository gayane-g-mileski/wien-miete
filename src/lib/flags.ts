// Schalter für Bereiche, die fertig sind, aber noch nicht gezeigt werden.
//
// Der Code bleibt vollständig erhalten – nur die Wege dorthin verschwinden aus
// der Oberfläche. Auf true gesetzt, ist alles sofort wieder sichtbar; die
// Adresse /api/ muss dann zusätzlich in scripts/prerender.mjs wieder in die
// Liste der vorgerenderten Seiten aufgenommen werden.

/** Schnittstelle (REST) und eingebetteter Rechner im fremden Erscheinungsbild. */
export const API_SICHTBAR = false
