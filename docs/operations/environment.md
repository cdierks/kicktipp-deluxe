# Umgebung

## Laufzeitprofil

Kicktipp Deluxe 5.0.0 ist eine serverseitig gerenderte Next.js-App mit App
Router, Prisma 7, NextAuth und MariaDB/MySQL.

Erforderlich sind:

- Node.js `^20.19.0`, `^22.12.0` oder `>=24.0.0`;
- npm 10 oder neuer;
- MariaDB beziehungsweise MySQL;
- Docker für reproduzierbare Linux-Produktionsbuilds;
- OpenLigaDB als externe Quelle für Spielstände und Clubdaten.

## Pflichtvariablen

```env
DATABASE_URL="mysql://user:password@localhost:3306/kicktipp"
NEXTAUTH_SECRET="mindestens-32-zufaellige-zeichen"
NEXTAUTH_URL="https://kicktipp.example.org"
CRON_SECRET="anderes-mindestens-32-zeichen-secret"
```

Quelle: [.env.example](../../.env.example)

Die zentrale Laufzeitvalidierung verlangt:

- eine vollständige MySQL-URL mit Host, Benutzer und Datenbankname;
- eine absolute HTTP(S)-URL für NextAuth;
- HTTPS für jeden öffentlichen Produktionshost;
- voneinander unabhängige, mindestens 32 Zeichen lange Secrets.

Für `localhost`, Loopback, private IPv4-Netze, Link-Local und private IPv6-Ziele
darf eine bewusst lokal betriebene Standalone-Instanz auch im
Produktionsmodus HTTP verwenden. Diese Ausnahme gilt nicht für öffentlich
erreichbare Domains.

`CRON_SECRET` wird für `POST /api/sync` benötigt. Der Header
`x-cron-secret` wird längenkonstant verglichen; Platzhalter oder zu kurze Werte
sind unzulässig.

## Seed-Variablen

Nur für `npm run db:seed` werden zusätzlich benötigt:

```env
SEED_ADMIN_EMAIL="admin@example.org"
SEED_ADMIN_PASSWORD="ein-einzigartiges-starkes-passwort"
```

Es gibt keine Default-Zugangsdaten. Beispielwerte, fehlende Werte und
Passwörter außerhalb der zulässigen Länge führen zum Abbruch.

## Entwicklungs- und Produktionsstart

Lokal:

```bash
npm run dev
```

Ein Produktionsbuild erzeugt eine selbstständige Next.js-Runtime. `postbuild`
kopiert `public` und `.next/static` in den Standalone-Baum; `npm run start`
startet anschließend:

```text
node .next/standalone/server.js
```

Im produktiven Release liegt derselbe Entrypoint als `<release>/server.js`.
Der Server wird nicht mit `next start` und nicht aus einer geteilten externen
`node_modules`-Installation betrieben.

## Supervisor-Laufzeit

Die versionierte Service-Datei setzt:

```text
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
TZ=Europe/Berlin
```

`HOSTNAME` bindet den Standalone-Server ausschließlich an Loopback; der
öffentliche Zugriff läuft über das konfigurierte Uberspace-Backend. `TZ` macht
serverseitige Bundesliga-Datumsgrenzen deterministisch. Fachliche Formatter
sollen die Zeitzone dennoch explizit angeben, wenn Daten außerhalb dieses
Prozesses verarbeitet werden.

`check.sh` vergleicht die produktive Service-Datei exakt mit der versionierten
Konfiguration und verweigert einen Deploy bei Abweichungen.

## Secrets und Dateirechte

- Secrets niemals committen, loggen oder in Build-Metadaten schreiben.
- Die produktive `.env` liegt serverseitig im aktiven Release.
- `create-release.sh` kopiert sie serverseitig in den neuen Release und setzt
  Modus `600`.
- `link-runtime.sh` verweigert Releases mit abweichendem `.env`-Modus.
- Die lokale `.env` wird nur für den Container-Build benötigt und nicht aus dem
  Standalone-Artefakt hochgeladen.
- Backup-Archive enthalten die produktive `.env` und benötigen deshalb
  denselben Zugriffsschutz wie Secrets.

## Externe Abhängigkeiten und Grenzen

### Datenbank

Die dokumentierte Produktion nutzt MariaDB auf `localhost`, Datenbank
`kicktipp`. Ein Verbindungsfehler trifft Login, Server Actions und
Synchronisation unmittelbar.

### OpenLigaDB

Für OpenLigaDB ist kein API-Key erforderlich. Ein Ausfall beeinträchtigt die
Ergebnis-Synchronisation, nicht den Zugriff auf bereits gespeicherte Daten.

### Uberspace

Der Host hat begrenzte Build-Ressourcen. Deshalb ist ausschließlich der lokale
Docker-Build mit Upload des eigenständigen Linux-Standalone-Artefakts
dokumentiert. Ein Build auf dem Produktionshost ist kein unterstützter
Fallback.
