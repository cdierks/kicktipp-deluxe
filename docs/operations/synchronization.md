# Synchronisation

## Zweck und Wege

Ergebnisse und Spielstatus werden über OpenLigaDB synchronisiert:

- manuell für einen ausgewählten Spieltag im Adminbereich;
- automatisch für den aktiven Spieltag über `POST /api/sync`.

OpenLigaDB benötigt keinen API-Key. Ein Ausfall betrifft die Aktualisierung,
nicht den Zugriff auf bereits gespeicherte Daten.

## HTTP-Cron-Endpunkt

```text
POST /api/sync
x-cron-secret: <CRON_SECRET>
```

Die Anwendung validiert `CRON_SECRET` beim Start und vergleicht den Header nach
einer Längenprüfung mit `crypto.timingSafeEqual`. Es wird kein Klartextvergleich
verwendet.

Erwartete Antworten:

- fehlendes oder falsches Secret: `401 Unauthorized`;
- erfolgreicher Sync: `200` mit JSON-Ergebnis;
- externer, Validierungs- oder Datenbankfehler: `500` mit generischer
  Fehlermeldung.

Das Secret darf nur im Cron-Dienst und in der geschützten Serverkonfiguration
liegen. Nicht in URL-Querys, Logs oder Tickets kopieren.

## Validierung und Schreibverhalten

Der gemeinsame Sync-Kern für Cron und Admin:

- lädt ausschließlich den ausgewählten Spieltag;
- begrenzt externe Requests durch einen Timeout;
- validiert Typen, IDs, Teams, Termine, Ergebnisse und Status;
- verlangt für einen Bundesliga-Spieltag genau neun eindeutige Spiele und 18
  eindeutige Teams;
- verhindert die Wiederverwendung einer OpenLigaDB-Spiel-ID in einem anderen
  Spieltag;
- gleicht kontrolliert nur noch ungetippte, veraltete Fixtures ab und weist
  widersprüchliche Bestandsdaten zurück;
- setzt ein Spiel nur mit vollständigem Endergebnis auf abgeschlossen;
- schreibt Spiele und `syncedAt` transaktional;
- berechnet Punkte anschließend konsistent neu beziehungsweise entfernt
  überholte Wertungen.

Ein Sync darf deshalb bei einer unvollständigen oder unerwarteten Provider-
Antwort fehlschlagen, statt einen teilweise gültigen Spieltag zu speichern.

## Manueller Sync

Die Server Action verlangt eine aktive Adminberechtigung und eine valide
Spieltag-ID. Sinnvolle Einsatzfälle sind:

- ein verzögerter Cronlauf;
- eine Nachkontrolle nach Provider-Problemen;
- eine gezielte Aktualisierung nach Ergebnisfreigabe.

## Clubdaten und Icons

Clubdaten sind keine zur Laufzeit veränderliche Adminfunktion. Sie werden
kontrolliert im Repository erzeugt:

```bash
npm run generate:clubs -- <season-start-year>
npm run mirror:club-icons
npm run list:missing-club-icons
npm run build
```

`generate:clubs` schreibt die statische, versionierte Clubquelle; die Icons
werden lokal unter `public/club-icons` ausgeliefert. Damit gelangen saisonale
Änderungen nur als prüfbarer Code-/Asset-Stand in einen Release.

## Operative Prüfung

```bash
curl -i --max-time 20 \
  -X POST \
  -H 'x-cron-secret: <CRON_SECRET>' \
  https://kicktipp.schultypografie.de/api/sync
```

Danach prüfen:

- HTTP-Status ist weder `401` noch `500`;
- `syncedAt` des aktiven Spieltags wurde aktualisiert;
- neun Partien, Vereinszuordnung, Anstoßzeiten, Scores und Status sind
  plausibel;
- Punkte und Joker-Auswertung entsprechen den Endergebnissen;
- Supervisor-Logs enthalten keine wiederholte Sync-Fehlerschleife.

Bei `500` zuerst OpenLigaDB-Erreichbarkeit, Provider-Antwort, aktive
Spieltagskonfiguration und Datenbankverbindung prüfen. Nicht durch manuelle
Teil-Updates umgehen.
