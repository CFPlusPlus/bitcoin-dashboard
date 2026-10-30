# Phase 2.0 – Design Discovery, UX-Audit und Art Direction

Datum: **30. Oktober 2026** · Repository: `CFPlusPlus/bitcoin-dashboard`.

**Status: Konzept zur Entscheidung durch den Betreiber. Keine Designfreigabe und kein Implementierungsauftrag.**

## 1. Executive Summary

Empfohlen wird **Konzept C – Digital Asset Observatory**: eine Bitcoin-Oberfläche, deren Identität aus dem Zusammenhang von Blockspace, Gebühren, Blöcken und Zeit entsteht. Eine breite Analysefläche, ein schmalerer Kontextbereich und offene Datenzeilen ersetzen die gleichförmige Kartenwand. Grünliche Graphitflächen beziehungsweise helles Kalkweiß, präzise technische Beschriftungen und sparsam eingesetztes Kupfer geben der Oberfläche eine eigene Handschrift. Die Informationshierarchie bleibt auch ohne Animation und Farbe erkennbar.

Das gegenwärtige Fundament ist funktional brauchbar. Die gestalterische Schwäche liegt vor allem in der **Gleichbehandlung ungleicher Inhalte**: echte Blockdaten, unverbundene Marktkennzahlen und ein synthetischer Chart erhalten vergleichbare Flächen und Aufmerksamkeit. Wiederholte Container, Überschriften und Quellenhinweise verdrängen die eigentliche Analyse. Die fehlende Eigenständigkeit lässt sich aus diesen konkreten Mustern erklären; eine Entstehung durch KI lässt sich daraus nicht nachweisen.

Die Empfehlung übernimmt aus A die Ausrichtung und Genauigkeit von Zahlen und aus B die bewusste Gewichtung von Haupt- und Nebeninhalten. Sie übernimmt weder die Terminal-Navigation von A noch die ausgeprägte Serifentypografie und Magazin-Dramaturgie von B. C bleibt eine zusammenhängende Richtung, kein Mix dreier Erscheinungsbilder.

**Wesentliche Einschränkung:** Eine manuelle visuelle Browserinspektion war technisch nicht möglich. Alle Aussagen zur Erscheinung sind nachfolgend als Codebefund, rechnerischer Nachweis oder Entwurf gekennzeichnet. Die vorhandenen Chromium-Funktionstests bestehen, ersetzen jedoch keine visuelle Abnahme. Vor der Umsetzung muss der Betreiber die Richtung anhand der Konzeptunterlagen auswählen; in Phase 2.1 werden dazu begrenzte visuelle Muster ausgearbeitet und abgenommen.

Dieser Auftrag liefert ausschließlich dieses Dokument. Anwendungscode, Datenquellen, API-Verträge, Access, Produktionsabhängigkeiten und Architektur bleiben unverändert.

## 2. Untersuchungsbasis und Evidenzgrenzen

### 2.1 Repository und Vorgehen

- Ausgangsbranch: `feature/phase-1.6.1-medium-fixes`, Commit `3d9b34eb023834a6b6858c6bc57cdd6e875860a4`.
- Nach Abruf der Remote-Refs: Basis `origin/main`, Commit [`0981e5dc54f867a94d7151d7b74c84270030a0fe`](https://github.com/CFPlusPlus/bitcoin-dashboard/commit/0981e5dc54f867a94d7151d7b74c84270030a0fe). Der Dateivergleich mit dem Ausgangscommit war leer.
- Eigener Konzeptbranch: `feature/phase-2.0-design-discovery`.
- Untersucht: `App.tsx`, alle vier Seiten, CSS-Tokens, lokale UI-Primitives, Dashboard- und Bitcoin-Bausteine, ECharts-Komponente, Theme-/Datenlogik, gemeinsame Datenmodelle, Fehlerbehandlung, vorhandene Tests und Build-/Pages-Konfiguration.
- Referenzzeilen in diesem Dokument beziehen sich auf den genannten Basiscommit. Relative Dateilinks führen zur jeweiligen Repository-Datei; die Zeilenangaben im Text präzisieren die Stelle.

Evidenzkategorien:

| Kürzel | Bedeutung                                             | Aussagegrenze                                                            |
| ------ | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| **V**  | Manuell im gerenderten Browser visuell überprüft      | In diesem Auftrag keine Befunde dieser Kategorie                         |
| **C**  | Direkt aus Quellcode bzw. daraus abgeleitet           | Layoutwirkung ist begründete Prognose, keine Screenshotbeobachtung       |
| **R**  | Rechnerischer Nachweis anhand expliziter Werte        | Belegt z. B. Farbkontrast, keine gesamte WCAG-Konformität                |
| **T**  | Vorhandene automatisierte Funktionsprüfung ausgeführt | Belegt das geprüfte Verhalten, keine ästhetische Qualität                |
| **K**  | Konzeptvorschlag für Phase 2                          | Noch nicht implementiert, visuell erprobt oder vom Betreiber freigegeben |

### 2.2 Browserprüfung und Zielgrößen

Der Vite-Server startete unter `http://127.0.0.1:5173/`. Die Browserinventarisierung meldete `The browser access host is unavailable`. Der native Edge-Zugriff meldete zunächst ein minimiertes Fenster. Beim anschließenden Aktivierungs-/Beobachtungsversuch beendete die Computer-Use-Sicherheitsprüfung den Zugriff, weil die aktuelle Browser-URL nicht zuverlässig ermittelt werden konnte. Es erfolgte **keine manuelle Inspektion der Anwendung im Browser**; es liegen keine geprüften UI-Screenshots vor. Weitere manuelle UI-Automation wurde beendet.

| Zielviewport | Dark Mode     | Light Mode    | Vorliegende Evidenz                                                        |
| ------------ | ------------- | ------------- | -------------------------------------------------------------------------- |
| 1440 × 900   | visuell offen | visuell offen | C: sechs KPI-Spalten ab `xl`, Chart/Kontext 8:4                            |
| 1920 × 1080  | visuell offen | visuell offen | C: Shell auf 1600 px begrenzt, dieselbe Inhaltsstruktur                    |
| 768 × 1024   | visuell offen | visuell offen | C: drei KPI-Spalten ab `md`; Navigation wechselt bereits in Desktopmodus   |
| 390 × 844    | visuell offen | visuell offen | C: zwei KPI-Spalten, Navigation horizontal scrollbar, Chart unter den KPIs |

Die Breakpoint-Einschätzung verwendet Tailwinds unveränderte Standardgrenzen (`md` 768, `lg` 1024, `xl` 1280 bei üblicher 16-px-Basis). Die tatsächlichen Umbrüche, Schriftmetriken, Touchbedienung und Überläufe sind noch zu prüfen. Beide Token-Sätze wurden im Code untersucht. Die E2E-Suite prüft den Themewechsel und dessen Persistenz; sie enthält keine visuelle Vier-Viewport-Matrix.

### 2.3 Funktionale Ausgangsbasis

Die Repository-Vorgabe aus der README verlangt vor einem PR die bestehenden Qualitätsprüfungen. Ausgeführt mit der bereits lokal gecachten Toolchain **Node 22.22.2 / npm 10.9.7**, ohne Neuinstallation von Abhängigkeiten:

| Prüfung                             | Ergebnis                        | Relevanz für die Designarbeit                                     |
| ----------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| ESLint                              | PASS                            | Bestehender Code ohne Lintfehler                                  |
| Prettier / `format:check`           | PASS                            | Gesamtes Repository einschließlich Konzeptdokument geprüft        |
| Typecheck                           | PASS                            | Frontend, Functions, Functions-Tests und E2E                      |
| Vitest                              | PASS: **203 Tests, 11 Dateien** | Datenverträge, Zustände und Fehlerbehandlung als Regressionsbasis |
| Vite-Build einschließlich Typecheck | PASS                            | Bestehender Produktionsbuild bleibt erzeugbar                     |
| Pages Functions Build               | PASS                            | Lokale Functions kompilieren                                      |
| Chromium-E2E / lokale Pages         | PASS: **23 Tests**              | Routen, Deep Links, Theme, Fehlerpfade und HTTP-/Assetverhalten   |

Der erste Pages-Build scheiterte an Sandbox-Dateirechten für Wrangler-Logs und Verzeichnistraversierung. Mit freigegebenem lokalem Dateizugriff bestanden Functions-Build und E2E. Dies ist kein nachgewiesener Anwendungsfehler. Die Formatprüfung umfasst das fertige Konzeptdokument; nur diese Markdown-Datei wird versioniert geändert.

Die UI-E2E-Tests verwenden kontrollierte Bitcoin-Fixtures und blockieren unerwarteten externen Verkehr. Sie belegen keine aktuelle Datenqualität von mempool.space, keine Access-Freigabe und keine manuell begutachtete Oberfläche. Die Korrekturen am Chart-Lebenszyklus aus Phase 1.6.1 sind im untersuchten Code enthalten; die alten Findings des Phase-1.6-Berichts werden hier nicht als offene Fehler wiederholt.

## 3. Analyse des aktuellen Designs

### 3.1 Gesamtwirkung, Hierarchie und Komposition — C

Die Shell ist eine horizontale Kopfzeile mit Wortmarke, vier Textlinks und Themebutton. Die Inhaltsbreite ist auf 1600 px begrenzt. Alle Seiten beginnen mit demselben `PageHeading`, einschließlich des wiederholten Produktnamens in Versalien. Darunter folgt ein 12-Spalten-Grid. Das erzeugt Konsistenz, aber kaum unterschiedliche Leseführung für Marktanalyse, Blockübersicht oder Mining.

Die sechs ersten Kennzahlen werden auf großen Desktops als sechs gleich breite Karten dargestellt. Ihre Datenreife unterscheidet sich erheblich. Auf der Übersicht sind vier davon Platzhalter, nur Blockhöhe und Gebühren sind angebunden. Trotzdem folgen die Komponenten derselben räumlichen Logik. Der Demo-Kurschart beansprucht anschließend acht von zwölf Spalten, während Mempool und Halving im rechten Drittel liegen. Diese Gewichtung privilegiert den demonstrativen Verlauf vor tatsächlich verfügbaren Daten.

### 3.2 Typografie, Karten und Rhythmus — C

Inter 400/500/600 wird lokal geladen. Das ist eine gute lesbare Basis; der Font selbst ist kein Fehler. KPI-Zahlen nutzen bereits tabellarische Ziffern. Die Rollen sind jedoch wenig abgestuft: Seitenüberschriften 24/30 px, Kartenüberschriften meist 14 px, Kennzahlen meist 30 px, zahlreiche Quellen-/Hinweistexte 12 px. Platzhalter-KPI-Titel weichen mit 12 px/500 von angebundenen KPI-Titeln mit 14 px/600 ab, obwohl beide als gleichwertige Kennzahlen auftreten.

`Card` gibt jeder Sektion denselben Radius von 12 px, dieselbe Umrandung, Hintergrundfläche und 20/24 px Innenabstand. Mempool, Gebührenliste, große Blocktabelle und leere Vorschau bekommen dadurch gleichartige Rahmen. Der Abstandsrhythmus ist konsistent (16/20 px Grid-Abstand), unterscheidet aber kaum zwischen einem neuen Themenkapitel und zwei verwandten Messwerten.

### 3.3 Farbe und Wiedererkennbarkeit — C/R

Die aktuellen Light-Tokens kombinieren kühles Grau/Weiß mit Orange `#D97706`; Dark nutzt Blau-Schwarz und Orange `#F7931A`. Orange bezeichnet gleichzeitig Markenfläche, aktiven Navigationsstrich, Chartlinie, Blocklinks und veraltete Daten. Es fehlt eine klare Trennung von Interaktion, Datenreihe und Datenwarnung. Ein Bitcoin-Symbol im farbigen abgerundeten Quadrat ist das wesentliche explizite Identitätsmerkmal; die Datenkomposition liefert wenig zusätzliche Identität.

Rechnerisch sind normale Texte ausreichend kontrastreich: `#526174` auf Weiß erreicht etwa 6,32:1, `#98A5B5` auf dunkler Karte etwa 6,98:1. **Das Light-Orange erreicht auf Weiß jedoch nur 3,19:1.** Es wird in 12-px-Blocklinks und 12-px-Stale-Hinweisen verwendet und unterschreitet dort die 4,5:1-Anforderung für normalen Text. Die dunkle Variante erreicht etwa 7,61:1. Das ist ein konkreter, themenspezifischer Mangel; daraus folgt kein pauschales Urteil über alle aktuellen Kontraste. Rechenmethode und Normbezug stehen in Abschnitt 6.

### 3.4 Diagramme, Tabellen und Datendichte — C

Der einzige Diagrammtyp ist eine orange Linie mit sehr leichter Flächenfüllung und festen Indexgrenzen 90–130. X-Beschriftungen `P1` bis `P12` sind korrekt für die synthetischen Werte, ergeben aber noch kein eigenständiges Analysesystem. Tooltip, Achsen und Gitter sind technisch konfiguriert, ohne gemeinsame gestalterische Tokens mit dem übrigen UI. Der Tooltip nutzt den ECharts-Standardstil; ein explizites Theme für Schrift, Hintergrund und Rand fehlt.

Die Blocktabelle zeigt sinnvolle Rohdaten und externe Blocklinks. Alle Spalten sind linksbündig, auch Zahlen; die Schrift ist 12 px. Die vollständige lokalisierte Datums-/Zeitangabe wird nicht umgebrochen. Die Tabelle kann intern horizontal scrollen. Es gibt noch keine Caption oder explizite `scope`-Attribute, und keine vom Chart ergänzend erreichbare Wertetabelle. Das vorhandene `role="img"`, ARIA-Beschreibungen und der registrierte `AriaComponent` sind eine Grundlage, aber keine vollständige Tastaturbedienung von Diagrammdaten.

### 3.5 Zustände, Interaktion und Bewegung — C/T

Positiv: Datenquellen, Abrufzeit, initiales Laden, Fehler und veraltete Werte sind explizit modelliert. Fehlgeschlagene Aktualisierungen bewahren vorhandene Werte. Fehler haben Retry und Reload; lokale Fehlergrenzen schützen Navigation und andere Inhalte. Semantische Landmarks, Skip-Link, aktive Routenauszeichnung und sichtbare Fokusregeln sind vorhanden. T bestätigt die vorhandenen Routen-/Theme-/Fehlerabläufe.

Gestalterisch wird der Metadatenblock jedoch je Kennzahl wiederholt, auch wenn Blockgröße und -gewicht denselben Blocks-Snapshot nutzen. Bei jedem Laden oder Fehler können zusätzliche Text- und Buttonzeilen in der KPI-Karte erscheinen. Daraus folgt ein Layout-Shift-Risiko; ein tatsächlicher CLS-Wert wurde nicht gemessen. Mehrere `aria-live="polite"`-Bereiche können bei Aktualisierungen redundante Ansagen erzeugen; ein Screenreader-Test steht aus.

Es existieren Button-Farbübergänge und Chart-Tooltips. ECharts-Animation ist ausdrücklich deaktiviert. Zeitraumwahl, verknüpfte Charts oder Routenanimationen gibt es nicht. Eine explizite `prefers-reduced-motion`-Regel fehlt, allerdings auch eine umfangreiche Motion-Schicht. Der Befund lautet fehlende differenzierte Rückmeldung, nicht zu viel Bewegung. Eine dekorative Icon-Flut, Glassmorphism, starke Schatten oder beliebige Gradients sind im untersuchten Code **nicht** nachgewiesen; sie erklären den aktuellen Eindruck nicht.

### 3.6 Unterschiede und Leerstände der vier Bereiche — C

| Bereich           | Derzeitige Komposition                                                                       | Gestalterische Konsequenz                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Übersicht         | Vier leere und zwei angebundene KPIs, Demo-Chart, Mempool, Halving-Platzhalter, Blocktabelle | Kein eindeutiger Hauptinhalt nach tatsächlicher Datenverfügbarkeit                                                          |
| Markt             | Sechs leere KPIs, synthetischer Chart, Sats-Rechner-Platzhalter                              | Viele Flächen suggerieren einen größeren Analyseumfang, obwohl die Hinweise den Vorschaustatus korrekt benennen             |
| Blockchain        | Vier angebundene und zwei leere KPIs, Mempool, fünf Gebührenempfehlungen, Blocktabelle       | Beste verfügbare fachliche Substanz; Beziehungen zwischen Gebühren, Blockspace und letzten Blöcken bleiben räumlich schwach |
| Netzwerk & Mining | Sechs leere KPIs und vier große Platzhalter                                                  | Starke Wiederholung von Leertext, Database-Icon und Rahmen; keine sinnvolle Priorisierung bei fehlenden Daten               |

### 3.7 Responsive Ableitung — C, keine visuelle Prüfung

Bei 1440 px beträgt der rechnerische Inhalt 1376 px. Bei sechs Spalten und fünf 20-px-Abständen bleiben etwa 213 px pro KPI, nach je 24 px Padding etwa 165 px Textbreite. Bei 1920 px bleibt die Shell 1600 px breit: Inhalt 1536 px, KPI etwa 239 px. Mehr Bildschirmbreite erzeugt also vor allem Außenraum, keine zusätzliche Informationsstufe.

Bei 768 px sind rechnerisch 704 px Inhalt verfügbar; drei KPI-Spalten mit zwei 16-px-Abständen ergeben je 224 px. Gleichzeitig versucht die Navigation ab `md`, neben Marke und Themebutton in der Kopfzeile zu stehen. Ob die Flexzeile sauber umbricht, wurde nicht visuell geprüft; gerade dieser Übergang ist ein Abnahmepunkt.

Bei 390 px stehen nach Außenpadding 358 px zur Verfügung. Zwei KPI-Karten mit 16 px Abstand ergeben je 171 px, nach 20 px Innenpadding etwa **131 px Textbreite**. Lange Titel, Abrufzeiten und Fehlerbuttons dürften dadurch stark umbrechen. Die Kennzahlen verbrauchen drei Reihen, bevor der Chart beginnt. Die letzte Navigation ist über horizontales Scrollen erreichbar; ihre Entdeckbarkeit ist offen. Ob die Tabelle oder die Seite tatsächlich überläuft, ist ohne Rendering nicht belegt.

## 4. Konkrete Probleme mit Code-/UI-Bezug

Priorität meint Bedeutung für Phase 2, keine Einstufung als technischer Produktionsausfall. Sämtliche Einträge sind C, außer dem ausdrücklich berechneten Farbkontrast.

| ID / Priorität   | Nachvollziehbare Stelle                                                                                                              | Problem und Wirkung                                                                                                        | Gestaltungsentscheidung                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| D20-01 / hoch    | [card.tsx](../src/components/ui/card.tsx), Z. 8; alle vier Seiten                                                                    | Identischer Rahmen und Innenraum für fast jeden Datentyp; Themenhierarchie wird zu einer Reihe gleichartiger Objekte       | Drei Bausteinformen: offene Messwertzeile, Analysefläche, Datentabelle; Karten nur für wirklich zusammengehörige Gruppen                             |
| D20-02 / hoch    | [overview.tsx](../src/pages/overview.tsx), Z. 13–31; [dashboard.tsx](../src/components/dashboard.tsx), Z. 75–101                     | Großer Demo-Chart folgt auf vier leere Markt-/Mining-KPIs; echte Netzwerkdaten erhalten keine Hauptrolle                   | Übersicht zunächst von angebundenem Blockspace/Blöcken führen; Kursvorschau kompakt und ausdrücklich synthetisch erhalten                            |
| D20-03 / hoch    | [index.css](../src/index.css), Z. 15; [bitcoin-data.tsx](../src/components/bitcoin-data.tsx), Z. 24/186                              | R: Light-Orange auf Weiß 3,19:1 bei kleinen Texten                                                                         | Eigenständige, dunklere Text-/Interaktionsfarbe im Light Mode; Warnfarbe separat                                                                     |
| D20-04 / mittel  | [dashboard.tsx](../src/components/dashboard.tsx), Z. 42/44; [bitcoin-data.tsx](../src/components/bitcoin-data.tsx), Z. 56/57         | Titel angebundener und leerer KPIs unterscheiden sich zufällig; gleiche Zahlengröße ohne Relevanzgewicht                   | Typografische Rollen unabhängig von Datenstatus; Hauptzahl, Vergleichswert und Metadatum unterscheiden                                               |
| D20-05 / hoch    | [bitcoin-data.tsx](../src/components/bitcoin-data.tsx), Z. 7–48/147–156                                                              | Derselbe Quellen-/Statusblock mehrfach, einschließlich identischem Blocks-Snapshot; Fehler erweitern jede kleine Karte     | Status auf tatsächlicher Ressourcen-/Gruppenebene, einzelne Unterschiede sichtbar erhalten; reservierte Statuszeile plus ausführlicher Fehlerbereich |
| D20-06 / mittel  | [App.tsx](../src/App.tsx), Z. 33–50                                                                                                  | Kleine Geräte nutzen scrollende Navigation, Tablet schaltet früh auf Desktopanordnung                                      | Vier Routen immer explizit erreichbar; Konzept C nutzt mobil ein 2×2-Raster statt versteckter letzter Route                                          |
| D20-07 / mittel  | [demo-chart.tsx](../src/components/demo-chart.tsx), Z. 41–72/109–115                                                                 | Einzelchart ohne wiederverwendbare Achsen-/Tooltipgestaltung; keine erreichbare Datentabelle oder Keyboard-Dateninspektion | Gemeinsames Diagramm-Vokabular mit Einheit, Zeitbezug, Tastatur-/Touchpfad und Alternativwerten                                                      |
| D20-08 / mittel  | [bitcoin-data.tsx](../src/components/bitcoin-data.tsx), Z. 169–198                                                                   | 12-px-Tabelle, linksbündige Zahlen, lange ungebrochene Zeitwerte                                                           | 14-px-Daten, rechtsbündige Zahlenspalten, getrennte Zeit-/Datumsdarstellung; kompletten Zeitpunkt zugänglich halten                                  |
| D20-09 / mittel  | [dashboard.tsx](../src/components/dashboard.tsx), Z. 64–69; [mining.tsx](../src/pages/mining.tsx), Z. 21–40                          | Wiederholtes Database-Icon und generischer Leertext bilden die Hauptkomposition von Mining                                 | Ein klarer Bereichshinweis plus kompakte, fachlich bezeichnete leere Module; Funktionalität/Benennung bleibt auffindbar                              |
| D20-10 / mittel  | [index.css](../src/index.css), Z. 15/27; [App.tsx](../src/App.tsx), Z. 48; [demo-chart.tsx](../src/components/demo-chart.tsx), Z. 67 | Dieselbe Orange-Rolle für Navigation, Daten und Stale-Zustand                                                              | Semantische Tokens für Aktion, Reihe, Richtung, Warnung und Datenherkunft                                                                            |
| D20-11 / mittel  | [overview.tsx](../src/pages/overview.tsx), Z. 20–32; [blockchain.tsx](../src/pages/blockchain.tsx), Z. 20–27                         | Blockhöhe, Blockgröße, Gebühren und Mempool stehen nebeneinander, ohne die Datenbeziehung zu erklären                      | Gebühren und Mempool als gemeinsamen Blockspace-Bereich komponieren; jüngste Blöcke als anschließende zeitliche Evidenz                              |
| D20-12 / niedrig | [dashboard.tsx](../src/components/dashboard.tsx), Z. 25–27; [App.tsx](../src/App.tsx), Z. 29–31/93                                   | Produktname in Shell, Seiteneinstieg und Footer wiederholt; keine zusätzliche Orientierung                                 | Produktname in Shell, im Einstieg fachlicher Titel und Datenzeit; Footer für Quellen-/Projektkontext                                                 |

## 5. Drei Designrichtungen

Die folgenden Spezifikationen sind **K**. Hexwerte und Maße sind Arbeitsvorgaben für prüfbare Muster, keine bereits abgenommene Gestaltung. Die Richtungen unterscheiden sich in ihrer Leselogik: **A vergleicht simultan, B führt sequenziell, C erklärt räumliche Datenbeziehungen.**

### 5.1 Konzept A – Precision Terminal

**Leitidee und Identität.** Ein sachliches Messinstrument für Nutzer, die mehrere Größen zügig vergleichen wollen. Schmale Beschriftungsspalten, ausgerichtete Zahlen und gemeinsame horizontale Bezugslinien vermitteln Präzision. Kein Tickertape, kein Orderbuch, keine künstlichen Trading-Elemente. Das Erkennungsmerkmal ist das durchgehende Messraster mit Einheitenzeile.

**Farbpalette:**

| Rolle                     | Dark      | Light     |
| ------------------------- | --------- | --------- |
| Hintergrund               | `#101419` | `#F3F5F7` |
| Analysefläche             | `#171D24` | `#FFFFFF` |
| Haupttext                 | `#EDF2F7` | `#182330` |
| Sekundärtext              | `#A2AFBF` | `#536477` |
| Interaktion / erste Reihe | `#8EBAF4` | `#245998` |
| Zweite Reihe              | `#C2ABD9` | `#725188` |
| Positiv                   | `#79CBA5` | `#24664D` |
| Negativ                   | `#F29A9A` | `#A83343` |
| Warnung                   | `#E3BD73` | `#795500` |
| Dekorative Trennlinie     | `#303B49` | `#D3DBE4` |
| Notwendige Control-Kontur | `#77899E` | `#728194` |

Dark ist Ausgangspunkt, Light ein gleichwertiger heller Arbeitsmodus mit stärker abgedunkeltem Blau. Keine bloße Farbinversion und kein blauer Flächenglow. Positive/negative Farben stehen nur neben einem Vorzeichen und einer Bezugsperiode.

**Typografie.** Inter 400 für Text, 500 für Controls, 600 für Titel. IBM Plex Mono 400/500 als Kandidat für Zahlen und technische Identifikatoren, alternativ zunächst die vorhandene Inter mit `tabular-nums`. Seitentitel 28/34 px, führender KPI 36/40 px, übrige KPIs 24/30 px, Tabellen 14/20 px, Metadaten 12/18 px. Keine gesamte Oberfläche in Monospace; das würde lange deutsche Labels unnötig verbreitern.

**Layout, Navigation und Architektur.** Ab 1280 px eine 184-px-Seitennavigation innerhalb einer maximal 1680 px breiten Shell; Inhaltsabstand 24 px. Im Inhalt ein 12-Spalten-Raster mit 16 px Gutter, offene horizontale KPI-Bänder statt sechs Boxen. Reihenfolge: kompakte Zustandszeile → vergleichbare Messwerte → Analyse und Detailtabelle. Rahmen nur um zusammengehörige Analysegruppen, 4 px Radius, 1 px Linien, keine Schatten. Tabellendichte 44 px pro interaktiver Zeile. Aktive Route: 3-px-Seitenstrich, Textgewicht 600 und `aria-current`.

**Diagrammstil.** Gerade, nicht geglättete Linien, 2 px breit, kaum Flächenfüllung. Kleine Multiples mit gleicher Zeitachse; echte Achsenbereiche explizit beschriften. Eine vertikale Inspektionslinie zeigt Wert und Zeit, keine Fadenkreuz-Inszenierung. Gebühren werden in beschrifteten Vergleichszeilen dargestellt, Blockdaten tabellarisch. Spätere Hashrate/Difficulty als getrennte, zeitlich ausgerichtete Plots statt täuschender Doppelachse.

**Interaktion und Motion.** Fokus/Selection nutzt dieselbe Kontrollfarbe wie aktive Navigation, aber zusätzlich Kontur/Text. Hover nur bei bedienbaren Elementen, 100 ms Farbwechsel. Datenwechsel atomar, maximal 180 ms Hintergrundhervorhebung bei geändertem Wert; keine hochzählenden Zahlen. Zeitraumwahl nur bei tatsächlich vorhandenen Reihen. Reduzierte Bewegung deaktiviert Übergänge. Die relative Ruhe kann trotz schneller Bedienung etwas statisch wirken.

**Desktop und Mobile.** Desktop priorisiert parallelen Vergleich. Bei 768 px entfällt die Seitenspalte; vier Textlinks stehen oberhalb des Inhalts in zwei Zeilen. Bei 390 px werden Messgruppen vertikal zu Definitionslisten, die Hauptzahl bleibt einzeln. Breite Rohdatentabellen dürfen in einem bezeichneten Container scrollen; die gesamte Seite bleibt ohne horizontalen Scroll. Kein geschrumpftes Sechs-Spalten-Terminal auf dem Smartphone.

**Eignung und Abwägung.** Sehr gut für Marktvergleich, Blocktabellen, Gebühren und Mining-Rohwerte; weniger gut für den schnellen verständnisorientierten Einstieg. Vorteil: hohe Lesbarkeit und einfache Erweiterung durch weitere Messreihen. Nachteile: höhere wahrgenommene Fachlichkeit, weniger erzählerische Führung und geringere Markenunterscheidung. **Generikrisiko: mittel bis hoch**, falls blaues Dunkelthema und Monospace allein die Identität tragen. Das Messraster muss fachlich motiviert bleiben, sonst entsteht Terminal-Cosplay.

**Kompositionsskizze — Konzeptmaterial, kein Screenshot:**

```text
184 px Route | Fachlicher Titel · Ressourcenzustand
             | Messwert ┃ Messwert ┃ Messwert ┃ Messwert
             | ────────────────────────────────────────
             | Analyse A             | Vergleichswerte
             | Analyse B, gleiche Zeitachse
             | Präzise Datentabelle über Inhaltsbreite
```

### 5.2 Konzept B – Editorial Intelligence

**Leitidee und Identität.** Ein regelmäßig konsultierter Datenbericht: zuerst eine klare Hauptaussage durch Überschrift, führenden Wert und Diagramm, danach Belege und Kontext. Die Aussage entsteht aus der Datenauswahl und deren Beschriftung, nicht aus automatisch erfundenen Kommentaren. Unterschiedliche Kapitelbreiten und betonte Typografie schaffen Wiedererkennbarkeit.

**Farbpalette:**

| Rolle                     | Dark      | Light     |
| ------------------------- | --------- | --------- |
| Hintergrund               | `#1B1917` | `#F4F0E8` |
| Analysefläche             | `#24211E` | `#FFFCF6` |
| Haupttext                 | `#F3EDE2` | `#28231E` |
| Sekundärtext              | `#B9AEA0` | `#6D6257` |
| Interaktion / erste Reihe | `#DB9D92` | `#8A3C35` |
| Zweite Reihe              | `#AFC3D7` | `#365C7A` |
| Positiv                   | `#9BC3A5` | `#326047` |
| Negativ                   | `#E99B98` | `#A23839` |
| Warnung                   | `#E2BF7E` | `#795A20` |
| Dekorative Trennlinie     | `#494139` | `#D9D0C3` |
| Notwendige Control-Kontur | `#9F8D7A` | `#877867` |

Light ist der konzeptionelle Ausgangspunkt: warmes Papier ohne Papiertextur. Dark verwendet warme dunkle Flächen und unveränderte Kapitelhierarchie. Die Datenlinie darf nicht mit negativem Trend gleichgesetzt werden; Linienname, Vorzeichen und Trendwort unterscheiden die Bedeutung.

**Typografie.** Newsreader 500/600 für Seitentitel und ausgewählte Kapitelüberschriften; Inter 400/500/600 für Daten und Bedienung. Seitentitel 44/48 px, mobil 32/36 px; Hauptzahl in Inter 48/52 px, Sekundärzahlen 28/34 px, Fließtext 16/25 px, Metadaten 13/19 px. Serifenschrift nicht in Tabellen oder Tooltips. Alternative bei zu starkem Magazincharakter: Source Serif 4 als ruhigerer Titelkandidat mit identischem Inter-Datenkern. Die Auswahl bleibt offen bis zur Schriftprobe.

**Layout, Navigation und Architektur.** Maximal 1360 px, 32 px Außenraum, 24 px Gutter. Ein 12-Spalten-Raster wird als 8:4-Komposition verwendet: links Hauptdiagramm, rechts knappe Definitionsliste. Kapitel beginnen nach 48 px mit einer durchgehenden Linie; verwandte Details folgen nach 16 px. Navigation horizontal unter dem Produktkopf, aktive Route durch kräftigere Schrift und Unterstreichung. Karten nur für Rechner oder tatsächlich abgeschlossene Hilfsinhalte, 2–4 px Radius. Keine sechsfache KPI-Zeile; ein Leitwert und eine kompakte Faktenspalte.

**Diagrammstil.** Wenige Serien, direkte Linienbeschriftung am Rand, zurückhaltende Achsen. Anmerkungen nur für belegte Ereignisse aus vorhandenen Daten; keine erfundenen Marktursachen. Tabellen erscheinen als Belegteil mit Caption, 14/22 px Text und 48-px-Zeilen. Mining kann aus Rechenleistung, Difficulty und Emission drei Kapitel bilden; Blockchain aus Blockspace und letzten Blöcken zwei Kapitel. Der Inhalt muss nicht künstlich täglich umgeschrieben werden.

**Interaktion und Motion.** Zeitraumwahl neben dem jeweiligen Diagrammtitel, bei fehlender Historie nicht anzeigen. Hauptwert/Inspektionswert wechselt ohne Zahlentween. Ein gewählter Datenpunkt bleibt mit beschriftetem Marker fixierbar; Escape hebt die Auswahl auf. Navigation kann 120 ms überblenden, ohne Scrollparallax oder verschobene Kapitel. Reduzierte Bewegung schaltet die Überblendung ab. Hoverlinien signalisieren nur vorhandene Links.

**Desktop und Mobile.** Desktop nutzt bewusst längere Lesestrecken und ungleiche Breiten. Auf Tablet bleibt die Faktenspalte nur bei ausreichendem Platz neben dem Plot, sonst folgt sie darunter. Mobil lautet die Reihenfolge Titel → Hauptwert → Kontext → Chart → Fakten → Rohdaten; die Kopfzeile bietet einen beschrifteten Bereichs-Disclosure mit vier normalen Links, dem aktuellen Bereich und offen erkennbarem Zustand. Ein geschlossenes Menü spart Platz, verringert aber die unmittelbare Sichtbarkeit aller Routen.

**Eignung und Abwägung.** Stark für Marktüberblick, Angebots-/Halving-Kontext und gelegentliches Lesen; brauchbar für Blockchain und Mining, solange Tabellen nicht redaktionell versteckt werden. Vorteile: deutliche Typografie und sorgfältige Leseführung. Nachteile: längere Wege beim schnellen Vergleich vieler Größen; Kontexttexte und wechselnde Datenmengen erfordern kompositorische Disziplin. **Generikrisiko: mittel**: Ohne datenbezogene Kapitel wird es ein beliebiges Finanzmagazin; übergroße Serifentitel könnten eine kurzfristige Designmode werden.

**Kompositionsskizze — Konzeptmaterial, kein Screenshot:**

```text
Produktkopf / horizontale Kapitel-Navigation
Großer fachlicher Titel
──────────────────────────────────────────────────────
Führender Wert + Hauptdiagramm (8) | Faktenkolumne (4)
Kontext zum Datenstand

──────────────────────────────────────────────────────
Zweites Kapitel: Vergleich / Rohdatentabelle
```

### 5.3 Konzept C – Digital Asset Observatory

**Leitidee und Identität.** Bitcoin als beobachtbares System: Blockspace-Nachfrage, Gebühren und bestätigte Blöcke bilden zusammen ein verständliches Bild. Jeder Bereich erhält ein charakteristisches Hauptbild aus seinen tatsächlichen Daten. Der Arbeitstitel benennt die Art Direction; die Anwendung bleibt bis zu einer gesonderten Namensentscheidung „Bitcoin Dashboard“.

Die Handschrift besteht aus **Messdatum, Analysefeld und Kontext**: eine kleine typografische Bezugszeile mit Einheit/Zeit, eine großzügige sachliche Visualisierung und unmittelbar zugehörige Messwerte. Ein kurzer kupferfarbener Strich markiert den aktuellen Analysebereich. Kein Radar, keine Umlaufbahnen, kein 3D-Netzwerk. Die Metapher bleibt in der Informationsordnung, nicht in einer dekorativen Observatoriumskulisse.

**Farbpalette:**

| Rolle                            | Dark      | Light     |
| -------------------------------- | --------- | --------- |
| Hintergrund                      | `#111817` | `#F3F3EC` |
| Analysefläche                    | `#192321` | `#FDFDF8` |
| Haupttext                        | `#E7EEE9` | `#202E29` |
| Sekundärtext                     | `#A7B7AE` | `#52665C` |
| Markenakzent / Messdatum         | `#E3AB7A` | `#8A4D25` |
| Interaktion / primäre Datenreihe | `#89CBB8` | `#226855` |
| Zweite Datenreihe                | `#B6B7E4` | `#655C94` |
| Positiver Vergleich              | `#9DC9AD` | `#2E6148` |
| Negativer Vergleich / Fehler     | `#E6A0A0` | `#9B3C43` |
| Warnung / veralteter Abruf       | `#E2BF79` | `#795716` |
| Dekorative Trennlinie            | `#344640` | `#D2DBD4` |
| Notwendige Control-Kontur        | `#799087` | `#71867B` |

Dark und Light bekommen dieselbe inhaltliche Gewichtung. Light verwendet abgedunkelte Akzente und keine blassen grünen Texte. Kupfer kennzeichnet weder Kursgewinn noch Fehler. Die grüne Datenlinie bezeichnet eine Reihe, keine positive Bewertung; deren Veränderung braucht ein Vorzeichen und einen Zeitraum. Akzentflächen bleiben auf kurze Markierungen und bedienbare Zustände beschränkt. Es gibt keine riesige grüne oder orange Hero-Fläche.

**Typografie.** IBM Plex Sans 400/500/600 für Oberfläche und große Messwerte; IBM Plex Mono 400/500 für Blockhöhen, Hashausschnitte und präzise Zeit-/Einheitenzeilen. Hauptwert 40/44 px, sekundäre Messwerte 24/30 px, Seitentitel 32/38 px, Modultitel 18/24 px, Tabellen/Labels 14/20 px, Metadaten 12/18 px. Mobil Hauptwert 32/36 px und Titel 28/34 px. Tabellarische Ziffern auch in der Sans; Mono ist fachlicher Akzent, kein Flächentext. Inter bleibt Rückfall-/Vergleichskandidat, falls Plex in der Schriftprobe zu stark an eine bestehende Technikmarke erinnert.

**Layout, Navigation und Architektur.** Desktop maximal 1536 px Gesamtbreite, darin 32 px Außenpadding und 24 px Gutter. Die Hauptsektion nutzt 8:4 Spalten, sekundäre Abschnitte 6:6 oder volle Breite. Verwandte Zahlen bilden eine offene Zeile, nicht mehrere Karten. Größere Analysefelder erhalten höchstens 6 px Radius, 24 px Padding und eine zurückhaltende Linie. Kapitelabstand 40 px, Modulabstand 24 px, zusammengehörige Werte 12 px. Die Hauptnavigation bleibt als vier Textlinks in der oberen Shell sichtbar; aktive Route mit 2-px-Unterstrich, Gewicht 600 und `aria-current`.

**Diagrammstil.** Gebühren als beschriftete Vergleichsleiter, Mempool-Histogramm als präzise Balken, letzte Blöcke als einfache chronologische Folge mit begleitender Tabelle. Jeder dargestellte Block entspricht einem tatsächlichen Datensatz. Balken zeigen eine ausdrücklich benannte Größe; bloße Blocksymbole bekommen keine quantitative Flächenbedeutung. Markt und Mining nutzen ruhige Zeitreihen mit zugehörigen Kontextwerten. Nicht jeder Datentyp wird zum Spektakel; eine aussagekräftige Definitionsliste ist besser als ein bedeutungsloser Gauge.

**Interaktion und Motion.** Inspektion macht Beziehungen sichtbar: Ein ausgewählter Gebührenbereich zeigt dessen Datenwerte und hebt nur die zugehörigen Histogrammbalken hervor. Diese Verknüpfung erfolgt ausschließlich zwischen Daten desselben Mempool-Snapshots. Neue Blöcke werden erst nach validiertem neuen Blocks-Snapshot markiert; vorhandene Zeilen springen beim Lesen nicht ungefragt aus dem Fokus. Aktualisierungen bekommen eine kurze lokale Flächenbetonung und eine klare Abrufzeit. Keine dauerhaften Lichtpunkte, keine simulierten Transaktionen und kein vermeintlicher Echtzeit-Puls.

**Desktop und Mobile.** Bei 1440 px: 1376 px Inhalt, 8:4-Aufteilung mit etwa 909/443 px nach Gutter. Bei 1920 px: Shell 1536 px, Inhalt 1472 px, etwa 973/475 px. Bei 768 px: 24 px Außenpadding, 720 px Inhalt, Analyse und Kontext untereinander, bei geeigneten kurzen Werten zwei Spalten. Bei 390 px: 16 px Außenpadding, 358 px Inhalt, eine primäre Messwertspalte, 44-px-Touchziele und 240–280 px hohe Charts. Die mobilen vier Routen stehen in einem expliziten 2×2-Raster mit mindestens 48 px hohen Feldern; „Netzwerk & Mining“ darf umbrechen. Keine feste Unterleiste, die Diagrammfläche oder Fokus verdeckt.

**Eignung und Abwägung.** Sehr gut für Blockchain/Mempool, belastbar für Markt und Mining durch wiederverwendbare Zeitachsen und Kontextspalten. Angebot/Emission werden zu Zeit-/Fortschrittsdarstellungen, sobald belastbare Werte existieren. Vorteile: Datenbeziehungen schaffen Bitcoin-Identität; variable Modulformen vermeiden Kartenmonotonie; nützliche Inspektion vermittelt Lebendigkeit. Nachteile: mehr Diagrammgestaltung und sorgfältigere Daten-/Statuszuordnung als bei A; mobile Transformation und Tastaturinspektion benötigen explizite Spezifikation. **Generikrisiko: mittel**: Grün und Kupfer allein wären austauschbar. Ohne reale Datenbeziehungen oder bei dekorativen Blockgrafiken verliert C seinen Vorteil.

**Kompositionsskizzen — Konzeptmaterial, keine Screenshots:**

```text
DESKTOP
Bitcoin Dashboard       Übersicht | Markt | Blockchain | Netzwerk & Mining
Fachlicher Titel                        Datenabruf / Quellenkontext
Messwert ───── Einheit ───── Datenbezug       (offene Zeile)
┌─────────────────────────────────┬─────────────────────┐
│ Analysefeld / vorhandene Daten  │ Zugehöriger Kontext │
│ z. B. Blockspace-Histogramm     │ Gebührenleiter      │
│ Einheit, Abrufzeit, Legende     │ Status je Ressource │
└─────────────────────────────────┴─────────────────────┘
Letzte Blöcke — chronologische Folge und vollständige Tabelle
Weitere Vorschau — kompakt, ausdrücklich ohne angebundene Daten

MOBIL
Bitcoin Dashboard                         Theme
Übersicht             | Markt
Blockchain            | Netzwerk & Mining
Fachlicher Titel
Führender Messwert + Datenstatus
Analysefeld, ohne abgeschnittene Achsen
Kontext / Gebühren als beschriftete Zeilen
Blockübersicht, weitere Felder erreichbar
Kompakter Vorschauabschnitt
```

## 6. Konkretes Designsystem und Zugänglichkeit

### 6.1 Typografische und numerische Regeln — K

Alle Konzepte verwenden echte Fontgewichte; keine synthetische Fettung. Große Zahlen erhalten `font-variant-numeric: tabular-nums lining-nums`. Negative Laufweite höchstens bei großen Überschriften, nicht bei Tabellenziffern. Deutsche Labels dürfen mehrzeilig sein; feste KPI-Höhen dürfen Text bei Zoom nicht abschneiden.

| Datentyp                       | Anzeigeprinzip                                                                                          | Beispiel nur zur Formatdemonstration      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Blockhöhe, Transaktionen, sat  | Ganze Zahl, `de-DE`, keine Abkürzung im Detail                                                          | `900.000 Blöcke`, `12.345 sat`            |
| Kurs bei künftig echter Quelle | Währung explizit, zwei Nachkommastellen; USD bleibt Voreinstellung des bestehenden Umfangs              | `84.321,50 USD`                           |
| Gebühr                         | Bis drei Nachkommastellen, keine erzwungenen Nullstellen                                                | `1,125 sat/vB`; `0 sat/vB` bleibt gültig  |
| Größe und Gewicht              | Decimal-MB/MvB und MWU getrennt, keine Umdeutung                                                        | `1,42 MB`, `3,98 MWU`, `0,46 MvB`         |
| Prozentänderung                | Vorzeichen, Wert, Bezugsperiode und Wort/zugängliche Bezeichnung                                        | `+2,4 % · 24 h · gestiegen`               |
| Timestamp                      | Kurze sichtbare lokale Zeit mit Zeitzonenangabe im Kontext; Datum und vollständiger ISO-Wert zugänglich | `Abruf 13:42:08 MEZ`; Blockzeit gesondert |
| Fehlende / unverbundene Daten  | Gedankenstrich plus Erklärung, niemals Null oder interpolierter Ersatz                                  | `— · Datenquelle noch nicht verbunden`    |

Beispiele sind keine aktuellen Bitcoin-Messwerte. Gerundete Null darf einen kleinen positiven Wert nicht verschleiern: bei notwendiger Präzision eine beschriftete Grenze wie `< 0,001` oder mehr Stellen verwenden. Verkürzungen wie Mrd. nur in Überblicken, mit vollem Wert in zugänglicher Detaildarstellung. Zahl und Einheit durch geschützten Abstand zusammenhalten; bei Platzmangel dürfen Zahlengruppe und Einheitenzeile getrennt stehen.

### 6.2 Kontrastnachweis — R und offene Prüfungen

Die Werte wurden aus den angegebenen sRGB-Hexfarben nach relativer Luminanz berechnet: Kanäle linearisieren, `L = 0,2126 R + 0,7152 G + 0,0722 B`; Kontrast `(Lhell + 0,05) / (Ldunkel + 0,05)`. Auf zwei Stellen gerundete Darstellung, keine Rundung zum Bestehen eines Grenzwerts. Transparenz und Zustandsmischungen sind nicht Teil dieser Stichprobe.

| Konzept / Kartenfläche | Haupttext | Sekundärtext | Interaktion | Notwendige Control-Kontur |
| ---------------------- | --------- | ------------ | ----------- | ------------------------- |
| A Dark `#171D24`       | 15,06:1   | 7,61:1       | 8,47:1      | 4,73:1                    |
| A Light `#FFFFFF`      | 15,89:1   | 6,07:1       | 7,10:1      | 3,97:1                    |
| B Dark `#24211E`       | 13,74:1   | 7,34:1       | 7,05:1      | 5,01:1                    |
| B Light `#FFFCF6`      | 15,20:1   | 5,80:1       | 7,38:1      | 4,17:1                    |
| C Dark `#192321`       | 13,66:1   | 7,69:1       | 8,67:1      | 4,72:1                    |
| C Light `#FDFDF8`      | 13,87:1   | 6,03:1       | 6,47:1      | 3,81:1                    |

C-Kupfer erreicht 7,96:1 Dark und 6,49:1 Light; die zweite Reihe 8,35:1 bzw. 5,86:1 gegen die jeweilige Analysefläche. Die hellen dekorativen Trennlinien sind absichtlich kein Nachweis notwendiger Control-Grenzen. Wo eine Kontur zur Erkennung eines Controls nötig ist, muss der stärkere Control-Token eingesetzt werden.

[WCAG 2.2: Textkontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) verlangt für normalen Text 4,5:1, für großen Text 3:1. [Nichttextkontrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) betrifft notwendige visuelle Merkmale von Controls/Zuständen und verständnisrelevante Grafik mit 3:1. Die Auswahl oben schafft Reserven; sie zertifiziert keine Oberfläche. Vor Freigabe sind alle tatsächlichen Kombinationen, Statusfarben, Hover-/Disabled-/Fokuszustände, Chartüberlagerungen und angrenzenden Serien in beiden Themes zu prüfen. Reihen unterscheiden sich zusätzlich durch Beschriftung, Strichart oder Muster, nicht nur Farbe.

### 6.3 Gemeinsame Zustände und Bedienregeln — K

- **Fokus:** 2 px sichtbare Kontur mit 3 px Abstand; gegen alle angrenzenden Flächen prüfen. Kein Entfernen des Fokus ohne Ersatz. Aktive Route zusätzlich Textgewicht/Strich, Auswahl zusätzlich Marker/Text und geeigneter ARIA-Zustand.
- **Hover:** lokale Flächenänderung oder Unterstreichung, keine Vergrößerung der Karte. Statische Messwerte erhalten keinen Pointercursor und keine vermeintliche Klickbarkeit.
- **Interaktionsgröße:** Produktziel mindestens 44 × 44 CSS-px, mobil Navigation mindestens 48 px hoch. Das ist strenger als [WCAG 2.2 AA 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) mit 24 × 24 px bzw. seinen Ausnahmen; die Ziele werden nicht fälschlich gleichgesetzt. Inline-Links müssen ebenfalls eindeutig erreichbar bleiben.
- **Semantik:** ein `h1`, Themen als `h2`, Untergruppen bei Bedarf `h3`; zusammengehörige Messwerte als `dl`; Tabellen mit Caption und Spaltenköpfen mit `scope="col"`. Keine interaktiven `div`-Elemente als Ersatz für Links/Buttons.
- **Keyboard:** Skip-Link erhalten; DOM-Reihenfolge entspricht der visuellen Lesefolge. Routenwechsel aktualisiert Dokumenttitel und bietet einen getesteten Fokuspfad zum neuen Hauptinhalt. Segmentwahl als native Buttons oder korrekt implementierte Radiogruppe; Tabmuster nur bei tatsächlichen Tabpanels.
- **Datenzustand:** „Beobachtet · Quelle“, „Historische Reihe · Zeitraum“, „Synthetische Vorschau“ und „Nicht verbunden“ sind unterschiedliche Inhalte. Stale ist ein Zustand vorhandener Daten, kein Wechsel ihrer Herkunft. Initialer Fehler zeigt keinen Zahlenwert; Null bleibt bei erfolgreicher Antwort ein gültiger Wert.
- **Updates:** „Abruf vor …“ bedeutet Zeitpunkt erfolgreicher Abfrage, nicht Zeitpunkt der letzten Provideränderung. Kein pauschales „Live“-Badge bei 60-s-Polling. Blockzeit und Abrufzeit getrennt benennen. Gemeinsame Statuszeilen nur für wirklich gemeinsam gesampelte Daten; unabhängige Ressourcen behalten unabhängige Zeitpunkte und Fehler.
- **Laden/Fehler:** Container und Statuszone passend reservieren; nach erfolgreichem Erstladen Chart bei Refresh erhalten. Lange Fehlermeldungen dürfen nach unten erweitern, niemals überlagern oder abschneiden. Eine Gruppenmeldung darf mehrere identische Fehler reduzieren, muss aber pro Ressource Retry und Status nachvollziehbar lassen.
- **Assistenztechnik:** sparsame konsolidierte Statusansagen statt jeder einzelnen geänderten Zahl; bei blockierendem Initialfehler Alert. Screenreader-Prüfung für doppelte Ansagen, Tabellen und Chartalternativen einplanen. Die bestehende Cache-/Retry-Semantik bleibt erhalten.

Schriften werden erst nach Entscheidung als selbst gehostete, versionierte WOFF2-Assets mit Lizenzdatei eingeplant; keine Laufzeitabfrage bei Google Fonts und keine neue Abhängigkeit in Phase 2.0. Schriftmuster müssen Umlaute, `ß`, `₿`, `%`, `sat/vB`, lange Labels und echte Ziffernfolgen prüfen. Eine fehlende Glyphe erhält einen bewussten Fallback. `font-display` und metrisch passender Fallback sollen Layoutsprünge begrenzen; Auswahl, Lizenz und Budget gehören zur Abnahme von 2.1.

## 7. Informationsarchitektur und Datenvisualisierung

### 7.1 Umfang erhalten, Datenreife ehrlich darstellen — K

Die vier Hauptrouten bleiben bestehen. Mempool/Gebühren gehören zunächst als Sektion zu Blockchain; Angebot/Emission zu Netzwerk & Mining. Kein zusätzlicher Navigationspunkt allein für einen einzelnen Graphen. Bei später erheblich größerem Datenumfang wird die Gruppierung erneut anhand realer Inhalte beurteilt; das Konzept benötigt heute weder neue Routen noch neue Quellen.

| Route             | Führender Inhalt nach C                                  | Sekundär / vollständiger Zugriff                                                                  | Umgang mit aktuellem Datenstand                                                                                                  |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Übersicht         | Blockspace-Zustand mit Blockhöhe, Mempool und Gebühren   | Letzte Blöcke; kompakte Markt-, Hashrate- und Halving-Vorschau                                    | Echte aktuelle Snapshots führen; synthetischer Kurschart bleibt als solche benannte Vorschau erreichbar                          |
| Markt             | Später echter Kurs mit Verlauf und Bezugszeit            | Marktkapitalisierung, Volumen, ATH, Dominanz, Fear & Greed; Sats-Rechner-Platzhalter              | Heute ein gemeinsamer Vorschauhinweis, beschriftete leere Werte und klar synthetischer Indexchart; keine fingierte Preisbewegung |
| Blockchain        | Mempool/Fees als zusammenhängender Analysebereich        | Blockhöhe, letzte Blockgröße/-gewicht, vollständige Blocktabelle; Blockzeit-/Durchsatzplatzhalter | Vorhandenes Histogramm kann ausgewertet werden; die zwei unverbundenen Kennzahlen bleiben sichtbar bezeichnet                    |
| Netzwerk & Mining | Später Hashrate und Difficulty auf gemeinsamer Zeitbasis | Anpassung, Poolanteile, Halving, Angebot, Inflation                                               | Heute kompakte fachliche Leerzustände; keine berechnete Historie oder Countdownbewegung ohne Quelle                              |

„Kompakt“ bedeutet räumlich bündeln, nicht Funktion oder benannten Datenumfang entfernen. Externe Blocklinks, Theme, Fehlerrückgewinnung, Quellenhinweise und alle aktuellen Platzhalterbereiche müssen erhalten bzw. klar erreichbar bleiben. Eine Vorschau darf nicht so verkleinert werden, dass ihre Demo-Kennzeichnung unlesbar wird.

### 7.2 Passende Formen für verschiedene Datentypen — K

| Datentyp                           | Geeignete Form                                                   | Fachliche Regeln / Datenvoraussetzung                                                                                                                                                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Einzelner aktueller Messwert       | Zahl mit Einheit, Zeitbezug und kurzer Definition                | Kein Sparkline ohne echte Zeitreihe; aktuelle Snapshots ergeben keine Historie                                                                                                                                                                          |
| Kursentwicklung                    | Linienchart, darunter Preis-/Periodenvergleich                   | Erst mit echten zeitgestempelten Kursdaten; Demo bis dahin Index und `P1…P12` behalten                                                                                                                                                                  |
| Marktkapitalisierung, Volumen, ATH | Vergleichende Faktenzeilen                                       | Größen und Zeitbezüge trennen; Volumen ist nicht Marktkapitalisierung                                                                                                                                                                                   |
| Letzte Blöcke                      | Chronologische Folge plus Tabelle                                | Reihenfolge und tatsächliche Blockanzahl bewahren; keine Animation vorhergesagter Blöcke; Minerzeit nicht als exakt gemessene Blockdauer behandeln                                                                                                      |
| Gebührenempfehlungen               | Fünf beschriftete Zeilen, optional ausgerichtete Marker          | Empfehlungen bleiben Schätzungen; keine garantierten Bestätigungszeiten, keine unnötige Logskala                                                                                                                                                        |
| Mempool-Snapshot                   | Histogramm: Gebührensatz gegen virtuelle Größe                   | Vorhandene `feeHistogram`-Paare nutzen; vor Umsetzung die genaue Bucket-Semantik prüfen. Ohne belegte Bucketgrenzen diskrete Fee-Rate-Balken, keine erfundenen Intervalle. Summenabweichungen zur Gesamtsize offenlassen, nicht künstlich normalisieren |
| Netzwerkaktivität                  | Zeitreihe oder einzelne Messzeile, je tatsächlichem Vertrag      | Keine TX/s aus bloßer Mempool-Anzahl ableiten; fehlende Historie bleibt leer                                                                                                                                                                            |
| Hashrate / Difficulty              | Zwei zeitlich ausgerichtete Plots mit Einheiten                  | Keine unbezeichnete Doppelachse; Quelle, Schätzfenster und Glättung offenlegen, sobald Daten angebunden sind                                                                                                                                            |
| Mining-Pools                       | Sortierte horizontale Balken plus Werteliste                     | Auswertungsfenster und Nenner nennen; keine Poolzuordnung ohne Daten, kein dekorativer Donut                                                                                                                                                            |
| Angebot / Emission / Halving       | Exakte Zahlen plus lineare Fortschrittsleiste oder Stufenverlauf | Nur aus validierten Grundlagen; verbleibende Blöcke und geschätzte Kalenderzeit unterscheiden; keine scheinexakte Uhr                                                                                                                                   |

Nur Snapshot-Histogramm, Gebührenvergleich und letzte Blöcke sind mit dem derzeitigen API-Umfang grundsätzlich darstellbar. Neue Markt-/Mining-Historien bleiben Folgeaufgaben außerhalb dieser Designphase. Verknüpfungen zwischen unabhängig abgerufenen Ressourcen dürfen keine atomare Gleichzeitigkeit oder Kausalität behaupten.

### 7.3 Diagrammsystem für Phase 2 — K

Plotfläche und Beschriftungen werden getrennt geplant: Desktop 320–360 px Plotregion, Mobil 240–280 px; Achsenplatz zusätzlich aus den tatsächlichen Labels ableiten. 2-px-Linien, keine Glättung oder Flächenverläufe als Standard. Vier bis sechs Y-Ticks auf Desktop, drei bis vier mobil, abhängig vom Wertebereich. Gitterlinien dienen der Orientierung und bleiben schwächer als Daten. Balken beginnen bei Null; bei nicht bei Null beginnenden Linienachsen wird der Bereich sichtbar und sachgerecht angegeben. Logarithmische Skalen nur bei belegtem Bedarf mit ausdrücklichem Label und sauberem Umgang mit Nullwerten.

Zeitachsen zeigen tatsächliche Zeitstempel und die dargestellte Zeitzone. Lücken bleiben Lücken. Kein Verbinden über fehlende Werte, kein Downsampling, das Spitzen ohne Kennzeichnung entfernt. Die Legende benennt Serie, Einheit und gewählten Zeitraum. Mobile Charts reduzieren Tickzahl und Zusatztext, nicht die zugrunde liegenden Werte.

Tooltips erhalten Theme-Tokens, 14-px-Text, tabellarische Zahlen, kompakte Zeitzeile, 1-px-Control-Kontur, 6 px Radius und 12 px Padding. Sie dürfen nicht aus dem Viewport ragen. Pointer-Hover zeigt temporäre Inspektion, Touch-Tap fixiert einen Punkt, Escape bzw. ein beschrifteter Schließen-Button löst ihn. Kein wichtiges Wissen ausschließlich im Hover.

Ein fokussierbarer Inspektionsbereich erlaubt links/rechts den vorigen/nächsten Datenpunkt und Home/End den ersten/letzten; Tab verlässt den Bereich. Eine beschriftete Wertausgabe enthält Zeit, Einheit und Serie. Dieser DOM-Pfad wird ausdrücklich gebaut und getestet; Canvas/ECharts-ARIA allein stellt ihn nicht bereit. Für Histogramme werden Kategorien entsprechend durchlaufen. Bei komplexen oder langen Reihen bleibt eine zugängliche, sinnvoll gegliederte Wertetabelle verfügbar; sie muss den dargestellten Daten entsprechen.

ECharts bleibt die bestehende Engine. Theme-/Chartoptionen werden aus gemeinsamen Tokens abgeleitet; komponentenbezogener Lazy Load, ResizeObserver-Cleanup und lokale ErrorBoundary bleiben erhalten. Kein zusätzlicher Chartbaukasten. Die offizielle [ECharts-ARIA-Dokumentation](https://echarts.apache.org/handbook/en/best-practices/aria/) beschreibt Beschreibungen und Muster; diese ergänzen die hier geforderten DOM-Alternativen. Konkrete Optionen sind gegen die installierte Version zu prüfen, statt Beispiele ungeprüft zu übernehmen.

## 8. Motion- und Interaktionsstrategie

Alle Vorschläge sind K. Bewegung verdeutlicht einen bereits eingetretenen Zustand. Sie erzeugt keine Aktivität, die die Daten nicht belegen.

| Kategorie                      | Auslöser und Verhalten                                                                     | Dauer / Grenze                                                            | Ohne Bewegung / Keyboard                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Funktionale Interaktion        | Zeitraum- oder Serienwahl ändert nur das betroffene Diagramm; Auswahl bleibt beschriftet   | 100–140 ms Control-Farbwechsel; kein unnötiger kompletter Chart-Neuaufbau | Sofortiger Zustand, native Controls; nur Optionen mit echten Daten anbieten                                              |
| Datenbezogene Animation        | Erfolgreicher neuer Abruf mit geändertem Messwert: lokale Hinterlegung und neuer Timestamp | Einmalig ca. 350 ms, keine Zahlentweens, kein Blinken                     | Sofortiger Wert und statischer Hinweis „aktualisiert“; Ansagen bündeln                                                   |
| Neue Blöcke                    | Tatsächlich neue Hashes im validierten Blocks-Snapshot markieren                           | Einmalig 350 ms; kein automatischer Fokus-/Scrollwechsel                  | Statische Markierung; bei aktiver Tabelleninspektion neue Reihen über Hinweis kontrolliert übernehmen, ohne Datenverlust |
| Navigation                     | Fachliche Ansicht wechselt, Shell bleibt stabil                                            | Optional 100–140 ms Opacity, kein Slide; keine Verzögerung der Bedienung  | Direkter Wechsel; Titel/Fokus und Browser-Back testen                                                                    |
| Mikrointeraktion               | Hover, Fokus, gewählte Datenkategorie                                                      | 100–140 ms Farbe/Kontur; keine Kartenhebung                               | Fokus/Selection sofort sichtbar, zusätzlich Text/Marker                                                                  |
| Initiales Laden                | Platz für Wert/Plot reserviert, kurze verständliche Statusmeldung                          | Statische Platzhalter; kein Shimmer, keine falsche Kurve                  | Gleiches Verhalten; nur Datenbereich als beschäftigt kennzeichnen                                                        |
| Hintergrundaktualisierung      | Letzte gültige Werte bleiben, Status „Abruf läuft“                                         | Keine dimmende Vollflächenüberlagerung, keine Dauerrotation               | Sachlicher Text und erfolgreiche Abrufzeit                                                                               |
| Fehler / veraltete Werte       | Vorhandene Werte mit Warntext; initialer Fehler mit Recovery                               | Kein Schütteln, keine rote Ganzseitenanimation                            | Text, Symbol und klare Buttons; vorhandene Retry-/Reload-Verträge erhalten                                               |
| Visuelles Detail ohne Funktion | Kurzer statischer Kupferstrich am Analysebezug                                             | Keine Animation                                                           | Identisch; sonstige dekorative Bewegung entfällt                                                                         |

`prefers-reduced-motion: reduce` deaktiviert CSS- und ECharts-Übergänge sowie Markierungsausblendungen; eine Markierung kann statisch bis zur nächsten bewussten Interaktion bestehen. Die Abfrage ist auch für den Chartadapter auszuwerten und bei Änderung zu berücksichtigen. Keine verpflichtenden Animationen, keine Scrollparallax, kein Zählwerk und keine dauernden „Live“-Lichter.

Performanceziel ist stabile Interaktion: nur benötigte Serienoptionen aktualisieren, keine ununterbrochenen Renderloops und keine künstlich höhere Abruffrequenz. Die vorhandenen 60-s-Polling-/Stale-/Retry-Regeln bleiben bestehen. Unveränderte Werte erzeugen keine neue Hervorhebung. Reflow wird durch reservierte Datenflächen und stabile Ziffern begrenzt; Animationen verwenden höchstens Opacity/Hintergrund, keine Geometrieänderungen. Konkrete CLS-/Interaktionsmessungen erfolgen erst an der Implementierung.

## 9. Bitcoin-spezifische Produktidentität

Die stärkste Identität entsteht aus dem, was nur diese Anwendung zeigen kann: **Blockhöhe als Bezugsdatum, Gebühren in sat/vB, Mempool in MvB und bestätigte Blöcke als nachvollziehbare Folge**. Die Gestaltung muss diese Größen verständlich zusammenführen, ohne aus bloßer Nachbarschaft kausale Beziehungen zu behaupten.

Das wiederkehrende Muster aus Bezugszeile, Datenfeld und Kontext funktioniert auf allen Routen: Kurs/Zeitraum und Bewertung im Markt; Blockspace/Fees und Bestätigung in Blockchain; Rechenleistung/Difficulty und Emission im Mining. Kleine Mono-Zeilen und ausgerichtete Einheiten schaffen technische Glaubwürdigkeit. Die präzise Trennung von Abruf-, Block- und Periodenzeit gehört zur Produktidentität, nicht nur in die Fußnote.

Kupfer erinnert zurückhaltend an Bitcoin, ohne das klassische Orange überall zu wiederholen. Ein optionales kleines Wortmarken-Detail darf aus einem einfachen Block-/Linienmotiv entstehen, muss aber auch einfarbig und ohne Animation funktionieren. Keine neue Bildmarke ist mit diesem Dokument beauftragt. Coins, dekorative Netzgraphen, Neon, Glow und zufällige Gradients bringen keinen Erkenntnisgewinn und werden nicht vorgesehen.

## 10. Entscheidungsmatrix

Bewertung von 1 bis 10. Die Zahlen strukturieren das gestalterische Urteil anhand der beschriebenen Konzepte. Es sind **keine Messwerte, kein Nutzertest und keine objektive Rangfolge**. Insbesondere sind Responsive- und Accessibility-Eigenschaften noch nicht durch visuelle Muster belegt; alle Konzepte erhalten dort denselben vorsichtigen Wert.

| Kriterium                              | Gewicht   | A – Precision Terminal                                                   | B – Editorial Intelligence                                              | C – Digital Asset Observatory                                                           |
| -------------------------------------- | --------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Eigenständigkeit / Wiedererkennbarkeit | 25 %      | **6**: Messraster erkennbar, aber Nähe zu vielen Finanzterminals         | **9**: Kapitelrhythmus und Serif-/Datenkontrast deutlich unterscheidbar | **9**: reale Blockspace-/Blockbeziehungen ergeben eine Bitcoin-spezifische Handschrift  |
| Visuelle Hochwertigkeit                | 20 %      | **8**: präzise Ausrichtung, begrenzte kompositorische Spannung           | **9**: starke Typografie und bewusst ungleiche Gewichte                 | **9**: klare Analyse-/Kontextproportionen und differenzierte Flächen statt Kartenwand   |
| Datenlesbarkeit / Hierarchie           | 20 %      | **9**: simultaner Vergleich und tabellarische Ausrichtung                | **8**: klare Führung, dafür mehr Wege zwischen Belegen                  | **9**: Hauptbild und Kontext unmittelbar zusammen, Rohdaten angeschlossen               |
| Interaktivität / Lebendigkeit          | 15 %      | **7**: schnelle Inspektion, eher statisches Messraster                   | **7**: gute Punktinspektion, Kapitel bleiben überwiegend lesend         | **9**: selektierte Kategorien verbinden Histogramm und Kontext nachvollziehbar          |
| Langfristige Erweiterbarkeit           | 10 %      | **9**: weitere Messreihen leicht integrierbar                            | **7**: wachsende Kapitel brauchen stärkeres kompositorisches Nachführen | **9**: flexible Formen für Snapshots, Verläufe und Tabellen ohne neue Shell             |
| Responsive / Barrierefreiheit          | 10 %      | **8**: Listenfallback gut, hohe Dichte und breite Tabellen anspruchsvoll | **8**: lineare Lesefolge gut, Menü und lange Seiten zu prüfen           | **8**: klare mobile Reihenfolge, verknüpfte Charts brauchen zusätzlichen DOM-/Fokuspfad |
| **Gewichtete Gesamtbewertung**         | **100 %** | **7,65 / 10**                                                            | **8,20 / 10**                                                           | **8,90 / 10**                                                                           |

Formel: `0,25 × Eigenständigkeit + 0,20 × Hochwertigkeit + 0,20 × Lesbarkeit + 0,15 × Interaktivität + 0,10 × Erweiterbarkeit + 0,10 × Responsive/Accessibility`.

Kontrolle: A = `1,50 + 1,60 + 1,80 + 1,05 + 0,90 + 0,80`; B = `2,25 + 1,80 + 1,60 + 1,05 + 0,70 + 0,80`; C = `2,25 + 1,80 + 1,80 + 1,35 + 0,90 + 0,80`.

C führt vor allem durch die Verbindung von Eigenständigkeit und Datenbeziehungen. Wenn gekoppelte Inspektion nicht überzeugend umgesetzt wird und Eigenständigkeit visuell schwächer ausfällt, sinkt C bei jeweils zwei Punkten Abzug in diesen beiden Kriterien auf **8,10** und liegt knapp hinter B. Die Empfehlung hängt damit an überprüfbaren Eigenschaften und darf nicht allein aus der Zahl übernommen werden.

## 11. Begründete Designempfehlung

**C als primäre Richtung auswählen lassen.** Es passt zum Bitcoin-spezifischen Datenkern, ermöglicht eine eigenständige Datenoberfläche und lässt sich ohne neue Architektur in den vorhandenen Stack übertragen. Es macht die derzeit tatsächlich angebundenen Daten stark, während Markt und Mining später in dieselbe Ordnung wachsen können. Sein Mehrwert muss schon mit ruhenden, korrekt beschrifteten Daten sichtbar werden.

Exakt zu übernehmen:

- Aus **A**: tabellarische Zahlenausrichtung, präzise Einheiten, gemeinsame Zeitbasen und sparsame Linien. Keine Seitennavigation, terminalweite Monospace-Schrift oder Maximierung der Dichte.
- Aus **B**: ein führendes Thema pro Seite, unterschiedliche Gewichtung von Hauptanalyse und Kontext, Kapitelabstände statt pauschaler Kartenabstände. Keine Serifentitel, Magazinmargen oder längeren redaktionellen Erzähltexte als Standard.
- Aus **C** unverändert als Leitprinzip: Analysefläche plus direkt zugeordneter Kontext, Datenbeziehungen als Identität, grünlicher Graphit/Kalkweiß mit Kupfer, vier sichtbare Hauptrouten und mobile lineare Transformation.

Das ist eine **Empfehlung zur Freigabe durch den Betreiber**, keine bereits getroffene Produktentscheidung. Weder dieses Dokument noch das Mergen seines PRs sollte als Freigabe produktiver UI-Änderungen interpretiert werden. Vor dem ersten produktiven Designumbau ist die gewählte Richtung ausdrücklich festzuhalten.

## 12. Offene gestalterische Entscheidungen

| Entscheidung                      | Begründeter Vorschlag                                                 | Vor Umsetzung zu entscheiden / zu prüfen                                                                  |
| --------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Art Direction                     | C mit den genau begrenzten Prinzipien aus A/B                         | Betreiber wählt C, A oder B bzw. konkret benannte Anpassungen                                             |
| Schrift                           | Plex Sans + sparsame Plex Mono                                        | Schriftprobe gegen Inter: deutsche lange Labels, Zahlen, Glyphen, Markenassoziation, Dateibudget/Lizenzen |
| Themepräferenz                    | Beide gleichwertig; bestehende gespeicherte Auswahl zunächst erhalten | Dark als derzeitiger Startwert oder Systempräferenz; keine implizite Änderung durch das Konzept           |
| Übersicht bei dünnem Datenbestand | Aktuelle Blockchain-/Blockspace-Daten führen                          | Gewichtung gegenüber Markt-Vorschau durch Betreiber bestätigen; nichts stillschweigend entfernen          |
| Mobile Navigation                 | Sichtbares 2×2-Raster                                                 | Platzbedarf auf 390 px und bei 200 % Textzoom; vollständige Labels und Fokus prüfen                       |
| Chartverknüpfung                  | Zunächst Kategorien innerhalb eines Mempool-Snapshots                 | Bucketsemantik prüfen; keine Kopplung unabhängig abgerufener Werte behaupten                              |
| Blockfolge plus Tabelle           | Fachlicher Einstieg und vollständige tabellarische Details            | Nutzen gegenüber einer alleinigen Tabelle visuell belegen; bei Redundanz die Folge weglassen              |
| Produktname / Zeichen             | „Bitcoin Dashboard“ beibehalten                                       | Eigene Marken-/Namensarbeit nur bei späterem ausdrücklichem Wunsch                                        |

Die Browserprüfung bleibt offen und ist vor endgültiger visueller Abnahme nachzuholen. Zielgruppe und bevorzugte Datendichte wurden nicht durch Nutzerinterviews erhoben; die Konzepte gehen von einem regelmäßig genutzten privaten Analysewerkzeug aus. Die Richtung wird am realen Datenumfang und an tatsächlicher Bedienung überprüft, nicht an einem idealisierten, vollständig befüllten Mockup.

## 13. Umsetzungskonzept für Phase 2.1 bis 2.6

Alle Dateiangaben in diesem Abschnitt sind **Planung**, keine mit Phase 2.0 ausgeführten Änderungen. Neue Module sind Vorschläge innerhalb der vorhandenen React-/ECharts-Struktur. Keine neue Datenquelle, kein API-Vertragswechsel, kein neues UI-Template, keine Access-Änderung und keine neue Produktionsabhängigkeit sind Voraussetzung dieser Schritte.

### 13.1 Phase 2.1 – Art Direction und Designsystem

**Ziel:** Die vom Betreiber gewählte Richtung in überprüfbare visuelle Regeln übersetzen, bevor eine ganze Oberfläche umgebaut wird.

**Dateien/Komponenten:** zunächst Designunterlagen in `docs/`; nach Richtungsfreigabe `src/index.css`, `src/main.tsx`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`; ggf. versionierte Fontassets samt Lizenzen. Die genaue Schriftintegration ist Bestandteil der Entscheidung, keine vorab beschlossene Abhängigkeit.

**Gestaltungsergebnisse:** vollständige semantische Tokens für beide Themes; Typorollen, Zahl-/Einheit-/Datumsformatierung, Abstände, Linien, Radien; Zustandstafel für Default/Hover/Focus/Selection/Disabled/Fehler. Zwei begrenzte visuelle Muster: Analysefeld mit Gebührenkontext und eine Daten-/Statustabelle, jeweils Desktop und Mobil. Keine vollständige Dashboard-Neuimplementierung als versteckte Vorentscheidung.

**Technische Risiken:** Fontmetriken und Ladeverhalten, unvollständige Glyphen, unpassende Akzentkontraste, alte CSS-/Chart-Hardcodierungen. Keine breit gestreuten Utility-Overrides zur Simulation fehlender Tokens.

**Prüfkriterien:** Betreiber bestätigt Richtung und Schriftprobe; gemessene tatsächliche Text-/Controlkontraste in beiden Themes; lange deutsche Labels und alle Datenzustände lesbar; keine unlizenzierte oder extern zur Laufzeit geladene Schrift; Muster funktioniert in statischer Darstellung und mit Reduced Motion. Visuelle Muster bei 1440 × 900 und 390 × 844 ausdrücklich abnehmen.

**Abhängigkeiten:** explizite Produktentscheidung aus Phase 2.0. Die Freigabe des Konzept-PRs allein genügt nicht. 2.2 und 2.3 verwenden die abgenommenen Tokens.

### 13.2 Phase 2.2 – App-Shell, Navigation und Seitenkomposition

**Ziel:** Klare Orientierung und unterschiedliche fachliche Seitenhierarchien mit derselben Shell.

**Dateien/Komponenten:** `src/App.tsx`, `src/components/dashboard.tsx` (`PageHeading`), `src/pages/overview.tsx`, `market.tsx`, `blockchain.tsx`, `mining.tsx`, `src/index.css`, `src/test/app.test.tsx`, `e2e/dashboard.spec.ts`.

**Gestaltungsergebnisse:** neue Breiten/Gutter, fachlicher Seiteneinstieg, vier sichtbare Desktop-Routen, mobiles Navigationsraster, neue Haupt-/Kontextkompositionen. Markt/Mining bekommen eine ehrliche Vorschaukomposition. Quellen- und Projektkontext werden ohne wiederholten Produkt-Eyebrow integriert.

**Technische Risiken:** CSS-Visuallogik gegen DOM-Reihenfolge, Fokusverlust bei Navigation, verschluckte lange Routennamen, zu hohe mobile Shell, Regression bei Deep Links und ErrorBoundary-Reset.

**Prüfkriterien:** jede Route direkt aufrufbar, Reload und Zurück/Vorwärts funktionieren; `aria-current`, Skip-Link, Dokumenttitel und Fokuspfad korrekt; alle bisherigen Bereiche erhalten; kein Seitenüberlauf bei 390 px; 768-px-Übergang ohne abgeschnittene Navigation; 1920 px ohne willkürliche Inhaltsstreckung. Die Shell in beiden Themes visuell prüfen.

**Abhängigkeiten:** 2.1; geplante Inhaltsgruppen aus Abschnitt 7. 2.3 kann nach Stabilisierung der Shell folgen, 2.4 braucht endgültige Containermaße.

### 13.3 Phase 2.3 – Informationskarten und Dashboard-Bausteine

**Ziel:** Datentyp, Relevanz und Datenstatus statt eines universellen Kartenrasters abbilden.

**Dateien/Komponenten:** `src/components/dashboard.tsx` (`MetricCard`, `PlaceholderCard`, `PriceChart`-Rahmen), `src/components/bitcoin-data.tsx` (`DataStatus`, Kennzahlen, `FeeDetails`, `MempoolCard`, `LiveBlocksTable`), lokale UI-Primitives und vier Seiten; Verhaltenstests in `src/test/bitcoin-ui.test.tsx`, `app.test.tsx` und bestehenden Fehlergrenzentests. Mögliche neue Darstellungsbausteine `MetricRow`, `AnalysisSection` und `ResourceStatus` sind lokale Komponenten, kein Architekturwechsel.

**Gestaltungsergebnisse:** offene Messwertzeilen, fachliche Analysegruppen, Gebührenleiter, lesbare Tabelle und kompakte Leerzustände. Statusmodell auf Ressourcenebene mit sichtbaren Einzelabweichungen. Quellen, Abrufzeit, echte Nullwerte, initiale Fehler und zwischengespeicherte Werte bleiben klar unterscheidbar.

**Technische Risiken:** zu starkes Zusammenfassen unterschiedlicher Ressourcen, versteckte Retry-Möglichkeiten, versehentlich unterschiedliche Blocks-Snapshots, falsch verstandene Null-/Leerwerte, Layoutsprünge bei langen Fehlertexten. Keine Änderung an `shared/bitcoin.ts`, Validierung oder Query-Verträgen zur Vereinfachung des Designs.

**Prüfkriterien:** deterministische Fixtures für Erfolg, gültige Null/leer, initiales Laden, initialer Fehler, veraltete Daten, Refresh mit vorhandenen Werten, Refreshfehler, 401/403 und Retry. Fehlerbuttons per Tastatur erreichbar; Tabellenzahlen rechtsbündig; Quelle und erfolgreicher Abruf je Ressource nachvollziehbar. Lange Werte/Texte bei 390 px und Zoom dürfen nicht abgeschnitten werden.

**Abhängigkeiten:** 2.1/2.2; Daten-/Cachelogik bleibt bestehende Basis. 2.4 nutzt diese Container und Zustandszonen.

### 13.4 Phase 2.4 – Datenvisualisierung und Diagrammsystem

**Ziel:** Ein konsistentes, fachlich korrektes Chartvokabular mit gleichwertigen Alternativinformationen schaffen.

**Dateien/Komponenten:** `src/components/demo-chart.tsx`, `src/components/dashboard.tsx` (`PriceChart`), mögliche lokale Token-/Optionsmodule unter `src/lib/` und Diagrammbausteine unter `src/components/`; `src/components/bitcoin-data.tsx` für vorhandenes Mempool-Histogramm/Blockansicht; `src/test/demo-chart.test.tsx`, `chart-load-error.test.tsx`, `error-boundaries.test.tsx`, `e2e/dashboard.spec.ts`. `src/lib/demo.ts` bleibt als bewusst synthetische Fixture erkennbar.

**Gestaltungsergebnisse:** Theme-gerechte Achsen, Tooltip, Legende, Inspektionsmarker; Mempool-Balken aus bestehendem Snapshot nach geklärter Semantik; optionale echte Blockfolge; tabellarische Alternative und Tastatur-/Touchinspektion. Definitionen für spätere Markt-/Mining-Diagramme ohne vorgetäuschte Historie.

**Technische Risiken:** Canvas ist keine zugängliche DOM-Tabelle; Tooltip außerhalb des Viewports; Chart-Neuinitialisierung bei jedem Update; Resizefehler und Ressourcenlecks; überladener Lazy-Chunk; Missinterpretation von Histogramm-Buckets, Einheiten oder Zeitachsen.

**Prüfkriterien:** vorhandene Lebenszyklus-/Fehlergrenzentests erhalten; Themewechsel, Resize und Unmount hinterlassen keine Instanz/Observer; Datenwerte stimmen mit Tabelle überein; Keyboard/Touch funktionieren ohne Hover; Achsen bleiben bei 390 px lesbar; keine interpolierten Marktwerte oder historischen Netzwerkkurven aus Snapshots. Bundle/Lazy Load mit bestehender Buildbasis vergleichen; neue Warnungen begründen, keine zusätzlichen Bibliotheken.

**Abhängigkeiten:** 2.1–2.3 sowie geklärte Histogrammsemantik. Fehlende Marktdaten blockieren die saubere Vorschau nicht und werden nicht in dieser Phase durch neue APIs ersetzt.

### 13.5 Phase 2.5 – Interaktionen und Motion

**Ziel:** Zustandsänderungen verständlich und reaktionsfreudig vermitteln, ohne Dauerbewegung oder fingierte Ereignisse.

**Dateien/Komponenten:** `src/index.css`, UI-Buttons, `src/App.tsx`, `DataStatus` und Tabellen in `bitcoin-data.tsx`, Chartadapter/Inspektionsbereich aus 2.4; ggf. kleine lokale Motion-Präferenzabfrage unter `src/lib/`; bestehende Unit-/E2E-Tests um relevantes Verhalten ergänzen.

**Gestaltungsergebnisse:** Zustandstafel aus Abschnitt 8, reduzierte Bewegungsvariante, lokale Changed-Markierung nach validierten Daten, bewusster Umgang mit neuen Zeilen während aktiver Inspektion, Tooltipfixierung und sichtbare Control-Rückmeldung. Routenüberblendung ist optional und entfällt, wenn sie keinen wahrnehmbaren Nutzen bringt.

**Technische Risiken:** Reload-/Retry-Semantik versehentlich ändern, CSS-Präferenz ohne ECharts-Anbindung, Mehrfachansagen, Race Conditions bei Datenwechseln, Scroll-/Fokusverschiebung, animierte Layoutgrößen. Keine Motion-Bibliothek und keine Polling-Erhöhung nötig.

**Prüfkriterien:** identischer Datenabruf erzeugt keinen Effekt; geänderter Wert nur einmal; neue Blockmarkierung nur bei echtem neuem Hash; Reduced Motion bereits beim Start und bei Präferenzwechsel wirksam; keine Daueranimation, keine verzögerte Interaktion, kein Fokusverlust. Keyboard-/Touchpfad bleibt vollständig. CLS und Interaktionsverhalten an real gerenderter Seite prüfen.

**Abhängigkeiten:** stabile Komponenten und Datendarstellung aus 2.3/2.4. Motion wird erst auf visuell brauchbare statische Zustände gesetzt.

### 13.6 Phase 2.6 – Responsive, Accessibility und visuelle Qualitätssicherung

**Ziel:** Abnahmefähige Qualität über Geräte, Themes, Datenzustände und Eingabemethoden herstellen.

**Dateien/Komponenten:** alle betroffenen UI-/Seitenmodule, `src/index.css`, bestehende Tests und `e2e/dashboard.spec.ts`; ergänzende visuelle Nachweise/Abnahmeprotokoll unter `docs/`. Testinfrastruktur nur soweit nötig erweitern; bestehende Cloudflare-/HTTP-Prüfungen behalten.

**Gestaltungsergebnisse:** geprüfte Umbrüche, Tabellen-/Chartalternativen, Fokusführung, Reduced Motion, Kontrast-/Zustandsnachweise und dokumentierte Betreiberabnahme. Kein bloßer Screenshot des idealen Erfolgsfalls.

**Technische Risiken:** nur Desktop optimieren; Screenshot-Fixtures als vermeintliche Live-Daten ausgeben; Fokus hinter Sticky-Elementen; min-width-/Canvas-Overflow; Textzoom-Clip; Access-/Routing-Regression durch unnötige Hostingänderungen.

**Prüfmatrix und konkrete Abnahmekriterien:**

| Prüfdimension        | Mindestumfang                                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visuelle Basismatrix | Vier Routen × vier Viewports (1440 × 900, 1920 × 1080, 768 × 1024, 390 × 844) × beide Themes = **32 Ansichten** mit kontrollierten, klar bezeichneten Daten                                                          |
| Datenzustände        | Angebundene Bereiche auf Desktop und Mobil: Laden, Erfolg inkl. gültig leer/Null, Initialfehler, veralteter Snapshot, Refresh, Refreshfehler; Markt/Mining mit Vorschau-/Nicht-verbunden-Zuständen                   |
| Komponentenfehler    | Chart-, View- und globaler Fallback in beiden Themes und mindestens Desktop/Mobil; Recovery und erhaltene Navigation nach jeweiligem Scope                                                                           |
| Eingabe              | Vollständiger Keyboarddurchlauf inkl. Skip-Link, Navigation, Theme, Chartinspektion, Wertetabelle, Retry/Reload; Touch-Auswahl ohne Hoverpflicht                                                                     |
| Zugänglichkeit       | Tatsächliche Kontraste aller Zustände, sinnvolle Namen/Überschriften, Screenreader-Stichprobe mit NVDA/Edge, keine ausschließlich farbliche Codierung, Fokus nicht verdeckt                                          |
| Reflow / Zoom        | Zusätzlich 320 CSS-px, 200 % Textvergrößerung und 400 % Browserzoom an geeignetem Desktop-Ausgangsviewport; kein Inhaltsverlust. Echte zweidimensionale Tabellen ggf. lokal scrollbar mit erreichbaren Informationen |
| Bewegung             | `prefers-reduced-motion` an/aus, unveränderte und geänderte Fixtures, keine fiktiven Ereignisse, keine Fokus-/Scrollsprünge                                                                                          |
| Laufzeit             | Chart-Resize, Themewechsel, Refresh und Rücknavigation ohne neue Consolefehler, Leaks oder Seitenüberlauf; Lade-/Update-Layout anhand Messung prüfen                                                                 |
| Technische Gates     | `lint`, `format:check`, `typecheck`, `test`, `build`, `pages:check`, `test:e2e` nach README; bestehenden Pages-/Asset-/HTTP- und API-Vertragsumfang bewahren                                                         |

**Visuelle Betreiberabnahme:** nach 2.1 zunächst die Art-Direction-Muster, nach 2.6 mindestens Übersicht und Blockchain in 1440 × 900 und 390 × 844 in beiden Themes gemeinsam beurteilen. Markt und Mining auch mit ihrem realen unvollständigen Datenbestand abnehmen. Die vollständigen 32 Ansichten und Zustandsnachweise gehören zum Abnahmeprotokoll; offene Fehler erhalten konkrete Nacharbeit statt stiller Akzeptanz. Keine Freigabe allein aus grünen Funktionstests ableiten.

**Abhängigkeiten:** 2.1–2.5. Responsive und Accessibility beginnen bereits in 2.1 und werden hier abgeschlossen. Cloudflare Access bleibt extern verwaltet und unverändert; für eine spätere Veröffentlichung gilt weiterhin die separate [Pages-/Access-Verifikation](cloudflare-pages-verification.md). Phase 2.0 nimmt weder ein Deployment noch diese Freigabe vorweg.

## 14. Referenzen und Entscheidungsgrundlagen

Die Entwürfe sind eigenständige gestalterische Vorschläge, keine Kopien eines Templates. Die externen Quellen stützen technische Eigenschaften und Prüfkriterien, nicht die numerische Designbewertung. Abrufdatum: 30. Oktober 2026.

- [W3C: Textkontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [Nichttextkontrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) und [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): Grundlage für Kontrast-/Bedienziele. Die hier gewählten größeren Touchziele sind ein Produktstandard.
- [Inter vom Gestalter](https://rsms.me/inter/): Fontkandidat mit tabellarischen Ziffern; die bestehende Nutzung ist ein brauchbarer Vergleichsmaßstab, keine gestalterische Bindung.
- [IBM Plex, offizielles Repository](https://github.com/IBM/plex): Kandidaten für zusammenpassende Sans-/Mono-Rollen in A/C; konkrete Assets und Lizenzbeilage in 2.1 prüfen.
- [Newsreader, Production Type](https://github.com/productiontype/Newsreader) und [Source Serif, Adobe](https://github.com/adobe-fonts/source-serif): konkrete Serifenkandidaten für B, vor Auswahl am deutschen Datenkontext erproben.
- [Apache ECharts: ARIA und Muster](https://echarts.apache.org/handbook/en/best-practices/aria/): ergänzende Chartbeschreibungen; kein Ersatz für DOM-Bedienpfad und Datenalternativen.
- [README](../README.md), [Datenmodelle](../shared/bitcoin.ts), [Query-/Formatlogik](../src/lib/bitcoin.ts), [UI-E2E](../e2e/dashboard.spec.ts) und [Pages-E2E](../e2e/pages.spec.ts): Repository-Evidenz für Datenumfang, Abruf-/Zeitsemantik und technische Regressionserhaltung.
