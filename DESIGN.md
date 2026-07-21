---
name: Kicktipp Deluxe
description: A compact Bundesliga match center for private prediction leagues.
colorRamps:
  primary:
    50: "oklch(97.18% 0.01 258.36)"
    100: "oklch(93.24% 0.02 263.20)"
    200: "oklch(88.21% 0.04 261.52)"
    300: "oklch(80.26% 0.07 259.63)"
    400: "oklch(70.34% 0.10 260.52)"
    500: "oklch(61.26% 0.14 265.06)"
    600: "oklch(53.74% 0.16 268.13)"
    700: "oklch(46.18% 0.15 269.98)"
    800: "oklch(42.74% 0.13 271.73)"
    900: "oklch(38.13% 0.10 271.51)"
    950: "oklch(28.64% 0.06 274.29)"
  secondary:
    50: "oklch(98.14% 0.01 196.80)"
    100: "oklch(94.89% 0.03 199.04)"
    200: "oklch(90.10% 0.06 200.44)"
    300: "oklch(83.22% 0.09 201.27)"
    400: "oklch(74.48% 0.11 202.86)"
    500: "oklch(66.30% 0.10 204.92)"
    600: "oklch(56.96% 0.09 210.37)"
    700: "oklch(49.32% 0.07 212.00)"
    800: "oklch(43.40% 0.06 213.91)"
    900: "oklch(38.60% 0.05 218.94)"
    950: "oklch(29.12% 0.04 220.82)"
  neutral:
    50: "oklch(97.59% 0.00 264.70)"
    100: "oklch(94.87% 0.01 264.61)"
    200: "oklch(88.69% 0.01 259.84)"
    300: "oklch(78.62% 0.02 259.20)"
    400: "oklch(66.51% 0.04 256.79)"
    500: "oklch(55.44% 0.04 257.42)"
    600: "oklch(48.62% 0.04 260.28)"
    700: "oklch(42.19% 0.03 261.30)"
    800: "oklch(38.08% 0.03 260.61)"
    900: "oklch(34.77% 0.02 264.23)"
    950: "oklch(27.17% 0.01 261.69)"
  success:
    50: "oklch(98.47% 0.04 125.15)"
    100: "oklch(96.68% 0.08 127.45)"
    200: "oklch(94.08% 0.15 129.36)"
    300: "oklch(91.47% 0.22 131.78)"
    400: "oklch(87.85% 0.26 135.62)"
    500: "oklch(80.94% 0.24 136.18)"
    600: "oklch(68.39% 0.21 136.57)"
    700: "oklch(56.01% 0.17 136.51)"
    800: "oklch(47.15% 0.14 135.90)"
    900: "oklch(41.92% 0.12 135.79)"
    950: "oklch(28.58% 0.09 136.04)"
  warning:
    50: "oklch(98.10% 0.01 80.68)"
    100: "oklch(95.89% 0.04 83.76)"
    200: "oklch(90.76% 0.07 78.61)"
    300: "oklch(84.65% 0.11 75.25)"
    400: "oklch(76.94% 0.14 65.62)"
    500: "oklch(71.52% 0.16 57.45)"
    600: "oklch(65.30% 0.17 49.43)"
    700: "oklch(56.04% 0.15 45.69)"
    800: "oklch(47.56% 0.12 43.57)"
    900: "oklch(41.47% 0.10 44.61)"
    950: "oklch(27.10% 0.06 42.10)"
  error:
    50: "oklch(97.05% 0.01 17.51)"
    100: "oklch(94.21% 0.03 17.71)"
    200: "oklch(89.37% 0.05 15.17)"
    300: "oklch(81.12% 0.10 16.17)"
    400: "oklch(71.81% 0.15 17.70)"
    500: "oklch(63.71% 0.20 19.85)"
    600: "oklch(57.36% 0.21 20.41)"
    700: "oklch(50.04% 0.19 19.51)"
    800: "oklch(44.38% 0.16 16.96)"
    900: "oklch(40.17% 0.14 13.73)"
    950: "oklch(26.53% 0.09 15.24)"
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

- **Match Indigo:** Primäre Aktionen, aktuelle Navigation, Fokus-Ring und ausgewählte Zustände.

### Secondary

- **Pitch Cyan:** Sekundäre Aktionen, Informationszustände und dezente Akzentflächen mit dunkler Schrift.

### Tertiary

- **Success:** Abgeschlossene oder erfolgreiche Zustände mit Neutral-950 als Vordergrund.
- **Warning:** Fristen, Aufmerksamkeit und riskante Zustände mit Neutral-950 als Vordergrund.
- **Error:** Fehler und destruktive Aktionen; Light nutzt Error-600 mit Neutral-50, Dark Error-400 mit Neutral-950.

### Neutral

- **Neutral 50–950:** Vollständige Grundlage für Text, Hintergründe, Borders, Muted-Flächen, Sidebar und Dark-Mode-Abstufungen.

### Named Rules

**The Meaning Before Decoration Rule.** Markenfarben kennzeichnen Aktion, Auswahl oder Status; sie werden nie als unmotivierter Schmuck eingesetzt.

**The Domain Color Rule.** Gespeicherte Spielerfarben und originale Vereinslogos bleiben unangetastet. Tabellenzonen und fachliche Diagrammkategorien verwenden ausschließlich die dokumentierten Rampen.

**The Closed Palette Rule.** Alle UI-, Status-, Tabellen- und Diagrammfarben stammen aus den sechs dokumentierten OKLCH-Rampen. Nur gespeicherte Spielerfarben und originale Vereinslogos sind fachliche Ausnahmen; `transparent`, `currentColor` und funktionale Alpha-Zustände gelten nicht als zusätzliche Farbfamilien.

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
- **Responsive Gutter:** mobil 12px horizontal und 16px vertikal, ab `sm` 16px, ab `lg` 24px und ab `2xl` 32px.
- **Seitenrhythmus:** 24px zwischen Hauptgruppen, ab `2xl` 32px; interne Gruppen verwenden 8, 12 oder 16px.
- **Mobile:** Die Content-Plane bleibt vollflächig und ohne äußeren Schatten. Raised Panels verwenden nur ihre kurze lokale Tiefe.
- **Compact App Shell:** Unter 64rem ersetzt eine safe-area-fähige Bottom-Navigation die Desktop-Sidebar; der Inhalt erhält ausreichend Scroll-Padding für die schwebende Leiste.

## Components

### Buttons

- **Shape:** kompakt und leicht gerundet (10px).
- **Primary:** Light nutzt Primary-600 mit Neutral-50, Dark Primary-400 mit Neutral-950; 40px Höhe und 16px horizontaler Innenabstand.
- **Hover / Focus:** leichte Tonverschiebung, klarer Indigo-Ring und funktionale 150–200-ms-Übergänge.
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

Ab 64rem ist die Sidebar eine eigenständige Layered-Material-Ebene: 17.5rem breit und auf 4rem einklappbar. Spieltag, Tippen, Bundesliga und Statistiken bilden die fachliche Navigation; Profilzugriffe liegen ausschließlich im Kontomenü und Admin erscheint als getrennte Berechtigungsgruppe. Aktive Ziele nutzen eine eingelassene Primary-Fläche, Hover-Zustände eine kurz angehobene Neutral-Fläche. Tooltips sichern die Erkennbarkeit im eingeklappten Zustand.

Unter 64rem bleiben dieselben vier Ziele als permanente Bottom-Tabs sichtbar. Eine einzige schwebende Regular-Liquid-Glass-Fläche nutzt direkte Alpha-Abstufungen aus Neutral, `backdrop-filter: blur(20px) saturate(135%)` und einen kurzen Schatten. Nur der aktive Tab erhält einen gemeinsamen beweglichen Primary-Lens; die Tabs selbst erzeugen keine weiteren Glasflächen. Ohne Filterunterstützung oder bei reduzierter Transparenz wird die Fläche opaker. Konto, Theme und Admin liegen im Avatar-Sheet der Primary-Kopfzeile.

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
