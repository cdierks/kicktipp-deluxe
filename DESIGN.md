---
name: Kicktipp Deluxe
description: A compact Bundesliga match center for private prediction leagues.
colorRamps:
  primary:
    50: "oklch(96.688% 0.00989 267.359)"
    100: "oklch(93.601% 0.01746 264.484)"
    200: "oklch(88.687% 0.02958 264.413)"
    300: "oklch(85.261% 0.04048 269.932)"
    400: "oklch(80.550% 0.05196 268.036)"
    500: "oklch(54.342% 0.09676 261.914)"
    600: "oklch(33.722% 0.11002 262.626)"
    700: "oklch(30.158% 0.09487 262.296)"
    800: "oklch(27.676% 0.08054 261.518)"
    900: "oklch(24.978% 0.06870 261.761)"
    950: "oklch(20.703% 0.04721 261.566)"
  secondary:
    50: "oklch(96.838% 0.01079 256.695)"
    100: "oklch(94.211% 0.01945 252.881)"
    200: "oklch(89.293% 0.03542 250.877)"
    300: "oklch(81.899% 0.05804 251.744)"
    400: "oklch(73.622% 0.07941 252.958)"
    500: "oklch(65.517% 0.09237 252.730)"
    600: "oklch(50.735% 0.10287 251.304)"
    700: "oklch(43.340% 0.08752 250.993)"
    800: "oklch(38.594% 0.07204 250.809)"
    900: "oklch(34.486% 0.05950 250.717)"
    950: "oklch(27.173% 0.04445 252.093)"
  neutral:
    50: "oklch(98.427% 0.00395 106.472)"
    100: "oklch(95.375% 0.00664 106.525)"
    200: "oklch(92.735% 0.00678 97.357)"
    300: "oklch(83.024% 0.01234 106.665)"
    400: "oklch(69.279% 0.01573 106.803)"
    500: "oklch(53.197% 0.01374 106.858)"
    600: "oklch(49.393% 0.01090 106.792)"
    700: "oklch(40.340% 0.00982 106.832)"
    800: "oklch(30.775% 0.00701 106.804)"
    900: "oklch(26.336% 0.00547 106.769)"
    950: "oklch(22.567% 0.00379 106.700)"
  success:
    50: "oklch(97.173% 0.01071 158.849)"
    100: "oklch(94.045% 0.02153 158.581)"
    200: "oklch(87.983% 0.04423 160.899)"
    300: "oklch(80.457% 0.07112 161.696)"
    400: "oklch(73.126% 0.09014 161.300)"
    500: "oklch(61.685% 0.09963 164.002)"
    600: "oklch(52.329% 0.09738 161.703)"
    700: "oklch(44.961% 0.08141 161.936)"
    800: "oklch(39.268% 0.06796 162.892)"
    900: "oklch(34.719% 0.05705 162.774)"
    950: "oklch(26.761% 0.04042 162.720)"
  warning:
    50: "oklch(97.922% 0.01512 90.233)"
    100: "oklch(95.043% 0.03459 88.776)"
    200: "oklch(89.330% 0.07004 88.250)"
    300: "oklch(83.810% 0.10430 85.161)"
    400: "oklch(79.274% 0.12824 84.163)"
    500: "oklch(75.041% 0.13648 78.023)"
    600: "oklch(64.421% 0.12544 75.449)"
    700: "oklch(53.595% 0.10375 73.810)"
    800: "oklch(46.154% 0.08445 72.608)"
    900: "oklch(40.668% 0.06818 72.401)"
    950: "oklch(28.985% 0.04425 75.542)"
  error:
    50: "oklch(96.729% 0.01211 4.745)"
    100: "oklch(93.497% 0.02492 2.092)"
    200: "oklch(87.364% 0.04774 3.348)"
    300: "oklch(78.640% 0.08776 3.794)"
    400: "oklch(69.768% 0.12701 6.360)"
    500: "oklch(60.139% 0.16670 8.751)"
    600: "oklch(51.911% 0.17223 10.828)"
    700: "oklch(45.502% 0.15252 11.122)"
    800: "oklch(40.385% 0.12747 9.782)"
    900: "oklch(36.188% 0.10628 7.817)"
    950: "oklch(26.068% 0.07385 6.912)"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0"
  tab-label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  surface-max: "14px"
  navigation-capsule: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
semanticTokens:
  light:
    primary-readable: "{colorRamps.primary.700}"
    success-readable: "{colorRamps.success.800}"
    error-readable: "{colorRamps.error.700}"
    control-border: "{colorRamps.neutral.500}"
  dark:
    primary-readable: "{colorRamps.primary.300}"
    success-readable: "{colorRamps.success.300}"
    error-readable: "{colorRamps.error.300}"
    control-border: "{colorRamps.neutral.400}"
components:
  button-primary:
    backgroundColor: "{colorRamps.primary.600}"
    textColor: "{colorRamps.neutral.50}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  field:
    backgroundColor: "{colorRamps.neutral.50}"
    textColor: "{colorRamps.neutral.950}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 12px"
  panel:
    backgroundColor: "{colorRamps.neutral.50}"
    textColor: "{colorRamps.neutral.950}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Kicktipp Deluxe

## Overview

**Creative North Star: "Kompaktes Match-Center"**

Kicktipp Deluxe fühlt sich wie eine fokussierte Spieltagsanwendung an: ruhig im Rahmen, dicht in den Daten und lebendig dort, wo Ergebnisse und Mitspieler relevant werden. Die Informationshierarchie folgt dem Spieltag – Kontext, eigene Leistung, Spiele, Feldvergleich und vertiefende Statistiken.

Die Oberfläche ist flach und strukturell. Grenzen und dezente Tonflächen gruppieren Inhalte; Karten werden nur für eigenständige Informationseinheiten eingesetzt. Generische SaaS-Kartenwände, Marketing-Heroes, dekoratives Glassmorphism, verschachtelte Karten und dekorative Kennzahlen sind ausgeschlossen. Die mobile Bottom-Navigation ist die einzige funktionale Liquid-Glass-Ausnahme.

**Key Characteristics:**

- kompakte, scannbare Informationsdichte;
- ein klarer primärer Fokus pro Ansicht;
- vertraute shadcn-Bedienmuster;
- ruhige neutrale Flächen mit gezielter Markenfarbe;
- fußballspezifische Tabellen-, Spieler- und Diagrammfarben.

## Colors

Die Primary-Rampe führt Aktionen und Auswahl, Secondary liefert Orientierung, und die Neutral-Rampe strukturiert Light- und Dark-Flächen. Success, Warning und Error sind ausschließlich semantischen Zuständen vorbehalten.

### Primary

- **Marineblau (#16336F):** Primäre Aktionen, aktuelle Navigation, Fokus-Ring und ausgewählte Zustände.

### Secondary

- **Abgestuftes Blau:** Sekundäre Aktionen, Informationszustände und dezente Akzentflächen mit dunkler Schrift.

### Tertiary

- **Success (ruhiges Smaragdgrün):** Abgeschlossene oder erfolgreiche Zustände mit Neutral-950 als Vordergrund.
- **Warning (Amber):** Fristen, Aufmerksamkeit und riskante Zustände mit Neutral-950 als Vordergrund.
- **Error (kühles Rot):** Fehler und destruktive Aktionen; Light nutzt Error-600 mit Neutral-50, Dark Error-400 mit Neutral-950.

### Neutral

- **Neutral 50–950:** Vollständige Grundlage für Text, Hintergründe, Borders, Muted-Flächen, Sidebar und Dark-Mode-Abstufungen.

### Corporate-Akzent

Rotorange (#FE492A) ist ausschließlich der Marke vorbehalten: Hintergrund des KD-Zeichens und Punkt in „Kicktipp.Deluxe“. Die Beschriftung des Zeichens nutzt Neutral-950. Der Punkt verwendet im Hellmodus das kontrastreichere #BF351F; im Dunkelmodus nutzen beide Akzente das weichere #F77960. Buttons und Links bleiben blau. Aktive Navigationsflächen verwenden warmes Steingrau mit marineblauer Schrift im Hellmodus sowie helleres Graphit mit warmweißer Schrift im Dunkelmodus. Die Tokens `brand-orange`, `brand-orange-foreground` und `brand-orange-readable` trennen Marke und Fehlerstatus.

### Warmer Graphit

Die Neutral-Rampe nimmt die Temperatur des Creme-Ankers #F0EEDF auf, ohne eine beigefarbene Arbeitsfläche zu erzeugen. Hell: äußerer Rahmen #E8E7E2, Inhaltsfläche #FAFAF7, Sidebar und abgesetzte Flächen #F0F0EB. Dunkel: Hintergrund #1C1C1A, Inhaltsfläche #252522, erhöhte Flächen #30302C. Hellblau #B1BFE2 trägt primäre Aktionen im Dunkelmodus; Fließtext bleibt warmes Fastweiß.

### Named Rules

**The Meaning Before Decoration Rule.** Markenfarben kennzeichnen Aktion, Auswahl oder Status; sie werden nie als unmotivierter Schmuck eingesetzt.

**The Domain Color Rule.** Gespeicherte Spielerfarben und originale Vereinslogos bleiben unangetastet. Tabellenzonen und fachliche Diagrammkategorien verwenden ausschließlich die dokumentierten Rampen.

**The Closed Palette Rule.** Alle UI-, Status-, Tabellen- und Diagrammfarben stammen aus den sechs dokumentierten OKLCH-Rampen und den drei Corporate-Akzent-Tokens. Nur gespeicherte Spielerfarben und originale Vereinslogos sind fachliche Ausnahmen; `transparent`, `currentColor` und funktionale Alpha-Zustände gelten nicht als zusätzliche Farbfamilien.

Diagramme verwenden themeabhängige `chart-1` bis `chart-8` sowie gemeinsame `chart-hit-*`, `chart-joker-*` und `chart-miss`-Tokens. Dadurch bleiben Treffer- und Jokerkategorien in Statistik und Spielerprofil auch auf Graphit erkennbar. Gespeicherte Spielerfarben haben weiterhin Vorrang.

### Semantic Readability Tokens

Gesättigte Flächen und farbiger Text haben unterschiedliche Kontrastaufgaben.
Die regulären Tokens `primary`, `success` und `error` tragen gefüllte Controls
oder Statusflächen. Auf neutralen Hintergründen werden ausschließlich die
stärkeren Texttokens verwendet:

| Token | Light | Dark | Zweck |
|---|---|---|---|
| `primary-readable` | Primary-700 | Primary-300 | Links, hervorgehobene Werte und Primary-Icons auf Neutral |
| `success-readable` | Success-800 | Success-300 | positiver Status als Text oder Icon auf Neutral |
| `error-readable` | Error-700 | Error-300 | Fehlertext und destruktive Hinweise auf Neutral |
| `control-border` | Neutral-500 | Neutral-400 | sichtbare Begrenzung interaktiver Felder und Auswahlcontrols |

`control-border` ist bewusst kontrastreicher als der strukturelle
`border`-Token. Dadurch bleiben Input- und Select-Grenzen ohne Schatten
erkennbar. Für Warning- und Secondary-Flächen bleibt Neutral-950 die
vorgesehene Vordergrundfarbe; ein zusätzliches Farbfamilien-Token ist nicht
nötig.

**The Filled-vs-Readable Rule.** Ein Flächentoken wird nicht automatisch als
Textfarbe wiederverwendet. Farbiger Text auf neutralem Grund nutzt das passende
`*-readable`; Text auf gefüllten semantischen Flächen nutzt das zugehörige
`*-foreground`.

## Typography

**Display Font:** Inter Variable
**Body Font:** Inter Variable
**Label/Mono Font:** Inter Variable

**Character:** Eine einzige präzise Sans-Familie trägt Navigation, Formulare, Daten und Titel. Variable Gewichte erzeugen Hierarchie; Resultate und Tabellen erhalten tabellarische Ziffern.

### Hierarchy

- **Display** (700, 1.5–1.875rem, 1.15): Seitentitel, niemals als Marketing-Hero.
- **Headline** (650, 1–1.125rem, 1.3): Abschnitte und wichtige Paneltitel.
- **Title** (600, 0.875–1rem, 1.4): Karten, Tabellen und Dialoge.
- **Body** (400, 0.875rem, 1.5): Beschreibungen mit maximal 65–75 Zeichen pro Zeile.
- **Label** (600, 0.75–0.8125rem, normaler Zeichenabstand, Satzschreibung): Feldnamen, Spalten und Statusdetails. Versalien bleiben seltenen, kurzen Statuskürzeln vorbehalten.

### Named Rules

**The One Inter Rule.** Inter ist die einzige Schrift. Display-, Sans- und Mono-Aliase zeigen auf dieselbe lokale Variable-Font-Datei.

**The Match Number Rule.** Resultate, Punkte, Tabellenplätze, Uhrzeiten und Diagrammwerte verwenden `tnum`, ohne die globalen Inter-Features zu überschreiben.

**The Route Title Rule.** Der H1 nennt immer das aktuelle Navigationsziel, etwa „Tippen“, „Bundesliga“ oder „Statistiken“. Spieltag, Saison und Status erscheinen als Kontext im Eyebrow oder in der Beschreibung und ersetzen niemals den Seitentitel.

**The Mobile Matchday Title Rule.** In der mobilen Large-Title-Bar benennt die Ansicht „Spieltag“ abweichend vom Desktop den tatsächlich betrachteten Spieltag, etwa „34. Spieltag“. Beim Wechsel auf historische Spieltage folgt die Zahl der URL; Bundesliga und Statistiken behalten ihre Routentitel.

## Elevation

Die App verwendet eine klar begrenzte Ebenenhierarchie. Die Sidebar und die gemeinsame Content-Plane liegen angehoben auf dem neutralen App-Untergrund. Eigenständige Hauptpanels dürfen eine kurze gerichtete Tiefe erhalten; Tabellenzeilen, KPI-Zellen, Formgruppen und andere innere Strukturen bleiben flach und werden durch Tonflächen oder Divider gegliedert.

### Shadow Vocabulary

- **Floating overlay** (`0 4px 8px var(--color-neutral-300)`): Ausschließlich Dropdown, Popover, Tooltip und Dialog; im Dark Mode ersetzt Oberflächenhelligkeit den Schatten.
- **Pressed surface** (`0 1px 2px var(--color-neutral-200)`): Optional für interaktive, nicht verschachtelte Zeilen.
- **Sidebar raised** (`0 1px 2px` plus `0 3px 6px` aus Neutral): Logo, ausgewähltes Theme-Segment und Kontozugriff erhalten eine kurze gerichtete Tiefe.
- **Sidebar inset** (`inset 0 1px 3px`): Aktive Navigation und Theme-Schiene wirken gedrückt beziehungsweise eingelassen. Dark Mode nutzt ausschließlich Neutral-700 bis Neutral-950.
- **Content plane** (`inset 0 1px 0` plus `0 1px 2px` und `0 3px 8px` aus Neutral): Der komplette Desktop-Inhaltsbereich liegt als zusammenhängende Ebene auf dem App-Untergrund.
- **Raised panel** (`inset 0 1px 0` plus `0 1px 2px` und `0 3px 6px` aus Neutral): Nur abgeschlossene Hauptpanels wie Matchliste, Ranking, Diagramm oder priorisierte Adminaufgabe.

### Named Rules

**The Flat-by-Default Rule.** Ein Panel erhält Border oder kleinen Schatten, niemals eine Border plus breiten Schatten.

**The Two-Level Content Rule.** Content-Plane und eigenständige Hauptpanels bilden die einzigen dauerhaften Inhalts-Ebenen. Innere Zellen und Gruppen erzeugen keine weitere Schattenstufe.

## Application frame

- **Maximale Inhaltsbreite:** 100rem für jede authentifizierte Route.
- **Desktop-Außenrahmen:** Ab 64rem jeweils 16px Außenrand und sichtbarer Abstand zwischen Sidebar und Content-Plane; ab 90rem jeweils 24px. Die nutzbare Sidebar-Breite bleibt erhalten. Container, Platzhalter und Content-Mindesthöhe berücksichtigen denselben `app-frame-gap`, auch bei eingeklappter Sidebar.
- **Responsive Gutter:** mobil 12px horizontal und 16px vertikal, ab `sm` 16px, ab `lg` 24px und ab `2xl` 32px.
- **Seitenrhythmus:** 24px zwischen Hauptgruppen, ab `2xl` 32px; interne Gruppen verwenden 8, 12 oder 16px.
- **Mobile:** Die Content-Plane bleibt vollflächig und ohne äußeren Schatten. Raised Panels verwenden nur ihre kurze lokale Tiefe.
- **Compact App Shell:** Unter 64rem ersetzt eine safe-area-fähige Bottom-Navigation die Desktop-Sidebar; der Inhalt erhält ausreichend Scroll-Padding für die schwebende Leiste.

## Components

### Buttons

- **Shape:** kompakt und leicht gerundet (10px).
- **Primary:** Light nutzt Primary-600 mit Neutral-50, Dark Primary-400 mit Neutral-950; 40px Höhe und 16px horizontaler Innenabstand.
- **Hover / Focus:** leichte Tonverschiebung, klarer blauer Ring und funktionale 150–200-ms-Übergänge.
- **Secondary / Ghost:** Secondary-Rampe oder eine feste Neutral-Fläche; inaktive Zustände tragen keine gesättigte Farbe.

### Chips

- **Style:** pillenförmig nur für Status, Filter oder sehr kurze Metadaten; normaler Zeichenabstand.
- **State:** Text oder Symbol ergänzt jede farbliche Bedeutung.

### Cards / Containers

- **Corner Style:** 12px, in Ausnahmefällen maximal 14px.
- **Background:** Card- oder Muted-Token, keine Verläufe und kein Glas.
- **Shadow Strategy:** flach; Elevation nur für echte Overlays.
- **Border:** vollständige 1px-Border, keine farbigen Seitenstreifen.
- **Internal Padding:** 12–16px, 24px nur für leere oder auth-fokussierte Ansichten.

### Inputs / Fields

- **Style:** 40px hoch, 10px Radius, klarer Border und lesbarer Placeholder.
- **Focus:** sichtbarer Primary-Ring, ohne Layoutsprung.
- **Error / Disabled:** semantische Farbe plus Text beziehungsweise Symbol; niemals nur Farbe.

### Navigation

Ab 64rem ist die Sidebar eine eigenständige Layered-Material-Ebene: mit 16.5rem nutzbarer Breite und auf 4rem einklappbar; hinzu kommt der responsive Außenabstand. Spieltag, Tippen, Bundesliga und Statistiken bilden die fachliche Navigation; Profilzugriffe liegen ausschließlich im Kontomenü und Admin erscheint als getrennte Berechtigungsgruppe. Aktive Ziele nutzen eine eingelassene Neutral-200-Fläche mit Primary-600-Schrift (Dark: Neutral-700 mit Neutral-50-Schrift), Hover-Zustände eine kurz angehobene Neutral-Fläche. Tooltips sichern die Erkennbarkeit im eingeklappten Zustand.

Unter 64rem bleiben dieselben vier Ziele als permanente Bottom-Tabs sichtbar. Eine einzige schwebende Regular-Liquid-Glass-Fläche nutzt direkte Alpha-Abstufungen aus Neutral, `backdrop-filter: blur(28px) saturate(135%)` bei 64% Deckkraft. Warmes Milchglas im Hellmodus und warmes Rauchglas im Dunkelmodus erhalten eine obere Lichtkante, einen kurzen Kontaktschatten und einen weichen Schatten (`0 8px 24px -4px`). Nur der aktive Tab erhält eine gemeinsame bewegliche Auswahlfläche aus warmem Steingrau (Neutral-200 bei 85% Deckkraft; Dark: Neutral-700 bei 88% Deckkraft); die Tabs selbst erzeugen keine weiteren Glasflächen. Ohne Filterunterstützung ist die Fläche deckend; reduzierte Transparenz nutzt 96% Deckkraft mit 8px Blur. Erhöhter Kontrast verwendet eine deckende Fläche ohne Blur. Beschriftungen sind immer deckend. Konto, Theme und Admin liegen im Avatar-Sheet der Primary-Kopfzeile.

Die mobile Spieltagsnavigation reserviert die vorherige Position immer für einen 44-px-Pfeilbutton. Am ersten verfügbaren Spieltag bleibt er sichtbar, trägt einen verständlichen Accessible Name und verwendet den nativen Disabled-State; Desktop behält an dieser Stelle seine bestehende Leerstelle.

**The Single Glass Layer Rule.** Liquid Glass ist ausschließlich für die kompakte Bottom-Navigation erlaubt. Content, Karten, Sheet und aktive Tabfläche verwenden kein eigenes `backdrop-filter`, damit niemals Glas auf Glas entsteht.

Dashboard-Ansichten sind URL-gesteuert: `/dashboard` zeigt den Spieltag, `?ansicht=bundesliga` die Tabelle und `?ansicht=statistiken` die Auswertung. Historische Spieltagspfade bleiben beim Ansichtswechsel erhalten. Der Inhaltskopf zeigt den aktuellen Seitenkontext; eine zusätzliche Tab-Leiste im Inhalt entfällt.

Die mobile App-Kopfzeile nutzt Primary-700 mit Neutral-50 für WCAG-AA-kontrastreichen Text. Am Seitenanfang zeigt sie als 124-px-Large-Title-Bar den Routentitel, genau eine kontextabhängige Zeile und einen räumlich angehobenen Kontozugriff mit Avatar, Name und Öffnungsindikator. Nach 48px Scrollweg reduziert sie sich funktional auf eine 56-px-Leiste; bei reduzierter Bewegung erfolgt der Zustandswechsel ohne Übergang. Primary-500 beziehungsweise Primary-600 bilden Trenn-, Hover- und Pressed-Stufen. Der Desktop-Header bleibt kompakt und unverändert.

Der Footer verbindet eine eingelassene Hell-/Dunkel-/System-Auswahl mit einem angehobenen Kontozugriff. Translation und Schatten reagieren innerhalb von 120–180ms; bei reduzierter Bewegung entfallen räumliche Translationen.

### Match Row

Die Matchzeile verbindet Uhrzeit und Status, Vereine, Ergebnis, eigenen Tipp, Punkte und Feldvergleich in einer einzigen Ebene. Desktop nutzt tabellarische Spalten, Mobile eine kompakte zweizeilige Anordnung ohne Card-in-Card-Struktur.

### Tables

Die umgebende Hauptfläche besitzt Radius und Tiefe; die Tabelle selbst bleibt rechteckig und flach. Kopfzeilen nutzen `Muted`, Datenzeilen einen neutralen Hover und semantisch markierte Zeilen behalten ihren eigenen Ton. Tabellenzonen werden als kompakte, zur Legende passende Farbmarker neben dem Rang dargestellt – niemals als unterbrochene Seitenstreifen.

## Do's and Don'ts

### Do:

- **Do** Seitentitel auf 24–30px begrenzen und den Spieltagskontext direkt daneben oder darunter zeigen.
- **Do** 8/12/16/24px als räumlichen Rhythmus verwenden.
- **Do** maximal vier zentrale Kennzahlen gleichzeitig hervorheben.
- **Do** alle sichtbaren Controls aus der gemeinsamen shadcn-Schicht aufbauen.
- **Do** Inter-Features global und `tnum` gezielt für Daten verwenden.

### Don't:

- **Don't** eine generische SaaS-Kartenwand mit austauschbaren Icon-Kacheln bauen.
- **Don't** Marketing-Heroes, Glassmorphism-, Gradient- oder Grid-Noise-Ästhetik verwenden.
- **Don't** übergroße Titel, dekorative Kennzahlen oder verschachtelte Karten einsetzen.
- **Don't** Versal-Kicker mit weitem Zeichenabstand als wiederkehrendes Abschnittsmuster verwenden.
- **Don't** Inhaltskarten stärker als 14px runden oder Border und breiten Schatten kombinieren.
