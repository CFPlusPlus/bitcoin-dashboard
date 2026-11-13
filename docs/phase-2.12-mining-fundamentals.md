# Phase 2.12 – Mining-Kennzahlen, Halving und Bitcoin-Angebot

Stand: 13. November 2026 (Europe/Berlin). Ausgangspunkt: nach `git fetch origin main`
aktueller `origin/main`-Commit `e785b64` (Merge von Phase 2.11).
Branch: `feature/phase-2.12-mining-fundamentals`.

## Ausgangszustand und Architekturentscheidung

Die Mining-Seite enthielt die funktionierende Difficulty-Anpassungsprognose,
fünf KPI-Platzhalter und vier Analyse-Platzhalter. Untersucht wurden Mining,
Übersicht/Netzwerkkarten, Bitcoin-/Hashrate-Queries, normalisierte Verträge,
serverseitige mempool-Adapter, Ressourcenstatus, Design-Tokens, Grid, vorhandene
Tests, README und Deploymentkonventionen.

Die bestehende Prognose liefert nur Änderungsprozent und Epochenkontext, keinen
aktuellen Difficulty-Wert. Die bereits abgerufene Blockliste enthält dagegen
`difficulty` und `height` pro Block. Daher wird lediglich das bisher verworfene
Difficulty-Feld in den bestehenden `Block`-Vertrag übernommen und auf beiden
Seiten der API-Grenze validiert. Es entsteht kein neuer Endpunkt.

Mining verwendet `useBitcoin('blocks')`, das auch die Übersicht und die Blockchain
für ihre Blocktabellen nutzen. Der erste Eintrag liefert gleichzeitig Difficulty
und die Höhe für alle neuen deterministischen Kennzahlen. Eine zusätzliche
`height`- oder `latest-block`-Abfrage wäre hier redundant. Die eigenständige
Difficulty-Prognose behält ihre bisherige Datenquelle und kann einen anderen
Abrufzeitpunkt haben; sie wird nicht zur Angebotsberechnung herangezogen.

## Neue Kennzahlen und ersetzte Platzhalter

| Bisheriger Platzhalter  | Implementierung                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Hashrate                | Bestehende `HashrateCard`, EH/s mit genau zwei Nachkommastellen, Schätzung über 1.008 Blöcke                  |
| Difficulty              | Tatsächliche Difficulty des letzten Blocks / 10¹², in T, bis zu zwei Nachkommastellen                         |
| Bitcoin-Angebot         | Subventionsmodell einschließlich Genesis, in der KPI auf ganze BTC gerundet                                   |
| Inflationsrate          | Geschätzte Angebotsinflation des nächsten Modelljahrs, bis zu drei Nachkommastellen                           |
| Nächstes Halving        | Dynamisch verbleibende Blockintervalle und nächste Zielhöhe                                                   |
| Halving-Analyse         | Höhe, Zyklus, letzte/nächste Grenze, Restblöcke, Fortschritt, aktuelle/nächste Subvention                     |
| Bitcoin-Angebotsanalyse | Genauer Modellbestand, Restangebot, exaktes Maximum, Fortschritt, Subvention, jährliche Neuemission/Inflation |

Die vorhandene Anpassungsprognose bleibt in Inhalt und Implementierung unverändert.
Hashrate/Difficulty-Historie und Mining-Pools bleiben deutlich als Platzhalter für
Phase 2.13 beschriftet. Alle Zahlen verwenden `de-DE`.

## Wiederverwendete Datenquellen und Difficulty-Methodik

| Daten                        | Same-Origin-Route / Query-Key                                                | Öffentliche Quelle                                         |
| ---------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Hashrate                     | `/api/mining/hashrate`, `['mining', 'hashrate']`                             | mempool.space `/api/v1/mining/hashrate/1m`, unverändert    |
| Höhe und aktuelle Difficulty | `/api/bitcoin/blocks`, `['bitcoin', 'blocks']`                               | mempool.space `/api/blocks`, erster Eintrag                |
| Anpassungsprognose           | `/api/bitcoin/difficulty-adjustment`, `['bitcoin', 'difficulty-adjustment']` | mempool.space `/api/v1/difficulty-adjustment`, unverändert |

`difficulty` ist ein dimensionsloses Verhältnis, keine prognostizierte Änderung.
Zulässig sind endliche numerische Werte von 1 bis zur großzügigen technischen
Obergrenze 2²⁵⁶; Strings, fehlende Werte, null, negative Werte und Überläufe werden
verworfen. Es findet keine Rekonstruktion aus Hashrate oder Prognosewerten statt.
Der Providerwert wird lediglich für die Darstellung in T skaliert und gerundet.
Der Blockvertrag bleibt hinsichtlich seiner bisherigen numerischen Höhenlimits
unverändert. Auch `latest-block` erhält durch denselben Parser das Difficulty-Feld.

Primärreferenzen: [mempool.space REST API](https://mempool.space/docs/api/rest),
[Blockantwort](https://mempool.space/api/blocks) und
[Prognosevertrag im mempool-Quellcode](https://github.com/mempool/mempool/blob/master/backend/src/api/difficulty-adjustment.ts).
Eine öffentliche Blockantwort wurde am 13. November 2026 zusätzlich lesend auf das
vorhandene Difficulty-Feld geprüft. Dieser Abruf ist kein Test des geschützten
produktiven Dashboards. Reproduzierbare Tests und Screenshots verwenden ausschließlich Fixtures.

## Bitcoin-Angebot und exakte Subventionsregeln

Die reinen Funktionen liegen in `shared/bitcoin-supply.ts`; sie benötigen weder
React-Zustand noch Query-Client, Netzwerk oder Uhrzeit. `halvingAt()` wird von
`src/lib/overview.ts` aus derselben Implementierung reexportiert. Der bisherige
Vertrag einschließlich numerischer `subsidySats` bleibt für die Übersicht erhalten.

Für Höhe h gilt mit c = floor(h / 210.000):

```text
Subvention(h) = 5.000.000.000 sat >> c  (für c < 64)
             = 0 sat                 (für c >= 64)
Angebot(h)   = Summe der Subventionen für alle Höhen 0 bis h einschließlich
```

Rechtsverschiebung von `bigint` halbiert mit Abrundung auf ganze Satoshis.
Schon ab Zyklusindex 33, Höhe 6.930.000, ist die Subvention null; der Schutz ab
64 entspricht Bitcoin Core. Höhe 6.929.999 erhält den letzten einzelnen Satoshi.
Die Summe arbeitet über Subventionsintervalle statt über einzelne Blöcke und endet
bei der Nullsubvention. Auch große gültige Höhen bleiben dadurch günstig berechenbar.

Die schon bestehende `halvingAt()`-Höhenbegrenzung bleibt 0 bis 2.147.483.647
(ganze Zahlen). Für negative, gebrochene, nicht endliche oder größere Werte werfen
die mathematischen Funktionen einen Fehler. Da der allgemeine Block-API-Vertrag
weiterhin sichere JavaScript-Ganzzahlen erlaubt, behandelt Mining einen Snapshot
oberhalb des Modellbereichs lokal mit Warnung und leeren Modellwerten. Hashrate und
aktuelle Difficulty bleiben dabei nutzbar. Das ist ebenfalls getestet.

Es gibt bei Höhe h insgesamt h + 1 Blöcke einschließlich Genesis. Dessen
50 BTC werden im gewählten **Subventionsmodell mitgezählt**, sind aber nicht
ausgebbar. Diese Besonderheit steht in der UI. Das Modell nimmt vollständige
Subventionsansprüche an; tatsächliche Unterbeanspruchung, verlorene Schlüssel,
verbrannte Ausgaben und andere Abweichungen werden nicht ermittelt. Gebühren sind
keine neue Subvention. Der berechnete Wert wird deshalb nicht unqualifiziert als
exakter zirkulierender oder verfügbarer Bestand bezeichnet.

Das aus allen ganzzahligen Intervallen berechnete langfristige Maximum beträgt
**2.099.999.997.690.000 sat = 20.999.999,9769 BTC**, einschließlich Genesis.
21 Millionen BTC ist ein gerundeter Referenzwert. Ohne Genesis wären es
20.999.949,9769 BTC; auch dieser Wert wäre noch kein tatsächlich verfügbarer Bestand.
Restangebot und Fortschritt verwenden konsequent dasselbe Maximum einschließlich
Genesis wie der Modellbestand. Geldmengen bleiben intern `bigint`; erst an der
Darstellungsgrenze werden BTC und Prozentverhältnisse als `number` formatiert.
Die Satoshi-Gesamtsumme liegt unter 2⁵³. Die Analyse zeigt bis zu acht Nachkommastellen,
ohne unnötige nachgestellte Nullen, und ist damit bis zum Satoshi darstellbar.

Primärreferenzen: Bitcoin Core
[`GetBlockSubsidy` und Genesis-Behandlung](https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp),
Mainnet-[Konsensparameter](https://github.com/bitcoin/bitcoin/blob/master/src/kernel/chainparams.cpp).

## Halving-Zählung und Grenzen

Der Zyklusindex c ist nullbasiert; die UI bezeichnet c + 1 als laufenden Zyklus und
zeigt zusätzlich die Anzahl bereits durchlaufener Halvings. Vor dem ersten Halving
lautet die letzte Grenze „Noch keines · Genesis bei 0“.

```text
letzte Halving-Höhe = c × 210.000 (nur bei c > 0)
nächste Grenze     = (c + 1) × 210.000
verbleibend        = 210.000 − (h mod 210.000)
Fortschritt        = (h mod 210.000) / 210.000 × 100
```

Der Halving-Block erhält bereits die neue Subvention. Direkt an einer Grenze
springt der Fortschritt auf 0 %, verbleibend auf 210.000 und die Zielhöhe auf den
nächsten Zyklus. Fortschritt misst Blockintervalle ab der Grenze; er ist nicht die
inklusive Anzahl ausgegebener Coinbase-Subventionen. Es gibt keine hartcodierten
Kalendertermine oder Zielhöhen. Nach Ende der Subvention weist die Analyse darauf
hin, dass weitere Intervallgrenzen die bereits bei null liegende Subvention nicht ändern.

## Jährliche Neuemission und Angebotsinflation

Definition: ein zukünftiges Modelljahr mit 365 Tagen und 144 Blöcken pro Tag,
also 52.560 **zusätzlichen** Blöcken nach dem beobachteten Tip.

```text
Jahresemission(h) = Angebot(h + 52.560) − Angebot(h)
Inflation(h)      = Jahresemission(h) / Angebot(h) × 100 % p. a.
```

Das Fenster umfasst h + 1 bis h + 52.560 einschließlich; die Subvention des schon
beobachteten Blocks h ist bereits im Nenner enthalten. Beide Angebotssummen
berücksichtigen alle betroffenen Intervalle, einschließlich Satoshi-Abrundungen.
Ein Halving innerhalb des Jahres reduziert daher korrekt nur die danach liegenden
Subventionen. Eine konstante Hochrechnung mit der heutigen Subvention wird vermieden.

Reproduzierbare Beispiele:

| Höhe      | Rechnerisch ausgegeben | Modell-Neuemission/Jahr | Erläuterung                                                 |
| --------- | ---------------------- | ----------------------- | ----------------------------------------------------------- |
| 0         | 50 BTC                 | 2.628.000 BTC           | Genesis einmal im Bestand, nur zukünftige Blöcke im Zähler  |
| 900.000   | 19.875.003,125 BTC     | 164.250 BTC             | 0,826 % p. a. gerundet                                      |
| 1.049.990 | 20.343.721,875 BTC     | 82.139,0625 BTC         | 9 × 3,125 + 52.551 × 1,5625 BTC                             |
| 1.049.999 | 20.343.750 BTC         | 82.125 BTC              | Der unmittelbar nächste Block ist bereits der Halving-Block |
| 1.050.000 | 20.343.751,5625 BTC    | 82.125 BTC              | Neue Subvention ist bereits im Bestand enthalten            |
| 6.929.998 | Maximum − 1 sat        | 1 sat                   | Ende der Subvention im Modelljahr                           |
| 6.929.999 | Maximum                | 0 BTC                   | Keine weitere modellierte Emission                          |

Das Modell sagt die tatsächliche künftige Blockproduktion nicht voraus.
Es verwendet keine kurzfristig gemessene Blockzeit und berücksichtigt keine
künftigen Änderungen der Konsensregeln. Es beschreibt Angebotswachstum, keine
Kaufkraftinflation und keine Kursentwicklung. Der kleine Genesis-Nenner führt in
sehr frühen Zyklen mathematisch zu hohen Prozentwerten; diese werden nicht künstlich begrenzt.

## Caching, Aktualisierung und Fehlerverhalten

| Ressource           | Abruf/Stale-Time | Alterswarnung               | Inaktiver Cache |
| ------------------- | ---------------- | --------------------------- | --------------- |
| Block-Snapshot      | 60 Sekunden      | 60 Sekunden                 | 10 Minuten      |
| Hashrate            | 15 Minuten       | 30 Minuten oder Abruffehler | 60 Minuten      |
| Difficulty-Prognose | 10 Minuten       | 20 Minuten                  | 30 Minuten      |

Bestehende Query-Keys, Retries, Fristen und Cooldowns bleiben erhalten. Bei einem
sichtbaren Mining-Erstaufruf sind nur drei Requests nötig: Blöcke, Hashrate und
Prognose. Frische Übersichtscaches für Blöcke und Hashrate werden beim Seitenwechsel
wiederverwendet. Für Höhe, Subvention, Halving, Angebot oder Inflation gibt es keine
separaten Requests und keinen zusätzlichen Cache.

Alle neuen blockbezogenen Werte werden synchron aus dem ersten Block desselben
validierten Responses abgeleitet. Fehlgeschlagene Aktualisierungen behalten den
vorigen Snapshot samt Abrufzeitpunkt. Ungültige Zahlen werden nicht in den Cache
übernommen. Ohne erfolgreiche Daten erscheinen Striche statt Ersatzwerte.
Hashratefehler und Blockfehler bleiben voneinander sowie von der Prognose getrennt.
Die vorhandene Kartenfehlergrenze hält unerwartete Fundamentals-Renderfehler von
der bereits vorhandenen Anpassungsprognose fern.

Hintergrundpolling ist ausgeschaltet; TanStack Query übernimmt Sichtbarkeitswechsel
und Wiederverbindung. Offline pausierte Abrufe sind beschriftet, alte Werte bleiben
sichtbar und können nach ihrer Altersgrenze als veraltet markiert werden. Die
bestehende sichtbarkeitsabhängige Uhr aktualisiert ausschließlich Altershinweise,
ohne selbst Daten abzurufen. Kein Live-Indikator wird hinzugefügt.

## UI und Accessibility

- Bestehender 12-Spalten-Analysebereich mit unveränderten Karten/Tokens und ruhiger Typografie.
- Fünf gleich breite KPIs in der Desktopreihe; Container-Abfragen wechseln zu zwei und einer Spalte und berücksichtigen vergrößerte Root-Schrift.
- Subgrid richtet Titel, Werte, Erläuterungen und Footer je KPI-Zeile aus. Lange gültige Werte bleiben vollständig sichtbar; bei Textvergrößerung ist natürlicher Umbruch möglich.
- Jede blockbezogene KPI trägt ihren Status und verlinkt auf den gemeinsamen Quellen-/Zeit-/Fehlerbereich. Die Hashrate behält ihre vollständige vorhandene Quellen- und Statusdarstellung.
- Beide nativen `progress`-Elemente haben zugängliche Namen, `max=100` und den berechneten Wert. Ohne Daten wird nur die feste sechs Pixel hohe Spur gezeigt, kein erfundener oder indeterminierter Fortschritt.
- Die neuen Balken verwenden den bestehenden orangefarbenen Accent-Token (inklusive kontrastangepasstem Light Mode); keine Animation oder Transition.
- Definitionlisten, benannte Bereiche, sichtbare Warntexte, Status-/Alert-Rollen und vorhandene Retry-/Anmeldeaktionen bleiben per Tastatur nutzbar.
- Die Navigation darf ausschließlich auf der Mining-Seite bei Textvergrößerung umbrechen. Dies behebt den im Browser nachgewiesenen Überlauf bei 1024 px / 200 % Text.

Chromium prüft Dark/Light, sechs Breiten von 320 bis 1920 px, jeweils 100/200 % Text,
gleichmäßige KPI-Ausrichtung, fehlenden Seitenüberlauf, benannte Fortschrittswerte,
Reduced Motion und sichtbaren Tastaturfokus. Ein echter Screenreader sowie Firefox
und WebKit wurden nicht separat geprüft. Die Textvergrößerung simuliert nicht jede
Browser-Zoomimplementierung.

## Tests und Verifikation

Die zusätzlichen Unit-Tests prüfen Genesis, Höhe 1, alle angeforderten Halving-Grenzen,
späte Satoshi-Subventionen, Nullübergang, sehr große gültige Höhen und ungültige
Eingaben. Sie prüfen die kumulative Differenz pro Block, Erhaltung des Maximums,
exakte Jahressummen und Inflationsnenner. Ein unabhängiger Test summiert pro zukünftigem
Block mit ganzzahliger Division, statt die Intervallsummen nur zu wiederholen.

Integrationstests prüfen alle fünf KPIs, beide Analysen, atomare Aktualisierung,
leere/Lade-/Fehler-/Alters-/Offlinezustände, Recovery, Hintergrundverhalten und
Cache-Wiederverwendung über echte React-Routen. Der kompilierte Pages-Worker wird
mit deterministischen Upstreams auf korrektes Difficulty-Feld, ungültige Antworten,
Byte-Limits und unveränderte Sicherheitsheader/fehlende Credential-Weitergabe geprüft.

Bestehende Tests werden beibehalten. Alte Difficulty-Browserselektoren werden auf
die Prognosekarte begrenzt, weil nun zusätzliche Fortschrittsbalken/Statusbereiche
auf der Seite existieren. Die nicht mehr zutreffende Platzhalter-Erwartung im
Ladetest wird durch leere echte KPIs und die zwei verbleibenden Platzhalter ersetzt.
Die Header-Erwartung folgt dem erweiterten Funktionsumfang. Bestehende numerische
API-Grenztests bleiben unverändert.

Verwendete lokale Toolchain: vorhandenes Node 22.22.2 / npm 10.9.7 aus
`.wrangler/toolchain`. Keine neue Dependency und keine Lockfileänderung. Wrangler-
Logs bleiben im ignorierten Workspaceverzeichnis; Telemetrie ist deaktiviert.
Für lokale Pages-/Chromium-Prozesse wird Loopback-Zugriff verwendet. Kein Deployment.

Abschließende Ergebnisse des vollständigen lokalen Prüflaufs:

| Prüfung                | Ergebnis                                         |
| ---------------------- | ------------------------------------------------ |
| `npm run lint`         | Erfolgreich, keine Warnungen                     |
| `npm run format:check` | Erfolgreich                                      |
| `npm run typecheck`    | Alle vier TypeScript-Konfigurationen erfolgreich |
| `npm test`             | 836 Tests in 35 Dateien erfolgreich              |
| `npm run build`        | Erfolgreich; 2.635 Module                        |
| `npm run pages:check`  | Worker erfolgreich kompiliert                    |
| `npm run test:e2e`     | Alle 207 Tests erfolgreich, 2,3 Minuten          |
| `git diff --check`     | Erfolgreich                                      |

## Screenshot-Nachweise

Alle hier verlinkten Bilder zeigen die echte React-Anwendung im lokalen Pages-
Produktionsbuild mit sichtbarer Kennzeichnung **Testfixture MF-212 · synthetische
Prüfdaten**. Sie sind kein Nachweis aktueller Live-Daten oder eines Deployments.
Die Dateien werden durch `e2e/mining-fundamentals.spec.ts` reproduzierbar erzeugt.

| Ansicht             | Dark                                                                      | Light                                                                      |
| ------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Desktop 1440 px     | [Screenshot](screenshots/phase-2.12/mining-1440-dark-fixture.png)         | [Screenshot](screenshots/phase-2.12/mining-1440-light-fixture.png)         |
| Mobil 390 px        | [Screenshot](screenshots/phase-2.12/mining-390-dark-fixture.png)          | [Screenshot](screenshots/phase-2.12/mining-390-light-fixture.png)          |
| 320 px / 200 % Text | [Screenshot](screenshots/phase-2.12/mining-320-text-200-dark-fixture.png) | [Screenshot](screenshots/phase-2.12/mining-320-text-200-light-fixture.png) |
| Laden               | [Screenshot](screenshots/phase-2.12/mining-loading-dark-fixture.png)      | [Screenshot](screenshots/phase-2.12/mining-loading-light-fixture.png)      |
| Ungültige Antwort   | [Screenshot](screenshots/phase-2.12/mining-invalid-dark-fixture.png)      | [Screenshot](screenshots/phase-2.12/mining-invalid-light-fixture.png)      |
| Veralteter Snapshot | [Screenshot](screenshots/phase-2.12/mining-stale-dark-fixture.png)        | [Screenshot](screenshots/phase-2.12/mining-stale-light-fixture.png)        |

Zusätzlich: [Offline mit letztem Datenstand](screenshots/phase-2.12/mining-offline-dark-fixture.png).
Desktop und Mobilansicht wurden in beiden Themes visuell geprüft. Alle weiteren
Prüfbreiten werden automatisiert auf Geometrie und Semantik geprüft.

## Geänderte Dateien

| Dateien                                                                                                     | Zweck                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `shared/bitcoin-supply.ts`, `src/lib/overview.ts`                                                           | Gemeinsame reine Subventions-/Halving-/Angebots-/Inflationsmathematik                 |
| `shared/bitcoin.ts`, `shared/bitcoin-number.ts`, `shared/bitcoin-validation.ts`, `functions/lib/mempool.ts` | Tatsächliche Difficulty im bestehenden Blockvertrag validieren                        |
| `src/components/mining/fundamentals.tsx`, `src/pages/mining.tsx`, `src/styles/mining.css`                   | Fünf KPIs, Status, zwei Analysen und responsive Darstellung                           |
| `src/components/overview/network.tsx`                                                                       | Optionale CSS-Klasse an bestehender Hashrate-Karte zur unveränderten Wiederverwendung |
| `src/test/bitcoin-supply.test.ts`, `src/test/mining-contract.test.ts`, `src/test/mining-ui.test.tsx`        | Neue Fach-, Vertrags- und Integrationstests                                           |
| `src/test/bitcoin-fixtures.ts`, `e2e/blockchain.spec.ts`                                                    | Explizite synthetische Difficulty in bestehenden Block-Fixtures                       |
| `src/test/app.test.tsx`, `src/test/difficulty-ui.test.tsx`, `e2e/mining.spec.ts`                            | Bestehende assertions an neue Quellenbezeichnung/zusätzliche Karten anpassen          |
| `e2e/mining-fundamentals.spec.ts`, `e2e/pages-mining-fundamentals.spec.ts`                                  | Neue Browser-/Pages-Prüfungen und Screenshot-Erzeugung                                |
| `README.md`, dieser Bericht, `docs/screenshots/phase-2.12/`                                                 | Funktionsumfang, Methodik, Ergebnisse und visuelle Nachweise                          |

## Einschränkungen, Phase 2.13 und Git-Workflow

Der Modellbestand ist keine UTXO-Auswertung. Unterbeanspruchte Subventionen,
verlorene oder anderweitig nicht verfügbare BTC werden nicht ermittelt. Die
Difficulty stammt vom zuletzt erfolgreich beobachteten Block; veraltete Snapshots
können eine inzwischen erfolgte Anpassung noch nicht enthalten. Erneuerungen
übernehmen daher den gesamten validierten Snapshot. Die Hashrate bleibt eine
eigene 1.008-Block-Schätzung und kann einen anderen Abrufstand haben.

Offen für Phase 2.13: historische Hashrate-/Difficulty-Charts und Mining-Pool-
Verteilung. Historische Angebotscharts, eigene Node, komplexere Mining-Analysen
und tatsächliche Coinbase-/UTXO-Bilanzen sind ebenfalls nicht implementiert.

Cloudflare Access, Flags, Secrets, Kraken, CoinGecko, Hashrate-API, Sicherheitsheader
und Domainkonfiguration bleiben unverändert. Produktive Access-Policies wurden
nicht überprüft. Der Feature-Commit verwendet die vorhandene Konvention
`[CF-Pages-Skip]`, um ein automatisches Pages-Deployment dieses Pushes zu unterdrücken.
Der Pull Request richtet sich gegen `main`; Merge und Deployment erfolgen nicht
automatisch. Bei einem späteren manuellen Merge ist die Deploymentkonvention erneut
zu berücksichtigen.
