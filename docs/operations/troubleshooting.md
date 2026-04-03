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
- nur reduzierte `.next`-Artefakte hochladen
- kein regulärer Server-Build auf diesem Host, solange keine Reserve bestätigt ist

## Problem: zweites `node_modules` passt nicht mehr sauber auf den Host

### Symptom

- Quota-Probleme oder unnötig hoher Platzverbrauch während des Deploys

### Ursache

- pro Release wird ein weiteres vollständiges `node_modules` angelegt

### Behebung

- bestehende produktive `node_modules` für den Laufzeitbetrieb per Symlink wiederverwenden

## Problem: Turbopack-Server-Build mit ausgelagertem `node_modules` scheitert

### Symptom

- Buildfehler mit Hinweis auf ungültigen Symlink außerhalb des Filesystem-Roots

### Ursache

- Symlinktes `node_modules` ist für diesen Build-Pfad ungeeignet

### Behebung

- keinen Turbopack-Server-Build auf Basis des Laufzeit-Symlinks fahren
- stattdessen lokalen Build plus Laufzeit-Symlink verwenden

## Problem: `/login` funktioniert, aber Auth- oder Server-Routen liefern `500`

### Typisches Symptom

- App startet scheinbar
- `/login` antwortet
- `/api/auth/signin` oder geschützte Seiten brechen mit `500`

### Bekannte Ursache

Bei lokal erzeugten Turbopack-Artefakten kann im Release ein Prisma-Runtime-Link fehlen.

Typischer Fehler im Log:

```text
Failed to load external module @prisma/client-<hash>/runtime/client
```

### Behebung

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
