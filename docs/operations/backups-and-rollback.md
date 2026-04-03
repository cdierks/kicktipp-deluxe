# Backups und Rollback

## Grundsatz

Vor jedem produktiven Eingriff mit Risiko sind zwei Backups Pflicht:

- App-Dateisystem
- Datenbank

Ohne diese beiden Backups kein Deploy, kein größerer Import und kein invasiver Reparatureingriff.

## Pflicht-Backups vor einem Deploy

```bash
ssh kicktipp@regulus.uberspace.de

ts=$(date +%Y%m%d-%H%M%S)
mkdir -p ~/backups

tar -czf ~/backups/kicktipp-app-$ts.tar.gz -C /home/kicktipp kicktipp-deluxe
mysqldump --single-transaction --quick --default-character-set=utf8mb4 --databases kicktipp | gzip > ~/backups/kicktipp-db-$ts.sql.gz

ls -lh ~/backups/kicktipp-app-$ts.tar.gz ~/backups/kicktipp-db-$ts.sql.gz
```

## Was die Backups abdecken

### App-Backup

Deckt den aktuell aktiven App-Pfad ab, inklusive:

- produktiver `.env`
- aktueller Release-Stand
- Konfigurationsdateien im App-Verzeichnis

### Datenbank-Backup

Deckt die gesamte Datenbank `kicktipp` ab, inklusive:

- Benutzer
- Spieltage
- Spiele
- Tipps
- App-Einstellungen

## Anwendungseigenes JSON-Backup

Im Admin-Bereich existiert zusätzlich ein anwendungsinternes Backup-Format über `exportAppBackup()` und `importAppBackup()`.

Dieses Format enthält:

- `users`
- `colorPalettes`
- `seasons`
- `matchdays`
- `matches`
- `tips`
- `appSettings`

Eigenschaften:

- Export ist für Admins verfügbar
- Import löscht vor dem Wiederaufbau die vorhandenen Anwendungsdaten tabellenweise
- das Format ist versioniert mit `version: 1`

Das JSON-Backup ist nützlich für App-Datenmigrationen und schnelle Anwendungswiederherstellung, ersetzt aber kein vollständiges Datenbank-Backup.

## Rollback auf das vorige Release

Vorher den letzten alten Stand ermitteln:

```bash
ls -d ~/kicktipp-deluxe-predeploy-*
ls -lh ~/backups
```

Dann Rückfall auf den letzten bekannten App-Stand:

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

## Was ein App-Rollback nicht rückgängig macht

Ein Symlink-Rollback setzt nur den Dateistand der Anwendung zurück. Es setzt nicht automatisch zurück:

- bereits gelaufene Datenbankmigrationen
- in der Zwischenzeit geänderte Produktivdaten
- externe Nebeneffekte aus Cron- oder Admin-Aktionen

Wenn der Fehler datenbankbezogen ist, kann ein reines App-Rollback unzureichend sein.

## Datenbank-Restore

Für einen harten Datenbank-Restore wird das vorgelagerte `mysqldump`-Backup benötigt. Der konkrete Restore-Befehl ist absichtlich nicht als Standardworkflow fest verdrahtet, weil er stark von Schadensbild und Zeitfenster abhängt.

Vor einem Restore immer klären:

- soll der komplette Stand auf den Backup-Zeitpunkt zurück
- müssen seitdem eingegangene Daten gesichert werden
- ist ein JSON-Import der App-Daten ausreichend oder ist ein vollständiger SQL-Restore nötig

## Mindestprüfungen nach Restore oder Rollback

- `supervisorctl status kicktipp` zeigt `RUNNING`
- `/login` antwortet erfolgreich
- `/api/auth/signin` liefert keinen `500`
- `/dashboard` leitet ohne Session sauber auf den Login-Flow um
- produktive Daten sind sichtbar und plausibel

Die kompakten HTTP-Checks stehen in [Verifikationscheckliste](./verification-checklist.md).
