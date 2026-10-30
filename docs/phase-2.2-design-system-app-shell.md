# Phase 2.2 – Produktives Designsystem und App-Shell

30. Oktober 2026 · `CFPlusPlus/bitcoin-dashboard` · Basis `origin/main`,
    Commit `d6d5f2d` · Branch `feature/phase-2.2-design-system-app-shell`.

Die vom Betreiber ausgewählte Art Direction **B – Bitcoin Analytical** ist in
der React-Anwendung umgesetzt. Grundlage sind die tatsächlichen Dateien in
`design/prototypes/final-observatory/`, insbesondere `palettes.css`, `style.css`
und die vier Analytical-Referenzaufnahmen für Desktop/Mobil und Dark/Light.
Die Inhaltskomposition bleibt in dieser Phase bestehen.

**Code-Review und visuelle Betreiberfreigabe stehen aus. Erfolgreiche Tests
sind keine gestalterische Freigabe von Phase 2.2.**

## 1. Design-Tokens

[`src/styles/tokens.css`](../src/styles/tokens.css) enthält die semantischen
Werte; [`src/index.css`](../src/index.css) verwendet sie für die Shell und
grundlegende Komponenten. Tailwind 4 bekommt die Rollen über `@theme inline`.
Bestehende Klassen wie `bg-card`, `text-muted-foreground`, `text-primary` und
`border-border` bleiben durch semantische Aliasse verwendbar.

| Rolle / Custom Property                                                  | Dark               | Light              |
| ------------------------------------------------------------------------ | ------------------ | ------------------ |
| Seitenhintergrund `--background`                                         | `#111214`          | `#f3f4f5`          |
| Hauptfläche `--surface`, Alias `--card`                                  | `#191b1e`          | `#ffffff`          |
| Sekundärfläche `--surface-secondary`                                     | `#202226`          | `#e9ecef`          |
| Hervorgehobene Fläche `--surface-raised`, Alias `--muted`                | `#24272c`          | `#eef0f3`          |
| Primärtext `--foreground`                                                | `#f2f3f5`          | `#1c2026`          |
| Sekundärtext `--foreground-secondary`, Alias `--muted-foreground`        | `#adb2bb`          | `#555e6b`          |
| Dezente Labels `--foreground-subtle`                                     | `#969fab`          | `#5f6975`          |
| Trennlinien `--border`                                                   | `#373b42`          | `#d2d7de`          |
| Control-Rahmen `--control-border`                                        | `#7d848f`          | `#78818e`          |
| Markenfarbe `--brand`                                                    | `#f7931a`          | `#f7931a`          |
| Interaktion `--accent`, Alias `--primary`                                | `#f7931a`          | `#9a4b00`          |
| Text auf Interaktion `--accent-foreground`, Alias `--primary-foreground` | `#111214`          | `#ffffff`          |
| Aktive Navigation `--accent-surface`                                     | `#35291c`          | `#fff0dc`          |
| Fokus `--focus`, Alias `--ring`                                          | Interaktionsakzent | Interaktionsakzent |
| Datenlinie / Primärdaten `--data-primary`                                | `#9ab9de`          | `#355f8c`          |
| Sekundärdaten / Balken `--data-secondary`                                | `#7294be`          | `#6281a5`          |
| Datenauswahl `--data-selection`                                          | `#263549`          | `#e5edf6`          |
| Positive Zustände `--positive`                                           | `#86c6ae`          | `#23644d`          |
| Negative Zustände `--negative`, Fehler-Alias `--danger`                  | `#f0a1ae`          | `#a42f46`          |
| Warnung / veraltete Daten `--warning`                                    | `#e3bc69`          | `#76530b`          |
| Textselektion `--selection`                                              | Datenauswahl       | Datenauswahl       |

Marke, Daten und Zustände besitzen eigenständige Rollen. Orange bleibt die
Identität; quantitative Daten werden blau gezeichnet. Die vorhandene
ECharts-Demolinie liest ihre Farben, Achsen, Tooltip-Fläche und Schriften aus
den berechneten CSS-Tokens. Ihre Daten und Interaktionen bleiben bestehen.
Veraltete Daten verwenden jetzt die Warnrolle; Fehlermeldungen die Fehlerrolle.
Die ausgeschriebenen Zustände und Quellenangaben bleiben erhalten.

Weitere Tokens:

- Abstandsskala `--space-1/2/3/4/5/6/8/12`: 4/8/12/16/20/24/32/48 px bei
  normaler Schriftgröße, in `rem` definiert.
- `--grid-gutter`: 16 px, ab 1024 px 20 px. Die Obergrenze verhindert, dass
  elf Zwischenräume des bestehenden Zwölfspaltenrasters bei Textvergrößerung
  breiter als die Seite werden.
- `--content-max`: 1536 px inklusive Rändern. Seitenränder: 48 px, bis
  1200 px 32 px, bis 700 px 20 px, bis 360 px 14 px.
- Radien: 4 px für kleine Flächen, 5 px für Controls, 8 px für Panels.
  Linien: 1 px. Fokus: 2 px mit 4 px Abstand.
- Interaktionsübergänge: 120 ms, bei `prefers-reduced-motion: reduce` 0 ms.
  Der Themewechsel selbst besitzt keine Farbübergangsanimation.
- Shell-Grenzen: 900 px für die zweite Navigationszeile und 560 px für die
  kompakte Navigation; als Tailwind-Breakpoints `shell` und `compact` benannt.
  CSS-Media-Queries verwenden dieselben festen Grenzen, weil native
  Media-Queries keine Custom Properties auflösen. Inhalts-Breakpoints bleiben
  erhalten.

## 2. Farbrollen und Themes

Die Standardwerte in `:root` bilden Light ab; die bestehende `.dark`-Klasse
aktiviert Dark. `localStorage.theme`, Dark als Standard und der frühe
HTML-Bootstrap bleiben erhalten. Der Provider setzt die Klasse jetzt in
`useLayoutEffect`, damit sie vor dem Paint und vor den ECharts-Effekten gilt.
Bei gesperrtem Speicher funktionieren Themewechsel und Navigation weiter.

Die Browserprüfungen testen mindestens 4,5:1 für alle drei Textrollen auf den
fünf vorgesehenen Flächen einschließlich Selektion, aktive Navigation,
gefüllte Buttons und Statusfarben auf der Hauptfläche. Control-Rahmen und
Fokus erreichen mindestens 3:1 auf ihrer geprüften Nachbarfläche. Das reine
orange Markenzeichen ist dekorativ und wird nicht als Light-Textfarbe benutzt.
Subtile Panel-Trennlinien erfüllen keine Control-Funktion.

## 3. Typografie und Schriftassets

Manrope aus dem Prototyp ist die primäre Oberflächenschrift, Inter trägt
technische Labels, Tabellen und Metadaten. Alle sichtbaren kleinen Shell-Texte
bleiben mindestens 12 px bei normaler Schriftgröße.

| Rolle / Token                                | Größe Desktop / kompakt | Gewicht / Anwendung                                                     |
| -------------------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| Produktname `--text-product`                 | 20 / 18 px              | Manrope 700, Suffix 400                                                 |
| Seitentitel `--text-page`                    | 48 / 40 px              | Manrope 500, Zeile 1,15, Laufweite −0,06 em                             |
| Abschnitt `--text-section`                   | 20 / 18 px              | Manrope 600, Klasse `.section-title`                                    |
| Große Kennzahl `--text-metric`               | 72 / 60 px              | Manrope 500, `.metric-value-large`, für Phase 2.3 vorbereitet           |
| Sekundäre Kennzahl `--text-metric-secondary` | 30 / 24 px              | Manrope 600, `.metric-value`                                            |
| Fließtext `--text-body`                      | 14 px                   | Manrope 400, Zeile 1,5                                                  |
| Tabellen `--text-table`                      | 13 px                   | Inter 400/500; bestehende Tabellen behalten zunächst ihre 12-px-Utility |
| Navigation `--text-navigation`               | 13 / 12 px              | Manrope 400                                                             |
| Beschriftung `--text-label`                  | 12 px                   | Inter, Eyebrow 500 und 0,065 em Laufweite                               |
| Metadaten `--text-metadata`                  | 12 px                   | Inter 400, `.metadata-text`                                             |
| Technische IDs `--text-identifier`           | 12 px                   | Inter, `.technical-identifier`                                          |

Messwerte, Tabellenwerte und Zeitangaben verwenden tabellarische Ziffern.
Die bestehenden KPI- und Abschnittstitel werden nicht vollständig auf die
spätere Inhalts-Hierarchie umgestellt.

[`public/fonts/`](../public/fonts/README.md) enthält gezielt sechs unveränderte
Latin-WOFF2-Dateien: Manrope 400/500/600/700 aus `@fontsource/manrope` 5.2.8
und Inter 400/500 aus `@fontsource/inter` 5.3.0, insgesamt **104.472 Byte**.
Umlaute und ß sind enthalten. Beide Original-Lizenzen (SIL OFL 1.1) werden
mit ausgeliefert. Herkunft und Copyright stehen in der dortigen Dokumentation.

[`fonts.css`](../src/styles/fonts.css) verwendet `font-display: swap`, normale
Schnitte und keine synthetischen Gewichte. Die ersten beiden Manrope-Schnitte
werden lokal vorgeladen. Fallbacks sind Segoe UI, Arial und sans-serif;
Identifikatoren verwenden Inter, Consolas, monospace. Es gibt keine externen
Font-Stylesheets oder Schriftanfragen. Die vorhandene Fontsource-Abhängigkeit
bleibt im Paketbestand; neue Produktionsabhängigkeiten wurden nicht ergänzt.

## 4. App-Shell-Architektur

[`App.tsx`](../src/App.tsx) hält Produktkopf, Wortmarke, Navigation,
Theme-Schalter, `main` und Footer zusammen. Drei gemeinsame Container richten
Kopf, Inhalte und Footer auf denselben Achsen aus. Die Shell füllt mindestens
`100svh`; der Inhaltsbereich wächst und hält den Footer bei kurzen Seiten unten.

`PageHeading` in [`dashboard.tsx`](../src/components/dashboard.tsx) liefert
für alle vier Seiten Eyebrow, H1, orangefarbenen Punkt, Beschreibung und den
bisherigen Quellen-/Vorschaustatus. Routen, Seitenmodule, Query-Client,
Lazy-Chart, API-Verträge und sämtliche Retry-/Stale-Data-Mechanismen bleiben
bestehen. Die routenbezogene Error Boundary bleibt erhalten; Fehlerflächen
verwenden den Panelradius und besitzen einen fokussierbaren H1.

`RouteAccessibility` setzt den Dokumenttitel auf „Seitentitel · Bitcoin
Dashboard“. Bei einem Routenwechsel wird der H1 fokussiert, ersatzweise `main`.
Ein abbrechbarer zweiter Fokus im nächsten Animationsframe berücksichtigt die
native Wiederherstellung von `#main` beim Browser-Zurück. Der erste Aufruf
stiehlt keinen Fokus. Das Matching folgt React Router auch bei abschließendem
Slash und Großschreibung. Der vorhandene Skip-Link führt zu `main`.

## 5. Navigation und Responsive-Verhalten

Die vier Ziele bleiben `/`, `/market`, `/blockchain` und `/mining` mit den
Namen Übersicht, Markt, Blockchain und **Netzwerk & Mining**. `NavLink` setzt
`aria-current="page"`; genau ein Ziel ist aktiv. Die aktive Fläche bleibt
dezent orange getönt, mit kleiner Unterlinie und Akzenttext.

Ab 900 px steht die Navigation rechts neben der Wortmarke. Darunter erhält
sie eine eigene Zeile. Bis 560 px nutzt sie vier gleichmäßig verteilte Ziele;
„Netzwerk & Mining“ steht über zwei Zeilen und behält seinen vollständigen
zugänglichen Namen. Die Route und der Funktionsumfang werden nicht verkürzt.
Bei größerer Schrift kann das flexible Raster zusätzliche Zeilen bilden.

Navigation und Theme-Control haben mindestens 44 px Höhe, mobil hat die
Navigation 48 px. Auch die Wortmarke bietet 44 px Höhe. Bei 320 px entfällt
lediglich der visuelle Wortmarken-Suffix; der Link heißt weiterhin „Bitcoin
Dashboard – Übersicht“. Sichtbare Fokuszustände gelten für Links, Controls,
Skip-Link und das fokussierte Routenziel.

## 6. Bewusste Abweichungen vom Prototyp

| Abweichung                                                              | Grund                                                                                                                                              |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wortmarke „bitcoin / dashboard“ statt „bitcoin / observatory“           | Bestehenden Produktnamen beibehalten; Zeichen, Gewichtung und Hierarchie aus dem Prototyp übernehmen.                                              |
| Vollständiges „Netzwerk & Mining“ auch mobil                            | Orientierung und bestehende Routenbedeutung erhalten; zweizeilige Beschriftung statt Informationsverlust.                                          |
| Mobile Navigation 48 statt 44 px                                        | Platz für zwei Zeilen und größere Touch-Fläche. Die mobile Kopflinie liegt dadurch etwa 6 px tiefer als im Referenzbild.                           |
| Quellen-/Vorschaustatus statt „Beispieldaten · OBS-01“                  | Tatsächliche bestehende Datenherkunft bewahren; keine Prototyp-Fixture oder erfundene Aktualisierungszeit in der Anwendung.                        |
| Stärkerer Rahmen am Theme-Schalter                                      | Die semantische Control-Farbe erfüllt den geprüften Kontrast; der Prototyp verwendet hier die schwächere Trennlinie.                               |
| Zusätzliche dezente Textrolle mit angepasstem Kontrast                  | Auch auf der Auswahlfläche und der dunkleren Light-Sekundärfläche mindestens 4,5:1 erreichen. Die ursprüngliche Sekundärtextfarbe bleibt erhalten. |
| Kartenradius 8 statt bisher 12 px, notwendige kleine Zahlen mobil 24 px | Grundlegende Token-/Schriftintegration und Vermeidung gebrochener Kontraste beziehungsweise Überläufe. Die Kartenkomposition bleibt bestehen.      |
| Bestehendes Inhaltsraster und 16/20-px-Gutter                           | Phase 2.2 integriert die Shell. Die neue Netzwerk-/Analysekomposition und deren Abstände gehören zu Phase 2.3.                                     |

## 7. Visuelle Prüfung und Screenshots

Die **echte gebaute React-Anwendung** wurde mit Wrangler Pages und Chromium
gerendert. Es handelt sich nicht um neue statische Mockups. Die UI-Prüfungen
verwenden die vorhandenen synthetischen Bitcoin-Testfixtures und einen festen
Abrufzeitpunkt; externe Anfragen werden abgewiesen. Das ändert keine produktive
Datenquelle. `document.fonts.ready` wird vor den Aufnahmen abgewartet.

Die acht geforderten Ansichten wurden tatsächlich geöffnet und visuell mit
den vier freigegebenen Analytical-Referenzbildern verglichen:

| Bereich / Größe         | Dark                                                                                                                                   | Light                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Übersicht · 1440 × 900  | [Ansicht](screenshots/phase-2.2/overview-1440x900-dark.png) · [Ganze Seite](screenshots/phase-2.2/overview-1440x900-dark-full.png)     | [Ansicht](screenshots/phase-2.2/overview-1440x900-light.png) · [Ganze Seite](screenshots/phase-2.2/overview-1440x900-light-full.png)     |
| Übersicht · 390 × 844   | [Ansicht](screenshots/phase-2.2/overview-390x844-dark.png) · [Ganze Seite](screenshots/phase-2.2/overview-390x844-dark-full.png)       | [Ansicht](screenshots/phase-2.2/overview-390x844-light.png) · [Ganze Seite](screenshots/phase-2.2/overview-390x844-light-full.png)       |
| Blockchain · 1440 × 900 | [Ansicht](screenshots/phase-2.2/blockchain-1440x900-dark.png) · [Ganze Seite](screenshots/phase-2.2/blockchain-1440x900-dark-full.png) | [Ansicht](screenshots/phase-2.2/blockchain-1440x900-light.png) · [Ganze Seite](screenshots/phase-2.2/blockchain-1440x900-light-full.png) |
| Blockchain · 390 × 844  | [Ansicht](screenshots/phase-2.2/blockchain-390x844-dark.png) · [Ganze Seite](screenshots/phase-2.2/blockchain-390x844-dark-full.png)   | [Ansicht](screenshots/phase-2.2/blockchain-390x844-light.png) · [Ganze Seite](screenshots/phase-2.2/blockchain-390x844-light-full.png)   |

Direkte Referenzen: [Desktop Dark](../design/prototypes/screenshots/final/analytical-1440x900-dark.png),
[Desktop Light](../design/prototypes/screenshots/final/analytical-1440x900-light.png),
[Mobil Dark](../design/prototypes/screenshots/final/analytical-390x844-dark.png),
[Mobil Light](../design/prototypes/screenshots/final/analytical-390x844-light.png).

Ergebnis des Shell-Vergleichs: Bei 1440 px folgen Kopfhöhe (84 px), linke
Inhaltsachse (48 px), 48-px-Titel, Titelpunkt und Inhaltsbeginn (235 px) der
Referenz. Graphit, weiße Light-Flächen, Orange und die Schriftfamilien stimmen
mit Palette B überein. Die mobile Shell behält 20-px-Ränder und 40-px-Titel.
Ihr erster Inhaltsblock beginnt bei rund 279 statt 270 px: längere vollständige
Navigation und die bestehende Herkunftskennzeichnung erklären die Differenz.
Die deutlich andere Dichte und Anordnung innerhalb der Karten ist beabsichtigt.

Ergänzend wurden diese tatsächlich gerenderten Blockchain-Ansichten gesichtet:

| Größe       | Dark                                                           | Light                                                           | Befund                                                                 |
| ----------- | -------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1920 × 1080 | [Ansicht](screenshots/phase-2.2/blockchain-1920x1080-dark.png) | [Ansicht](screenshots/phase-2.2/blockchain-1920x1080-light.png) | Zentrierter 1536-px-Container, Inhaltsachse bei 240 px.                |
| 768 × 1024  | [Ansicht](screenshots/phase-2.2/blockchain-768x1024-dark.png)  | [Ansicht](screenshots/phase-2.2/blockchain-768x1024-light.png)  | Navigation in eigener Zeile, vollständige Bezeichnungen, 32-px-Ränder. |
| 320 × 844   | [Ansicht](screenshots/phase-2.2/blockchain-320x844-dark.png)   | [Ansicht](screenshots/phase-2.2/blockchain-320x844-light.png)   | Vier sichtbare Ziele, vollständiger Mining-Name, 14-px-Ränder.         |

Alle vier Routen wurden in beiden Themes bei **allen fünf Größen** im Browser
auf Navigation, Titel, Schriftladung und fehlenden horizontalen Seitenüberlauf
geprüft. Zusätzlich: 320 px mit 200 % Wurzelschriftgröße und reduzierter Bewegung
auf allen vier Routen. Lange Tabellen scrollen innerhalb ihres Containers.

Reproduktion: `npm run build`, `npm run test:e2e`. Die Aufnahmen entstehen in
`test-results/shell/`; die hier verlinkten 22 PNGs sind die eingecheckte Auswahl.
Unter Windows können sie anschließend mit folgendem Befehl aktualisiert werden:

```powershell
Copy-Item -Path test-results/shell/overview-*.png,test-results/shell/blockchain-*.png -Destination docs/screenshots/phase-2.2
```

## 8. Testergebnisse

| Prüfung                | Ergebnis                                                                    |
| ---------------------- | --------------------------------------------------------------------------- |
| `npm ci`               | Erfolgreich, 300 Pakete installiert, Audit ohne Befund.                     |
| `npm run lint`         | Erfolgreich, keine Warnungen.                                               |
| `npm run format:check` | Erfolgreich.                                                                |
| `npm run typecheck`    | Frontend, Functions, Functions-Tests und E2E erfolgreich.                   |
| `npm test`             | 207 Tests in 11 Dateien erfolgreich.                                        |
| `npm run build`        | Erfolgreicher Vite-Produktionsbuild.                                        |
| `npm run pages:check`  | Cloudflare-Functions erfolgreich kompiliert.                                |
| `npm run test:e2e`     | 41 Chromium-Tests erfolgreich, einschließlich der bestehenden 23 Prüfungen. |

Die abschließenden Prüfungen verwenden Node 22.22.2 und npm 10.9.7 entsprechend
`.nvmrc` und `packageManager`. Die erste erfolgreiche Installation lief mit npm
10.9.7 auf dem vorhandenen Node 26.11.1. Ein alter lokaler Wrangler-Prozess hatte
zunächst `esbuild.exe` gesperrt und wurde vor der sauberen Installation beendet.
Wrangler und Browser benötigen hier die lokale Ausführung außerhalb der
Dateisandbox; anwendungsbezogene Tests wurden dafür nicht abgeschwächt.

Neue Prüfungen betreffen Dokumenttitel, Fokus einschließlich Browser-Zurück
und Skip-Link, vollständige Mining-Beschriftung, Theme-Persistenz, gesperrten
Speicher, Bootstrap vor React, lokale Schriften, Touch-Höhen, Kontraste,
Responsive-Verhalten und Textvergrößerung. Die bisherigen UI-Fixtures wurden
ohne abgeschwächte Assertions nach `e2e/fixtures.ts` extrahiert und wiederverwendet.

Ein zusätzlicher Build-Test prüft `dist` auf ausgeschlossene Prototyp-,
Screenshot- und Designverzeichnisse, fehlende Prototyp-Skripte, genau sechs
Schriftdateien und per HTTP ausgelieferte Lizenztexte. Es gibt keinen Import
aus `design/` in den produktiven Code. API- und Access-Konfigurationen,
Cloudflare-Routen und Datenherkunft wurden nicht geändert.

## 9. Bekannte Einschränkungen

- Die alten Inhaltskomponenten besitzen weiterhin unterschiedliche Titelgewichte
  und eine hohe Karten-/Metadatendichte. Lange deutsche KPI-Titel und schmale
  Quellenzeilen umbrechen sichtbar; bei 200 % Text sind diese kompakten
  Inhaltskarten noch keine abschließend gestaltete Lesefläche.
- Die bestehende Blocktabelle benötigt auf kleinen Ansichten horizontales
  Scrollen. Ihre umfassende Tastatur-/Tabellenaufbereitung ist Teil der
  folgenden Inhaltsphase, kein Bestandteil einer behaupteten vollständigen
  Accessibility-Zertifizierung dieser Shell.
- Visuelle und automatisierte Browserprüfung erfolgte mit Chromium; Safari,
  Firefox und assistive Technologien wurden hier nicht zusätzlich geprüft.
- Die Screenshots zeigen feste Testdaten. Sie sind ein Gestaltungsnachweis,
  keine Prüfung der aktuellen externen Bitcoin-Datenlage oder einer
  Cloudflare-Access-Konfiguration.

## 10. Offene Gestaltungsdetails für Phase 2.3

Die Blockchain-Komposition aus dem Prototyp, Kennzahlenhierarchie und
Metadatengruppierung stehen als nächster Schritt an. Dazu gehören die
Netzwerkfläche, Mempool-Analyse und deren responsive Reihenfolge, präzisere
Karten-/Abschnittstitel, lange deutsche Bezeichnungen, Gebühren und die
Blocktabelle. Neue Diagramme oder Dateninteraktionen wurden in Phase 2.2 nicht
vorweggenommen. Die Betreiberbegutachtung soll insbesondere Wortmarke,
Navigation, Theme-Flächen und die dokumentierten mobilen Abstände bestätigen.
