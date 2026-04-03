# Kicktipp Deluxe – Roadmap für Version 3

## Kurzfassung

Version `3.0` wird ein **fokussierter Stabilitäts-Release**.  
Das Hauptziel ist ein reproduzierbarer Produktionspfad für Uberspace, damit Deployments, Runtime-Artefakte und Verifikation nicht mehr ad hoc nachgezogen werden müssen.

Nach außen bleibt `v3` bewusst klein: Neben der Technik gibt es genau **ein kleines sichtbares Produktziel** im Bereich `Spieler / Tipps`.

Leitsatz:

> Version 3 macht Deployments, Runtime und Produktionsbetrieb zuverlässig. Sichtbar nach außen bleibt der Release bewusst klein.

## Arbeitspaket 1 – Deploy-Pfad härten

### Ziel

Ein verbindlicher Standardpfad für produktive Releases auf Uberspace.

### Warum das in v3 ist

Der aktuelle Produktionspfad funktioniert, ist aber noch zu stark von manuellen Entscheidungen und Sonderfällen geprägt:

- lokaler Build statt Server-Build
- Quota-Grenzen auf dem Host
- reduzierte `.next`-Uploads
- Sonderbehandlung bei `node_modules`

### Nach v3 muss konkret besser sein

- Es gibt genau einen dokumentierten Standardpfad für produktive Releases.
- Ein Deploy ist ohne improvisierte Zwischenentscheidungen möglich.
- Die Reihenfolge `Build -> Upload -> Umschalten -> Verifikation` ist verbindlich festgelegt.
- Der Host-spezifische Uberspace-Pfad ist nicht mehr „Workaround-Wissen“, sondern offizieller Betriebsstandard.

## Arbeitspaket 2 – Runtime-Artefakte stabilisieren

### Ziel

Build-Output und produktive Laufzeit müssen vollständig zueinander passen.

### Warum das in v3 ist

Der kritischste Fehler im `2.6.0`-Deploy war kein UI-Fehler, sondern ein Artefakt-Mismatch:

- einzelne Server-Routen liefen
- andere Routen fielen mit fehlender Prisma-Runtime aus
- Fehler waren erst nach Umschaltung in Produktion sichtbar

### Nach v3 muss konkret besser sein

- Ein produktiver Release enthält alle Laufzeit-Artefakte, die `next start` benötigt.
- Prisma-bezogene Server-Routen dürfen nicht mehr an fehlenden Runtime-Modulen scheitern.
- Release-Artefakte müssen reproduzierbar sein und nicht durch nachträgliche Hotfixes ergänzt werden.
- Der Unterschied zwischen lokalem Build und produktiver Laufzeit ist im Prozess explizit berücksichtigt.

## Arbeitspaket 3 – Produktionsverifikation standardisieren

### Ziel

Jeder Release wird mit einer festen Abnahme geprüft, bevor er als erfolgreich gilt.

### Warum das in v3 ist

Ein `RUNNING`-Dienst allein reicht nicht als Erfolgskriterium.  
Ein Release kann formal laufen und trotzdem auf einzelnen produktiven Pfaden `500` liefern.

### Nach v3 muss konkret besser sein

Jeder produktive Release wird mindestens gegen diese Pfade geprüft:

- `/login` -> `200`
- `/api/auth/signin` -> kein `500`
- `/dashboard` ohne Session -> korrekter Redirect in den Sign-in-Flow
- mindestens eine Admin-Route -> kein Runtime-Fehler

Zusätzlich muss immer geprüft werden:

- aktiver Release-Pfad
- `supervisorctl status`
- öffentlicher HTTPS-Endpunkt
- lokaler Backend-Endpunkt auf `127.0.0.1:3000`

Definition von „Release erfolgreich“:

- nicht nur Dienst gestartet
- sondern Dienst gestartet **und** Kernrouten funktional verifiziert

## Arbeitspaket 4 – Technische Dokumentation und Betriebswissen bündeln

### Ziel

Die Betriebsrealität des Projekts wird sauber dokumentiert und nicht mehr nur aus Deploy-Verläufen rekonstruiert.

### Warum das in v3 ist

Aktuell steckt wichtiges Wissen an mehreren Stellen:

- in `DEPLOY.md`
- in Deploy-Verläufen
- in situativen Fixes
- in impliziten Annahmen über Uberspace

### Nach v3 muss konkret besser sein

- `DEPLOY.md` bleibt die operative Anleitung.
- Diese Roadmap beschreibt das strategische Zielbild für `v3`.
- Host-spezifische Besonderheiten sind dokumentiert:
  - Quota
  - Build-Grenzen
  - Supervisor-/Backend-Struktur
  - Runtime-Fallen mit Turbopack/Prisma
- Ein neuer Deploy soll nicht mehr davon abhängen, dass frühere Fehlersituationen noch im Kopf präsent sind.

## Arbeitspaket 5 – Kleines sichtbares Produktziel: Spieler-/Tipp-Feinschliff

### Ziel

Neben der Technik bekommt `v3` genau ein kleines sichtbares Produktpaket.

### Warum das in v3 ist

Ein rein technischer Release ist intern sinnvoll, aber nach außen oft schwer greifbar.  
Ein eng begrenztes sichtbares Upgrade hält `v3` produktseitig relevant, ohne den Fokus zu verwässern.

### Leitplanken

- kein großer neuer Feature-Block
- keine breite UX-Wunschliste
- nur ein zusammenhängendes Ziel
- soll direkt auf dem stabileren Fundament aufsetzen

### Geeigneter Zuschnitt

Der sichtbare Teil von `v3` soll aus dem Bereich `Spieler / Tipps` kommen, zum Beispiel:

- gezielter Feinschliff im Vergleichsmodus
- präzisere Statusdarstellung
- klarere Mikro-Interaktionen oder Verifikationszustände

Die genaue Umsetzung wird später separat geplant.  
Wichtig für die Roadmap ist nur: `v3` bleibt technisch fokussiert, und der sichtbare Produktanteil bleibt bewusst klein.

## Abnahme für Version 3

Version `3.0` ist erfolgreich, wenn diese Punkte erfüllt sind:

- Deployments auf Uberspace laufen über einen definierten Standardpfad.
- Produktionsreleases brauchen keine improvisierten Runtime-Hotfixes mehr.
- Auth-, Dashboard- und Admin-Kernrouten lassen sich nach jedem Release verbindlich prüfen.
- Ein Release gilt erst nach technischer **und** funktionaler Verifikation als erfolgreich.
- Neben der Technik gibt es genau ein kleines sichtbares Spieler-/Tipp-Upgrade.

## Nicht Ziel von v3

Diese Themen sind bewusst **nicht** Kern von `v3`:

- großer Feature-Ausbau
- breiter UX-Relaunch
- vollständige CI/CD-Einführung
- Plattformwechsel
- mehrere parallele Produktinitiativen

## Arbeitsannahmen

- `v3` ist ein fokussierter technischer Stabilitäts-Release.
- Die technische Tiefe reicht bis `Build / Deploy / Runtime / Verifikation`.
- Die Roadmap ist als **interne Leitlinie** gedacht, nicht als öffentliche Release-Note.
- Das kleine sichtbare Produktziel bleibt absichtlich untergeordnet.
