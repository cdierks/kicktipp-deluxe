# Runtime-Services

## Produktionsprozess

Die aktuelle Produktion läuft als `supervisord`-Programm mit dem Namen `kicktipp`.

Der Service startet den Standalone-Server des aktiven Releases. Ein produktiver Release muss deshalb seine komplette Node-Laufzeit selbst mitbringen.

Versionierte Service-Definition:

```ini
[program:kicktipp]
directory=/home/kicktipp/kicktipp-deluxe
command=/usr/bin/node /home/kicktipp/kicktipp-deluxe/server.js
autostart=yes
autorestart=yes
startsecs=15
stderr_logfile=/home/kicktipp/logs/supervisord/kicktipp.err
stdout_logfile=/home/kicktipp/logs/supervisord/kicktipp.log
environment=NODE_ENV="production",PORT="3000"
```

Quelle: [scripts/kicktipp.ini](../../scripts/kicktipp.ini)

## Erwarteter Laufzeitzustand

Im Normalbetrieb gilt:

- `supervisorctl status kicktipp` zeigt `RUNNING`
- die App antwortet lokal auf `http://127.0.0.1:3000`
- die Domain ist auf dieses Backend gemappt

## Relevante Pfade auf dem Host

- aktiver App-Pfad: `/home/kicktipp/kicktipp-deluxe`
- Release-Verzeichnisse: `/home/kicktipp/releases/kicktipp-*`
- vorheriger aktiver Stand: `/home/kicktipp/kicktipp-deluxe-predeploy-*`
- Standalone-Entrypoint im aktiven Release: `/home/kicktipp/kicktipp-deluxe/server.js`
- Standalone-Static-Dateien: `/home/kicktipp/kicktipp-deluxe/.next/static`
- Supervisor-Logs:
  - `/home/kicktipp/logs/supervisord/kicktipp.log`
  - `/home/kicktipp/logs/supervisord/kicktipp.err`

## Betriebsbefehle

### Status

```bash
supervisorctl status kicktipp
uberspace web backend list
```

### Neustart

```bash
supervisorctl restart kicktipp
```

### Stoppen und Starten

```bash
supervisorctl stop kicktipp
supervisorctl start kicktipp
```

## Was als normal gilt

- ein kurzer Startvorlauf wegen `startsecs=15`
- `307`-Redirects auf geschützten Seiten ohne Session
- erfolgreiche Antworten auf `/login` und `/api/auth/signin`
- erfolgreicher Session-Aufbau ueber den Credentials-Login
- authentifizierter Zugriff auf Dashboard und Admin-Bereich

## Was ein Warnsignal ist

- `BACKOFF`, `FATAL` oder dauerhaftes Neustarten im Supervisor-Status
- fehlendes `server.js` oder fehlende `.next/static` im aktiven Release
- `500` auf `/api/auth/signin`
- `500` auf Server-Routen nach ansonsten erfolgreichem Start
- App startet, aber geschützte Seiten oder Auth-Endpunkte brechen weg

## Auth-Laufzeitmodell

Die Anwendung nutzt NextAuth mit:

- Session-Strategie `jwt`
- eigener Login-Seite `/login`
- Credentials-Provider auf Basis lokaler Benutzer in der Datenbank

Betrieblich relevant:

- fehlerhafte Datenbankverbindung trifft den Login direkt
- inkonsistente `NEXTAUTH_URL` oder `NEXTAUTH_SECRET` führen schnell zu Auth-Anomalien

## Erstdiagnose bei Laufzeitproblemen

1. `supervisorctl status kicktipp`
2. `curl -I --max-time 20 http://127.0.0.1:3000/login`
3. `curl -I --max-time 20 https://kicktipp.schultypografie.de/api/auth/signin`
4. Supervisor-Logs prüfen
5. aktives Release und Symlink-Ziel prüfen
6. Standalone-Entrypoint und Static-Artefakte im aktiven Release prüfen

Wenn `/login` funktioniert, aber Server-Routen oder Auth-Endpunkte `500` liefern, ist ein Release-spezifisches Laufzeitproblem wahrscheinlich, nicht zwingend ein kompletter Prozessausfall.
