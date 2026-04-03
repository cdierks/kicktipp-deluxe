# Datenbank

## Datenbanktechnologie

Die Anwendung verwendet Prisma 7 mit dem MariaDB-Adapter und einer MySQL-kompatiblen Datenbank.

Die Prisma-Initialisierung zerlegt `DATABASE_URL` in:

- Host
- Port
- Benutzer
- Passwort
- Datenbankname

Wenn kein Port angegeben ist, wird `3306` verwendet.

## Produktive Erwartung

Für die aktuell dokumentierte Uberspace-Instanz gilt:

- Datenbankserver: `localhost`
- Datenbankname: `kicktipp`

## Produktionsmigrationen

Das für Produktion vorgesehene Kommando ist:

```bash
npm run db:migrate
```

Dieses Skript führt intern aus:

```bash
npx prisma migrate deploy
```

Für produktive Systeme gilt:

- Migrationen nur mit bekanntem Release-Stand ausführen
- vor Migrationen App- und DB-Backup anlegen
- nach Migrationen sofort Verifikation fahren

## Entwicklung gegen die Datenbank

Für lokale Schemaentwicklung ist dokumentiert:

```bash
npx prisma migrate dev --name beschreibung
```

Das ist kein Produktionskommando.

## Seed-Verhalten

Das Seed-Skript ist idempotent für zentrale Initialdaten.

Es erzeugt oder pflegt:

- einen Admin-Benutzer, falls noch keiner mit der konfigurierten E-Mail existiert
- eine Standard-Farbpalette
- eine Saison für das aktuelle Kalenderjahr mit `active: true`, falls sie noch nicht existiert
- die App-Einstellung `registrationEnabled=true`

Standardwerte ohne Seed-Overrides:

- Admin-E-Mail: `admin@kicktipp.local`
- Admin-Passwort: `changeme123`
- Admin-Nickname: `admin`

Nach Erstinstallation muss dieses Passwort geändert werden.

## Datenmodell mit Betriebsrelevanz

### `User`

- enthält Logins, Rollen und Profilattribute
- Rollenwerte: `USER`, `ADMIN`
- ohne funktionierende `User`-Tabelle kein Login

### `Season`

- pro Jahr genau ein `year`-Wert
- `active` markiert die aktuelle Spielsaison

### `Matchday`

- eindeutige Kombination aus `seasonId` und `matchdayNumber`
- `status` beschreibt den Betriebszustand eines Spieltags
- `tippDeadline` ist fachlich kritisch für die Tippabgabe
- `syncedAt` zeigt den letzten erfolgreichen Sync

### `Match`

- `openligaMatchId` ist eindeutig
- Spielstände und Status werden mit OpenLigaDB abgeglichen

### `Tip`

- eindeutige Kombination aus `userId` und `matchId`
- Punkte können `null` sein, bis sie berechnet wurden

### `AppSetting`

- enthält Schalter für Anwendungsverhalten
- aktuell relevant: `registrationEnabled`

## Operative Prüfpunkte

- ist `DATABASE_URL` korrekt und erreichbar
- ist die erwartete Datenbank ausgewählt
- passen Schema und laufendes Release zusammen
- existiert mindestens ein Admin-Zugang
- ist genau eine Saison fachlich aktiv

## Prisma Studio

Für manuelle Dateninspektion steht lokal zur Verfügung:

```bash
npm run db:studio
```

Im produktiven Betrieb ist direkte Datenbearbeitung über Studio nur mit Vorsicht sinnvoll. Bevorzugt werden reproduzierbare Migrationen, Admin-Funktionen oder klar dokumentierte SQL-Eingriffe.
