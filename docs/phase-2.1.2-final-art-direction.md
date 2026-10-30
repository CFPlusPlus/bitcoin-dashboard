# Phase 2.1.2 – Final Art Direction & Color Exploration

30. Oktober 2026 · `CFPlusPlus/bitcoin-dashboard` · Basis `origin/main`,
    Commit `237c715` · Branch `feature/phase-2.1.2-final-art-direction`.

**Eine konsolidierte Art-Direction-Kandidatin, genau drei Paletten, jeweils Dark
und Light. Empfehlung: B · Bitcoin Analytical. Die Betreiberfreigabe ist offen;
es wird keine Produktentscheidung vorweggenommen.**

## Konsolidierung

Die Komposition von Expressive Observatory bleibt erhalten: Netzwerk links,
breite Mempool-Analyse rechts; darunter Gebühren und Blocktabelle auf denselben
Spaltenachsen. Die Netzwerkfläche folgt jetzt dem jeweiligen Theme und bildet
einen benachbarten Lichtwert statt eines invertierten Gegenpols. Präzise,
einheitliche Begleitwerte und zurückhaltende Flächen übernehmen die Ruhe aus
Contemporary Precision. Es gibt kein zusätzliches Layoutkonzept.

| Detail      | Umsetzung                                                                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hauptzahl   | Manrope 500, Desktop 72 statt 100 px; bei 390 px 60 statt 80 px. Einheit kleiner, mit eigenem Abstand.                                                                                                   |
| Hierarchie  | Seitentitel 48/40 px, Bereichstitel 20/18 px; tabellarische Ziffern für Messwerte. Manrope für Oberfläche und Werte, Inter für technische Labels.                                                        |
| Lesbarkeit  | Sämtliche sichtbaren Textrollen mindestens 12 px, einschließlich Diagramm, Tabellen, Hashes und Metadaten. Lokale, bereits lizenzierte Fonts.                                                            |
| Header      | Kompakte Wortmarke mit Bitcoin-Zeichen; aktive Navigation mit Fläche, Unterlinie und Textfarbe. Mobile vier kompakte Ziele, mindestens 44 px hoch.                                                       |
| Inspektion  | Direktwerte, ruhiger Auswahlstreifen und neutrale beziehungsweise datenfarbene Fixierung. „Vorschau“ und „Fixierter Bereich“ unterscheidbar; Hover verändert nicht die fixierte `aria-pressed`-Auswahl.  |
| Datenstatus | Snapshot neutral, veraltet gelb, fehlend rosé/rot; zusätzlich ausgeschriebener Zustand. Ressourcenbezogene feste Abrufzeiten bleiben sichtbar; fehlender Abruf behauptet keinen erfolgreichen Zeitpunkt. |
| Oberflächen | Hintergrund, Analysefläche, Netzwerkfläche und Detailfläche fein gestaffelt. Kleine Radien und dünne Trennlinien; kein Schatten-/Glaseffekt.                                                             |
| Bedienung   | Tastatur, Maus, Touch und natives Select; sichtbare Fokusrahmen. Paletten- und Themewechsel bewahren Auswahl und Datenzustand. Keine Animationen.                                                        |

Mobil beginnt die Analyse vor dem Netzwerk. Methodik und Einheiten stehen im
Quellenbereich; die Grafik behält die Beschriftung „gleich breite Gebührenbereiche“.
Untergrenzen sind inklusive, Obergrenzen exklusive; Balkenhöhe zeigt Volumen,
keine Dichte. Es werden keine Daten oder Genauigkeitsangaben entfernt.

Bei 390 × 844 beginnt der Inspektionsstreifen bei rund 768 statt 904 px; die
vollständige Seite misst rund 3382 statt 3486 px. Die längere Scrollfolge mit
Gebühren und Blöcken bleibt bewusst bestehen. Der erste Viewport zeigt die
Analyse und den Beginn ihrer Inspektion. Zahlen sind Messwerte in diesem
Chromium-Rendering, keine allgemeine Gerätezusage.

Der isolierte Größenvergleich unter „Prototyp prüfen“ zeigt dieselben Ziffern
mit identischem Schnitt und identischer Laufweite: [Desktop](../design/prototypes/screenshots/final/typography-1440.png),
[Mobil](../design/prototypes/screenshots/final/typography-390.png). Die kleinere
Hauptzahl bleibt dominant, lässt aber Überschrift, Einheit und Begleitwerte
leichter als zusammengehörige Information lesen.

## Drei Paletten und semantische Rollen

Alle Varianten verwenden **denselben Einstieg, DOM, Controller, Fixture OBS-01,
Schrift und Interaktionszustand**. Unterschiede stehen ausschließlich als
Farbtokens in `final-observatory/palettes.css`. A ist lediglich die alphabetische
Startansicht, keine vorweggenommene Produktpräferenz.

| Farbrolle                     | A · Bitcoin Signature | B · Bitcoin Analytical | C · Warm Bitcoin      |
| ----------------------------- | --------------------- | ---------------------- | --------------------- |
| Hintergrund Dark / Light      | `#111214` / `#F3F4F5` | wie A                  | `#171513` / `#F3EFE9` |
| Analysefläche Dark / Light    | `#191B1E` / `#FFFFFF` | wie A                  | `#201D1A` / `#FFFCF7` |
| Netzwerkfläche Dark / Light   | `#202226` / `#E9ECEF` | wie A                  | `#28231F` / `#EAE3DA` |
| Markenfarbe Dark / Light      | `#F7931A` / `#F7931A` | wie A                  | `#D69768` / `#B16B3C` |
| Interaktion/Text Dark / Light | `#F7931A` / `#9A4B00` | wie A                  | `#D69768` / `#8E4C24` |
| Datenbalken Dark / Light      | `#929AA7` / `#717D8D` | `#7294BE` / `#6281A5`  | `#AE927B` / `#94745B` |
| Datenfokus Dark / Light       | `#F4F5F7` / `#303945` | `#9AB9DE` / `#355F8C`  | `#E1C5AA` / `#73543C` |

Orange beziehungsweise Kupfer bedeutet **Marke oder Bedienung**: Wortmarke,
aktive Navigation, wählbare Blockhöhe, Fokus. Es bedeutet weder steigenden Kurs
noch Warnung oder Datenvolumen. A visualisiert Daten neutral, B blau, C in warmen
Neutralen. Gebührenbalken und Gewichtsskala folgen derselben Datenrolle.

In allen drei Paletten gelten eigene Statusrollen: Warnung `#E3BC69` / `#76530B`,
Fehler `#F0A1AE` / `#A42F46`, positive Entwicklung `#86C6AE` / `#23644D`
(Dark / Light). Die positive Rolle bleibt reserviert und wird ohne entsprechenden
Fixture-Sachverhalt nicht angezeigt. Snapshot besitzt keinen grünen Live-Indikator.
Im Light Mode ist das klassische Orange nur am dekorativen Markenzeichen
eingesetzt; kleine Interaktionstexte verwenden die dunklere Abstufung.

## Visuelle Abnahme

Die zwölf verbindlichen PNGs sind echte Chromium-Screenshots bei Geräteskalierung 1,
mit identischem OBS-01, Bereich 1–<2 sat/vB fixiert und Block 968.421 gewählt.
`capture=1` blendet ausschließlich die separate Reviewleiste mit Palettenschaltern
aus. Diese Einstellung ist für alle zwölf Bilder gleich; das Dashboard selbst
bleibt unverändert. Ohne den Parameter stehen die drei Schalter im Prototyp bereit.

| Palette / Viewport | Dark                                                                                                                                                                      | Light                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A · 1440 × 900     | [Viewport](../design/prototypes/screenshots/final/signature-1440x900-dark.png) · [vollständig](../design/prototypes/screenshots/final/signature-1440x900-dark-full.png)   | [Viewport](../design/prototypes/screenshots/final/signature-1440x900-light.png) · [vollständig](../design/prototypes/screenshots/final/signature-1440x900-light-full.png)   |
| B · 1440 × 900     | [Viewport](../design/prototypes/screenshots/final/analytical-1440x900-dark.png) · [vollständig](../design/prototypes/screenshots/final/analytical-1440x900-dark-full.png) | [Viewport](../design/prototypes/screenshots/final/analytical-1440x900-light.png) · [vollständig](../design/prototypes/screenshots/final/analytical-1440x900-light-full.png) |
| C · 1440 × 900     | [Viewport](../design/prototypes/screenshots/final/warm-1440x900-dark.png) · [vollständig](../design/prototypes/screenshots/final/warm-1440x900-dark-full.png)             | [Viewport](../design/prototypes/screenshots/final/warm-1440x900-light.png) · [vollständig](../design/prototypes/screenshots/final/warm-1440x900-light-full.png)             |
| A · 390 × 844      | [Viewport](../design/prototypes/screenshots/final/signature-390x844-dark.png) · [vollständig](../design/prototypes/screenshots/final/signature-390x844-dark-full.png)     | [Viewport](../design/prototypes/screenshots/final/signature-390x844-light.png) · [vollständig](../design/prototypes/screenshots/final/signature-390x844-light-full.png)     |
| B · 390 × 844      | [Viewport](../design/prototypes/screenshots/final/analytical-390x844-dark.png) · [vollständig](../design/prototypes/screenshots/final/analytical-390x844-dark-full.png)   | [Viewport](../design/prototypes/screenshots/final/analytical-390x844-light.png) · [vollständig](../design/prototypes/screenshots/final/analytical-390x844-light-full.png)   |
| C · 390 × 844      | [Viewport](../design/prototypes/screenshots/final/warm-390x844-dark.png) · [vollständig](../design/prototypes/screenshots/final/warm-390x844-dark-full.png)               | [Viewport](../design/prototypes/screenshots/final/warm-390x844-light.png) · [vollständig](../design/prototypes/screenshots/final/warm-390x844-light-full.png)               |

Direkte Vergleichstafeln: [Desktop Dark](../design/prototypes/screenshots/final/comparison-desktop-dark.png),
[Desktop Light](../design/prototypes/screenshots/final/comparison-desktop-light.png),
[Mobil Dark](../design/prototypes/screenshots/final/comparison-mobile-dark.png),
[Mobil Light](../design/prototypes/screenshots/final/comparison-mobile-light.png).
Desktopbilder sind einheitlich auf 50 % verkleinert, mobile Bilder in Originalgröße.
Die [Vergleichsseite](../design/prototypes/final-observatory/compare.html) verlinkt
von jeder Palette zur interaktiven Ansicht.

Die vier Tafeln sowie vollständige Desktop- und Mobilansichten wurden bildlich
inspiziert. Nach dem ersten Rendering wurden mobile Abstände und Diagrammhöhe
reduziert sowie die Methodik aus der primären Messwertzone herausgenommen.
Die eingebettete Browservorschau meldete „The browser access host is unavailable“;
die tatsächliche Prüfung erfolgte mit dem vorhandenen Playwright-Chromium.

## Prüfung und Isolation

Mit Node **22.22.2 / npm 10.9.7** bestanden: ESLint, Prettier, alle vier Typechecks,
203 Tests in elf Dateien, Vite-Produktionsbuild, Pages Functions Build und alle
23 bestehenden Pages-/Chromium-E2E-Tests. Wrangler benötigte lokale Dateirechte
für Verzeichnistraversierung und seinen Logordner; die Prüfungen wurden unverändert
mit diesen Rechten ausgeführt.

`node design/prototypes/verify-final.mjs` prüft zwölf Zielansichten und
144 weitere Kombinationen: Breiten 320/560/700/768/900/1024/1200/1920 px,
drei Paletten, zwei Themes, drei Datenzustände. Geprüft sind Seitenüberlauf,
SVG-Grenzen, überschneidungsfreie Direktwerte, sichtbarer Text ab 12 px,
lokale Fonts, Maus-/Tastatur-/Touchbedienung, Auswahl, Zustände und Retry-Fokus.
Der Vergleich aller Elementrechtecke, Texte, Schriftfamilien, Größen und Gewichte
belegt gleiche Geometrie und Typografie zwischen den Paletten bei beiden Zielgrößen
und Themes. Keine Runtime-/Consolefehler und keine externen Requests in den Zielansichten.

138 Kontrastpaare werden aus den tatsächlich geladenen Tokens nach relativer
sRGB-Luminanz berechnet: Text mindestens 4,5:1, Datenbalken und Fokus-/Kontrollfarben
mindestens 3:1. Beispiele Dark / Light:

| Paar                             | A           | B           | C           |
| -------------------------------- | ----------- | ----------- | ----------- |
| Sekundärtext / Analyse           | 8,10 / 6,56 | 8,10 / 6,56 | 7,70 / 6,40 |
| Sekundärtext / Netzwerk          | 7,48 / 5,53 | 7,48 / 5,53 | 7,14 / 5,14 |
| Aktiver Text / Navigationsfläche | 6,16 / 5,55 | 6,16 / 5,55 | 5,45 / 5,28 |
| Balken / Analyse                 | 6,08 / 4,18 | 5,50 / 4,04 | 5,75 / 4,18 |

Alle zwölf tatsächlichen `dist/`-Dateien wurden nach Prototyppfaden/-inhalten
und den Bytes der Manrope-Assets durchsucht: kein Eintrag. Änderungen beschränken
sich auf `design/prototypes/` und diesen Bericht. React, APIs, Datenquellen,
Produktionsabhängigkeiten, Paketmanifest, Lockfile und Vite-Konfiguration bleiben
unverändert. Frühere Prototypen und Prüfskripte bleiben erhalten.

Grenzen: Chromium, emulierter Touch, keine physischen Geräte, kein Safari-/Firefox-
oder vollständiger Screenreader-/Zoomaudit. Kontrastmessungen sind keine vollständige
WCAG-Konformitätsprüfung. Der Bericht mit Messwerten und Fehlerzustandsbildern entsteht
unter `test-results/prototypes/final/`. Reproduktion: [Prototypanleitung](../design/prototypes/README.md).

## Empfehlung und verbleibende Entscheidung

**B · Bitcoin Analytical zur abschließenden Betreiberabnahme empfehlen.**
Das klassische Orange macht die Marke wieder klar erkennbar. Gedämpftes Blau
trennt quantitative Information von Bedienung und hält die größere Diagrammfläche
ruhig. Die Expressive-Komposition und Manrope tragen die Identität; das Blau
muss sie nicht allein herstellen. Das funktioniert in Dark und Light konsistent.

A ist die stärkste Alternative für maximale Zurückhaltung und eine strikt neutrale
Datenwelt. Im dunklen Theme zieht der fast weiße fixierte Balken allerdings mehr
Blickgewicht auf sich. C bietet eine angenehm warme, redaktionellere Wirkung;
die kupferne Marke und warmen Datenneutrale liegen visuell näher beieinander und
vermitteln weniger analytische Distanz. Diese Bewertung ist gestalterisches Urteil
anhand der Renderings, keine Nutzerstudie oder behauptete Betreiberzustimmung.

Offen bleibt die Freigabe einer der drei Paletten einschließlich ihrer beiden
Modes sowie der reduzierten Zahlengröße und mobilen Informationsfolge.
Ein Merge dieses Prototyp-PRs führt kein Designsystem in das Produkt ein.
