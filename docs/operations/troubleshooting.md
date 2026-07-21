# Troubleshooting

## Erstdiagnose

1. aktiven Release und Metadaten bestimmen;
2. Prozessstatus prüfen;
3. lokalen und öffentlichen Login prüfen;
4. Supervisor-Logs lesen;
5. erst dann Rollback oder Reparatur entscheiden.

```bash
readlink -f /home/kicktipp/kicktipp-deluxe
cat /home/kicktipp/kicktipp-deluxe/RELEASE_METADATA
supervisorctl status kicktipp
curl -I --max-time 20 http://127.0.0.1:3000/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/api/auth/signin
curl -I --max-time 20 https://kicktipp.schultypografie.de/dashboard
```

## Deploy-Preflight verweigert den Start

### Arbeitsbaum ist nicht sauber

Deploys werden ausschließlich aus einem verifizierten Commit erzeugt. Die
Änderungen prüfen, bewusst committen und den gesamten Verify-Lauf wiederholen.
Uncommittete Dateien dürfen nicht mit einem manuellen Upload umgangen werden.

### Backup fehlt oder ist ungültig

`check.sh` verlangt höchstens 24 Stunden alte, valide App- und DB-Backups. Ein
App-Archiv des Symlinks statt des aufgelösten Releases, ein Archiv ohne
vollständige Standalone-Runtime, `.env` oder passende `RELEASE_METADATA`, eine
Datei ohne Modus `600`, ein leeres Gzip oder ein Dump ohne `CREATE TABLE` und
Abschlussmarker wird abgewiesen. Die Befehle aus
[Backups und Rollback](./backups-and-rollback.md) erneut vollständig ausführen.

### Service-Datei weicht ab

Die produktive Definition muss den Standalone-Entrypoint mit `/usr/bin/node`,
Port `3000`, Loopback-Hostname und `TZ=Europe/Berlin` exakt abbilden. Die
versionierte [scripts/kicktipp.ini](../../scripts/kicktipp.ini) installieren,
Supervisor neu laden und den Preflight wiederholen.

## Remote-Deploy-Lock ist belegt

### Symptom

`run.sh` meldet einen bereits aktiven Deploy und zeigt
`/home/kicktipp/releases/.kicktipp-deploy.lock`.

### Vorgehen

Nicht sofort löschen. Zuerst Inhalt von `owner`, laufende lokale/entfernte
Deploy-Prozesse, Supervisor und aktiven Release prüfen. Nur wenn sicher kein
Deploy mehr läuft, den verwaisten `owner` entfernen und das leere Verzeichnis
mit `rmdir` löschen. Ein paralleles Umschalten ist ausdrücklich verboten.

## Linux-Container-Build schlägt fehl

- Docker-Daemon und freien lokalen Speicher prüfen;
- `BUILD_PLATFORM` gegen `uname -m` des Zielhosts prüfen;
- Erreichbarkeit des npm-Registrys und Integrität des Lockfiles prüfen;
- den exakten Commit nicht verändern, sondern Ursache beheben und Build neu
  starten.

Ein Build auf dem Produktionshost ist kein unterstützter Ersatz. Er umgeht
Plattform-, Commit- und Metadatenprüfungen.

## Standalone-Runtime ist unvollständig

### Symptome

- `server.js`, `.next/static`, `public` oder `node_modules/@prisma/client`
  fehlen;
- Linux-Sharp-Paket passt nicht zur Zielarchitektur;
- macOS-native Dateien liegen im Release;
- `.migration` fehlt oder meldet nicht Prisma 7.8.0;
- `.env` hat nicht Modus `600`;
- Paketversion und `RELEASE_METADATA` widersprechen sich.

### Behebung

Nicht manuell einzelne Dateien in Produktion ergänzen. Den Release verwerfen
und `run.sh` aus dem unveränderten, verifizierten Commit neu ausführen. Der
Standardpfad baut `public` und `.next/static` bereits in den Standalone-Baum
ein; eine externe `node_modules`-Basis oder historische Symlink-Kette ist
unzulässig.

## `/login` funktioniert, Auth- oder Serverrouten liefern aber `500`

Prüfen:

- `DATABASE_URL` ist vollständig und die Datenbank erreichbar;
- `.env` gehört zum aktiven Release und hat Modus `600`;
- `NEXTAUTH_URL` entspricht bei der öffentlichen Produktion exakt der
  HTTPS-Domain; nur lokale oder private Standalone-Ziele dürfen HTTP nutzen;
- `NEXTAUTH_SECRET` ist stabil und mindestens 32 Zeichen lang;
- Standalone-Runtime und Prisma-Client stammen aus demselben Release-Commit;
- Supervisor-Logs nennen keinen nativen Runtime- oder Schemafehler.

Keine Runtime aus einem alten Release verlinken. Bei unklarem Zustand den
Release-spezifischen Fallback über `restore-release.sh` wiederherstellen.

## Funktionaler Check schlägt nach dem Umschalten fehl

`verify-functional.sh` verlangt:

- `--release` mit dem tatsächlich erwarteten Release;
- `VERIFY_LOGIN_EMAIL` und `VERIFY_LOGIN_PASSWORD` eines existierenden Admins;
- erreichbare Dashboard-, Tipp- und Adminrouten;
- funktionierenden SQL-Zugriff für einen transaktional zurückgerollten
  `AppSetting`-Write.

Das Skript erzeugt keinen temporären Benutzer und schreibt keine Tipps. Bei
falschen Zugangsdaten einen vorgesehenen Prüf-Admin verwenden; nicht die
Kontrolle durch einen manuellen Datenbankbenutzer umgehen. `run.sh` versucht
bei diesem Fehler automatisch, das vorige App-Release wiederherzustellen.

## Automatischer Rollback schlägt fehl

Cleanup stoppen und keine Fallbacks verschieben. Prüfen:

```bash
readlink -f /home/kicktipp/kicktipp-deluxe
ls -l /home/kicktipp/kicktipp-deluxe-predeploy-*
supervisorctl status kicktipp
```

Nur der zum aktuell ausgewählten Release gehörende Fallback darf verwendet
werden. Wenn der Standardzustand noch besteht, erneut
`restore-release.sh --release <aktiver-release>` ausführen. Manuelle
Symlink-Operationen erst nach Sicherung aller Ziele und nur mit einem
bestätigten Wiederanlaufplan.

## `/api/sync` liefert `401` oder `500`

Bei `401` Headername und `CRON_SECRET` abgleichen. Bei `500` zusätzlich
OpenLigaDB, Provider-Antwort, aktiven Spieltag, Datenbankverbindung und
Supervisor-Logs prüfen. Das Secret wird längenkonstant verglichen; zusätzliche
Leerzeichen verändern es.

## Daten nach Import, Migration oder Restore sind unplausibel

- verwendeten SQL- beziehungsweise JSON-Stand identifizieren;
- Migrationstand und Release-Metadaten vergleichen;
- getrennt aktive Saison und aktiven Spieltag prüfen;
- Anzahlen von Benutzern, Matches und Tipps mit dem Backup vergleichen;
- Punktestichprobe inklusive Joker neu berechnen;
- Registrierungseinstellung und mindestens einen Admin bestätigen.

Bei ungeklärter Datenabweichung Schreibzugriffe stoppen und erst am isolierten
Backup analysieren.

## Logs

```text
/home/kicktipp/logs/supervisord/kicktipp.log
/home/kicktipp/logs/supervisord/kicktipp.err
```

## Eskalationsregel

Wenn sich der Fehler nicht eindeutig auf Release, Runtime oder Datenbank
begrenzen lässt, zuerst das letzte bekannte App-Release wiederherstellen. Eine
DB-Wiederherstellung ist eine separate, destruktive Entscheidung und darf nicht
als Nebenwirkung eines App-Rollbacks erfolgen.
