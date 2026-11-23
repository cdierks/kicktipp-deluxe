# Redesign: Prüfung gegen DESIGN.md §9

Stand: 23.11.2026. `✓` = im Quellcode und, wo möglich, in der lokalen Browser-Vorschau geprüft. `◐` = im Quellcode geprüft; eine angemeldete Sichtprüfung steht noch aus. `—` = für diesen Screen nicht relevant.

| Screen | Hierarchie | Farbe | Du | Spieler | Ergebnisse | Zahlen | Raster | Zustände | Mobil | Dunkel | Texte | Wachstum |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Spieltag und historischer Spieltag | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tippen | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ |
| Statistiken | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bundesliga | ✓ | ◐ | — | — | — | ✓ | ◐ | ◐ | ◐ | ◐ | ✓ | — |
| Spielerprofil und Profil | ✓ | ◐ | ✓ | ✓ | ◐ | ✓ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Admin: Übersicht, Spieltage, Ergebnisse, Benutzer | ✓ | ◐ | — | ◐ | ◐ | ✓ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Admin: Farben | ✓ | ✓ | — | ✓ | — | ✓ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ |
| Login und Registrierung | ✓ | ✓ | — | — | — | — | ✓ | ◐ | ✓ | ✓ | ✓ | — |

## Nachweise

- Produktionsbuild, TypeScript, Oxlint, Deployment-Shellprüfung und neun Tests sind grün.
- Browser-Vorschau mit temporären Daten für 2, 8 und 12 Spieler: Spieltag vor Frist, live und abgeschlossen; Tippen; Statistiken Spieltag/Saison. Die Vorschau-Route wurde danach entfernt.
- Browserbreiten: 1440, 1024 und 390 px. Hell und Dunkel wurden für Spieltag und Tippen geprüft. Saisonkurve mit 12 Spielern wurde mobil horizontal scrollbar gemacht; Endbeschriftungen bleiben mit mindestens 22 px Abstand.
- Bottom Sheet mobil: Dialogfokus und Schließen mit Escape geprüft. Schließen per Schaltfläche und Hintergrund erfolgt über Radix Sheet.
- Login mobil und geschlossene Registrierung bei 1440, 1024 und 390 px wurden im laufenden lokalen Browser in Dunkel geprüft.
- Die 16 Farbpaare aus §2.5 wurden nach WCAG-Formel nachgemessen; Abweichungen zur Designangabe betragen nur Rundungsschritte.

## Noch manuell zu prüfen

- Angemeldete Screens mit echten Daten: Bundesliga, Spielerprofil, Profil und Admin in Hell/Dunkel sowie die tatsächliche App-Shell. Die lokale Sitzung hatte keine Anmeldung; die Vorschau hat keine Datenbank verändert.
- Autospeichern, Joker setzen, Admin-Farbverwaltung und Ergebnisse bearbeiten sollten in einer angemeldeten Testumgebung einmal per UI durchgespielt werden. Ihre bestehenden Actions, API-Routen und fachlichen Berechnungen wurden nicht geändert.
