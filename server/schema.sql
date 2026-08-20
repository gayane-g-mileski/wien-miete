-- Datenbank des Servers (Cloudflare D1). Bewusst wenige Tabellen: Konten,
-- Einmal-Anmeldungen, Käufe und der Verbrauch der Schnittstelle.
--
--   npx wrangler d1 execute mietzins --file=schema.sql

CREATE TABLE IF NOT EXISTS konten (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  tarif TEXT NOT NULL DEFAULT 'frei',
  firma TEXT,
  uid TEXT,
  land TEXT,
  guthaben_berichte INTEGER NOT NULL DEFAULT 0,
  api_schluessel TEXT UNIQUE,
  stripe_kunde TEXT,
  laufzeit_bis TEXT,
  erstellt TEXT NOT NULL
);

-- Anmeldelinks: gespeichert wird nur der Hash, gültig 15 Minuten, einmal
-- verwendbar. Der Eintrag wird beim Einlösen gelöscht (Löschkonzept).
CREATE TABLE IF NOT EXISTS anmeldungen (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ablauf TEXT NOT NULL,
  verwendet INTEGER NOT NULL DEFAULT 0
);

-- Käufe samt Nachweis der Zustimmung zum sofortigen Beginn (§ 18 Abs 1 Z 11
-- FAGG). Aufbewahrung nach § 132 BAO.
CREATE TABLE IF NOT EXISTS kaeufe (
  id TEXT PRIMARY KEY,
  konto TEXT NOT NULL REFERENCES konten(id),
  produkt TEXT NOT NULL,
  betrag INTEGER NOT NULL,
  waehrung TEXT NOT NULL,
  sofort_start INTEGER NOT NULL,
  zustimmung_am TEXT NOT NULL,
  stripe_sitzung TEXT,
  erstellt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verbrauch (
  konto TEXT NOT NULL REFERENCES konten(id),
  monat TEXT NOT NULL,
  anzahl INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (konto, monat)
);

CREATE INDEX IF NOT EXISTS anmeldungen_ablauf ON anmeldungen(ablauf);
CREATE INDEX IF NOT EXISTS kaeufe_konto ON kaeufe(konto);
