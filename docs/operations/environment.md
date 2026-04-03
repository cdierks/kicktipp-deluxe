# Umgebung

## Laufzeitprofil

`kicktipp-deluxe` ist eine serverseitig gerenderte Next.js-Anwendung mit App Router, Prisma 7 und MariaDB/MySQL.

Im Betrieb sind diese Laufzeitbausteine relevant:

- Node.js 20+
- npm 10+
- MariaDB oder MySQL
- NextAuth mit Credentials-Login
- OpenLigaDB als externe Datenquelle für Spielstände und Vereinsdaten

## Pflichtvariablen

Die Anwendung erwartet mindestens diese Umgebungsvariablen:

```env
DATABASE_URL="mysql://user:password@localhost/kicktipp"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.uberspace.de"
CRON_SECRET="generate-with-openssl-rand-base64-32"
```

Quelle: [.env.example](../../.env.example)

## Bedeutung der Variablen

### `DATABASE_URL`

- Pflichtvariable für Prisma und Seed
- erwartet ein MySQL-kompatibles URL-Format
- wird in der Laufzeit explizit in Host, Port, Benutzer, Passwort und Datenbankname zerlegt
- Standardport ist `3306`, falls kein Port in der URL angegeben ist

Beispiel:

```env
DATABASE_URL="mysql://user:password@localhost:3306/kicktipp"
```

### `NEXTAUTH_SECRET`

- Pflichtsecret für NextAuth
- muss lang, zufällig und stabil sein
- ein Wechsel invalidiert bestehende Sessions

### `NEXTAUTH_URL`

- öffentliche Basis-URL der laufenden Instanz
- muss in Produktion auf die echte Domain zeigen
- eine falsche URL führt typischerweise zu fehlerhaften Redirects oder Auth-Problemen

### `CRON_SECRET`

- Shared Secret für `POST /api/sync`
- wird über den Request-Header `x-cron-secret` übergeben
- eine fehlende oder falsche Übergabe führt zu `401 Unauthorized`

## Optionale Seed-Variablen

Das Seed-Skript akzeptiert zusätzlich:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Wenn sie nicht gesetzt sind, werden diese Defaults verwendet:

- E-Mail: `admin@kicktipp.local`
- Passwort: `changeme123`

## Externe Abhängigkeiten

### Datenbank

- lokale oder entfernte MariaDB-/MySQL-Instanz
- für die produktive Uberspace-Installation: MariaDB auf `localhost`, Datenbank `kicktipp`

### OpenLigaDB

- keine API-Credentials nötig
- Ausfall oder Fehler der API betrifft Sync und Vereinsdaten-Aktualisierung

### Prozesslaufzeit

- lokal typischerweise `npm run dev` oder `npm run start`
- in Produktion aktuell `supervisord` mit `next start --port 3000`

## Betriebsgrenzen

Die aktuell dokumentierte Produktionsrealität ist auf Uberspace geprägt durch:

- knappe RAM-Reserven für Server-Builds
- möglich knappe Disk-Quota für doppelte `node_modules`
- bevorzugten lokalen Produktionsbuild mit reduziertem `.next`-Upload

Diese Einschränkungen gelten nicht zwangsläufig für andere Hosts, sind aber für diese Codebasis und das vorhandene Deploy-Verfahren betriebsrelevant.

## Secrets und Ablage

Für die aktuelle Produktion gilt:

- die produktive `.env` liegt auf dem Server unter `~/kicktipp-deluxe/.env`
- neue Releases übernehmen diese Datei beim Upload
- Secrets gehören nicht ins Repository

Beim Self-Hosting gilt derselbe Grundsatz:

- `.env` außerhalb des Versionskontrollflusses pflegen
- vor Deploys sicherstellen, dass die Zielinstanz eine vollständige `.env` besitzt
