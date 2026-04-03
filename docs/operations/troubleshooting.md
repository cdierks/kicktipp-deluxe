# Troubleshooting

## Erstes Vorgehen bei Störungen

1. Prozessstatus prüfen
2. lokalen Backend-Check fahren
3. öffentliche Health-nahe URLs prüfen
4. Supervisor-Logs lesen
5. aktives Release und letzte Änderung identifizieren

Minimalbefehle:

```bash
supervisorctl status kicktipp
curl -I --max-time 20 http://127.0.0.1:3000/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/api/auth/signin
curl -I --max-time 20 https://kicktipp.schultypografie.de/dashboard
```

## Problem: Build auf dem Server stirbt mit `Killed`

### Symptom

- `npm ci` oder `npm run build` endet ohne fachlichen Fehlertext mit `Killed`

### Wahrscheinliche Ursache

- RAM-Limit des Hosts

### Behebung

- lokalen Produktionsbuild verwenden
- Standalone-Output plus `.next/static` hochladen
- kein regulärer Server-Build auf diesem Host, solange keine Reserve bestätigt ist

## Problem: Standalone-Artefakte im Release fehlen oder sind unvollständig

### Symptom

- `supervisorctl start kicktipp` endet mit `spawn error` oder `FATAL`
- `server.js` fehlt im Release
- `.next/static` oder das Standalone-`node_modules` fehlen im aktiven Release

### Ursache

- der Release wurde nicht mit dem Standalone-Output ausgeliefert
- der Upload hat nur Teile von `.next` statt des Runtime-Artefakts übertragen

### Behebung

- lokalen Build erneut erzeugen
- `.next/standalone` in den Release-Root entpacken
- `.next/static` zusaetzlich nach `release/.next/static` uebertragen
- vor dem Umschalten `server.js`, `.next/static`, `node_modules/` und `node_modules/@prisma/client` pruefen

## Problem: Altes externes-`node_modules`-Modell mischt sich noch in die Laufzeit

### Symptom

- alte Releases enthalten `node_modules`-Symlinks auf andere Releases
- ein Neustart haengt von frueheren Releases ab
- der aktive Release ist nicht aus sich selbst heraus startfaehig

### Ursache

- Altlast aus dem frueheren Runtime-Modell
- versteckte Abhaengigkeit zu einer historischen Release-Kette

### Behebung

- aktiven Release auf echte Standalone-Artefakte umstellen
- keine externe produktive `node_modules`-Basis mehr als Standard voraussetzen
- alte Symlink-Ketten nur noch als Rollback-Artefakte behandeln oder bereinigen

## Problem: `/login` funktioniert, aber Auth- oder Server-Routen liefern `500`

### Typisches Symptom

- App startet scheinbar
- `/login` antwortet
- `/api/auth/signin` oder geschützte Seiten brechen mit `500`

### Bekannte Ursache

Im Altmodell aus lokalem `.next` plus externer Runtime konnten Prisma-Runtime-Module im Release fehlen. AP2 stellt deshalb auf Standalone-Artefakte um, damit dieser Hotfix im Standardpfad entfaellt.

Typischer Fehler im alten Modell:

```text
Failed to load external module @prisma/client-<hash>/runtime/client
```

### Behebung

- sicherstellen, dass der Release aus `.next/standalone` gestartet wird
- aktiven Release nicht mit externem `node_modules` mischen
- Deploy erneut mit Standalone-Upload fahren

Danach pruefen:

```bash
curl -I --max-time 20 https://kicktipp.schultypografie.de/api/auth/signin
curl -I --max-time 20 https://kicktipp.schultypografie.de/dashboard
```

Erwartet:

- kein `500` mehr auf `/api/auth/signin`
- `/dashboard` ohne Session liefert `307`

## Problem: `/api/sync` liefert `401`

### Ursache

- `x-cron-secret` fehlt oder passt nicht zu `CRON_SECRET`

### Behebung

- Secret in Zielinstanz prüfen
- Headernamen exakt setzen
- Cron-Konfiguration gegen produktive `.env` abgleichen

## Problem: Login funktioniert nicht

### Prüfpunkte

- Datenbank erreichbar
- `DATABASE_URL` korrekt
- mindestens ein Benutzer vorhanden
- `NEXTAUTH_SECRET` gesetzt
- `NEXTAUTH_URL` stimmt mit der öffentlichen URL überein

### Zusatzhinweis

Da der Credentials-Provider direkt gegen die Datenbank prüft, ist ein Loginfehler oft ein Datenbank- oder Datenproblem, nicht nur ein Frontend-Problem.

## Problem: Funktionale Verifikation scheitert nach erfolgreichem Smoke-Check

### Typische Symptome

- `verify-functional.sh` bricht bei `credentials login` mit `401` ab
- `/dashboard` oder `/admin/benutzer` liefern nach Login nicht `200`
- die Verifikation bricht beim reversiblen Schreibtest ab

### Pruefpunkte

- wurde der Verifikationslauf mit expliziten `VERIFY_LOGIN_*`-Werten gegen veraltete oder falsche Zugangsdaten gestartet
- kann das Skript auf dem Zielhost temporaer einen Verifikationsbenutzer in der Datenbank anlegen und wieder entfernen
- existiert ein aktiver Spieltag fuer den bevorzugten Tipp-Schreibtest
- ist der Datenbankzugriff aus dem aktiven Release ueber `DATABASE_URL` intakt

### Behebung

- Funktionstest ohne explizite Login-Daten erneut starten, damit ein temporaerer Admin-Benutzer automatisch angelegt wird
- bei Fehlschlag des Tipp-Schreibtests pruefen, ob aktive Spieltage und Matches vorhanden sind
- bei Datenbankfehlern zuerst `DATABASE_URL` und die Erreichbarkeit des MySQL-Servers validieren
- Deploy nicht bereinigen; Rollback-Kandidaten erhalten, bis der Funktionstest grün ist

## Problem: Daten nach Import oder Restore unplausibel

### Prüfpunkte

- wurde ein SQL-Restore oder ein JSON-App-Import verwendet
- sind Migrationen und Datenstand kompatibel
- ist die aktive Saison korrekt gesetzt
- existieren Spieltage, Matches und Tipps in erwarteter Anzahl

## Relevante Log-Orte

- `/home/kicktipp/logs/supervisord/kicktipp.log`
- `/home/kicktipp/logs/supervisord/kicktipp.err`

## Eskalationsregel

Wenn die Störung nicht klar auf Runtime, Build oder Datenbank eingegrenzt werden kann, zuerst das letzte funktionierende Release wiederherstellen und danach die Analyse am nicht-produktiven Stand fortsetzen.
