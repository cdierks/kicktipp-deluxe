# Deploy auf Uberspace

Diese Anleitung beschreibt den produktiven Deploy-Workflow für `kicktipp.schultypografie.de` auf Uberspace.

## Zielsystem

- Uberspace-User: `kicktipp`
- SSH-Host: `regulus.uberspace.de`
- Produktive Domain: `https://kicktipp.schultypografie.de`
- Produktiver App-Pfad: `/home/kicktipp/kicktipp-deluxe`
- Aktiver `supervisord`-Service: `kicktipp`
- Backend-Zuordnung: `kicktipp.schultypografie.de/ http:3000`
- Datenbank: MariaDB auf `localhost`, Datenbankname `kicktipp`

## Voraussetzungen

- SSH-Zugang per Key für `kicktipp@regulus.uberspace.de`
- Lokaler Projektstand ist fertig getestet
- Produktions-`.env` liegt bereits auf dem Server in `~/kicktipp-deluxe/.env`

## Wichtige Realität auf diesem Host

- `npm ci` kann auf Uberspace wegen Speicherlimits sterben.
- Ein zweites vollständiges `node_modules` pro Release kann zusätzlich an der Disk-Quota scheitern.
- `next build` auf dem Server ist deshalb nicht mehr der Standardpfad.
- Der robuste Deploy-Weg auf diesem Host ist aktuell:
  - Release-Quellstand hochladen
  - Produktionsbuild lokal erzeugen
  - nur die produktionsrelevanten `.next`-Artefakte hochladen
  - Release auf die bestehenden produktiven `node_modules` zeigen lassen
  - danach `supervisorctl` umschalten
- Bei Turbopack-/Prisma-Builds kann zusätzlich ein Prisma-Runtime-Link im Release fehlen. Das ist unten dokumentiert.
- Alte Releases, echte Predeploy-Verzeichnisse, große App-Backups und `~/.npm` koennen die
  10-GB-Quota sehr schnell sprengen. Cleanup ist deshalb fester Teil des Deploys.

## 1. Serverzustand prüfen

```bash
ssh kicktipp@regulus.uberspace.de

supervisorctl status
uberspace web backend list
node -v
npm -v
mysql --version
```

Zusätzlich prüfen:

```bash
cat ~/etc/services.d/kicktipp.ini
cd ~/kicktipp-deluxe
git status --short
```

## 2. Pflicht-Backups vor jedem Deploy

```bash
ssh kicktipp@regulus.uberspace.de

ts=$(date +%Y%m%d-%H%M%S)
mkdir -p ~/backups

tar -czf ~/backups/kicktipp-app-$ts.tar.gz -C /home/kicktipp kicktipp-deluxe
mysqldump --single-transaction --quick --default-character-set=utf8mb4 --databases kicktipp | gzip > ~/backups/kicktipp-db-$ts.sql.gz

ls -lh ~/backups/kicktipp-app-$ts.tar.gz ~/backups/kicktipp-db-$ts.sql.gz
```

Ohne diese beiden Backups kein Deploy.

Wichtig:

- Die App-Backups koennen schnell mehrere hundert MB bis mehrere GB gross werden.
- Nach erfolgreichem Deploy muessen alte grosse App-Backups aktiv ausgeduennt werden.
- Kleine DB-Dumps koennen deutlich laenger behalten werden als App-Tarballs.

## 3. Neues Release hochladen

Lokal im Repo:

```bash
ts=$(date +%Y%m%d-%H%M%S)
tar \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.env \
  --exclude=tsconfig.tsbuildinfo \
  -czf - . \
| ssh kicktipp@regulus.uberspace.de "set -e; rel=\$HOME/releases/kicktipp-$ts; mkdir -p \$rel; tar -xzf - -C \$rel; cp \$HOME/kicktipp-deluxe/.env \$rel/.env; echo \$rel"
```

Beispiel-Release-Pfad:

```text
/home/kicktipp/releases/kicktipp-20260403-003441
```

## 4. Build auf dem Server

Nur verwenden, wenn klar ist, dass ausreichend RAM und Disk-Quota frei sind.

```bash
ssh kicktipp@regulus.uberspace.de

rel=/home/kicktipp/releases/kicktipp-<timestamp>

rm -rf "$rel/node_modules"
cp -a ~/kicktipp-deluxe/node_modules "$rel/"

cd "$rel"
npm run build
npm run db:migrate
```

Wenn `npm ci` auf diesem Host doch wieder getestet werden soll:

```bash
cd "$rel"
npm ci
```

Wenn der Prozess mit `Killed` endet, wieder auf das Kopieren von `~/kicktipp-deluxe/node_modules` zurückgehen.

## 4a. Bevorzugter Produktionspfad: lokaler Build, reduzierter `.next`-Upload

Lokal:

```bash
npm run build
```

Danach nur die produktionsrelevanten `.next`-Artefakte hochladen, nicht den Dev-/Cache-Ballast:

```bash
tar \
  --exclude='.next/dev' \
  --exclude='.next/cache' \
  --exclude='.next/standalone' \
  --exclude='.next/build' \
  --exclude='.next/node_modules' \
  -czf - .next \
| ssh kicktipp@regulus.uberspace.de "rel=\$HOME/releases/kicktipp-<timestamp>; rm -rf \$rel/.next; tar -xzf - -C \$rel"
```

Danach den Release auf die bestehenden produktiven Abhängigkeiten zeigen lassen:

```bash
ssh kicktipp@regulus.uberspace.de

rel=/home/kicktipp/releases/kicktipp-<timestamp>
current=$(readlink -f ~/kicktipp-deluxe)

rm -rf "$rel/node_modules"
ln -s "$current/node_modules" "$rel/node_modules"
```

Wichtig:

- Kein zweites komplettes `node_modules` in den Release kopieren, wenn die Disk-Quota knapp ist.
- Kein `node_modules`-Symlink für einen Server-Build mit Turbopack verwenden; das kann mit
  `Symlink node_modules is invalid, it points out of the filesystem root`
  scheitern.
- Der Symlink ist für den Laufzeitbetrieb nach lokalem Build geeignet, nicht als Ersatz für einen Turbopack-Server-Build.

## 4b. Prisma-Runtime-Fix für Turbopack-Builds

Bei lokal gebauten Turbopack-Artefakten kann der Release nach dem Umschalten mit 500ern auf Server-Routen starten, obwohl `/login` noch funktioniert.

Typischer Fehler im Supervisor-Log:

```text
Failed to load external module @prisma/client-<hash>/runtime/client
```

Dann im aktiven Release den fehlenden Prisma-Link ergänzen:

```bash
ssh kicktipp@regulus.uberspace.de

rel=/home/kicktipp/releases/kicktipp-<timestamp>
mkdir -p "$rel/.next/node_modules/@prisma"
rm -f "$rel/.next/node_modules/@prisma/client-<hash>"
ln -s ../../../node_modules/@prisma/client "$rel/.next/node_modules/@prisma/client-<hash>"

supervisorctl restart kicktipp
```

Danach prüfen:

```bash
curl -I --max-time 20 https://kicktipp.schultypografie.de/api/auth/signin
curl -I --max-time 20 https://kicktipp.schultypografie.de/dashboard
```

Erwartet:

- `/api/auth/signin` liefert keinen `500` mehr
- geschützte Seiten wie `/dashboard` liefern ohne Session korrekt `307` auf den Sign-in-Flow

## 5. Produktiv umschalten

```bash
ssh kicktipp@regulus.uberspace.de

rel=/home/kicktipp/releases/kicktipp-<timestamp>
ts=$(date +%Y%m%d-%H%M%S)

supervisorctl stop kicktipp
mv ~/kicktipp-deluxe ~/kicktipp-deluxe-predeploy-$ts
ln -s "$rel" ~/kicktipp-deluxe
supervisorctl start kicktipp
sleep 5
supervisorctl status kicktipp
```

## 5a. Pflicht-Cleanup nach erfolgreichem Deploy

Sobald das neue Release stabil laeuft, aufraeumen. Sonst wachsen `~/releases`, `~/backups`,
alte echte Predeploy-Verzeichnisse und `~/.npm` unkontrolliert an.

### Retention-Regel

Behalten:

- den aktiven Release
- genau einen vorherigen kleinen Release als schnellen Fallback
- die juengsten 1-2 DB-Backups
- hoechstens ein frisches App-Backup direkt nach einem riskanten Eingriff

Loeschen:

- alte grosse Releases mit eigenen `node_modules` oder schweren Build-Artefakten
- echte alte Predeploy-Verzeichnisse, sobald sie nicht mehr fuer einen Rollback gebraucht werden
- alte grosse App-Backups
- `~/.npm`, wenn kein unmittelbar bevorstehender Server-Build geplant ist

### Groessen schnell pruefen

```bash
ssh kicktipp@regulus.uberspace.de

du -sh ~/* ~/.[!.]* 2>/dev/null | sort -h
du -sh ~/releases/* 2>/dev/null | sort -h
du -sh ~/backups/* 2>/dev/null | sort -h | tail -n 20
```

### Typischer Cleanup

```bash
ssh kicktipp@regulus.uberspace.de

rm -rf ~/releases/kicktipp-<old-1> ~/releases/kicktipp-<old-2>
rm -rf ~/kicktipp-deluxe-predeploy-<timestamp>
rm -rf ~/.npm
rm -f ~/backups/kicktipp-app-<old>.tar.gz
```

Vor dem Loeschen immer pruefen:

- ist der Release aktuell nicht aktiv
- ist das Predeploy-Ziel kein benoetigter Rollback-Kandidat mehr
- bleibt mindestens ein sinnvoller Rueckfallstand erhalten

## 6. Verifikation

Serverseitig:

```bash
curl -I --max-time 20 http://127.0.0.1:3000/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/api/auth/signin
curl -I --max-time 20 https://kicktipp.schultypografie.de/dashboard
```

Erwartet:

- lokaler Backend-Check: `HTTP/1.1 200 OK`
- öffentliche URL: `HTTP/2 200`
- `/api/auth/signin`: kein `500`
- `/dashboard` ohne Session: `307` auf den Sign-in-Flow
- `supervisorctl status kicktipp` zeigt `RUNNING`

Danach manuell prüfen:

- Login
- Dashboard
- Tippen
- Admin
- bestehende Produktionsdaten vorhanden

## 7. Rollback

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

## 8. Nützliche Pfade

- Service-Datei: `/home/kicktipp/etc/services.d/kicktipp.ini`
- Logs:
  - aktueller Stand pruefen mit `supervisorctl status`
  - Logpfade koennen vom versionierten Beispiel abweichen
- Produktive `.env`: `/home/kicktipp/kicktipp-deluxe/.env`
- Release-Ordner: `/home/kicktipp/releases/`
- Backups: `/home/kicktipp/backups/`
- npm-Cache: `/home/kicktipp/.npm`

## 9. Aktuell zuletzt erfolgreich deployed

- Release: `/home/kicktipp/releases/kicktipp-20260403-153810`
- Vorheriger kleiner Fallback-Stand: `/home/kicktipp/releases/kicktipp-20260403-142822`
- App-Backup: `/home/kicktipp/backups/kicktipp-app-20260403-153712.tar.gz`
- DB-Backup: `/home/kicktipp/backups/kicktipp-db-20260403-153712.sql.gz`
