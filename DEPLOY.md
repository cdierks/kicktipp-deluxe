# Deploy auf Uberspace

Diese Datei ist die operative Quelle fuer produktive Releases auf `kicktipp.schultypografie.de`.
Der Standardpfad wird lokal aus dem Repository heraus ueber `scripts/deploy/*.sh` ausgefuehrt.

## Zielsystem

- Uberspace-User: `kicktipp`
- SSH-Host: `regulus.uberspace.de`
- Produktive Domain: `https://kicktipp.schultypografie.de`
- Produktiver App-Pfad: `/home/kicktipp/kicktipp-deluxe`
- Release-Basis: `/home/kicktipp/releases`
- Aktiver `supervisord`-Service: `kicktipp`
- Backend-Zuordnung: `kicktipp.schultypografie.de/ http:3000`
- Datenbank: MariaDB auf `localhost`, Datenbankname `kicktipp`

## Standardpfad

Der verbindliche Produktionspfad ist:

`Check -> Release anlegen -> lokalen Standalone-Build hochladen -> Runtime validieren -> optional migrieren -> umschalten -> Smoke-Checks -> expliziter Cleanup`

Alles davon wird lokal angestossen. Ein Server-Build ist nicht der Standard.

## Warum dieser Pfad der Standard ist

- `npm ci` kann auf Uberspace wegen Speicherlimits mit `Killed` enden.
- Der robuste Weg auf diesem Host ist deshalb:
  - Quellstand ohne `.next`, `.env` und `node_modules` hochladen
  - Produktionsbuild lokal erzeugen
  - den Standalone-Output plus `.next/static` hochladen
  - Release direkt aus seinem eigenen Runtime-Artefakt starten
  - danach per `supervisorctl` umschalten

## Pflicht vor jedem Deploy

Vor jedem produktiven Eingriff:

1. Pflicht-Backups anlegen
2. Ausgangszustand pruefen
3. erst danach den Standardpfad ausfuehren

Backups bleiben bewusst ein separater manueller Schritt. Ohne App-Backup und DB-Backup kein Deploy.

```bash
ssh kicktipp@regulus.uberspace.de

ts=$(date +%Y%m%d-%H%M%S)
mkdir -p ~/backups

tar -czf ~/backups/kicktipp-app-$ts.tar.gz -C /home/kicktipp kicktipp-deluxe
mysqldump --single-transaction --quick --default-character-set=utf8mb4 --databases kicktipp | gzip > ~/backups/kicktipp-db-$ts.sql.gz

ls -lh ~/backups/kicktipp-app-$ts.tar.gz ~/backups/kicktipp-db-$ts.sql.gz
```

## Deploy-Skripte

Alle Skripte laden dieselben Defaults aus `scripts/deploy/config.sh`:

- `DEPLOY_USER=kicktipp`
- `DEPLOY_HOST=regulus.uberspace.de`
- `APP_DIR=/home/kicktipp/kicktipp-deluxe`
- `RELEASES_DIR=/home/kicktipp/releases`
- `SERVICE_NAME=kicktipp`
- `DOMAIN=https://kicktipp.schultypografie.de`
- `LOCAL_PORT=3000`

Gemeinsame Optionen:

```bash
--host <host>
--user <user>
--app-dir <path>
--releases-dir <path>
--service <name>
--domain <url>
--local-port <port>
```

Verfuegbare Einstiegspunkte:

- `scripts/deploy/check.sh`
- `scripts/deploy/create-release.sh`
- `scripts/deploy/upload-build.sh`
- `scripts/deploy/link-runtime.sh`
- `scripts/deploy/switch.sh`
- `scripts/deploy/verify-smoke.sh`
- `scripts/deploy/verify-functional.sh`
- `scripts/deploy/cleanup.sh`
- `scripts/deploy/run.sh`

## Standard-Deploy ausfuehren

### Ohne Migration

```bash
bash scripts/deploy/run.sh
```

### Mit Produktionsmigration

```bash
bash scripts/deploy/run.sh --migrate
```

Optional kann ein fester Release-Name vorgegeben werden:

```bash
bash scripts/deploy/run.sh --release-name kicktipp-20260403-153810
```

`run.sh` fuehrt in genau dieser Reihenfolge aus:

1. `check.sh`
2. `create-release.sh`
3. `upload-build.sh`
4. `link-runtime.sh`
5. `switch.sh` mit optionalem `--migrate`
6. `verify-smoke.sh`
7. `verify-functional.sh`

Cleanup ist absichtlich **nicht** automatisch Teil von `run.sh`. Nach erfolgreicher Verifikation wird explizit entschieden, welche Altlasten entfernt werden duerfen.

## Einzelschritte

### 1. Hostzustand pruefen

```bash
bash scripts/deploy/check.sh
```

Prueft lokal benoetigte Werkzeuge und remote unter anderem:

- `supervisorctl status`
- `uberspace web backend list`
- `node -v`
- `npm -v`
- `mysql --version`
- `~/etc/services.d/kicktipp.ini`
- `git status --short` im aktiven App-Pfad

### 2. Neues Release anlegen

```bash
bash scripts/deploy/create-release.sh
```

Legt ein Release unter `~/releases/kicktipp-YYYYMMDD-HHMMSS` an, laedt den Quellstand ohne `.git`, `.env`, `.next`, `node_modules` und `tsconfig.tsbuildinfo` hoch und kopiert die produktive `.env` in den neuen Release.

Die Ausgabe endet mit dem erzeugten Release-Pfad.

### 3. Lokalen Build hochladen

```bash
bash scripts/deploy/upload-build.sh --release /home/kicktipp/releases/kicktipp-<timestamp>
```

Fuehrt lokal `npm run build` aus und laedt danach den Standalone-Runtime-Output in den Release:

- `server.js`
- `node_modules/` aus `.next/standalone`
- `.next/` aus `.next/standalone`
- `.next/static`

Die produktive `.env` bleibt die serverseitige Release-`.env` aus `create-release.sh`. Die lokale `.next/standalone/.env` wird nicht uebernommen.

### 4. Standalone-Runtime validieren

```bash
bash scripts/deploy/link-runtime.sh --release /home/kicktipp/releases/kicktipp-<timestamp>
```

Der Schritt verlinkt nichts mehr. Er prueft nur, dass der Release bereits eine vollstaendige Standalone-Runtime enthaelt.

Wichtig:

- der Standardpfad braucht keine externe produktive `node_modules`-Basis mehr
- `server.js`, das Standalone-`node_modules` und `.next/static` muessen im Release vorhanden sein

### 5. Aktives Release umschalten

Ohne Migration:

```bash
bash scripts/deploy/switch.sh --release /home/kicktipp/releases/kicktipp-<timestamp>
```

Mit Migration:

```bash
bash scripts/deploy/switch.sh --release /home/kicktipp/releases/kicktipp-<timestamp> --migrate
```

Mit `--migrate` wird im neuen Release genau einmal `npm run db:migrate` vor dem Umschalten ausgefuehrt.

Beim Umschalten:

- `supervisorctl stop kicktipp`
- aktiver Symlink wird nach `kicktipp-deluxe-predeploy-<timestamp>` verschoben
- `~/kicktipp-deluxe` zeigt auf den neuen Release
- Dienst wird neu gestartet

### 6. Verbindliche Smoke-Checks

```bash
bash scripts/deploy/verify-smoke.sh
```

Erwartet:

- `http://127.0.0.1:3000/login` -> `200`
- `https://kicktipp.schultypografie.de/login` -> `200`
- `https://kicktipp.schultypografie.de/api/auth/signin` -> kein `500`
- `https://kicktipp.schultypografie.de/dashboard` ohne Session -> `307`
- `supervisorctl status kicktipp` -> `RUNNING`

Wenn einer dieser Checks fehlschlaegt, ist der Deploy nicht erfolgreich. Es gibt keinen automatischen Cleanup und keinen automatischen Rollback.

### 7. Funktionale Verifikation

```bash
bash scripts/deploy/verify-functional.sh
```

Der Schritt prueft nach dem technischen Start die realen Nutzungspfade:

- Redirect auf geschuetzter Route ohne Session
- Login ueber den echten NextAuth-Credentials-Flow
- Session-Erstellung ueber `/api/auth/session`
- authentifizierter Zugriff auf `/dashboard`
- authentifizierter Zugriff auf `/tippen`
- authentifizierter Zugriff auf eine Admin-Route
- eine reversible produktive Schreibpruefung auf App-Daten
- Sign-out inklusive Session-Abbau

Defaults:

- ohne `VERIFY_LOGIN_EMAIL` und `VERIFY_LOGIN_PASSWORD` erzeugt das Skript automatisch einen temporaeren Admin-Benutzer, meldet sich damit an und raeumt ihn am Ende wieder auf
- mit `VERIFY_LOGIN_EMAIL` und `VERIFY_LOGIN_PASSWORD` nutzt das Skript explizit diese Zugangsdaten
- Admin-Route: `/admin/benutzer`
- Tipp-Route: `/tippen`

Schreibpruefung:

- bevorzugt wird ein reversibler Tipp-Schreibtest auf einem aktiven Spiel
- falls kein aktiver Spieltag vorhanden ist, faellt der Check kontrolliert auf einen reversiblen `AppSetting`-Write zurueck

Wenn die funktionale Verifikation fehlschlaegt, gilt der Deploy als fehlgeschlagen. Cleanup bleibt aus, damit ein manueller Rollback moeglich bleibt.

### 7. Expliziter Cleanup

Retention-Regel:

- mindestens 3 Releases insgesamt behalten
- mindestens 1 funktionierenden `kicktipp-deluxe-predeploy-*`-Fallback behalten
- mindestens 3 App-Backups behalten
- mindestens 5 DB-Backups behalten

Schutzregeln von `cleanup.sh`:

- loescht nur explizit angegebene Pfade
- loescht niemals den aktiven Release
- loescht niemals den juengsten funktionierenden Predeploy-Link
- loescht niemals das Release-Ziel dieses juengsten funktionierenden Predeploy-Links
- bricht ab, wenn die Retention-Regel durch die ausgewaehlten Loeschungen verletzt wuerde

Beispiele:

```bash
bash scripts/deploy/cleanup.sh \
  --release /home/kicktipp/releases/kicktipp-<old-1> \
  --release /home/kicktipp/releases/kicktipp-<old-2> \
  --predeploy /home/kicktipp/kicktipp-deluxe-predeploy-<timestamp> \
  --app-backup /home/kicktipp/backups/kicktipp-app-<old>.tar.gz
```

```bash
bash scripts/deploy/cleanup.sh --npm-cache
```

Vor dem Loeschen immer pruefen:

- ist der Release aktuell nicht aktiv
- ist das Predeploy-Ziel kein benoetigter Rollback-Kandidat mehr
- bleibt mindestens ein sinnvoller Rueckfallstand erhalten

## Rollback

Vorherigen Stand ermitteln:

```bash
ls -d ~/kicktipp-deluxe-predeploy-*
ls -lh ~/backups
```

App-Rollback:

```bash
ssh kicktipp@regulus.uberspace.de

old=/home/kicktipp/kicktipp-deluxe-predeploy-<timestamp>

supervisorctl stop kicktipp
rm ~/kicktipp-deluxe
ln -s "$old" ~/kicktipp-deluxe
supervisorctl start kicktipp
sleep 5
supervisorctl status kicktipp
```

DB-Rollback:

```bash
ssh kicktipp@regulus.uberspace.de

gzip -dc ~/backups/kicktipp-db-<timestamp>.sql.gz | mysql kicktipp
```

DB-Rollback nur verwenden, wenn wirklich Daten- oder Migrationsprobleme vorliegen.

## Bekannte Ausnahmen ausserhalb des Standardpfads

### Server-Build nur als Notfall

Nur wenn ausreichend RAM und Disk-Quota frei sind:

```bash
ssh kicktipp@regulus.uberspace.de

rel=/home/kicktipp/releases/kicktipp-<timestamp>

rm -rf "$rel/node_modules"
cp -a ~/kicktipp-deluxe/node_modules "$rel/"

cd "$rel"
npm run build
npm run db:migrate
```

Wenn `npm ci` oder `npm run build` mit `Killed` endet, ist das typischerweise ein Host-Limit und kein normaler Produktionspfad.

### Historischer Prisma-Hotfix aus dem Altmodell

Der manuelle Prisma-Runtime-Link aus AP1 war ein Befund des alten `.next + externes node_modules`-Modells. Im neuen Standalone-Standard ist dieser Eingriff kein regulaerer Deploy-Schritt mehr.

## Nützliche Pfade

- Service-Datei: `/home/kicktipp/etc/services.d/kicktipp.ini`
- Produktive `.env`: `/home/kicktipp/kicktipp-deluxe/.env`
- Release-Ordner: `/home/kicktipp/releases/`
- Backups: `/home/kicktipp/backups/`
- npm-Cache: `/home/kicktipp/.npm`
