# Kicktipp Deluxe

Bundesliga-Tippspiel für private Freundesrunden – als moderne Web-App mit Echtzeit-Synchronisation, Statistiken und Spieler-Profilen.

---

## Features

- **Tippen** – Ergebnisse für jeden Spieltag vorhersagen, mit optionalem Joker-Einsatz
- **Dashboard** – aktiver Spieltag auf einen Blick: Spiele, Punktetabelle, Bundesliga-Tabelle und Statistiken
- **Spieler-Profile** – persönliche Saison-Stats, Treffer-Verteilung und kumulativer Verlauf
- **Synchronisation** – Spielstände werden automatisch von OpenLigaDB abgerufen (Cronjob oder manuell)
- **Admin-Bereich** – Saisons anlegen, Spieltage verwalten, Ergebnisse korrigieren, Benutzerrollen vergeben
- **Farbzuweisung** – jeder Spieler wählt eine einzigartige Farbe für die Tipp-Übersicht
- **Light / Dark Mode** – richtet sich automatisch nach der Systemeinstellung
- **PWA-fähig** – installierbar auf Mobilgeräten (manifest.json vorhanden)

---

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Sprache | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Datenbank | SQLite via Prisma 7 + libSQL-Adapter |
| Authentifizierung | NextAuth v4 (Credentials) |
| Fonts | Space Grotesk (Display) + Inter Variable (Body) |
| Icons | Tabler Icons |
| Charts | Recharts |
| Externe API | OpenLigaDB (kostenlos, kein API-Key) |

---

## Voraussetzungen

- Node.js 20+
- npm 10+ (oder pnpm / yarn)

---

## Installation

```bash
# 1. Repository klonen
git clone <repo-url>
cd kicktipp-deluxe

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen anlegen
cp .env.example .env
# .env anpassen (siehe unten)

# 4. Datenbank migrieren
npx prisma migrate deploy

# 5. Seed-Daten einspielen (Admin-User + Saison)
npm run db:seed

# 6. Entwicklungsserver starten
npm run dev
```

Die App ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

---

## Umgebungsvariablen

Kopiere `.env.example` nach `.env` und trage die Werte ein:

```env
# Absoluter Pfad zur SQLite-Datenbankdatei
DATABASE_URL=file:./prisma/dev.db

# Beliebiger langer Zufallsstring (z. B. openssl rand -base64 32)
NEXTAUTH_SECRET=dein-geheimes-secret

# Basis-URL der App (lokal oder Produktions-URL)
NEXTAUTH_URL=http://localhost:3000

# Geheimnis für den Cron-Sync-Endpoint (/api/sync)
CRON_SECRET=dein-cron-secret
```

---

## Datenbank

```bash
# Neue Migration erstellen (nach Schema-Änderungen)
npx prisma migrate dev --name beschreibung

# Migrationen in Produktion anwenden
npm run db:migrate

# Prisma Studio (GUI für die Datenbank)
npm run db:studio

# Seed: Admin-Account + aktuelle Saison anlegen
npm run db:seed
```

**Standard-Zugangsdaten nach dem Seed:**

| Feld | Wert |
|---|---|
| E-Mail | admin@kicktipp.local |
| Passwort | changeme123 |
| Rolle | ADMIN |

> Das Passwort bitte nach dem ersten Login im Profil ändern.

---

## Produktions-Build

```bash
npm run build
npm run start
```

---

## Projektstruktur

```
src/
├── app/
│   ├── (app)/              # Authentifizierte Routen
│   │   ├── dashboard/      # Aktiver Spieltag, Tabelle, Statistiken
│   │   ├── tippen/         # Tipp-Eingabe
│   │   ├── profil/         # Profileinstellungen, Farbwahl
│   │   ├── spieler/        # Öffentliche Spieler-Profile
│   │   └── admin/          # Admin-Bereich
│   ├── login/              # Login-Seite
│   └── registrieren/       # Registrierung
├── actions/                # Server Actions (Tipps, Sync, Auth …)
├── components/             # Globale Komponenten (Nav, BottomNav …)
├── lib/                    # Hilfsfunktionen (Prisma, Auth, Punkte …)
└── types/                  # TypeScript-Erweiterungen
prisma/
├── schema.prisma           # Datenbankschema
├── migrations/             # Migrationsverlauf
└── seed.ts                 # Seed-Skript
public/
└── fonts/                  # Inter Variable (lokal eingebunden)
```

---

## Punktesystem

| Tipp-Qualität | Punkte |
|---|---|
| Exaktes Ergebnis (z. B. 2:0 → 2:0) | 4 |
| Richtige Tordifferenz (z. B. 2:0 → 3:1) | 3 |
| Richtige Tendenz (Sieg/Unentschieden/Niederlage) | 2 |
| Falsche Tendenz | 0 |

Mit einem **Joker** werden die erzielten Punkte eines Spiels verdoppelt. Pro Saison steht ein begrenztes Kontingent an Jokern zur Verfügung.

---

## Spielstand-Synchronisation

Spielstände werden über die öffentliche [OpenLigaDB-API](https://www.openligadb.de/) bezogen.

**Manuell** (Admin-Bereich → Spieltage):
- Einzelnen Spieltag synchronisieren

**Automatisch** via HTTP-Cron (z. B. cron-job.org):
```
POST /api/sync
Header: x-cron-secret: <CRON_SECRET>
```

---

## Lizenz

Privates Projekt – kein öffentliches Deployment beabsichtigt.
