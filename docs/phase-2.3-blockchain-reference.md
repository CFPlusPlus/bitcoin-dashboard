# Phase 2.3 – Blockchain als Bitcoin-Analytical-Referenzseite

30. Oktober 2026 · `CFPlusPlus/bitcoin-dashboard` · Basis
    `34151e2b9f58cb34004546482ea8514ad53f93ba` · Branch
    `feature/phase-2.3-blockchain-reference`.

Die produktive React-Seite ersetzt das bisherige KPI-Kartenraster durch die
freigegebene Komposition **B · Bitcoin Analytical**. Die bestehenden anderen
Fachseiten, API-Verträge, Cloudflare-Access-Konfiguration und Error Boundaries
bleiben erhalten. Die visuelle Begutachtung durch den Betreiber bleibt eine
eigene Abnahme; bestandene Tests ersetzen sie nicht.

## 1. Seitenkomposition

Die obere, zusammenhängende Analysefläche besitzt links eine Netzwerkspalte
und rechts die breite Mempool-Analyse, getrennt durch eine dünne Linie.
Netzwerkfläche, Analyse und Inspektion verwenden die semantischen Flächen-
und Datenfarben aus Phase 2.2, ohne neue Farbwerte oder Tokens.

Die linke Spalte misst regulär 280 px, bis 1200 px 252 px und bis 900 px
232 px. Unter 700 px steht der Mempool vor dem Netzwerk. Der untere Bereich
ordnet Gebühren und Blöcke auf denselben Spaltenachsen an; bis 900 px folgen
sie untereinander. Mobil lautet die vollständige Reihenfolge: Mempool,
Netzwerk, Gebühren, Blocktabelle mit Details, Methodik.

Die Tabelle behält auch mobil Größe und Gewicht. Ihr eigener, fokussierbarer
Scrollbereich verhindert horizontalen Seitenüberlauf. Bei großen Zahlen oder
vergrößerter Schrift kann auch das Histogramm innerhalb seiner Fläche scrollen.
Hauptzahlen und lange Hashes dürfen umbrechen. Die bestehenden lokalen
Manrope-/Inter-Schriften und Typografietokens gelten weiterhin.

## 2. Komponentenstruktur

[`src/pages/blockchain.tsx`](../src/pages/blockchain.tsx) komponiert die Seite
und besitzt genau einen Query-Observer pro benötigter Ressource.

| Datei unter `src/components/blockchain/` | Aufgabe                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `mempool-analysis.tsx`                   | Hauptkennzahl, Begleitwerte und unabhängiger Mempool-Status                                            |
| `fee-histogram.tsx`                      | Kategorische Balken, Hover/Fokus, fixierte Auswahl, Inspektionsstreifen und native Bereichsauswahl     |
| `network-status.tsx`                     | Höhe, jüngster Block, Größe, Gewicht, tatsächliche Gewichtsauslastung und nicht angebundene Kennzahlen |
| `fee-recommendations.tsx`                | Fünf Empfehlungen mit datenabhängiger Skalierung                                                       |
| `recent-blocks.tsx`                      | Auswählbare Tabelle, Blockdetails und separater Explorer-Link                                          |
| `resource-status.tsx`                    | Herkunft, erfolgreicher Abruf, Lade-/Refresh-/Stale-/Fehlerzustand und Wiederholung                    |

[`blockchain-analysis.ts`](../src/lib/blockchain-analysis.ts) enthält die pure
Aggregation und Skalierung; [`blockchain-resource.ts`](../src/lib/blockchain-resource.ts)
die Statusableitung. [`blockchain.css`](../src/styles/blockchain.css) definiert
die Komposition. Die bisherige `bitcoin-data.tsx` bleibt für andere Seiten
unverändert verfügbar.

Das Histogramm besteht aus React, nativen Buttons und CSS. Sieben diskrete
Kategorien benötigen hier weder Canvas noch eine zusätzliche Chartbibliothek:
Beschriftungen, Fokus, Touch und `aria-pressed` arbeiten direkt auf denselben
Elementen wie die Balken. Es entsteht kein zweiter Chart-Engine-Wrapper.
Die vorhandene ECharts-Integration anderer Seiten bleibt unverändert.
Aggregation wird anhand der Eingabereferenz memoisiert, nicht bei jedem Hover
erneut berechnet. Die Darstellung animiert keine Datenübergänge.

## 3. Datenquellen und Ressourcenzuordnung

Alle Daten kommen weiterhin aus den validierten same-origin Endpunkten und
TanStack Query mit den vorhandenen Retry-, Polling-, Cache- und Access-Regeln.
Es gibt weder neue externe Datenquellen noch synthetische Produktionsdaten.

| Ressource              | Verwendung                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `/api/bitcoin/height`  | Blockhöhe mit eigenem `updatedAt`                                                    |
| `/api/bitcoin/blocks`  | Jüngster Block in der Netzwerkspalte sowie Tabelle und Details aus derselben Antwort |
| `/api/bitcoin/fees`    | `fastest`, `halfHour`, `hour`, `economy`, `minimum`                                  |
| `/api/bitcoin/mempool` | Transaktionen, virtuelle Größe, Gesamtgebühren und Rate-/Volumen-Paare               |

`latest-block` wird nicht zusätzlich abgefragt. Vier Ressourcen ergeben vier
Initialabrufe, auch wenn die Blockdaten in zwei Bereichen erscheinen.
`updatedAt` ist der erfolgreiche Ressourcenabruf, nicht der Blockzeitstempel.
Beide werden getrennt beschriftet. Datumsangaben verwenden die lokale
Browserzeitzone; die Bildtests legen `Europe/Berlin` ausdrücklich fest.

Die Gewichtsauslastung lautet `weightUnits / 4_000_000 * 100`. Beispielsweise
ergeben 3.000.000 WU genau 75 %, unabhängig von `sizeBytes`. MWU und MB
werden durch 1.000.000 umgerechnet. Exakte Byte-/WU-Werte bleiben im Detail
sichtbar, auch wenn Netzwerk und Tabelle gerundete Einheiten zeigen.
Blockzeit und TX/s bleiben ausdrücklich als „nicht angebunden“ gekennzeichnet.

## 4. Histogramm-Aggregation

Die produktive API liefert Punkte aus Gebührenrate und bereits aggregiertem
Volumen. Daraus kann weder eine kontinuierliche Dichte noch eine Zeitreihe
rekonstruiert werden. Jeder Punkt wird **einmal und vollständig** seinem
Gebührenbereich zugeordnet; es wird kein Volumen zwischen Bereichen
interpoliert oder aus der Mempool-Gesamtgröße ergänzt.

| ID       | Gebührenintervall in sat/vB |
| -------- | --------------------------- |
| `fee-0`  | [0, 1)                      |
| `fee-1`  | [1, 2)                      |
| `fee-2`  | [2, 4)                      |
| `fee-4`  | [4, 8)                      |
| `fee-8`  | [8, 16)                     |
| `fee-16` | [16, 32)                    |
| `fee-32` | [32, ∞)                     |

Die Grenzen unterscheiden Sub-sat/vB und niedrige Raten präzise; darüber
erfassen verdoppelte Grenzen ein breites Spektrum, ohne viele schmale Balken
zu benötigen. Der offene letzte Bereich verliert auch extreme gültige Raten
nicht. Die Struktur bleibt zwischen Aktualisierungen stabil. Die gleichen
kategorischen Breiten bedeuten ausdrücklich **keine** gleich großen
Gebührenintervalle. Die Balkenhöhe zeigt das Volumen in MvB.

Unsortierte Einträge und mehrere Einträge derselben Rate werden addiert;
jeder Eingabeeintrag zählt genau einmal. vB sind nichtnegative, sichere ganze
Zahlen im bestehenden Vertrag. Intern werden sie als `bigint` summiert, damit
auch 10.000 maximal große gültige Einzelvolumen ihre exakte Summe behalten.
Nur für Balkenhöhen, MvB und Prozentdarstellung erfolgt eine Umwandlung nach
`number`; die Inspektion zeigt zusätzlich die vollständige exakte vB-Summe.
Die Achse erhält eine adaptive 1/2/5-Schrittweite und umfasst das Maximum.
Positive Balkenwerte unter 0,01 MvB sind entsprechend beschriftet, exakte Werte
stehen in Inspektion, Auswahlfeld und zugänglichem Balkennamen. Überlange
Balkenlabels werden innerhalb ihrer Kategorie gekürzt, statt Nachbarwerte
zu überdecken.

Defensives Verhalten außerhalb des bereits validierten Vertrags: Ungültige
Volumenwerte werden gezählt und sichtbar ausgeschlossen. Gültiges Volumen
mit nicht zuordenbarer Rate erhält eine ausdrücklich unbekannte Kategorie.
Im produktiven Datenfluss weist der vorhandene Validator solche Antworten
bereits zurück. Ein leeres oder vollständig volumenloses Histogramm zeichnet
keine Balken; es wird nicht mit einem leeren Mempool gleichgesetzt.

Anteile beziehen sich immer auf die **Histogrammsumme**. Diese muss laut
vorhandenem Vertrag nicht `virtualSizeBytes` entsprechen. Bei einer Differenz
zeigt die Anwendung beide Summen und erklärt die Bezugsgröße. Es gibt weder
stille Normalisierung auf 100 % des Mempools noch synthetische Restbalken.

## 5. Interaktionen

- Hover und Tastaturfokus zeigen eine Vorschau. `aria-pressed` und die fixierte
  Kategorie bleiben unverändert; die Vorschau nennt die bestehende Fixierung.
  Nach Verlassen gilt wieder der fixierte Bereich beziehungsweise die Summe.
- Klick, Touch, Enter und Leertaste fixieren einen Bereich. Pfeile wechseln
  den Fokus, Home/End springen zu erster/letzter Kategorie. Escape oder
  „Auswahl lösen“ setzen auf die Histogrammsumme zurück. Das native Select
  bietet dieselben Kategorien und exakten Werte ohne präzises Treffen.
- Bei Refresh wird die Kategorie anhand ihrer stabilen ID gesucht. Neue
  Volumenwerte erscheinen in der bestehenden Auswahl. Verschwindet die
  Kategorie, etwa bei leerem Histogramm, wird sie mit sichtbarer Mitteilung
  gelöst. Eine spätere Rückkehr reaktiviert sie nicht unbemerkt.
- Tabellenzeilen reagieren auf Klick/Touch, ihre nativen Höhen-Buttons auf
  Tab, Enter und Leertaste. Der vollständige Hash identifiziert die Auswahl
  über neue Antworten hinweg. Verlässt er die Liste, folgt ein erklärter
  Fallback auf den jüngsten verfügbaren Block. Ohne Daten entfällt das Detail.
- Der Explorer-Link steht ausschließlich im Detail und bleibt ein gewöhnlicher
  externer Link. Die Zeilenauswahl navigiert nicht.

Die Gebührenbalken skalieren gegen das tatsächliche Maximum der fünf Werte,
auch bei ungewöhnlicher Prioritätsreihenfolge. Identische Empfehlungen
erhalten identische Balken, null ergibt null Breite. Beschriftungen behaupten
keine garantierten Bestätigungszeiten. Es gibt keine Datenanimation;
reduzierte Bewegung und die Fokusrollen des Designsystems bleiben wirksam.

## 6. Lade-, Fehler- und Stale-Zustände

Initial erscheinen Gedankenstriche und ein Ladehinweis, ohne erfundenen
Abrufzeitpunkt. Erfolgreiche Antworten zeigen Quelle und eigenes `updatedAt`.
Hintergrundabrufe behalten die Daten sichtbar und ergänzen einen Status.
Query-Staleness, Refreshfehler oder ein mehr als 60 Sekunden zurückliegender
Antwortzeitpunkt führen zur Kennzeichnung „Veraltete Daten“. Die Prüfung
erfolgt bei den durch Query- und Interaktionsupdates ausgelösten Renderings.
Der neutrale Badge „Abruf“ behauptet keine Live-Verbindung.

Nach einem Refreshfehler bleibt die letzte erfolgreiche Antwort einschließlich
Zeitpunkt und Auswahl erhalten. Der betroffene Bereich bietet Retry und
vollständiges Neuladen zur möglichen erneuten Anmeldung. Die bestehenden
Meldungen unterscheiden unter anderem verweigerten Zugriff, Netzwerkprobleme
und ungültige API-Antworten. Ohne vorherigen Erfolg gibt es einen klaren
Fehlend-Zustand. Ein Mempool-Ausfall blockiert weder Gebühren noch Blöcke.

Leere Blocklisten können defensiv gerendert werden; eine leere Antwort der
produktiven Blocks-API bleibt gemäß bestehendem Vertrag ungültig und führt
zum Fehler-/Stale-Pfad. Dieser Vertrag wurde nicht gelockert.

## 7. Visueller Vergleich mit dem finalen Prototyp

Die unten verlinkten **React-Screenshots** wurden tatsächlich geöffnet und
mit [Desktop Dark](../design/prototypes/screenshots/final/analytical-1440x900-dark.png),
[Desktop Light](../design/prototypes/screenshots/final/analytical-1440x900-light.png),
[Mobil Dark](../design/prototypes/screenshots/final/analytical-390x844-dark-full.png)
und [Mobil Light](../design/prototypes/screenshots/final/analytical-390x844-light.png)
verglichen. Die Prototypdateien wurden nicht zur Produktion umgebaut oder
als Ergebnisbilder ausgegeben.

Übereinstimmungen: gemeinsame obere Fläche, linke Netzwerkachse, dominante
Mempool-Zahl, Begleitwerte rechts beziehungsweise mobil darunter, diskrete
blaue Balken, dezenter Inspektionsstreifen, offene Gebührenliste und
auswählbare Tabellenzeilen. Manrope, Inter, Graphit/Weiß, Orange und
Flächenkontraste stammen aus den bestehenden Analytical-Tokens.

Gemessene React-Geometrie bei 1440 px: Inhaltsbeginn bei y ≈ 235,7 px,
Netzwerkbreite 280 px, Analysebeginn x = 329 px. Damit stimmen Einstieg und
Spaltenachse mit der Referenz überein. Mobil beginnt die Fläche bei y ≈ 279,6
statt rund 270 px, die Inspektion bei rund 784 statt 768 px. Die vollständige
390-px-Seite misst in BC-23 3467 px gegenüber 3382 px im Prototyp. Die
Testläufe schreiben zusätzlich Geometrie-JSON nach `test-results/blockchain/`.

| Sichtbarer Unterschied                                                                                       | Ursache / Entscheidung                                                                                                      |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Produktname „dashboard“, vollständiges „Netzwerk & Mining“ und etwas tieferer mobiler Einstieg               | Bestehende Phase-2.2-Shell und vollständige Navigation erhalten                                                             |
| Bereiche 0–1, 1–2, 2–4, 4–8, 8–16, 16–32, ≥32                                                                | Dokumentierte Aggregation der echten Rate-/Volumen-Paare statt synthetischer Prototypintervalle                             |
| Anteil am Histogramm statt ungeprüft am gesamten Mempool                                                     | API garantiert keine übereinstimmenden Summen                                                                               |
| „Abruf“ und vollständige Ressourcendaten statt globaler Snapshot-Uhrzeit                                     | Keine vorgetäuschte Synchronität oder Live-Garantie                                                                         |
| Obere Desktopfläche etwa 691 statt 599 px hoch; unterer Bereich beginnt entsprechend später                  | Direkte Bereichsauswahl auch am Desktop, sichtbarer Löse-Button, separate Bedienhilfe und vollständiger Quellenzeitpunkt    |
| Netzwerk zeigt zusätzlich den Blockzeitpunkt; Detail zeigt Datum, Unix-Wert und exakte Einheiten             | Blockentstehung und Datenabruf unterscheiden und reale Modelldetails vollständig erhalten                                   |
| Gebührenwerte etwas kleiner und flexibel umbrechend                                                          | Auch dezimale Empfehlungen und längere tatsächliche Werte passen in die schmale Spalte                                      |
| Tabelle mit vollständigem Datum und stets verfügbarem Gewicht, sechs BC-23-Blöcken statt fünf OBS-01-Blöcken | Echte Modellfelder, eindeutige Zeitangaben und anderer ausdrücklich synthetischer Testdatensatz; mobil horizontal scrollbar |
| Methodik kompakter, keine Prototyp-Prüfwerkzeuge oder Palettenumschaltung                                    | Produktive Fachseite ohne isolierte Designwerkzeuge                                                                         |

Nach der ersten visuellen Runde wurden der zu breite mobile Badge und eine
zu großzügige Diagrammskala korrigiert. Der abschließende Vergleich umfasst
beide Themes, vollständige Ansichten, Tablet, 320/1920 px und den Stale-Fall.
Die Abweichungen oben bleiben bewusst sichtbar und sind keine behauptete
pixelgenaue Gleichheit mit synthetischen Beispielen.

## 8. Screenshots und Reproduktion

Alle 15 PNGs stammen aus dem gebauten produktiven React-Code, ausgeliefert
durch den bestehenden Wrangler-Pages-Testserver. **BC-23 ist eine ausschließlich
in `e2e/blockchain.spec.ts` definierte synthetische Testfixture.** Der Test
interzeptiert same-origin API-Antworten, kontrolliert die Uhr und kennzeichnet
die Bilder über eine vom Test gesetzte Quellenannotation ausdrücklich als
Testfixture. Es gibt keinen Produktionsschalter für diese Daten. Im Normalfall
sind die Ressourcenzeitpunkte verschieden; nach simuliertem Refreshfehler
behält nur der Mempool den alten Abruf. Schriftladung wird abgewartet.

| Ansicht            | Dark                                                                                                                                    | Light                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop 1440 × 900 | [Viewport](screenshots/phase-2.3/blockchain-1440x900-dark.png) · [vollständig](screenshots/phase-2.3/blockchain-1440x900-dark-full.png) | [Viewport](screenshots/phase-2.3/blockchain-1440x900-light.png) · [vollständig](screenshots/phase-2.3/blockchain-1440x900-light-full.png) |
| Mobile 390 × 844   | [Viewport](screenshots/phase-2.3/blockchain-390x844-dark.png) · [vollständig](screenshots/phase-2.3/blockchain-390x844-dark-full.png)   | [Viewport](screenshots/phase-2.3/blockchain-390x844-light.png) · [vollständig](screenshots/phase-2.3/blockchain-390x844-light-full.png)   |
| Tablet 768 × 1024  | [Ansicht](screenshots/phase-2.3/blockchain-768x1024-dark.png)                                                                           | [Ansicht](screenshots/phase-2.3/blockchain-768x1024-light.png)                                                                            |
| Schmal 320 × 844   | [Ansicht](screenshots/phase-2.3/blockchain-320x844-dark.png)                                                                            | [Ansicht](screenshots/phase-2.3/blockchain-320x844-light.png)                                                                             |
| Breit 1920 × 1080  | [Ansicht](screenshots/phase-2.3/blockchain-1920x1080-dark.png)                                                                          | [Ansicht](screenshots/phase-2.3/blockchain-1920x1080-light.png)                                                                           |

[Mempool mit Stale-Daten nach Refreshfehler, vollständige Desktopansicht](screenshots/phase-2.3/blockchain-stale-dark-full.png).

Reproduktion mit der in `.nvmrc` festgelegten Node-Version und npm aus
`packageManager`: `npm ci`, `npm run build`, `npm run test:e2e`.
Die neuen Aufnahmen entstehen in `test-results/blockchain/`. Anschließend:

```powershell
Copy-Item -Path test-results/blockchain/*.png -Destination docs/screenshots/phase-2.3
```

## 9. Verifikation

Abschließend erfolgreich unter **Node 22.22.2 / npm 10.9.7**:

| Prüfung                | Ergebnis                                                 |
| ---------------------- | -------------------------------------------------------- |
| `npm ci`               | 300 Pakete sauber installiert                            |
| `npm run lint`         | Erfolgreich, keine Warnungen                             |
| `npm run format:check` | Erfolgreich                                              |
| `npm run typecheck`    | Frontend, Functions, Functions-Tests und E2E erfolgreich |
| `npm test`             | 238 Tests in 13 Dateien erfolgreich; 31 neue Prüfungen   |
| `npm run build`        | Vite-Produktionsbuild erfolgreich                        |
| `npm run pages:check`  | Cloudflare-Functions erfolgreich kompiliert              |
| `npm run test:e2e`     | 55 Chromium-Tests erfolgreich; 14 neue Prüfungen         |

Die neuen Unit-/Komponententests prüfen Grenzen, Bruchteile, offenen Endbereich,
Reihenfolge, doppelte Raten, exakte Volumenerhaltung über den sicheren
Number-Bereich hinaus, ungültige Werte, leere Histogramme, Skalierung,
Ressourcenalter, getrennte Zeitpunkte, tatsächliche WU-Auslastung,
Hover/Fokus/Fixierung, Tastatur, Datenwechsel, Blockauswahl, Fallback sowie
Laden, Erstfehler, Stale-Erhaltung und Retry. Bestehende Tests wurden nicht
verändert oder abgeschwächt.

Die neuen Browserprüfungen umfassen zehn Theme-/Größenkombinationen, echte
sichtbare Balken, vier Initialabrufe, Reihenfolge und Seitenüberlauf,
Tastatur/Hover, Polling mit stabiler Auswahl, leeres Histogramm nach Refresh,
Block-Rollover, Stale-Daten, Wiederholung, Touch und 200 % Schrift bei 320 px.
Der bestehende Pages-/Shell-Aufbau prüft weiterhin alle vier Routen,
Authentifizierungsfehler, Deep Links, Themes, Fonts und Kontraste. Wrangler
und Chromium wurden wegen ihrer lokalen Laufzeit-/Logzugriffe außerhalb
der Dateisandbox ausgeführt; die Prüfungen selbst bleiben unverändert.

## 10. Offene Details für Folgephasen

- Betreiberbegutachtung der produktiven Komposition und der zusätzlichen
  Desktop-Bereichsauswahl; die dokumentierte Mehrhöhe ist bewusst prüfbar.
- Die offene obere Gebührenkategorie ist eine robuste Referenz. Eine feinere
  Aufteilung bei dauerhaft sehr hohen Raten wäre eine spätere, ausdrücklich
  zu dokumentierende Methodenänderung mit neuen Auswahl-IDs.
- Bei sehr schmalen Ansichten beziehungsweise großer Schrift bleibt die
  vollständige Blocktabelle lokal scrollbar. Eine zusätzliche mobile
  Kurzansicht wäre eine eigene Gestaltungsentscheidung.
- Visuelle Prüfung und Browserautomatisierung betreffen Chromium. Firefox,
  Safari und Screenreader wurden nicht zusätzlich manuell abgenommen.
- Markt, Übersicht und Mining erhalten ihre fachliche Neugestaltung in
  späteren Phasen. Blockzeit und Durchsatz bleiben bis zur tatsächlichen
  Datenanbindung fehlend.
