# Synchronisation

## Zweck

Die Anwendung synchronisiert Spielstände über OpenLigaDB.

Relevant sind zwei Wege:

- manueller Sync eines Spieltags im Admin-Bereich
- automatischer Sync über den HTTP-Endpunkt `/api/sync`

## Externe Quelle

- Dienst: OpenLigaDB
- API-Key: keiner erforderlich

Wenn OpenLigaDB stört oder fehlerhafte Antworten liefert, ist die Anwendung selbst nicht zwingend defekt. Betroffen sind dann primär:

- Ergebnis-Synchronisation
- Vereinsdaten-Aktualisierung

## HTTP-Cron-Endpunkt

Die Anwendung stellt diesen Endpunkt bereit:

```text
POST /api/sync
Header: x-cron-secret: <CRON_SECRET>
```

Verhalten:

- fehlender oder falscher Header: `401 Unauthorized`
- erfolgreicher interner Sync: JSON-Antwort mit Sync-Ergebnis
- unbehandelter Fehler im Sync-Pfad: `500`

Implementationsrelevant:

- nur `POST` ist vorgesehen
- das Secret wird direkt gegen `process.env.CRON_SECRET` verglichen

## Manueller Sync

Im Admin-Bereich können Spieltage gezielt synchronisiert werden.

Betrieblich sinnvoll bei:

- verzogenem Cronlauf
- Einzelkorrekturen nach API-Problemen
- Verifikation direkt nach Ergebnisfreigaben

## Fachlich relevanter Zustand

Ein erfolgreicher Sync aktualisiert unter anderem:

- Spiele eines Spieltags
- Spielstatus
- Scores
- `syncedAt` des Spieltags

## Clubs-Aktualisierung

Zusätzlich existiert eine Admin-Aktion zur Aktualisierung von Vereinsdaten aus:

- `bl1`
- `bl2`
- `bl3`

Auch diese Funktion hängt von OpenLigaDB ab.

## Operative Schnelltests

### Cron-Endpunkt prüfen

```bash
curl -i -X POST \
  -H "x-cron-secret: <CRON_SECRET>" \
  https://kicktipp.schultypografie.de/api/sync
```

### Erwartungsbild

- mit korrektem Secret kein `401`
- bei gesundem System kein `500`
- nach erfolgreichem Sync aktualisiert sich `syncedAt` des aktiven Spieltags

## Typische Fehlerbilder

### `401 Unauthorized`

Ursachen:

- `CRON_SECRET` falsch
- Headername falsch
- Secret nicht auf Zielinstanz gesetzt

### `500` beim Sync

Ursachen:

- OpenLigaDB liefert Fehler oder Timeout
- Datenbankproblem während Upsert
- Release-spezifischer Laufzeitfehler

## Nachkontrolle nach einem Sync

- Admin-Ansicht für Spieltage prüfen
- `syncedAt` des betroffenen Spieltags ansehen
- Stichprobe: sind Scores und Match-Status plausibel
- falls Punkte neu berechnet werden müssen, fachliche Folgeeffekte prüfen
