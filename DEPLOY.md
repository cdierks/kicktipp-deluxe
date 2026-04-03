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
- Der Build lief erfolgreich, indem die bestehenden produktiven `node_modules` in das neue Release kopiert wurden.
- Deshalb gilt auf diesem Host aktuell:
  - Erst Release hochladen
  - Dann produktive `node_modules` in das Release kopieren
  - Danach `npm run build` und `npm run db:migrate`

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

Auf diesem Uberspace nicht mit frischem `npm ci` starten, wenn es bereits einmal an Speichergrenzen gescheitert ist.

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

## 6. Verifikation

Serverseitig:

```bash
curl -I --max-time 20 http://127.0.0.1:3000/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/login
```

Erwartet:

- lokaler Backend-Check: `HTTP/1.1 200 OK`
- öffentliche URL: `HTTP/2 200`
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
  - `/home/kicktipp/logs/supervisord/kicktipp.log`
  - `/home/kicktipp/logs/supervisord/kicktipp.err`
- Produktive `.env`: `/home/kicktipp/kicktipp-deluxe/.env`
- Release-Ordner: `/home/kicktipp/releases/`
- Backups: `/home/kicktipp/backups/`

## 9. Aktuell zuletzt erfolgreich deployed

- Release: `/home/kicktipp/releases/kicktipp-20260403-003441`
- Vorheriger Stand: `/home/kicktipp/kicktipp-deluxe-predeploy-20260403-003715`
- App-Backup: `/home/kicktipp/backups/kicktipp-app-20260403-003230.tar.gz`
- DB-Backup: `/home/kicktipp/backups/kicktipp-db-20260403-003230.sql.gz`
