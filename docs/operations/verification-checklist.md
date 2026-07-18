# Verifikationscheckliste

## Nach jedem Deploy

```bash
expected_release=/home/kicktipp/releases/kicktipp-<timestamp>
active_release=$(readlink -f /home/kicktipp/kicktipp-deluxe)
test "$active_release" = "$expected_release"
curl -I --max-time 20 http://127.0.0.1:3000/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/login
curl -I --max-time 20 https://kicktipp.schultypografie.de/api/auth/signin
curl -I --max-time 20 https://kicktipp.schultypografie.de/dashboard
supervisorctl status kicktipp
```

Erwartet:

- aktiver Release-Pfad entspricht exakt dem erwarteten Release
- lokaler Backend-Check: `HTTP/1.1 200 OK`
- öffentliche Login-URL: `HTTP/2 200`
- `/api/auth/signin`: kein `500`
- `/dashboard` ohne Session: `307` auf den Sign-in-Flow
- `supervisorctl status kicktipp`: `RUNNING`

Danach manuell prüfen:

- Login möglich
- Dashboard lädt
- Tippabgabe erreichbar
- Admin-Bereich lädt
- bestehende Produktionsdaten sichtbar

## Nach einer Migration

- Deploy-Checks komplett durchlaufen
- Login mit Admin testen
- Admin-Ansicht für Spieltage prüfen
- Stichprobe auf Tabellen mit geänderter Struktur oder neuem Verhalten machen

## Nach einem Rollback

- aktiver Symlink zeigt auf das erwartete alte Release
- `supervisorctl status kicktipp` ist `RUNNING`
- Login und Dashboard funktionieren
- keine offensichtlichen Dateninkonsistenzen zum erwarteten Rückfallzeitpunkt

## Nach Sync- oder Cron-Änderungen

- `POST /api/sync` mit gültigem `x-cron-secret` testen
- kein `401`
- kein `500`
- `syncedAt` eines betroffenen Spieltags aktualisiert sich

## Nach Backup- oder Restore-Eingriffen

- Anwendungsdaten sind vollständig sichtbar
- aktive Saison korrekt
- Benutzer und Rollen plausibel
- Tipps und Spiele in erwarteter Menge vorhanden

## Freigabestandard

Ein Eingriff gilt erst dann als betriebsseitig akzeptiert, wenn:

- Prozessstatus stabil ist
- die vier HTTP-Schnelltests unauffällig sind
- Kernfunktionen manuell gegengeprüft wurden
- bei Datenbankeingriffen die Daten plausibel sind
