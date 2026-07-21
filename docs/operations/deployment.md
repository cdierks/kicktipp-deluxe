# Deployment

Die vollständige operative Anleitung steht in [DEPLOY.md](../../DEPLOY.md).
Diese Seite fasst die unveränderlichen Release-Eigenschaften zusammen.

## Release-Modell

Der aktive App-Pfad ist ein Symlink auf genau ein direktes Kind von
`/home/kicktipp/releases`:

```text
/home/kicktipp/kicktipp-deluxe
  -> /home/kicktipp/releases/kicktipp-20260718-153810
```

Ein Release enthält:

- den exakten, versionierten Quellstand;
- `RELEASE_METADATA` mit Commit, Version, UTC-Zeit, Build-Plattform und Image;
- die vollständige Next.js-Standalone-Runtime mit `server.js`, `public` und
  `.next/static`;
- Linux-native Abhängigkeiten für die Zielarchitektur;
- die über Lockfile gepinnte Prisma-7.8.0-Migrationsruntime unter `.migration`;
- die produktive `.env` mit Dateimodus `600`.

Das Artefakt wird lokal aus einem einmal ermittelten vollständigen Commit-SHA
in Docker für `linux/amd64` beziehungsweise `linux/arm64` gebaut. Weder der
uncommittete Arbeitsbaum noch lokale, ignorierte Dateien werden archiviert.
Ein Server-Build oder eine externe `node_modules`-Kette ist kein unterstützter
Notfallpfad.

## Operativer Standard

```text
valide Backups
  -> Preflight und Remote-Lock
  -> exakten Release anlegen
  -> Linux-Standalone-Artefakt hochladen
  -> Runtime validieren
  -> optional mit gepinnter Runtime migrieren
  -> Symlink umschalten
  -> Smoke- und Funktionstest
  -> später explizit bereinigen
```

Ausgeführt wird der Ablauf lokal mit:

```bash
bash scripts/deploy/run.sh
```

Für den Funktionstest müssen `VERIFY_LOGIN_EMAIL` und
`VERIFY_LOGIN_PASSWORD` auf einen existierenden Administrator zeigen. Das
Skript erstellt keinen temporären Produktionsaccount. Während des gesamten
Ablaufs verhindert ein Remote-Lock parallele Deployments.

## Rollback-Grenze

Fehler beim Start, Smoke-Check oder Funktionstest lösen einen automatischen
App-Rollback auf den Release-spezifischen Predeploy-Fallback aus. Der Fallback
für `.../releases/kicktipp-<id>` heißt
`.../kicktipp-deluxe-predeploy-kicktipp-<id>`.

Bereits angewendete Datenbankmigrationen werden dabei nicht zurückgenommen.
Migrationen müssen deshalb expand/contract-kompatibel sein; vor `--migrate`
sind ein aktuelles SQL-Backup und ein separat getesteter DB-Restore-Plan
verpflichtend.

## Nach dem Deploy

Cleanup bleibt immer eine eigene, explizite Entscheidung. Erst nach
erfolgreicher technischer und fachlicher Abnahme dürfen ausgewählte Releases,
Fallbacks oder Backups über `cleanup.sh` entfernt werden. Die Retention- und
Zielschutzregeln des Skripts sind verbindlich.
