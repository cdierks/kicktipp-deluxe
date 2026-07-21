# Verifikationscheckliste

## Vor jedem Deploy

- lokaler Arbeitsbaum ist sauber und der freizugebende Commit vollständig;
- `npm run verify` ist für genau diesen Commit erfolgreich;
- Docker-Buildplattform entspricht dem Zielhost;
- App- und DB-Backup sind höchstens 24 Stunden alt;
- App-Tar hat Modus `600`, ist nicht leer, enthält sichere relative Pfade,
  vollständige Standalone-Inhalte, `.env` und – soweit im aktiven Release
  vorhanden – exakt dessen `RELEASE_METADATA`;
- DB-Gzip hat Modus `600`, ist nicht leer, `gzip -t` ist erfolgreich und der
  Inhalt enthält `CREATE TABLE` sowie den `mysqldump`-Abschlussmarker;
- Zugangsdaten eines existierenden Prüf-Admins sind geschützt als
  `VERIFY_LOGIN_EMAIL` und `VERIFY_LOGIN_PASSWORD` verfügbar;
- bei `--migrate`: Expand/Contract-Kompatibilität und separater DB-Restore-Plan
  sind bestätigt.

## Automatisierter Deploy-Nachweis

`run.sh` muss alle sieben Schritte ohne Warnung abschließen. Für den erzeugten
Release prüfen:

```bash
expected_release=/home/kicktipp/releases/kicktipp-<timestamp>
active_release=$(readlink -f /home/kicktipp/kicktipp-deluxe)
test "$active_release" = "$expected_release"

cat "$expected_release/RELEASE_METADATA"
test "$(stat -c '%a' "$expected_release/.env")" = 600
test -f "$expected_release/server.js"
test -d "$expected_release/public"
test -d "$expected_release/.next/static"
test -x "$expected_release/.migration/node_modules/.bin/prisma"

curl -I --max-time 20 http://127.0.0.1:3000/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/api/auth/signin
curl -I --max-time 20 https://kicktipp.schultypografie.de/dashboard
supervisorctl status kicktipp
```

Erwartet:

- aktiver und erwarteter Release sind exakt identisch;
- Metadaten-Commit ist der freigegebene vollständige SHA und Version ist
  `5.0.0`;
- Build-Plattform, Paketversion und Runtime stimmen mit den Metadaten überein;
- `.env` hat Modus `600`;
- lokaler und öffentlicher Login liefern `200`;
- `/api/auth/signin` liefert keinen `500`;
- `/dashboard` leitet ohne Session mit `307` um;
- Supervisor meldet `RUNNING`.

## Funktionaler Check

`verify-functional.sh` bestätigt automatisiert:

- aktive Release-Identität;
- Redirect ohne Session;
- Credentials-Login eines bestehenden Admins;
- Session mit erwarteter E-Mail und Rolle;
- Dashboard, Tippen und Adminroute mit Session;
- reversiblen `AppSetting`-Write innerhalb einer Transaktion samt `ROLLBACK`;
- Sign-out und vollständig entfernte Session.

Es darf kein temporärer Produktionsbenutzer entstehen und kein Tipp verändert
werden.

## Fachliche Abnahme

- Spieltag, Bundesliga und Statistiken laden über direkte URL, Reload und
  Browser-Zurück;
- Tippen zeigt korrekten Spieltag, Deadline, bestehende Tipps und Joker;
- normaler Benutzer sieht keine Adminfunktionen;
- Admin kann die vorgesehenen Verwaltungsseiten öffnen;
- Produktionsdaten, Rang, Punkte und Ergebnisse sind plausibel;
- Light, Dark und System funktionieren auf Desktop und Mobil;
- Desktop-Sidebar sowie mobile Kopf- und Bottom-Navigation sind bedienbar;
- Tastaturfokus, Dropdowns, Dialoge, Tabellenüberlauf und lange Namen sind
  unauffällig.

## Nach einer Migration

- vollständigen Deploy- und Funktionstest erneut bestätigen;
- Migrationstatus mit der gepinnten Release-Runtime prüfen;
- geänderte Tabellen und kritische Datenmengen stichprobenartig vergleichen;
- altes App-Release darf weiterhin mit dem expandierten Schema starten;
- erst nach Ablauf des Rückfallfensters kontrahierende Folgemigration planen.

## Nach App-Rollback

- aktiver Symlink zeigt auf das erwartete alte Release;
- `RELEASE_METADATA` passt zu diesem Release;
- Supervisor ist `RUNNING` und lokaler Login liefert `200`;
- Login, Dashboard und Daten sind plausibel;
- prüfen, ob eine bereits angewandte Migration separat behandelt werden muss.

## Nach DB-Restore oder JSON-Import

- Schema und aktives Release sind kompatibel;
- Benutzer, Rollen und mindestens ein Admin sind vorhanden;
- aktive Saison und aktiver Spieltag sind getrennt korrekt gesetzt;
- Spiele, Tipps, Joker und Punkte haben erwartete Mengen und Stichprobenwerte;
- `registrationEnabled` ist exakt `true` oder `false`;
- Login, Admin, Sync und Tippabgabe funktionieren.

## Nach Sync- oder Cron-Änderungen

- `POST /api/sync` weist fehlendes/falsches Secret mit `401` zurück;
- gültiges Secret führt nicht zu `401` oder `500`;
- aktiver Spieltag enthält genau neun plausible Partien;
- `syncedAt`, Status, Ergebnisse und Punkte sind konsistent;
- keine OpenLigaDB-ID ist einem anderen Spieltag zugeordnet.

## Freigabestandard

Version 5.0.0 ist erst betriebsseitig freigegeben, wenn Commit-Identität,
Artefaktintegrität, Backups, automatisierte Checks und fachliche Abnahme für
denselben Stand dokumentiert sind. Cleanup erfolgt erst danach explizit.
