# Club-Icons

## Zweck

Die Vereinslogos werden bevorzugt lokal aus `public/club-icons` ausgeliefert.

Ziel dieses Workflows:

- keine browserabhängigen Ausfälle durch direkte Drittserver-Aufrufe
- keine Mixed-Content-Probleme
- kontrollierbare saisonale Aktualisierung der Club-Icons
- reproduzierbarer Nachziehprozess bei fehlenden Dateien

## Laufzeitverhalten

Die Clubdaten in [src/lib/clubs.ts](../../src/lib/clubs.ts) enthalten pro Verein:

- `iconUrl`: lokaler Pfad unter `/club-icons/...`
- `iconSourceUrl`: ursprüngliche externe Quelle

Das Rendering läuft zentral über [src/components/club-icon.tsx](../../src/components/club-icon.tsx).

Reihenfolge im Betrieb:

1. lokale Datei aus `iconUrl`
2. externer Fallback aus `iconSourceUrl`, falls lokal noch nichts liegt
3. sichtbarer Text-Fallback, falls auch die Remote-Quelle scheitert

## Relevante Skripte

### Clubdaten auf lokale Pfade umstellen

```bash
npm run localize:clubs
```

Verwendung:

- einmalig nach Einführung des lokalen Mirror-Workflows
- bei Bedarf nach strukturellen Änderungen am Icon-Pfadschema

### Fehlende lokale Club-Icons auflisten

```bash
npm run list:missing-club-icons
```

Ausgabe:

- Vereinsname
- erwarteter lokaler Pfad
- aktuelle Remote-Quelle

### Fehlende Club-Icons spiegeln

```bash
npm run mirror:club-icons
```

Standardverhalten:

- lädt nur fehlende Dateien
- überspringt bereits vorhandene lokale Icons
- versucht bei `HTTP 429` Retries mit Backoff

### In kleinen Chargen nachziehen

```bash
npm run mirror:club-icons -- --limit 3
npm run mirror:club-icons -- --offset 3 --limit 3
npm run mirror:club-icons -- --match "Wolfsburg"
```

Sinnvoll bei:

- Wikimedia-Rate-Limits
- manueller Nacharbeit einzelner Vereine
- saisonalen Korrekturen ohne Vollscan

### Platzhalter für noch fehlende lokale Dateien erzeugen

```bash
npm run generate:missing-club-icon-placeholders
```

Diese Platzhalter:

- sichern die vollständige lokale Auslieferung sofort ab
- verhindern sichtbare Lücken in der UI
- ersetzen keine echten Vereinslogos, solange die Spiegelung noch unvollständig ist

## Empfohlener Saison-Workflow

1. `npm run generate:clubs -- <season-start-year>`
2. `npm run mirror:club-icons`
3. `npm run list:missing-club-icons`
4. falls nötig kleine Nachzieh-Batches mit `--limit`, `--offset` oder `--match`
5. optional `npm run generate:missing-club-icon-placeholders`
6. `npm run build`

## Betriebsrealität

Bei Wikimedia-Quellen können `HTTP 429`-Antworten auftreten.

Das ist in diesem Projekt kein App-Fehler, sondern ein externes Drosselungsproblem. Der vorgesehene Umgang ist:

- zuerst lokal gespiegelte Dateien verwenden
- fehlende Dateien in kleinen Chargen nachziehen
- bis zur vollständigen Spiegelung Platzhalter lokal erzeugen

## Prüfpunkte

- `find public/club-icons -type f | wc -l`
- `npm run list:missing-club-icons`
- UI-Stichprobe in Dashboard, Tippen, Profil und Spielerprofil
- `npm run build`
