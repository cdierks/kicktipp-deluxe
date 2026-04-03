# Betriebsreferenz

Diese Referenz beschreibt den operativen Betrieb von `kicktipp-deluxe` für zwei Fälle:

- Self-Hosting einer eigenen Instanz
- Wartung der aktuell produktiven Uberspace-Installation

Die Sammlung ist bewusst als Nachschlagewerk organisiert. Sie erklärt, wie das System betrieben wird, welche Komponenten kritisch sind, welche Kommandos im Alltag relevant sind und wie typische Störungen eingegrenzt werden.

## Inhalt

- [Umgebung](./environment.md): Laufzeitvoraussetzungen, Secrets, externe Abhängigkeiten und Betriebsgrenzen
- [Deployment](./deployment.md): aktueller Deploy-Pfad, Release-Struktur und Umschalten eines Releases
- [Backups und Rollback](./backups-and-rollback.md): Pflicht-Backups, Wiederherstellung und Rückfall auf den letzten Stand
- [Runtime-Services](./runtime-services.md): `supervisord`, Web-Backend, Pfade, Logs und Erwartungswerte im Betrieb
- [Datenbank](./database.md): MariaDB/Prisma-Betriebsreferenz, Migrationen, Seed und Datenmodell-Schwerpunkte
- [Club-Icons](./club-icons.md): lokaler Mirror-Workflow, Fehlenden-Liste, Batch-Retries und Platzhalter
- [Synchronisation](./synchronization.md): OpenLigaDB-Sync, Cron-Endpunkt und betriebliche Prüfungen
- [Troubleshooting](./troubleshooting.md): bekannte Produktionsfallen, Symptome, Ursachen und Behebungen
- [Verifikationscheckliste](./verification-checklist.md): Minimalprüfungen nach Deploy, Rollback und Eingriffen

## Zielgruppe

Diese Referenz richtet sich an:

- den Maintainer dieses Projekts
- jede Person, die das Projekt selbst installiert und betreibt

Vorausgesetzt werden:

- sicherer Umgang mit Shell, SSH und Node.js
- Grundwissen zu Next.js, MariaDB/MySQL und Prozessmanagement

## Nicht enthalten

Diese Referenz ist keine Einführung in:

- Next.js-Entwicklung
- Prisma-Schemaentwicklung im Allgemeinen
- Uberspace-Grundlagen außerhalb der für dieses Projekt benötigten Kommandos

Für die lokale Projektinbetriebnahme und den Entwicklungsmodus bleibt [README.md](../../README.md) die erste Anlaufstelle. Diese Referenz beschreibt dagegen den stabilen Betrieb.
