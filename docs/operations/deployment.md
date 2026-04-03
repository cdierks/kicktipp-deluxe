# Deployment

Die vollstaendige operative Deploy-Anleitung steht in [DEPLOY.md](../../DEPLOY.md).
Diese Datei beschreibt nur noch die Release-Struktur und den Verweis auf den Standardpfad.

## Release-Struktur

Der aktive App-Pfad ist ein Symlink auf ein Release-Verzeichnis.

Beispiel:

```text
/home/kicktipp/kicktipp-deluxe -> /home/kicktipp/releases/kicktipp-20260403-003441
```

Dieses Modell erlaubt:

- atomisches Umschalten auf einen neuen Stand
- Rollback per Symlink-Wechsel
- klare Trennung zwischen altem und neuem Release

## Operativer Standard

Produktive Releases werden lokal ueber `scripts/deploy/*.sh` aus dem Repository heraus gestartet.
Der verbindliche Ablauf ist in [DEPLOY.md](../../DEPLOY.md) dokumentiert.
Der Runtime-Standard ist der Standalone-Output des lokalen Next.js-Builds.

Kurzform:

1. Pflicht-Backups
2. `bash scripts/deploy/run.sh`
3. erfolgreiche Smoke- und funktionale Verifikation
4. expliziter Cleanup

## Ausnahmen

- Server-Builds auf dem Host bleiben ein Notfallpfad
- Prisma-/Turbopack-Runtime-Fixes sind Troubleshooting, nicht Standardablauf
