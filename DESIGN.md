# DESIGN.md · Kicktipp.Deluxe

Version 1.0 · November 2026 · Textfassung des Designguides (PDF „Kicktipp-Deluxe-Designguide.pdf“).
Referenz-Entwürfe: https://claude.ai/artifact/RCEs1sTwDQm9cyRo3rHwZp (Design-Canvas mit Spieltag, Statistik, Tippen, Mobil, Farben).

Diese Datei ist die verbindliche Quelle für Gestaltung und Tokens. Bei Widersprüchen zwischen Code und dieser Datei gilt diese Datei, bei Widersprüchen zwischen dieser Datei und Fachlogik (Punkteregeln, Daten) gilt die Fachlogik.

---

## 0. Kurzfassung

- **Ruhige Flächen, laute Inhalte.** Flächen, Ränder, Navigation im Schiefer-Grau. Farbe gehört Ergebnissen, Punkten, Spielern.
- **Lime heißt du.** Deine Punkte, deine Zeile, deine nächste Aktion. Nirgends sonst als Signal.
- **Jeder Spieler hat seine Nutzerfarbe** (Admin › Farben, jede nur einmal vergeben). Erscheint als Ring, Balken, Linie, immer mit Namen.
- **Die Anzeigetafel ist die Signatur.** Spielstände stehen auf einer dunkelgrünen Tafel mit Mint-Ziffern. Nur Spielstände.
- **Was zählt, steht oben.** Ein grünes Panel pro Screen beantwortet die Hauptfrage.
- **Mona Sans** in zwei Breiten: 125 % für Zahlen und Überschriften, 100 % für Text. Proportionale Ziffern.
- **4-px-Raster**, Radien verschachtelt, keine Verläufe, kein Glow, keine Emojis, keine Ausrufezeichen.

---

## 1. Prinzipien

1. **Ruhige Flächen, laute Inhalte.** Hintergründe, Ränder und Navigation bleiben im Schiefer-Grau. Wenn alles bunt ist, ist nichts wichtig.
2. **Lime heißt du.** Deine Punkte, deine nächste Aktion, deine Zeile in der Rangliste.
3. **Jeder Spieler hat seine Farbe.** Die Nutzerfarbe markiert eine Person überall gleich. Der Name steht immer daneben.
4. **Die Anzeigetafel ist die Signatur.** Dunkelgrüne Tafel, Mint-Ziffern, nur für Spielstände.
5. **Was zählt, steht oben.** Jeder Screen beantwortet zuerst die eine Frage, wegen der man ihn öffnet.

**Zielgruppe und Ton:** 25–35, sportlich, wenig Geduld am Samstag. Direkt, ein bisschen Stammtisch, nie albern. Wirkt wie ein gutes Stadionheft.

**Vermeiden:** Farbverläufe, Glow, farbige Schatten · Emojis als Icons oder Deko · Versal-Labels mit weiter Laufweite · Ausrufezeichen · Diagramme, die nur dekorieren · Glas-/Blur-Effekte.

### Hierarchie über Flächen

Die Helligkeit der Flächen führt den Blick. Je dunkler, desto wichtiger.

| Ebene | Fläche | Hell | Dunkel |
|---|---|---|---|
| 1 Navigation | Seitenleiste | Dark Green `#183132` | Schiefer 950 `#0C1313` |
| 2 Panel | genau ein Panel „was gerade zählt“ | Green `#004D43` | Green `#004D43` |
| 3 Seitenfläche | Hintergrund | Schiefer 150 `#DEE5E6` | Schiefer 900 `#151E1E` |
| 4 Karten | Listen, Details | Schiefer 50 `#F7FDFD` | Schiefer 850 `#202A2A` |

Lesereihenfolge Spieltag: Dein Spieltag (Panel) → Rangliste → Alle Spiele → Navigation als Anker.

---

## 2. Farbe

### 2.1 Markenfarben

| Name | Hex | Aufgabe | Schrift darauf |
|---|---|---|---|
| Dark Green | `#183132` | Navigation, Anzeigetafel, Joker-Marke | Mint `#EBFFF5` |
| Green | `#004D43` | Panel, „du“ auf hellem Grund, Fokusring hell | Lime oder Mint |
| Radiant Green · Lime | `#D0FF71` | du, Hauptaktion, 4 Punkte, Joker aktiv | Dark Green |
| Neon Green | `#27EAA6` | Live, 3 Punkte, Marker „Bestwert“ | Dark Green |
| Mint | `#EBFFF5` | Schrift auf Grün und Tafel, Basis für 2 Punkte | Green |
| Coral | `#F57E59` | Abweichung vom Feld, Zähler offener Tipps | Dark Green (5,3 : 1) |

Purple aus der Chiron-Vorlage wird **nicht** verwendet.

- Mengen pro Screen: Green + Dark Green ca. 25 %, Lime ≤ 5 %, Coral < 2 %.
- **Lime nie als Schrift auf Hell** (1,1 : 1). Auf Hell übernimmt Green `#004D43` die Rolle „du“.
- **Coral als Schrift:** auf Hell `#A74728` (5,7 : 1), auf Dunkel `#F57E59` (5,6 : 1).
- Keine Verläufe. Erlaubt: Tonstufe einer Farbe über Deckkraft (z. B. Lime 55 % als hinterlegte Zeile).

### 2.2 Schiefer (neutrales Grau)

Abgeleitet aus Dark Green: Farbton 199°, Chroma 0,006–0,016 (in der Mitte am höchsten), Helligkeit OKLCH 0,97 → 0,18.

| Stufe | Hex | Hell | Dunkel |
|---|---|---|---|
| 50 | `#F7FDFD` | Karten | |
| 100 | `#E9EFEF` | erhöhte Fläche, offene Zeile | |
| 150 | `#DEE5E6` | Seitenhintergrund | |
| 200 | `#D2D9D9` | Matrix-Nullwert, Risiko Remis | |
| 300 | `#B7C0C0` | | Text sekundär |
| 400 | `#97A1A1` | | Text leise |
| 500 | `#788383` | Icons neutral | |
| 600 | `#5B6768` | Text leise | |
| 700 | `#445050` | Text sekundär | |
| 800 | `#2D3838` | | erhöhte Fläche |
| 850 | `#202A2A` | | Karten |
| 900 | `#151E1E` | Text | Seitenhintergrund |
| 950 | `#0C1313` | | Navigation |

Text im Dunkelmodus: `#EEF4F4`. Linien sind keine eigene Stufe: Textfarbe mit 10 % (hell) bzw. 8 % (dunkel) Deckkraft.

### 2.3 Bedeutung

**Punkte-Stufen** (Farbe = Stufe des Tipps, Zahl = Endpunkte inkl. Joker):

| Punkte | Stufe | Token | Hell | Dunkel |
|---|---|---|---|---|
| 4 | Exakt | Lime-Fläche, Dark-Green-Ziffer, Kontur Green 18 % | `#D0FF71` | gleich |
| 3 | Tordifferenz | Neon-Fläche, Dark-Green-Ziffer | `#27EAA6` | gleich |
| 2 | Tendenz | Mint-Fläche `#E2FBEF`, Ziffer Green, Kontur Green 22 % | | Neon 13 %, Ziffer `#86F3CD` |
| 0 | Daneben | nur Kontur, Ziffer Text leise | | |
| – | offen / kein Tipp | nur Kontur, Schnitt 400 | | |

Ein Tendenz-Tipp mit Joker zeigt „4“, bleibt aber Mint (Stufe 2) und trägt die Joker-Marke „★×2“.

**Du und das Feld:**

| Farbe | Bedeutet |
|---|---|
| Lime (auf Hell: Green) | du: deine Punkte, deine Zeile, deine nächste Aktion |
| Nutzerfarbe | eine bestimmte Person, auch du selbst in Diagrammen |
| Coral | Abweichung: „Nur du tippst 2:3“, „Gleich wie du“, Feldtrend-Balken, Zähler offener Tipps (Tab-Leiste mobil) |

**Status-Pille:** Tippen offen = Lime-Fläche (einzige Lime-Pille) · Live = Neon auf Dark Green mit langsam blinkendem Punkt · Abgeschlossen = neutral, Karte mit Kontur.

**Tabellenzonen Bundesliga:** Meister Lime · Champions League Green (dunkel: Neon) · Europa League Neon · Relegation Warnung · Abstieg Fehler. Warnung/Fehler nie als einziger Hinweis, immer mit Text oder Symbol.

### 2.4 Nutzerfarben

Jeder Spieler wählt in Admin › Farben eine Farbe, die nur einmal vergeben wird. Die gespeicherte Farbe bleibt unverändert, **angepasst wird nur die Anzeige**:

- In OKLCH umrechnen, Farbton (und wo möglich Chroma) behalten, Helligkeit L ins Band legen:
  - helle Karten: L 0,45–0,70
  - dunkle Karten, Anzeigetafel, Diagrammgrund: L 0,58–0,88
- Liegt die Farbe schon im Band, ändert sich nichts. Außerhalb des Gamuts Chroma reduzieren.

Aktuelle Palette (Stand 23.11.2026):

| Name | Original | auf Hell | auf Dunkel | vergeben an |
|---|---|---|---|---|
| Blau | `#2B7FFF` | `#2B7FFF` | `#2B7FFF` | frei |
| Cyan | `#00B8DB` | `#1EB0D0` | `#00B8DB` | frei |
| Emerald | `#00BC7D` | `#00BB7C` | `#00BC7D` | frei |
| Limette | `#7CCF00` | `#6FB51D` | `#7CCF00` | frei |
| Borussia | `#FDE100` | `#B39F16` | `#F3D928` | Michi |
| Amber | `#FE9A00` | `#DC881B` | `#FE9A00` | frei |
| Effzeh | `#E20613` | `#E20613` | `#E40C16` | Chrischi |
| Pink | `#F6339A` | `#F6339A` | `#F6339A` | SachmaMainza |
| Lila | `#AD46FF` | `#AD46FF` | `#AD46FF` | frei |
| Indigo | `#615FFF` | `#615FFF` | `#615FFF` | frei |
| Werder | `#1D9053` | `#1D9053` | `#1E9154` | TheWeedyWatson |
| Mainza | `#C3141E` | `#C3141E` | `#D83231` | frei |

**Wo die Nutzerfarbe erscheint:** Ring (2 px) um das Vereinswappen überall, wo ein Spieler genannt wird · Balken in der Rangliste · Linie im Saisonverlauf · Punkt in Legenden und Auswahlknöpfen.

**Wo nie:** als Füllung großer Flächen · als Schriftfarbe · als Hintergrund hinter dem Wappen.

**Immer mit Namen.** Farben können sich ähneln (Effzeh/Mainza; Rot/Grün bei Farbsehschwäche). Linienenden beschriftet, Tooltips nennen alle Spieler, Tabellen enthalten alle Werte.

**Empfehlung Admin › Farben:** beim Hinzufügen prüfen, ob die neue Farbe einer vorhandenen zu nah ist (ΔE in OKLab unter 15), dann Hinweis zeigen.

### 2.5 Kontrast (gemessen)

| Paar | Farben | Kontrast |
|---|---|---|
| Text auf Karte | `#151E1E` / `#F7FDFD` | 16,5 : 1 |
| Text sekundär auf Karte | `#445050` / `#F7FDFD` | 8,1 : 1 |
| Text leise auf Karte | `#5B6768` / `#F7FDFD` | 5,7 : 1 |
| Text leise auf Seitenfläche | `#5B6768` / `#DEE5E6` | 4,6 : 1 |
| Green-Schrift auf Karte | `#004D43` / `#F7FDFD` | 9,5 : 1 |
| Coral-Schrift auf Karte | `#A74728` / `#F7FDFD` | 5,7 : 1 |
| Lime auf Green | `#D0FF71` / `#004D43` | 8,5 : 1 |
| Mint auf Green | `#EBFFF5` / `#004D43` | 9,4 : 1 |
| Mint 74 % auf Green | `#AED1C7` / `#004D43` | 5,9 : 1 |
| Mint auf Anzeigetafel | `#EBFFF5` / `#183132` | 13,2 : 1 |
| Dark Green auf Lime | `#183132` / `#D0FF71` | 12,0 : 1 |
| Dark Green auf Neon | `#183132` / `#27EAA6` | 8,8 : 1 |
| Dark Green auf Coral | `#183132` / `#F57E59` | 5,3 : 1 |
| Dunkel: Text auf Karte | `#EEF4F4` / `#202A2A` | 13,2 : 1 |
| Dunkel: Text leise auf Karte | `#97A1A1` / `#202A2A` | 5,6 : 1 |
| Dunkel: Coral auf Karte | `#F57E59` / `#202A2A` | 5,6 : 1 |

Alle Textpaare ≥ 4,5 : 1. Lime-Flächen und helle Punkte-Tokens auf Hell < 3 : 1, deshalb dunkle Schrift und feine Kontur. Nutzerfarben als Linien ≥ 3 : 1, sonst Name und Wert direkt an der Linie.

---

## 3. Typografie

**Schrift:** Mona Sans (SIL OFL), variabel, Breite 75–125 %, Gewicht 200–900. Ersetzt Inter (bisher) bzw. Aeonik (Vorlage). Einbinden: `@fontsource-variable/mona-sans` mit Breitenachse (`wdth.css`).

| Rolle | Breite | Gewicht |
|---|---|---|
| Zahlen, Ergebnisse, Punkte | 125 % | 600 |
| Überschriften | 125 % | 600 |
| Fließtext, Bedienelemente | 100 % | 400 / 500 |
| Hervorhebung im Text | 100 % | 600 (selten) |

| Stufe | Größe px | Zeilenhöhe | Schnitt | Beispiel |
|---|---|---|---|---|
| Riesenzahl im Panel | 120 / 96 / 76 mobil | 0,86 | 125 % · 600 | Dein Spieltag, Saisonrennen |
| Seitentitel | 48 / 36 mobil | 1,04 | 125 % · 600 | Spieltag 10 |
| Kennzahl | 36 | 1,05 | 125 % · 600 | Kacheln |
| Kartentitel | 20 (mobil 18) | 1,2 | 125 % · 600 | Rangliste |
| Fakt im Panel | 22 (mobil 18) | 1,1 | 125 % · 600 | Bestwert |
| Ergebnis auf der Tafel | 19 (mobil 17) | 1 | 125 % · 600 | 4 : 1 |
| Fließtext | 15 | 1,45 | 100 % · 400 | |
| Bedienelement | 14–15 | 1,2 | 100 % · 500 | Buttons, Navigation |
| Sekundär | 13 | 1,4 | 100 % · 400 | Untertitel, Chips |
| Klein | 12 | 1,3 | 100 % · 400 | Achsen, Tabellenköpfe |
| Minimum mobil | 11 | 1 | 100 % · 500 | Tab-Beschriftung |

**Regeln**
- Hierarchie über Größe, Breite, Farbe. Keine Schnitte ≥ 700.
- Satzschreibung überall („Alle Spiele“), keine Versal-Labels.
- Kein Kursiv zur Betonung.
- Negative Laufweite nur ab 40 px (−0,01 bis −0,02 em).
- **Ziffern:** Mona Sans setzt standardmäßig gleich breite Ziffern mit Serifen-Eins (wirken wie Code). Global setzen: `font-variant-numeric: lining-nums proportional-nums;`. Die Inter-Features (`cv02 … ss08`) entfallen. `.tabular-nums` nur in echten Ausnahmen.

---

## 4. Raster, Raum, Bewegung

**Abstandsskala (4-px-Raster):** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64

| Wofür | Wert |
|---|---|
| innerhalb eines Elements | 4–12 |
| zwischen Zeilen einer Liste | 2–8 |
| zwischen Gruppen | 12–24 |
| zwischen Abschnitten | 24–40 |

**Desktop (≥ 1180 px):** Seitenleiste 264 px (eingeklappt 80) · Inhalt max. 1360 px · Seitenrand 32 · Kartenabstand 24 · Panel : Rangliste = 2 : 1, Rangliste min. 340 · Kopfleiste 64 · Zeile Spieleliste min. 80 · Navigationseintrag 40, Abstand 2.
**Tablet (760–1180 px):** Panel und Rangliste stapeln, Spalte „Vergleich im Feld“ wandert in die Details.
**Mobil (< 760 px):** Seitenrand 16 · Tab-Leiste 4 Ziele, 52 px + Home-Balken (`env(safe-area-inset-bottom)`) · Kopf 68, bleibt stehen · Spielkarte Radius 18, Abstand 8 · Tippfläche ≥ 44 × 44 · Schrift ≥ 11 px.

Gleiche Dinge haben gleiche Maße: alle Zeilen einer Liste gleich hoch, alle Karten einer Reihe gleiche Innenkante. Keine Ausreißer wie 13 oder 11 px.

**Radien:** 6 Tag/Badge · 10 Button, Eingabe, Tafel (`--radius`) · 16 Karte (mobil 18) · 20–24 Panel, Bottom Sheet. Verschachtelt: innen = außen − Innenabstand, nie unter 4.

**Tiefe:**
- Hell: Karten mit Kontur (Text 10 %) + `0 1px 2px rgb(21 30 30 / .05), 0 8px 24px rgb(21 30 30 / .05)`.
- Dunkel: keine Schatten. Tiefe über Flächenstufen 900 → 850 → 800 und Kontur 8 %.
- Schwebend (Tooltip, Sheet): `0 8px 24px` mit 12–28 % Schwarz.
- Keine farbigen Schatten, kein Glow. Aktive Einträge höchstens helle Kante oben (`inset 0 1px 0` Weiß 6–8 %).

**Bewegung:** Kurve `cubic-bezier(.22, 1, .36, 1)` · Hover/Klick 120–180 ms · Tooltip/Menü 160–220 ms · Sheet/Aufklappen 250–320 ms · Drücken `scale(.97–.985)`. Nur Farbe, Deckkraft, transform animieren. Einzige Dauerbewegung: Live-Punkt. `prefers-reduced-motion`: alles außer Farbwechseln aus.

---

## 5. Komponenten & Zustände

### Anzeigetafel (`Scoreboard`)
- Nur für Spielstände. Hintergrund `--board`, Ziffern `--board-foreground`, 125 % · 600, 19 px (mobil 17).
- Höhe 40 (mobil 36), min. Breite 76, Radius 10, Doppelpunkt 45 % Deckkraft.
- Zustände: **Endstand** · **Live** (Ziffern Lime, daneben Minute „71'“ und Neon-Punkt) · **leer** „–:–“ (nur Kontur, Text leise) · **groß** im Bottom Sheet (52 hoch, 26 px Ziffern, Radius 14).

### Punkte-Token (`PointsToken`)
- Quadrat 34 px (klein 28), Radius 9 (klein 8), 125 % · 600 · 15 px. Farben siehe 2.3.
- Joker-Marke: Dark Green, Lime-Stern + „×2“, Höhe 22, Radius 6. Neben dem Token oder als Tag „Joker ×2“. Mobil: feine Lime-Kontur um die ganze Spielkarte.
- Nicht: Punkte in Nutzerfarben, Ergebnisse ohne Tafel, Tafel für Kennzahlen.

### Vergleichs-Chip
Höhe 30, Radius 8, Punkt 7 px, 13 px · 500. Prüfreihenfolge:
1. Bestwert allein → „Du liegst am Bestwert“ (best: Lime 55 %, Punkt `--you`)
2. Bestwert mit 1 anderem → „Bestwert: du und Michi“; mit mehreren → „Bestwert mit 3 anderen“ (best)
3. eigener Tipp ist einzigartig (exaktes Ergebnis) → „Nur du tippst 2:3“ (solo: `--field-soft`, Text Coral lesbar)
4. sonst → „2 von 4 tippen wie du“ (share: Kontur, Text sekundär)
5. vor der Tippfrist ohne Tipp → „Tipp fehlt noch“ (todo: Lime-Fläche); mit Tipp → „3 von 4 abgegeben“

### Marker in „Tipps im Feld“
Dein Tipp (Lime 55 %) · Gleich wie du (`--field-soft`, Coral-Text) · Joker ×2 (Dark Green/Lime) · Bestwert (Neon/Dark Green) · Kein Tipp (Kontur) · Abgegeben (neutral, vor der Frist; Tipp selbst verdeckt mit Schloss).

### Avatar mit Farbring
Kreis 36 (klein 26), neutrale Füllung, Wappen 24 px (klein 18), Ring `0 0 0 2px <userTone>`. Wappen = Lieblingsverein, Ring = Person.

### Ranglisten-Zeile
Platz (125 %, 20 px) · Avatar · Name + „(du)“ (leise) · Balken 4 px in Nutzerfarbe (Breite relativ zum Ersten) · Punkte rechts (125 %, 22 px) + Unterzeile („131 Saison“ bzw. „13 am Spieltag“). Eigene Zeile hinterlegt (`--muted`). Gleichstand: gleicher Platz, nächster zählt weiter (1, 1, 3). Umschalter Spieltag/Saison.

### Steuerelemente
| Element | Standard | Hover | Gedrückt | Fokus | Deaktiviert |
|---|---|---|---|---|---|
| Hauptaktion (Lime, 44, Radius 12, 600) | Lime | `#DCFF8E` | scale .98 | Ring | 45 % |
| Werkzeug (Kontur, 36, Radius 10, 500) | Kontur 18 % | Fläche `--muted` | scale .97 | Ring | 45 % |
| Umschalter (Segmente 30–40) | aktiv: Karte + Kontur + kleiner Schatten | | | Ring | |
| Symbol-Button (40, mobil 44) | Text sekundär | Fläche Text 10 % | scale .97 | Ring | 40 % |

- **Eine Hauptaktion pro Screen** („9 Tipps abgeben“ vor der Frist, „Joker setzen“ auf Tippen).
- **Fokusring immer sichtbar:** 2 px, Green (hell) / Lime (dunkel), 2 px Abstand. Nie entfernen.
- Icons: Lucide, 18 px (klein 16), Strich 1,5, Farbe der Textstufe. Symbol-Buttons immer mit `aria-label`.
- Achtung CSS-Spezifität: Button-Resets (`button { background: none }`) dürfen Lime-Buttons nicht überschreiben.

### Tipp-Eingabe
- Torfelder 56 × 56 (mobil 48 × 52), Radius 12, 125 % · 600 · 24 px, `inputmode="numeric"`, max. 2 Ziffern, Platzhalter „–“.
- Zustände: leer (Fläche `--muted`, Kontur 18 %) · Fokus (Karte, 2 px Ring `--ring`, Schein `--you-soft` 4 px) · ausgefüllt (Karte, Kontur Text leise).
- Nach einer Ziffer automatisch ins nächste Feld, nach dem Gast-Tor ins nächste Spiel.
- Autospeichern, Status oben rechts: „Speichert …“ → „Alle Tipps gespeichert · gerade eben“. Kein Speichern-Button.
- Pro Zeile: Anstoß + Status (✓ Getippt / Offen) · Heim (Name, „6. Platz · 18 Pkt.“, Wappen) · Felder · Gast · Joker-Knopf.

### Joker-Knopf und Joker-Hinweis
- Knopf 44 × 44, Radius 12. Zustände: **gesperrt** (35 %, Tooltip „Erst beide Tore tippen“) · **wählbar** (Kontur) · **Kandidat** (nach „Joker setzen“: Ring Green 2 px + Lime-Schein) · **aktiv** (Lime, Stern gefüllt, „×2“, Zeile `--you-soft`).
- Ein Joker pro Spieltag, freiwillig, bis zur Tippfrist verschiebbar. Klick auf anderen Stern verschiebt. Wird ein Tor im Joker-Spiel gelöscht, wird der Joker automatisch frei.
- **Hinweis im Panel**, solange kein Joker gesetzt ist: Lime-umrandeter Kasten „Joker noch nicht gesetzt“ + Text „Ein Spiel deiner Wahl zählt doppelt, bis zu 8 statt 4 Punkte. Setzen ist freiwillig, du kannst ihn bis zur Tippfrist verschieben.“ + Hauptaktion „Joker setzen“ + „4 Spiele kommen infrage“. Deaktiviert, solange kein Spiel getippt ist („Tippe zuerst ein Spiel“).
- „Joker setzen“ startet Auswahlmodus: Hinweisband über der Liste („Wähle mit ★ das Spiel, das doppelt zählen soll …“ + „Abbrechen“), Kandidaten hervorgehoben.
- Nach dem Setzen: Kasten wird Bestätigung (Wappen, Spiel, Tipp in Lime, „Joker entfernen“).
- Zusätzlich: Badge an „Tippen“ in der Navigation mit Zahl offener Tipps.

### Navigation
- **Seitenleiste:** `--sidebar` (hell Dark Green, dunkel Schiefer 950), 264 px. Marke: Lime-Kachel 36 mit Spielfeld-Glyph + „Kicktipp**.Deluxe**“ (Deluxe in Lime). Einträge 40 px, aktiv: Fläche Mint 8 % + Symbol Lime. „Tippen“ mit Lime-Badge. Unten: Darstellung Hell/Dunkel/System (Segmente), Profilkarte mit Farbring. Einklappbar auf 80 px.
- **Tab-Leiste mobil:** Spieltag · Tippen · Bundesliga · Statistiken. Aktiv: Pille 56 × 30 (`--you-soft`, dunkel Lime 16 % + Lime-Icon). Zähler offener Tipps in Coral. Profil/Verwaltung über eigenes Wappen oben links. Flach, kein Glas/Blur.
- **Kopf mobil:** Wappen · „Spieltag 10“ + Saison mit Pfeilen · Darstellungs-Knopf (Hell → Dunkel → System). Bleibt beim Scrollen stehen.
- **Bottom Sheet mobil:** Spiel-Details statt aufklappender Zeilen. Griff, Schließen-Knopf, Tipp auf Hintergrund schließt, max. 88 % Höhe, Radius 24 oben, eigener Scrollbereich, `role="dialog" aria-modal`.

### Diagramme
- **Form folgt Daten:** Verlauf = Linie · Anteile = ein gestapelter Balken · Spieler × Spieltag = Matrix.
- Nutzerfarbe für Spieler, Punkte-Stufen für Treffer. Nie vermischen.
- **Diagramme mit Nutzerfarben auf `--well`** (`#0E1919`, im grünen Panel als „Anzeigetafel“), mit dunklem Band der Nutzerfarben.
- Direkt beschriften: Namen + Wert am Linienende; bei Überlappung automatisch ≥ 22 px auseinander. Legende als Auswahlknöpfe: Klick hebt eine Linie hervor, andere 18 % Deckkraft.
- Eigene Linie 3 px, andere 2 px, eigene/fokussierte zuletzt gezeichnet.
- Raster Text 8 %, Achsen 12 px leise, keine Punkte auf jedem Wert, nur Endpunkte (Ring in Grundfarbe).
- Tooltip: Hilfslinie gestrichelt, alle Spieler sortiert nach Stand, Wert + Zuwachs; ab Mitte nach links klappen.
- Matrix „Punkte pro Spieltag“: Zelle 40 hoch, Radius 8, Zahl in der Zelle, sequenzielle Skala 0–24 (hell: Mint → Green, dunkel: Schiefer → Lime), Bestwert des Spieltags mit 2-px-Rahmen, Spalte Ø.
- Treffer-/Joker-Verteilung: ein Stapelbalken (2 px Lücken, keine 0-Segmente) + Zeilen mit Farbfeld, Label, Punkte, Anzahl, Prozent. Joker: Erfolglos (Schiefer 200) / Tendenz 2×2=4 / Tordifferenz 3×2=6 / Exakt 4×2=8.
- Nichts auf eine feste Spielerzahl festlegen. Unter jedem Diagramm eine Tabelle mit allen Werten.

---

## 6. Screens & Abläufe

### Spieltag (Startseite)
Beantwortet: Wie läuft es für mich? Wer liegt vorn? Was ist in jedem Spiel passiert?
1. **Kopf:** Status-Pille, „Saison 2026/27“, Titel „Spieltag 10“ (48 px, 125 %), Tippfrist-Zeile mit Uhr-Icon, Spieltag-Blättern (‹ 10 von 34 ›).
2. **Panel (`--hero`)** + **Rangliste** nebeneinander (2 : 1):
   - Riesenzahl Punkte (Lime) + „Punkte am Spieltag“; rechts Faktenliste: Rang („2.“ / „von 4 · geteilt“), Einordnung, Joker („Bayern – Köln“ / „0 × 2 = 0 Punkte“).
   - Tipp-Bilanz: ein Feld je Spiel in Spielreihenfolge (Lime/Neon/Mint 62 %/Mint 14 %), Legende mit Anzahlen.
3. **Alle Spiele:** nach Tagen gruppiert („Freitag, 20.11.“ · „1 Partie“). Spalten: Anstoß/Status · Spiel (Heim/Gast mit Wappen 24, Verlierer in Text sekundär/400) · Tafel · Dein Tipp · Punkte (+ Joker) · Vergleich-Chip · Aufklapp-Chevron. „Alle aufklappen“.
4. **Details** (aufgeklappt, Fläche `--muted`): links „Vergleich im Feld“ (Feldtrend „2 von 4 tippen 4:1“, Verteilungsbalken Heim/Remis/Auswärts in Coral, eigene Tendenz kräftig; Häufigster Tipp; Dein Status; Bestwert), rechts „Tipps im Feld“ (Avatar, Name, Tipp, Punkte, Marker, „4 von 4 abgegeben“).
5. **Legende** der Punkte-Stufen am Seitenende.

**Zustände:**
- **Vor der Tippfrist:** Panel zeigt Restzeit groß („4 · Tage bis zur Tippfrist“), Fakten „Deine Tipps 0 / 9“, „Saisonrang“, „Joker“, Hauptaktion „9 Tipps abgeben“. Tipps der anderen verdeckt. Rangliste startet auf „Saison“.
- **Live:** Pille Live, Badge „Live · 5 Spiele laufen“, Punkte „vorläufig“, jede Zeile eigener Status (Endstand / 71' Live / Anstoß), Tipp-Bilanz zeigt offene Spiele als Umriss, Deadline-Zeile „1 beendet, 5 laufen, 3 folgen“.
- **Abgeschlossen:** neutrale Pille, Endstand.

**Einordnung:** Platz 1 allein → „Tagesbester · 3 Punkte vor Michi“ · Platz 1 geteilt → „Bestwert · gemeinsam mit Michi“ · dahinter → „4 Pkt. zurück · hinter TheWeedyWatson“.

### Tippen
Panel: „Dein Tippstand“ „4 / 9“ + „Spiele getippt · 5 fehlen noch“ + Fortschrittsfelder (getippt/offen/Joker) + Joker-Hinweis bzw. -Bestätigung. Kopf: Tippfrist mit Restzeit, Speicherstatus. Liste nach Tagen gruppiert („3 von 5 getippt“), Werkzeug „Nächstes offenes Spiel“. Rechts Bundesliga-Tabelle (#, Verein mit Wappen, Diff., Pkt.), Vereine des fokussierten Spiels hervorgehoben (`--you-soft`), Zonen als feine Linien. Fuß: „4 von 9 getippt · Joker noch frei“.

**Joker-Ablauf:** 1 Tippen → 2 Hinweis sehen → 3 „Joker setzen“, Kandidaten hervorgehoben → 4 Bestätigung → 5 Verschieben (anderer Stern) oder „Joker entfernen“.

### Statistik
Umschaltbar Spieltag/Saison (großer Segment-Umschalter im Kopf) + Spieltag-Blättern.
1. **Panel:** Saison = „Saisonrennen“: Riesenzahl eigener Punkte, „Platz 1 von 4“, Fakten Vorsprung (+5 auf Michi), Form (48, vorher 33), Bester Spieltag (22, Spieltag 9); rechts Saisonverlauf auf `--well`. Spieltag = „So sind die Punkte entstanden“: gestapelte Balken je Spieler (Exakt Lime, Tordifferenz Neon, Tendenz Mint 62 %, Joker-Bonus Lime-Umriss) mit Avatar.
2. **Kennzahlen:** Ø Punkte, Rekord, Joker-Bonus, Risikofaktor (ein Anteilsbalken Heim/Remis/Auswärts in Schiefer-Stufen, breiteste Kachel).
3. **Treffer-Verteilung** und **Joker-Verteilung** nebeneinander; Joker mit Spieler-Umschalter (Punkt in Nutzerfarbe; ab > 5 Spielern Dropdown), Zahlen Gesetzt / Erfolgreich / Bonus.
4. **Punkte pro Spieltag** (nur Saison) als Matrix.
5. **Spielervergleich:** Spieler (Avatar, Link auf `/spieler/<name>`), Punkte + Mini-Stapelbalken, Exakt, Differenz, Tendenz, Falsch, Joker (erfolgreich/gesetzt), Bonus, Quote, Form (Zahl + Pfeil + Differenz zu den drei Spieltagen davor). Erklärung darunter.

### Mobil
App-Gefühl: feste Tab-Leiste, stehender Kopf, Spiele als Karten (ganze Karte ist ein `<button>`, öffnet Bottom Sheet), Kurznamen in Listen („Gladbach“), volle Namen im Detail. Panel kompakt (Zahl 76 px, zwei Fakten daneben, Joker-Zeile, Bilanz). Rangliste als Karte. Alle Ziele ≥ 44 px. Zusätzlich in der echten App: Wischen zwischen Spieltagen, Sheet nach unten ziehen, Safe-Area-Abstände.

---

## 7. Sprache & Texte

**Ton:** duzen, knapp, direkt, Zahlen vorn. Keine Ausrufezeichen, keine Emojis, keine Werbesprache. Kein Punkt am Ende von Überschriften, Buttons, Chips, Bildunterschriften (nur Absätze mit mehreren Sätzen). Buttons sagen, was passiert. Leere Zustände nennen den nächsten Schritt. Spielernamen nie umformen, nur mit „…“ kürzen.

| So | Nicht so |
|---|---|
| Du liegst am Bestwert | Glückwunsch! Du hast die meisten Punkte!! |
| Nur du tippst 2:3 | Du bist der einzige Spieler mit diesem Tipp. |
| 4 Pkt. zurück, hinter TheWeedyWatson | Rang: 2 (Differenz: -4) |
| Joker noch nicht gesetzt | ACHTUNG: Joker fehlt |
| 9 Tipps abgeben | Jetzt tippen und gewinnen! |
| Alle Tipps gespeichert · gerade eben | Erfolgreich gespeichert ✓ |
| Noch kein Tipp abgegeben | Keine Daten vorhanden |

**Status im Spiel:** Du hältst den Bestwert · Du teilst den Bestwert · Du liegst mit dem Feld · Du stehst allein · angehängt „· Tendenz richtig“ (Exakt getroffen / Tordifferenz richtig / Tendenz richtig / Daneben) · live „…, vorläufig“ · vor der Frist „Noch kein Tipp abgegeben“.
**Feld:** „2 von 4 tippen 4:1“ / „Kein klarer Trend“ · „4 Punkte · Michi“ / „Niemand punktet“ · „4 von 4 abgegeben“.

**Formate**
| Was | Format |
|---|---|
| Datum lang / kurz | Freitag, 27.11. / Fr. 27.11. |
| Uhrzeit | 19:30 (ohne „Uhr“) |
| Frist | Tippfrist Fr. 27.11., 19:30 |
| Ergebnis, Tipp | 4:2 (Tafel mit Abstand) |
| Minute | 71' |
| Dezimal | 11,5 |
| Differenz | +5 · −4 (echtes Minuszeichen U+2212) |
| Punkte | 4 Punkte, in Spalten „Pkt.“ |
| Platz | 2. · 2. Platz |
| Prozent | 58 % (geschütztes Leerzeichen) |
| Saison | Saison 2026/27 |

**Labels:** Spieltag · Tippen · Bundesliga · Statistiken · Admin · Tippen offen · Live · Abgeschlossen · Endstand · Anstoß · Exakt · Tordifferenz · Tendenz · Daneben · Joker setzen · Joker entfernen · Joker ×2 · Speichert … · Alle Tipps gespeichert.
**Mehrzahl** immer über eine Plural-Funktion („1 Spiel kommt infrage“ / „4 Spiele kommen infrage“, „1 Partie“ / „6 Partien“).

---

## 8. Entwickler-Tokens

Struktur bleibt: Tailwind v4, `@theme inline`, shadcn-Namen. Drei Ebenen:
1. **Grundfarben** in `@theme inline` (`--color-pitch-700`, `--color-neutral-150` …), nie direkt in Komponenten.
2. **Semantik** in `:root` / `.dark` (`--primary`, `--card`, `--muted-foreground` …).
3. **Fachtokens** für Tafel, Punkte, Diagramme, Tabelle (`--board`, `--points-4`, `--chart-hit-exact` …).

| Bisher | Neu |
|---|---|
| primary (Marine) | pitch (Green) |
| secondary (Blau) | lime |
| neutral (warmes Grau) | neutral = Schiefer, mit Stufen 150 und 850 |
| brand-orange | Coral (Name bleibt) |
| success | neon als Grundlage |
| warning, error | bleiben |
| Inter | Mona Sans, Breite über `font-stretch` |
| `--radius: 0.625rem` | bleibt |

Skalen (Markenwert jeweils exakt):
- **pitch:** 50 `#EDFAF7` · 100 `#E3F3EF` · 200 `#CFE3DE` · 300 `#B4CEC8` · 400 `#8AADA6` · 500 `#5C8B81` · 600 `#2E6A5F` · 700 `#004D43` · 800 `#003E34` · 900 `#002F28` · 950 `#00221C`
- **lime:** 50 `#EFFFCB` · 100 `#E4FFA9` · 200 `#D7FF7A` · 300 `#D0FF71` · 400 `#BFEA67` · 500 `#A8CE5D` · 600 `#88A54F` · 700 `#687E41` · 800 `#4D5B34` · 900 `#384129` · 950 `#262B1F`
- **coral:** 50 `#FFF1EA` · 100 `#FFE6DC` · 200 `#FFCBB8` · 300 `#FFA385` · 400 `#F57E59` · 500 `#D16A4A` · 600 `#B45A3E` · 700 `#A74728` · 800 `#7F3D28` · 900 `#602C1C` · 950 `#3F1A0E`
- **neon:** 50 `#D8FFEE` · 100 `#BCFFE1` · 200 `#73FFC6` · 300 `#57F8B8` · 400 `#27EAA6` · 500 `#25C189` · 600 `#22966B` · 700 `#1D7453` · 800 `#195A40` · 900 `#154531` · 950 `#0F2D20`

### globals.css · @theme

```css
@theme inline {
  --breakpoint-xs: 480px;

  /* Green, Marke = 700 */
  --color-pitch-50: #EDFAF7;
  --color-pitch-100: #E3F3EF;
  --color-pitch-200: #CFE3DE;
  --color-pitch-300: #B4CEC8;
  --color-pitch-400: #8AADA6;
  --color-pitch-500: #5C8B81;
  --color-pitch-600: #2E6A5F;
  --color-pitch-700: #004D43;
  --color-pitch-800: #003E34;
  --color-pitch-900: #002F28;
  --color-pitch-950: #00221C;

  /* Lime, Marke = 300 */
  --color-lime-50: #EFFFCB;
  --color-lime-100: #E4FFA9;
  --color-lime-200: #D7FF7A;
  --color-lime-300: #D0FF71;
  --color-lime-400: #BFEA67;
  --color-lime-500: #A8CE5D;
  --color-lime-600: #88A54F;
  --color-lime-700: #687E41;
  --color-lime-800: #4D5B34;
  --color-lime-900: #384129;
  --color-lime-950: #262B1F;

  /* Coral, Marke = 400, lesbar = 700 */
  --color-coral-50: #FFF1EA;
  --color-coral-100: #FFE6DC;
  --color-coral-200: #FFCBB8;
  --color-coral-300: #FFA385;
  --color-coral-400: #F57E59;
  --color-coral-500: #D16A4A;
  --color-coral-600: #B45A3E;
  --color-coral-700: #A74728;
  --color-coral-800: #7F3D28;
  --color-coral-900: #602C1C;
  --color-coral-950: #3F1A0E;

  /* Neon, Marke = 400 */
  --color-neon-50: #D8FFEE;
  --color-neon-100: #BCFFE1;
  --color-neon-200: #73FFC6;
  --color-neon-300: #57F8B8;
  --color-neon-400: #27EAA6;
  --color-neon-500: #25C189;
  --color-neon-600: #22966B;
  --color-neon-700: #1D7453;
  --color-neon-800: #195A40;
  --color-neon-900: #154531;
  --color-neon-950: #0F2D20;

  /* Schiefer, aus Dark Green abgeleitet */
  --color-neutral-50: #F7FDFD;
  --color-neutral-100: #E9EFEF;
  --color-neutral-150: #DEE5E6;
  --color-neutral-200: #D2D9D9;
  --color-neutral-300: #B7C0C0;
  --color-neutral-400: #97A1A1;
  --color-neutral-500: #788383;
  --color-neutral-600: #5B6768;
  --color-neutral-700: #445050;
  --color-neutral-800: #2D3838;
  --color-neutral-850: #202A2A;
  --color-neutral-900: #151E1E;
  --color-neutral-950: #0C1313;

  --color-board: #183132;   /* Anzeigetafel, Dark Green */
  --color-mint: #EBFFF5;
  --color-well: #0E1919;    /* Grund für Diagramme mit Nutzerfarben */

  --font-sans: "Mona Sans Variable", system-ui, sans-serif;
  --font-display: var(--font-sans);
  --font-mono: ui-monospace, Menlo, monospace;

  /* warning-* und error-* Skalen aus der bisherigen Datei unverändert übernehmen */

  /* bestehende Mappings (--color-background: var(--background) usw.) bleiben,
     zusätzlich: */
  --color-hero: var(--hero);
  --color-hero-foreground: var(--hero-foreground);
  --color-board-surface: var(--board);
  --color-board-foreground: var(--board-foreground);
  --color-well-surface: var(--well);
  --color-you: var(--you);
  --color-you-soft: var(--you-soft);
  --color-points-4: var(--points-4);
  --color-points-3: var(--points-3);
  --color-points-2: var(--points-2);
  --color-secondary-text: var(--secondary-text);
}

@utility font-wide {
  font-stretch: 125%;
  font-weight: 600;
}
```

### globals.css · :root

```css
:root {
  --radius: 0.625rem;
  --app-frame-gap: 1rem;

  /* Flächen und Text */
  --background: var(--color-neutral-150);
  --foreground: var(--color-neutral-900);
  --card: var(--color-neutral-50);
  --card-foreground: var(--foreground);
  --popover: var(--color-neutral-50);
  --popover-foreground: var(--foreground);
  --muted: var(--color-neutral-100);
  --muted-foreground: var(--color-neutral-600);
  --secondary-text: var(--color-neutral-700);
  --border: color-mix(in oklch, var(--foreground) 10%, transparent);
  --input: color-mix(in oklch, var(--foreground) 18%, transparent);
  --control-border: color-mix(in oklch, var(--foreground) 18%, transparent);
  --ring: var(--color-pitch-700);

  /* Marke */
  --primary: var(--color-pitch-700);
  --primary-foreground: var(--color-neutral-50);
  --primary-readable: var(--color-pitch-700);
  --secondary: var(--color-lime-300);
  --secondary-foreground: var(--color-board);
  --accent: color-mix(in oklch, var(--color-lime-300) 55%, transparent);
  --accent-foreground: var(--foreground);
  --brand-orange: var(--color-coral-400);            /* = Coral */
  --brand-orange-foreground: var(--color-board);
  --brand-orange-readable: var(--color-coral-700);
  --neutral: var(--color-neutral-500);

  /* Status */
  --success: var(--color-neon-400);
  --success-foreground: var(--color-board);
  --success-readable: var(--color-neon-700);
  --warning: var(--color-warning-500);
  --warning-foreground: var(--color-neutral-900);
  --error: var(--color-error-600);
  --error-foreground: var(--color-neutral-50);
  --error-readable: var(--color-error-700);
  --destructive: var(--error);
  --destructive-foreground: var(--error-foreground);
  --info: var(--color-pitch-600);
  --info-foreground: var(--color-neutral-50);

  /* Fachtokens */
  --hero: var(--color-pitch-700);                    /* grünes Panel, in beiden Modi gleich */
  --hero-foreground: var(--color-mint);
  --hero-muted: color-mix(in oklch, var(--color-mint) 74%, transparent);
  --hero-line: color-mix(in oklch, var(--color-mint) 14%, transparent);
  --board: var(--color-board);                       /* Anzeigetafel */
  --board-foreground: var(--color-mint);
  --well: var(--color-well);                         /* Diagrammgrund */
  --you: var(--color-pitch-700);                     /* "du" auf hellem Grund */
  --you-soft: color-mix(in oklch, var(--color-lime-300) 55%, transparent);
  --field-soft: color-mix(in oklch, var(--color-coral-400) 18%, transparent);
  --points-4: var(--color-lime-300);
  --points-3: var(--color-neon-400);
  --points-2: #E2FBEF;
  --points-2-foreground: var(--color-pitch-700);
  --points-0: transparent;

  /* Diagramme */
  --chart-hit-exact: var(--color-lime-300);
  --chart-hit-diff: var(--color-neon-400);
  --chart-hit-outcome: #A9EBCF;
  --chart-miss: var(--color-neutral-200);
  --chart-joker: var(--you);                         /* Joker-Bonus nur als Umriss */

  /* Navigation */
  --sidebar: var(--color-board);
  --sidebar-foreground: var(--color-mint);
  --sidebar-muted: #A9BEBD;
  --sidebar-accent: color-mix(in oklch, var(--color-mint) 8%, transparent);
  --sidebar-accent-foreground: var(--color-mint);
  --sidebar-primary: var(--color-lime-300);
  --sidebar-primary-foreground: var(--color-board);
  --sidebar-border: color-mix(in oklch, var(--color-mint) 10%, transparent);
  --sidebar-ring: var(--color-lime-300);

  /* Mobile Navigation: flach statt Glas */
  --mobile-glass-solid: var(--color-neutral-50);
  --mobile-glass-background: var(--color-neutral-50);
  --mobile-glass-background-reduced: var(--color-neutral-50);
  --mobile-glass-border: var(--border);
  --mobile-glass-highlight: transparent;
  --mobile-glass-shadow: transparent;
  --mobile-lens-background: var(--you-soft);
  --mobile-lens-highlight: transparent;

  /* Bundesliga-Tabelle */
  --table-meister: var(--color-lime-300);
  --table-cl: var(--color-pitch-700);
  --table-el: var(--color-neon-400);
  --table-warning: var(--color-warning-500);
  --table-danger: var(--color-error-500);
}
```

### globals.css · .dark

```css
.dark {
  --background: var(--color-neutral-900);
  --foreground: #EEF4F4;
  --card: var(--color-neutral-850);
  --popover: var(--color-neutral-800);
  --muted: var(--color-neutral-800);
  --muted-foreground: var(--color-neutral-400);
  --secondary-text: var(--color-neutral-300);
  --border: color-mix(in oklch, var(--foreground) 8%, transparent);
  --input: color-mix(in oklch, var(--foreground) 16%, transparent);
  --control-border: color-mix(in oklch, var(--foreground) 16%, transparent);
  --ring: var(--color-lime-300);

  --primary: var(--color-lime-300);
  --primary-foreground: var(--color-board);
  --primary-readable: var(--color-lime-300);
  --brand-orange-readable: var(--color-coral-400);
  --success-readable: var(--color-neon-300);
  --error: var(--color-error-400);
  --error-foreground: var(--color-neutral-950);
  --error-readable: var(--color-error-300);
  --warning: var(--color-warning-400);

  --you: var(--color-lime-300);
  --you-soft: color-mix(in oklch, var(--color-lime-300) 16%, transparent);
  --field-soft: color-mix(in oklch, var(--color-coral-400) 16%, transparent);
  --points-2: color-mix(in oklch, var(--color-neon-400) 13%, transparent);
  --points-2-foreground: #86F3CD;
  --board: var(--color-neutral-950);

  --chart-hit-outcome: #5FAF92;
  --chart-miss: var(--color-neutral-700);

  --sidebar: var(--color-neutral-950);
  --sidebar-foreground: #EEF4F4;
  --sidebar-muted: var(--color-neutral-400);

  --mobile-glass-solid: var(--color-neutral-950);
  --mobile-glass-background: var(--color-neutral-950);
  --mobile-glass-background-reduced: var(--color-neutral-950);

  --table-meister: var(--color-lime-300);
  --table-cl: var(--color-neon-400);
  --table-el: var(--color-neon-300);
  --table-warning: var(--color-warning-400);
  --table-danger: var(--color-error-400);
  /* --hero bleibt Green: das Panel sieht in beiden Modi gleich aus */
}
```

### globals.css · Basis

```css
@layer base {
  body {
    @apply min-h-dvh bg-background font-sans text-foreground antialiased;
    font-variant-numeric: lining-nums proportional-nums;   /* ersetzt die Inter-Features */
  }
  h1, h2, h3, h4 {
    font-stretch: 125%;
    font-weight: 600;
    letter-spacing: 0;          /* bisher -0.025em */
    text-wrap: balance;
  }
}

.surface-raised { /* hell */
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px rgb(21 30 30 / .05), 0 8px 24px rgb(21 30 30 / .05);
}
.dark .surface-raised { box-shadow: none; }

.mobile-liquid-dock { background: var(--mobile-glass-solid); backdrop-filter: none; }

@keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
```

### Nutzerfarben im Code

```ts
import { converter, formatHex, clampChroma } from "culori";

const toOklch = converter("oklch");
const BAND = { light: [0.45, 0.70], dark: [0.58, 0.88] } as const;

/** Nutzerfarbe je Untergrund lesbar machen: Farbton bleibt, Helligkeit ins Band. */
export function userTone(hex: string, mode: "light" | "dark"): string {
  const c = toOklch(hex);
  if (!c) return hex;
  const [lo, hi] = BAND[mode];
  const l = Math.min(hi, Math.max(lo, c.l));
  return formatHex(clampChroma({ ...c, l }, "oklch"));
}
```

```tsx
// pro Spieler einmal berechnen (nicht bei jedem Render)
<li style={{ "--uc": userTone(user.color, "light"), "--uc-dark": userTone(user.color, "dark") } as React.CSSProperties}>
```

```css
.user-ring { box-shadow: 0 0 0 2px var(--uc); }
.dark .user-ring, .on-well .user-ring { box-shadow: 0 0 0 2px var(--uc-dark); }
.user-bar { background: var(--uc); }
.dark .user-bar { background: var(--uc-dark); }
```

Regeln: gespeicherte Farbe bleibt unverändert · Diagramme mit Nutzerfarben auf `--well` mit `--uc-dark` · nie Text in `--uc` · neue Spieler brauchen keinen Code (Liste und Farben aus den Daten).

---

## 9. Checkliste für neue Screens

- [ ] **Hierarchie:** genau ein grünes Panel, beantwortet die Hauptfrage
- [ ] **Farbe:** alle Flächen aus Schiefer, jede Farbe nur in ihrer Bedeutung
- [ ] **Du:** Lime nur für dich und die eine Hauptaktion
- [ ] **Spieler:** Ring/Balken/Linie in angepasster Nutzerfarbe, Name daneben
- [ ] **Ergebnisse:** jeder Spielstand auf der Anzeigetafel, nichts anderes darauf
- [ ] **Zahlen:** 125 % breit, proportionale Ziffern, Formate aus Kapitel 7
- [ ] **Raster:** alle Maße auf 4 px, gleiche Elemente gleich groß, Radien verschachtelt
- [ ] **Zustände:** Hover, Gedrückt, Fokus, Deaktiviert, Leer, Laden; Fokusring sichtbar
- [ ] **Mobil:** Tippflächen ≥ 44 px, Schrift ≥ 11 px, Details im Bottom Sheet
- [ ] **Dunkel:** eigene Werte statt Umkehrung, keine Schatten, Kontraste geprüft
- [ ] **Texte:** duzen, keine Ausrufezeichen, kein Punkt in Labels, Vergleiche mit Bezug
- [ ] **Wachstum:** funktioniert mit 2 und 12 Spielern, mit 1 und 34 Spieltagen
