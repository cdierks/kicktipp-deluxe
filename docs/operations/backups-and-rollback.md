# Backups und Rollback

## Grundsatz

Vor jedem Deploy, größeren Import oder invasiven Produktionseingriff sind zwei
voneinander unabhängige Backups Pflicht:

- ein Archiv des tatsächlich aktiven Release-Inhalts;
- ein vollständiger MariaDB-Dump.

Beide Dateien enthalten vertrauliche Daten. Das App-Archiv enthält die
produktive `.env`, der SQL-Dump personenbezogene Daten und Passwort-Hashes.

## Pflicht-Backups erstellen und prüfen

Der aktive Pfad ist ein Symlink. Deshalb wird zuerst sein Ziel aufgelöst und
anschließend genau dieses Release-Verzeichnis archiviert:

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

`set -o pipefail` verhindert, dass ein fehlgeschlagenes `mysqldump` durch einen
erfolgreichen Kompressor verdeckt wird. Die Inhaltsprüfungen weisen außerdem
absolute beziehungsweise rückwärts traversierende Tar-Einträge zurück,
bestätigen vollständige Standalone-Inhalte, `.env` und – sobald vorhanden –
exakt die Metadaten des aktiven Releases. Nur für den einmaligen Übergang von
einem Alt-Release ohne `RELEASE_METADATA` darf auch das Archiv diese Datei
nicht enthalten; jeder neue V5-Release enthält sie. Der Dump muss
SQL-Tabellendefinitionen und den `mysqldump`-Abschlussmarker enthalten. Beide
Dateien müssen Modus `600` haben.

Der Deploy-Preflight akzeptiert nur valide App- und DB-Backups mit den Namen
`kicktipp-app-*.tar.gz` und `kicktipp-db-*.sql.gz`, die höchstens 24 Stunden alt
sind. Eine erfolgreiche Dateierzeugung ohne Integritätsprüfung gilt nicht als
Backup.

## Schutz und Aufbewahrung

- Backup-Verzeichnis auf Modus `700`, Dateien durch `umask 077` nur für den
  Betreiber lesbar halten.
- Kopien außerhalb des Hosts verschlüsselt übertragen und verschlüsselt
  speichern; Schlüssel getrennt vom Backup verwahren.
- Zugriff auf benannte Verantwortliche und den Restore-Zweck begrenzen.
- Backups nicht per E-Mail, Chat, Ticket oder öffentlichem Link teilen.
- Retention mindestens gemäß `cleanup.sh`: drei valide App- und fünf valide
  DB-Backups. Eine längere Aufbewahrung braucht einen begründeten Zweck.
- Wiederherstellung regelmäßig auf einer isolierten Instanz testen und Ergebnis
  sowie Zeitpunkt dokumentieren.

## Anwendungseigenes JSON-Backup

Der Adminbereich kann zusätzlich ein versioniertes JSON-Backup exportieren und
vollständig importieren. Es enthält Benutzer, Farben, Saisons, Spieltage,
Spiele, Tipps und App-Einstellungen – einschließlich E-Mail-Adressen,
Rollenprofilen und BCrypt-Passwort-Hashes.

Export und Import erfordern:

- eine aktive Admin-Session;
- die erneute Eingabe des aktuellen Admin-Passworts;
- einen nicht ausgeschöpften Rate-Limit-Rahmen.

Vor dem Import validiert die Anwendung Format, Größe, IDs, Eindeutigkeiten,
Beziehungen, Admin-/Aktivzustände, Farbzuweisungen, Joker-Regeln und berechnete
Punkte. Der eigentliche Austausch des Datenbestands läuft transaktional. Ein
JSON-Backup ersetzt trotzdem weder SQL-Dump noch Release-Archiv.

Für JSON-Dateien gelten dieselben Vertraulichkeitsregeln wie für SQL-Dumps:

- unmittelbar nach dem Download in einen verschlüsselten, zugriffsgeschützten
  Speicher verschieben;
- Browser-Downloads und temporäre lokale Kopien nach bestätigter Sicherung
  löschen;
- Integrität zum Beispiel mit einem separat gespeicherten SHA-256-Hash
  dokumentieren;
- Import zunächst in einer isolierten Umgebung testen.

## App-Rollback

Beim Umschalten legt `switch.sh` für den neuen Release einen eindeutigen
Fallback an. Für `.../releases/kicktipp-<id>` lautet er:

```text
/home/kicktipp/kicktipp-deluxe-predeploy-kicktipp-<id>
```

Fehler beim Start, Smoke-Check oder Funktionstest lösen im Standard-Deploy
automatisch die Wiederherstellung aus. Manuell wird derselbe abgesicherte Pfad
verwendet:

```bash
bash scripts/deploy/restore-release.sh \
  --release /home/kicktipp/releases/kicktipp-<id>
```

Das Skript arbeitet nur, wenn genau dieser Release aktiv ist, der zugehörige
Fallback existiert und beide Ziele unter `RELEASES_DIR` liegen. Danach werden
Symlink-Ziel, Supervisor-Status und lokaler Login-Endpunkt geprüft.

## Grenze des App-Rollbacks

Ein Symlink-Rollback setzt nicht zurück:

- bereits angewandte Datenbankmigrationen;
- nach dem Backup geänderte Produktivdaten;
- externe Nebeneffekte von Cron- oder Admin-Aktionen.

Migrationen müssen daher expand/contract-kompatibel sein. Destruktive
Schemaänderungen brauchen einen separaten Wartungs- und Restore-Plan.

## Datenbank-Restore

Ein vollständiger Restore ist destruktiv und wird nicht automatisiert. Vorher
immer einen zusätzlichen Dump des aktuellen Schadensstands erstellen und
klären, welche seit dem Backup eingegangenen Daten erhalten werden müssen.

Nach Freigabe und erneuter Integritätsprüfung lautet der technische Kern:

```bash
set -euo pipefail
db_backup=/home/kicktipp/backups/kicktipp-db-<timestamp>.sql.gz
test -s "$db_backup"
gzip -t "$db_backup"
gzip -dc "$db_backup" | mysql
```

Da der Dump mit `--databases kicktipp` erzeugt wird, enthält er die
Datenbankauswahl. Während des Restores darf kein App-Prozess in die Datenbank
schreiben. Anschließend Migrationstand, aktive Saison, Benutzer, Spieltage,
Tipps und Anwendungseinstellungen prüfen.

## Mindestprüfungen nach Rollback oder Restore

- aktiver Symlink zeigt exakt auf das erwartete Release;
- `supervisorctl status kicktipp` zeigt `RUNNING`;
- lokaler und öffentlicher Login antworten;
- geschützte Routen leiten ohne Session korrekt um;
- Login, Dashboard, Tippen und Admin funktionieren;
- Datenmengen, aktive Saison und fachliche Ergebnisse sind plausibel.

Die vollständige Liste steht in der
[Verifikationscheckliste](./verification-checklist.md).
