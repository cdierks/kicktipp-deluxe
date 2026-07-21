---
target: release/5.0.0
total_score: 36
p0_count: 0
p1_count: 0
timestamp: 2026-07-18T18-08-53Z
slug: v5-release-readiness
---

# Version 5.0.0 – Release Readiness

## Ergebnis

Der V5-Stand hat keine offenen kritischen Accessibility-, Responsive- oder
Designsystembefunde. App-Shell, mobile Navigation, semantische Farbrollen,
Inter-Typografie, gemeinsame Seitenrahmen und die zentralen Admin-/Tipp-Flows
bilden ein konsistentes kompaktes Match-Center. Der Release ist nach einem
grünen Final-Gate für denselben Commit freigabefähig.

## Verbindliches Final-Gate

- `npm run test`
- `npm run typecheck`
- `npm run verify:deploy`
- `npm run build`
- Impeccable-Detector für `src/`
- `npm audit` ohne bekannte Schwachstellen
- `git diff --check`
- produktiver Linux-Container-Build, Backup-Preflight, Smoke- und funktionaler
  Check für den exakten Release-Commit

Die Ergebnisse müssen gemeinsam mit vollständigem Commit-SHA und
`RELEASE_METADATA` dokumentiert werden; ein Testlauf eines anderen
Arbeitsbaumstands ist kein Freigabenachweis.

## Lokaler Abschlusslauf

Am 18. Juli 2026 waren Unit-Tests, TypeScript-Prüfung, Produktions-Build,
Deploy-Syntaxprüfung, Impeccable-Detector, Abhängigkeitsbaum und
`git diff --check` erfolgreich. Die Paketinstallation meldete keine bekannte
Schwachstelle. Eine unabhängige Codeprüfung fand keine P0-/P1-Befunde; ihr
einziger P2-Befund wurde geschlossen, indem der Deploy die verpflichtenden
Prüfzugangsdaten nun vor Build, Migration und Release-Umschaltung validiert.

Linux-Container-Build, Backup-Preflight, Smoke- und Funktionstest bleiben das
verbindliche produktive Gate für den später festgeschriebenen Commit.

## Akzeptierte Restrisiken

### JWT-Sitzungswiderruf

Privilegierte Serveroperationen lesen die aktuelle Rolle aus der Datenbank und
setzen Rollenänderungen damit unmittelbar durch. Bereits ausgestellte JWTs
lassen sich nach Passwortänderung oder Rollenwechsel jedoch nicht zentral
widerrufen; nicht privilegierte Sitzungsclaims können bis zum Ablauf des Tokens
fortbestehen. Eine spätere Härtung sollte eine serverseitige Session- oder
`sessionVersion`-Prüfung einführen.

### CSP-Nonce

Die Content Security Policy begrenzt Quellen, Frames, Objekte, Formulare und
weitere Ressourcentypen. Next.js-Inline-Bootstrap und Styles erfordern derzeit
noch `unsafe-inline`. Eine nonce-basierte, pro Request erzeugte CSP bleibt die
nächste Härtungsstufe.

Diese beiden Punkte sind dokumentierte Defense-in-Depth-Arbeiten und keine
offenen P0/P1-Design- oder Funktionsblocker für 5.0.0.
