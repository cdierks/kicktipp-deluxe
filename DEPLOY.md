# Deployment auf Uberspace

Diese Datei ist die verbindliche operative Quelle für Releases auf
`kicktipp.schultypografie.de`. Der Produktionspfad wird lokal aus einem
verifizierten Commit über `scripts/deploy/*.sh` ausgeführt. Ein Build direkt auf
dem Server ist nicht unterstützt.

## Zielsystem

- SSH: `kicktipp@regulus.uberspace.de`
- Domain: `https://kicktipp.schultypografie.de`
- aktiver App-Pfad: `/home/kicktipp/kicktipp-deluxe`
- Releases: `/home/kicktipp/releases/kicktipp-*`
- Backups: `/home/kicktipp/backups`
- Supervisor-Service: `kicktipp`
- lokales Backend: `http://127.0.0.1:3000`
- Datenbank: MariaDB auf `localhost`, Datenbank `kicktipp`

Der aktive App-Pfad ist immer ein Symlink auf genau ein direktes Kind des
Release-Verzeichnisses. Jeder Release ist eigenständig startfähig und enthält
`server.js`, die Standalone-Runtime, statische Assets, eine produktive `.env`
mit Modus `600`, die gepinnte Prisma-Migrationsruntime und
`RELEASE_METADATA`.

## Voraussetzungen

Lokal werden `git`, `ssh`, `tar`, `curl`, Node.js, npm und Docker benötigt. Das
Repository muss sauber sein; nur ein vollständiger 40-stelliger Commit-SHA wird
ausgeliefert. Der Standardbuild läuft in einem Linux-Container:

```text
BUILD_PLATFORM=linux/amd64
BUILD_NODE_IMAGE=node:20.19.5-bookworm-slim
```

Die Werte können als Umgebungsvariablen überschrieben werden. `check.sh`
vergleicht die Zielarchitektur mit `BUILD_PLATFORM` und prüft außerdem die
versionierte Supervisor-Konfiguration.

Für den verpflichtenden funktionalen Check werden Zugangsdaten eines
existierenden Administrators benötigt. Das Skript legt niemals einen
temporären Produktionsbenutzer an:

```bash
export VERIFY_LOGIN_EMAIL='admin@example.com'
read -rsp 'Passwort des Prüf-Admins: ' VERIFY_LOGIN_PASSWORD
echo
export VERIFY_LOGIN_PASSWORD
```

Die Variablen nur in einer geschützten Shell setzen und danach mit
`unset VERIFY_LOGIN_EMAIL VERIFY_LOGIN_PASSWORD` entfernen. Passwörter gehören
weder in das Repository noch in Shell-History, Tickets oder Protokolle.

## Pflicht-Backups

Vor jedem Deploy müssen ein höchstens 24 Stunden altes, valides App-Backup und
ein ebenso aktuelles Datenbank-Backup vorhanden sein. `check.sh` verweigert den
Deploy andernfalls. Das App-Backup muss den aufgelösten Release-Inhalt sichern;
ein Archiv des Symlinks `kicktipp-deluxe` genügt nicht.

```bash
ssh kicktipp@regulus.uberspace.de 'bash -s' <<'REMOTE'
set -euo pipefail
umask 077

backup_dir=/home/kicktipp/backups
app_dir=/home/kicktipp/kicktipp-deluxe
releases_dir=/home/kicktipp/releases
ts=$(date -u +%Y%m%d-%H%M%S)
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"

active_release=$(readlink -f "$app_dir")
case "$active_release" in
  "$releases_dir"/kicktipp-*) ;;
  *) echo "Ungültiges aktives Release: $active_release" >&2; exit 1 ;;
esac

release_parent=$(dirname "$active_release")
release_name=$(basename "$active_release")
metadata_required=0
active_metadata=''
if [[ -f "$active_release/RELEASE_METADATA" ]]; then
  metadata_required=1
  active_metadata=$(cat "$active_release/RELEASE_METADATA")
fi
app_backup="$backup_dir/kicktipp-app-$ts.tar.gz"
db_backup="$backup_dir/kicktipp-db-$ts.sql.gz"
test ! -e "$app_backup" && test ! -e "$db_backup"

tar -czf "$app_backup" -C "$release_parent" "$release_name"
chmod 600 "$app_backup"
test -s "$app_backup"
tar -tzf "$app_backup" | awk -v root="$release_name" -v metadata_required="$metadata_required" '
  BEGIN { metadata = 0 }
  /^\// || /(^|\/)\.\.($|\/)/ { unsafe = 1 }
  $0 == root "/server.js" { server = 1 }
  $0 == root "/.env" { env = 1 }
  $0 == root "/package.json" { package = 1 }
  index($0, root "/.next/static/") == 1 { static = 1 }
  index($0, root "/node_modules/") == 1 { modules = 1 }
  $0 == root "/RELEASE_METADATA" { metadata += 1 }
  END {
    metadata_ok = metadata_required ? metadata == 1 : metadata == 0
    exit unsafe || !server || !env || !package || !static || !modules || !metadata_ok
  }
'
if ((metadata_required == 1)); then
  archive_metadata=$(tar -xOzf "$app_backup" "$release_name/RELEASE_METADATA")
  test "$archive_metadata" = "$active_metadata"
fi
test "$(stat -c '%a' "$app_backup")" = 600

mysqldump \
  --single-transaction \
  --quick \
  --default-character-set=utf8mb4 \
  --databases kicktipp \
| gzip -c > "$db_backup"
chmod 600 "$db_backup"
test -s "$db_backup"
gzip -t "$db_backup"
gzip -dc "$db_backup" | awk '
  NF { nonempty = 1 }
  /CREATE TABLE/ { found = 1 }
  /Dump completed on/ { complete = 1 }
  END { exit !nonempty || !found || !complete }
'
test "$(stat -c '%a' "$db_backup")" = 600

ls -lh "$app_backup" "$db_backup"
REMOTE
```

`set -o pipefail` ist für den Dump wesentlich: Ein fehlgeschlagenes
`mysqldump` darf nicht durch einen erfolgreichen `gzip`-Prozess verdeckt werden.
Die Inhaltsprüfungen bestätigen zusätzlich, dass das Archiv die vollständige
Standalone-Runtime samt `.env` und – sobald vorhanden – exakt den Metadaten des
aktiven Releases enthält. Nur beim einmaligen Übergang von einem Alt-Release
ohne `RELEASE_METADATA` ist ein Archiv ohne diese Datei zulässig; jeder durch
den V5-Pfad erzeugte Release enthält sie. Der SQL-Dump muss mindestens eine
Tabelle sowie den Abschlussmarker von `mysqldump` enthalten. Beide
Backup-Dateien müssen Modus `600` haben.

## Standard-Deploy

Ohne Datenbankmigration:

```bash
bash scripts/deploy/run.sh
```

Mit einer vorab geprüften, rückwärtskompatiblen Migration:

```bash
bash scripts/deploy/run.sh --migrate
```

Optional kann der Release-Name vorgegeben werden:

```bash
bash scripts/deploy/run.sh --release-name kicktipp-20260718-153810
```

Alle Skripte akzeptieren bei Bedarf gemeinsame Overrides:

```text
--host <host>
--user <user>
--app-dir <path>
--releases-dir <path>
--service <name>
--domain <https-url>
--local-port <port>
```

`run.sh` hält während des gesamten Ablaufs den Remote-Lock
`/home/kicktipp/releases/.kicktipp-deploy.lock`. Ein zweiter Deploy bricht ab.
Bleibt der Lock nach einem unerwarteten Client-Abbruch zurück, zuerst über
`ps`, `supervisorctl` und den Inhalt der Datei `owner` sicherstellen, dass kein
Deploy mehr läuft; erst dann das leere Lock-Verzeichnis manuell entfernen.

## Verbindlicher Ablauf

`run.sh` führt genau diese sieben Schritte aus:

1. `check.sh`: lokale und entfernte Voraussetzungen, sauberen Git-Stand,
   aktuelle valide Backups, Service-Datei, Architektur und aktiven Symlink
   prüfen.
2. `create-release.sh`: den einmal ermittelten Commit archivieren, den Release
   anlegen, die produktive `.env` serverseitig mit Modus `600` übernehmen und
   Metadaten schreiben.
3. `upload-build.sh`: denselben Commit in Docker für die Zielplattform bauen
   und Standalone- sowie Migrationsruntime hochladen.
4. `link-runtime.sh`: das selbstständige Linux-Artefakt, statische Assets,
   Prisma 7.8.0, `.env`-Modus, Plattform und Metadaten validieren.
5. `switch.sh`: optional migrieren, den bisherigen Symlink als Fallback
   erhalten und atomar auf den neuen Release umschalten.
6. `verify-smoke.sh`: aktiven Release exakt vergleichen, lokale und öffentliche
   HTTP-Endpunkte sowie Supervisor prüfen.
7. `verify-functional.sh`: echten Login, Session, geschützte Seiten, einen
   transaktional zurückgerollten `AppSetting`-Write und Sign-out prüfen.

Der Release-Commit wird zu Beginn genau einmal aus `HEAD` ermittelt.
`create-release.sh` und `upload-build.sh` erhalten denselben SHA; lokale,
ignorierte und uncommittete Dateien gelangen dadurch nicht in das Artefakt.
`RELEASE_METADATA` enthält Commit, Paketversion, UTC-Erstellzeit,
Build-Plattform und Build-Image und wird in den Prüfungen ausgegeben.

Der Container führt `npm ci`, `npm run build` und die Installation der
separaten Migrationsruntime aus. `postbuild` kopiert `public` und
`.next/static` in den Standalone-Baum. Hochgeladen wird anschließend das
vollständige, eigenständig startbare Linux-Artefakt; eine externe
`node_modules`-Basis ist nicht zulässig.

## Migrationen sicher ausführen

`switch.sh --migrate` verwendet ausschließlich die im Release enthaltene,
über Lockfile gepinnte Runtime unter `.migration`:

```text
<release>/.migration/node_modules/.bin/prisma migrate deploy
```

Produktionsmigrationen müssen nach dem Expand/Contract-Prinzip sowohl mit dem
alten als auch mit dem neuen App-Release kompatibel sein. Destruktive Schritte
wie Spaltenlöschung, Umbenennung oder irreversible Datenkonvertierung gehören
nicht in denselben Umschaltvorgang.

Wichtig: Der automatische Rollback stellt nur das vorige App-Release wieder
her. Eine bereits ausgeführte Datenbankmigration wird nicht automatisch
zurückgenommen. Vor `--migrate` müssen daher ein getesteter SQL-Restore-Plan
und ein aktuelles DB-Backup vorliegen.

## Umschalten, Verifikation und automatischer Rollback

Der Fallback für einen Release
`/home/kicktipp/releases/kicktipp-20260718-153810` heißt exakt:

```text
/home/kicktipp/kicktipp-deluxe-predeploy-kicktipp-20260718-153810
```

Schlägt der Service-Start innerhalb von `switch.sh` fehl, wird der vorherige
App-Symlink sofort wiederhergestellt. Schlägt nach dem Umschalten der Smoke-
oder Funktionstest fehl, ruft `run.sh` automatisch `restore-release.sh` für
genau diesen Release auf. Misslingt auch diese Wiederherstellung, ist eine
manuelle Intervention erforderlich; der Cleanup bleibt in jedem Fehlerfall
aus.

Der funktionale Check verlangt `--release` und explizite Zugangsdaten. Er
bestätigt zuerst die aktive Release-Identität und prüft dann:

- Redirect ohne Session;
- Credentials-Login und Session-E-Mail/-Rolle;
- authentifizierte Zugriffe auf Dashboard, Tippen und Admin;
- einen `AppSetting`-Write innerhalb einer SQL-Transaktion samt `ROLLBACK`;
- Sign-out und leere Session.

Er erzeugt oder löscht keine Benutzer und schreibt keine Tipps.

## Manueller App-Rollback

Wenn der automatische Pfad nicht gelaufen ist oder ein bereits freigegebener
Release zurückgenommen werden muss, wird der zu diesem aktiven Release
gehörende Fallback gezielt wiederhergestellt:

```bash
bash scripts/deploy/restore-release.sh \
  --release /home/kicktipp/releases/kicktipp-20260718-153810
```

Das Skript verweigert den Vorgang, wenn der angegebene Release nicht mehr aktiv
ist, der Fallback fehlt oder eines der Ziele außerhalb von `RELEASES_DIR` liegt.
Nach dem Wechsel prüft es Service-Status, exaktes Symlink-Ziel und den lokalen
Login-Endpunkt.

## Cleanup

Cleanup ist absichtlich kein Teil von `run.sh`. Erst nach erfolgreicher
fachlicher Abnahme werden konkrete Pfade übergeben:

```bash
bash scripts/deploy/cleanup.sh \
  --release /home/kicktipp/releases/kicktipp-<alt> \
  --predeploy /home/kicktipp/kicktipp-deluxe-predeploy-kicktipp-<alt> \
  --app-backup /home/kicktipp/backups/kicktipp-app-<alt>.tar.gz \
  --db-backup /home/kicktipp/backups/kicktipp-db-<alt>.sql.gz
```

Die Schutzregeln erhalten mindestens drei Releases, einen funktionierenden
Predeploy-Fallback, drei valide App-Backups und fünf valide DB-Backups. Aktiver
Release, jüngster funktionierender Fallback und dessen Ziel sind geschützt.
Nur explizit benannte, vom Skript erkannte Artefakte werden entfernt.

Die vollständige Nachkontrolle steht in
[docs/operations/verification-checklist.md](docs/operations/verification-checklist.md),
Backup- und Restore-Grenzen in
[docs/operations/backups-and-rollback.md](docs/operations/backups-and-rollback.md).
