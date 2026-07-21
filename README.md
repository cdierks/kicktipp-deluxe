# Kicktipp Deluxe 5.0.0

Bundesliga-Tippspiel für private Freundesrunden – als moderne Web-App mit Echtzeit-Synchronisation, Statistiken und Spieler-Profilen.

---

## Features

- **Tippen** – Ergebnisse für jeden Spieltag vorhersagen, mit optionalem Joker-Einsatz
- **Dashboard** – aktiver Spieltag auf einen Blick: Spiele, Punktetabelle, Bundesliga-Tabelle und Statistiken
- **Spieler-Profile** – persönliche Saison-Stats, Treffer-Verteilung und kumulativer Verlauf
- **Synchronisation** – Spielstände werden automatisch von OpenLigaDB abgerufen (Cronjob oder manuell)
- **Admin-Bereich** – Saisons anlegen, Spieltage verwalten, Ergebnisse korrigieren, Benutzerrollen vergeben
- **Farbzuweisung** – jeder Spieler wählt eine einzigartige Farbe für die Tipp-Übersicht
- **App-Shell** – Desktop-Sidebar und mobile Liquid-Glass-Bottom-Navigation mit kompaktem Dashboard-Layout
- **Light / Dark / System** – Modus direkt im Kontomenü auswählen
- **PWA-fähig** – mit KD-App-Icon, Safe Areas und Standalone-Manifest auf Mobilgeräten installierbar

---

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Sprache | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Datenbank | MySQL / MariaDB via Prisma 7 |
| Authentifizierung | NextAuth v4 (Credentials) |
| Fonts | Inter 4.1 Variable (lokal eingebunden) |
| Icons | Phosphor Icons |
| Charts | Recharts 3 über shadcn/ui Chart |
| Externe API | OpenLigaDB (kostenlos, kein API-Key) |

---

## Voraussetzungen

- Node.js 20.19+, 22.12+ oder 24+
- npm 10+
- Laufende MySQL- oder MariaDB-Instanz

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

# 4. Datenbank starten und `.env` prüfen
# DATABASE_URL muss auf eine erreichbare MySQL/MariaDB-Datenbank zeigen

# 5. Datenbank migrieren
npm run db:migrate

# 6. Sichere Seed-Zugangsdaten in `.env` setzen und Seed-Daten einspielen
npm run db:seed

# 7. Entwicklungsserver starten
npm run dev
```

Die App ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

Für die Installation als eigenständige App muss die Produktionsinstanz über HTTPS aufgerufen und anschließend über die Browserfunktion „Zum Home-Bildschirm“ beziehungsweise „App installieren“ hinzugefügt werden. Der Standalone-Modus ist bewusst online-first; ein Offline-Cache ist nicht enthalten.

---

## Umgebungsvariablen

Kopiere `.env.example` nach `.env` und trage die Werte ein:

```env
# MySQL/MariaDB-Verbindungsstring
DATABASE_URL="mysql://user:password@localhost:3306/kicktipp_db"

# Mindestens 32 zufällige Bytes (z. B. openssl rand -base64 32)
NEXTAUTH_SECRET=dein-geheimes-secret

# Basis-URL der App (lokal oder Produktions-URL)
NEXTAUTH_URL=http://localhost:3000

# Separates Geheimnis mit mindestens 32 zufälligen Bytes für /api/sync
CRON_SECRET=dein-cron-secret

# Initialer Admin; für den Seed verpflichtend, niemals Standardwerte verwenden
SEED_ADMIN_EMAIL=dein-admin@deine-domain.de
SEED_ADMIN_PASSWORD=ein-einzigartiges-starkes-passwort
```

---

## Datenbank

```bash
# Neue Migration erstellen (nach Schema-Änderungen)
npm exec prisma -- migrate dev --name beschreibung

# Migrationen in Produktion anwenden
npm run db:migrate

# Prisma Studio (GUI für die Datenbank)
npm run db:studio

# Seed: Admin-Account + aktuelle Saison anlegen
npm run db:seed
```

Der Seed legt den initialen Admin ausschließlich mit den explizit gesetzten
`SEED_ADMIN_EMAIL`- und `SEED_ADMIN_PASSWORD`-Werten an. Das Passwort wird
weder im Repository hinterlegt noch in der Konsole ausgegeben.

---

## Produktions-Build

```bash
npm run build
npm run start
```

`npm run build` erzeugt eine eigenständige Next.js-Standalone-Runtime und
kopiert über `postbuild` auch `public` sowie `.next/static` hinein.
`npm run start` startet anschließend `.next/standalone/server.js`; `next start`
und eine geteilte externe `node_modules`-Installation werden nicht verwendet.

Produktive Uberspace-Releases werden reproduzierbar aus einem exakten Commit
in einem Linux-Docker-Container gebaut, mit Metadaten versehen und erst nach
Smoke- sowie Funktionstest freigegeben. Die verbindliche Anleitung inklusive
Backup- und Rollback-Grenzen steht in [DEPLOY.md](DEPLOY.md) und unter
[docs/operations](docs/operations/README.md).

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
├── components/             # shadcn/ui, Sidebar, App-Header, Bottom-Navigation und globale Komponenten
├── lib/                    # Hilfsfunktionen (Prisma, Auth, Punkte …)
└── types/                  # TypeScript-Erweiterungen
prisma/
├── schema.prisma           # Datenbankschema
├── migrations/             # Migrationsverlauf
└── seed.ts                 # Seed-Skript
public/
└── fonts/                  # Inter Variable normal/italic + Lizenz
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

Das separate Secret muss mindestens 32 Zeichen lang sein und wird auf dem
Server längenkonstant verglichen.

---

## Lizenz

Privates Projekt – kein öffentliches Deployment beabsichtigt.
