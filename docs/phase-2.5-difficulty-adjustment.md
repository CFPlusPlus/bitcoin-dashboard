# Phase 2.5 – Difficulty-Anpassungsprognose

Stand: **31. Oktober 2026**, Europe/Berlin. Basis:
`cbc5b149aa792ef66f00f07b269b50352ace7987`. Umfang: ausschließlich **AP1** aus
[Phase 2.4](phase-2.4-data-function-inventory.md). Branch:
`feature/phase-2.5-difficulty-adjustment`.

## 1. Verifizierter Providervertrag

Öffentlicher, schlüsselloser Mainnet-Endpunkt:
`GET https://mempool.space/api/v1/difficulty-adjustment`.
Die [offizielle REST-Referenz](https://mempool.space/docs/api/rest) führt ihn und
weist auf HTTP 429 bei Rate-Limits hin, ohne hier eine feste öffentliche Quote
zuzusichern. Es wurden keine Limits durch Last provoziert.

Die [offizielle Berechnung](https://github.com/mempool/mempool/blob/master/backend/src/api/difficulty-adjustment.ts)
bestätigt die unten übernommenen Felder. Positive/negative Werte bedeuten
schwierigere/leichtere Mining-Arbeit, ohne Marktbewertung. Früh in der Epoche
verwendet Mempool zusätzlich ein angepasstes Fenster aus der vorigen Epoche;
die Prognose wird nicht lokal nachgebaut. Der
[offizielle Routenhandler](https://github.com/mempool/mempool/blob/master/backend/src/api/bitcoin/bitcoin.routes.ts)
liefert 503 ohne initiale Blockbasis und 500 bei Berechnungsfehlern.

Eine einzelne echte Probe am **2026-10-31, 14:26:55 UTC** ergab **HTTP 200**, JSON,
**349 Byte** (12-Sekunden-Requesttimeout, maximal 8 KiB akzeptierte Probe):

| Übernommenes Providerfeld | Beobachteter Typ / Wert      | Bestätigte Bedeutung                                                          |
| ------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `difficultyChange`        | number, `-3.700433495570643` | Prozentprognose, Bereich −75 bis +300; 0 ist gültig                           |
| `remainingBlocks`         | number, `1762`               | Ganzzahlige Distanz zur nächsten Retarget-Höhe, einschließlich Retarget-Block |
| `progressPercent`         | number, `12.599206349206348` | `(Blockhöhe mod 2016) / 2016 × 100`                                           |
| `nextRetargetHeight`      | number, `975744`             | Nächste Retarget-Blockhöhe, Vielfaches von 2016                               |
| `estimatedRetargetDate`   | number, `1794556819028`      | Geschätzter Zeitpunkt in Unix-Millisekunden                                   |

Weitere beobachtete numerische Felder: `remainingTime`, `previousRetarget`,
`previousTime`, `timeAvg`, `adjustedTimeAvg`, `timeOffset`, `expectedBlocks`.
Sie werden verworfen. Insbesondere ist `previousTime` in Probe/Berechnung in
Sekunden, obwohl ein Interfacekommentar Millisekunden nennt. Diese Diskrepanz
betrifft kein verwendetes Feld. **Keine aktuelle Difficulty und kein separater
Quellzeitstempel** sind Bestandteil unseres Vertrags.

Die verwendeten Mainnet-Felder waren endlich und nicht null. Null, fehlend,
nicht endlich oder typfalsch wird als ungültige Antwort behandelt, ohne
Ersatzrechnung. Quellcodeprüfung und Probe sind Schemaevidenz, keine Zusage zur
Version hinter jedem Providerknoten oder seiner Verfügbarkeit.

## 2. Normalisierter Datenvertrag

Neue einzige Ressource: `GET /api/bitcoin/difficulty-adjustment`.
Bestehende Hülle: `{ data, source: 'mempool.space', updatedAt: ISO-Abrufzeit }`.

| Normalisiertes Feld      | Prüfung / Einheit                                                           |
| ------------------------ | --------------------------------------------------------------------------- |
| `estimatedChangePercent` | Endliche Zahl, −75 bis +300, unveränderte Prozentpunkte                     |
| `remainingBlocks`        | Sichere Ganzzahl 1–2016; 0 ist laut Providerformel kein Epochenzustand      |
| `progressPercent`        | Endlich 0–100, mit Restblöcken konsistent (Toleranz 0,000001 Prozentpunkte) |
| `nextRetargetHeight`     | Sichere positive Ganzzahl, mindestens 2016 und durch 2016 teilbar           |
| `estimatedRetargetAt`    | Kanonisches ISO UTC, aus geprüften ganzzahligen Millisekunden               |

Zeitwerte liegen zwischen Bitcoin-Genesis und der JavaScript-Date-Grenze.
Ein Sekundenwert im Millisekundenfeld wird verworfen. Beim Epochenwechsel sind
2016 Restblöcke und 0 % Fortschritt gültig; unmittelbar davor 1 Restblock und
2015/2016 Fortschritt. Keine monotone Fortschritts-/Höhenannahme über mehrere
Abrufe: Auch ein Rollback bleibt darstellbar.

Provideradapter → gemeinsamer reiner Fachvalidator → sichere Function-Hülle →
Browservalidator → Querycache → React. Unbekannte Zusatzfelder gelangen nicht in
den normalisierten Vertrag. Ausschließlich feste Provider-URL und Ressourcenallowlist;
keine vom Browser wählbare URL, keine Credentials zum Provider.

## 3. Ressourcenfrische und Polling

Entscheidung: [ADR 0001](adr/0001-resource-freshness.md). Difficulty: 10 Minuten
Polling/Query-Stale, 20 Minuten Abrufalterswarnung, 30 Minuten Cacheaufbewahrung.
Alle bisherigen Ressourcen behalten ihre 60-Sekunden-Policies. Stale Querydaten
mit elf Minuten Alter sind noch keine fachlich veralteten Difficulty-Daten.

Polling pausiert verborgen/offline und endet ohne aktive Seitenverbraucher.
Stale Daten werden bei Rückkehr/Reconnect aktualisiert; bekannte 429-Pausen haben
Vorrang. Die sichtbare Anzeigeuhr aktualisiert Abrufalter und Warnungen alle
30 Sekunden und sofort beim Sichtbarwerden. Erfolgreiche Abrufzeit bleibt bei
Refreshfehlern erhalten. Fehler und Alter sind getrennt sichtbar.

`updatedAt` bezeichnet ausschließlich den erfolgreichen Abruf. Der Retargettermin
ist eine Prognose in Browser-Ortszeit, kein Beobachtungszeitpunkt. Die UI benennt
den fehlenden separaten Quellzeitstempel ausdrücklich. Ein bereits vergangener
Schätztermin erhält einen Hinweis; es wird kein scheinbar aktueller Countdown
aus alten Daten abgeleitet.

## 4. Fehler und Rate-Limits

| Zustand                                            | Verhalten                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Initiales Laden                                    | Keine erfundenen Zahlen; sichtbarer Ladestatus                                          |
| Erstfehler                                         | Leere Werte, Fehlertext, Tastatur-Retry und Neuladen/Anmelden                           |
| Refreshfehler                                      | Letzte validierte Daten und deren Abrufzeit bleiben erhalten                            |
| Provider-429                                       | Nur neue Ressource: HTTP 429, `UPSTREAM_RATE_LIMIT`, festes `Retry-After: 600`          |
| Bekannte 429-Pause                                 | Kein sofortiger Retry; Fokus, Reconnect, Remount und Retryknopf respektieren 10 Minuten |
| Provider-Timeout                                   | HTTP 504, `UPSTREAM_TIMEOUT`                                                            |
| Netzwerk, übriges HTTP, ungültige/zu große Antwort | HTTP 502, `UPSTREAM_UNAVAILABLE`                                                        |
| Browser-401/403                                    | Bestehender Zugriffshinweis und vollständiges Neuladen                                  |
| Redirect/Login-HTML/kaputter JSON-Vertrag          | Sichere Fehlermeldung, keine Erfolgsdaten und kein Schema-Retry                         |

Bestehende Ressourcen behalten auch bei Provider-429 ihren bisherigen 502-Vertrag.
Die Änderung ist additiv auf den neuen Key begrenzt. Fremdes `Retry-After` und
Providertexte werden nicht weitergegeben; die lokale feste Pause ist keine
Behauptung über die Dauer eines Providerlimits. Kein globaler Quotenmechanismus.

Transportgrenzen bleiben: 8 Sekunden Upstream einschließlich Body, 15 Sekunden
Browser einschließlich Body, Query-Abbruchsignal, manuelle Redirectbehandlung,
begrenzte UTF-8-Streams. Neues Rohantwortbudget: **4 KiB**. Die vorhandenen
Securityheader, `no-store`, fehlendes CORS und die Log-Allowlist bleiben bestehen.
Das eingehende HTTP-Abbruchsignal der Function wird wie bisher nicht zusätzlich
zum Upstream durchgereicht; die eigene 8-Sekunden-Grenze bleibt verbindlich.

## 5. Architektur und Gestaltung

Eine kleine Policyfunktion genügt; keine neue Bibliothek, Produktionsabhängigkeit,
Datenbank oder Cacheplattform. Gemeinsame Statuskomponenten nehmen optional
Ressourcenkey und Anzeigezeit an. Ihr Standard erhält das bisherige Verhalten.
Eine ergänzende Datenquellenbeschriftung benennt den tatsächlich angebundenen
Mining-Abschnitt, ohne übrige Platzhalter als verbunden auszugeben.

Der neue Epochenabschnitt ersetzt ausschließlich „Nächste Anpassung“. Die fünf
anderen Kennzahlen und vier Fachflächen bleiben korrekt beschriftete Platzhalter.
Manrope/Inter, Analytical-Tokens und zurückhaltende Flächen bleiben erhalten.
Blau bezeichnet Daten bei beiden Vorzeichen, Warnfarbe Alter und Rot Fehler.
Fortschritt nutzt ein beschriftetes natives `progress`; Retry ist ein echter
Button mit Fokusindikator und mindestens 44 px Bedienhöhe.

## 6. Deterministische Tests und Qualitätsprüfungen

- `difficulty-contract.test.ts`: Provider → Browser-Vertrag, Vorzeichen/0,
  Pflichtfelder/null/NaN, Grenzen, Zeit-/Prozenteinheiten, Epochenwechsel/Rollback,
  fester Endpunkt, 4-KiB-Grenze und 8-Sekunden-Body-Abbruch.
- `difficulty-ui.test.tsx`: Laden, Erfolg, Erst-/Refreshfehler, erhaltener
  Datenstand, Tastatur-Retry, 20-Minuten-Warnung unabhängig vom Cache, Policies,
  echtes Visibility-Event sowie Fokus/Offline/Reconnect, 429 inklusive Remount
  und deaktiviertem Retryknopf, 15-Sekunden-Deadline/Unmount-Abbruch.
- `functions.test.ts`: additive Route, Hülle/Sicherheit und bereinigtes 429;
  vorhandene Tests behalten ihre Assertions.
- `e2e/pages-difficulty.spec.ts`: durch Wrangler kompilierter Pages-Router in
  lokaler Miniflare/workerd-Runtime, abgefangener kontrollierter Upstream.
  Erfolgsvertrag, ungültige Antwort, 429, Bytebudget, echter Timeout, 405 und
  kein Weiterreichen von Cookies/Authorization. Keine externe CI-Anfrage.
  Miniflare stammt aus der bereits gelockten Wrangler-Toolchain; deren v4-
  Kompatibilitätskonverter wird verwendet. Keine Abhängigkeitsänderung.
- `e2e/mining.spec.ts`: echte Produktions-React-Ansichten, Keyboard-Retry,
  Erhalt alter Daten, Epochenwechsel, 429-Pause und 200 % Text bei 320 px.

Alle angeforderten Prüfungen bestanden, lokal mit **Node 22.22.2 / npm 10.9.7**:

| Prüfung                | Ergebnis                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `npm ci`               | PASS, unverändertes Lockfile; keine neue Abhängigkeit                                   |
| `npm run lint`         | PASS, keine Warnungen                                                                   |
| `npm run format:check` | PASS                                                                                    |
| `npm run typecheck`    | PASS, alle vier Teilprojekte                                                            |
| `npm test`             | PASS, **308 Tests / 15 Dateien**                                                        |
| `npm run build`        | PASS, einschließlich Typecheck                                                          |
| `npm run pages:check`  | PASS, Pages-Worker kompiliert                                                           |
| `npm run test:e2e`     | PASS, **86 Chromium-Tests**, einschließlich fünf kontrollierter Pages-Runtime-Szenarien |

Für die Runtime-Tests muss wie im CI-Ablauf `pages:check` vor `test:e2e` laufen.
Der echte Runtime-Timeout endete nach etwa acht Sekunden mit 504. Der erste
sandboxierte Pages-Build war wegen Log-/Verzeichnistraversierungsrechten blockiert;
der erlaubte lokale Lauf bestand. Beim Browserlauf wurde ein realer Überlauf des
Fortschrittslabels bei 320 px / 200 % Text behoben. Vorhandene Assertions wurden
beibehalten, die vollständige Suite danach erneut ausgeführt. Keine numerische
Coveragequote oder automatische Pixelbaseline wird behauptet.

## 7. Screenshots und visuelle Prüfung

Screenshots werden aus dem Produktionsbuild mit kontrollierten Antworten erzeugt,
mit **„Testfixture DA-25 · synthetische Prüfdaten“** gekennzeichnet und nicht als
Produktionsnachweis ausgegeben. Es gibt keinen Fixture-Modus in der Anwendung.
Die Tests schreiben nach `test-results/mining`; ausgewählte Nachweise liegen unter
`docs/screenshots/phase-2.5`.

Alle **23 unveränderten PNGs** des finalen Laufs sind versioniert:

| Ansicht / Zustand   | Dark                                                       | Light                                                       |
| ------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| Erfolg, 1440 px     | [Bild](screenshots/phase-2.5/mining-1440-dark.png)         | [Bild](screenshots/phase-2.5/mining-1440-light.png)         |
| Erfolg, 390 px      | [Bild](screenshots/phase-2.5/mining-390-dark.png)          | [Bild](screenshots/phase-2.5/mining-390-light.png)          |
| Erfolg, 320 px      | [Bild](screenshots/phase-2.5/mining-320-dark.png)          | [Bild](screenshots/phase-2.5/mining-320-light.png)          |
| Erfolg, 768 px      | [Bild](screenshots/phase-2.5/mining-768-dark.png)          | [Bild](screenshots/phase-2.5/mining-768-light.png)          |
| Erfolg, 1920 px     | [Bild](screenshots/phase-2.5/mining-1920-dark.png)         | [Bild](screenshots/phase-2.5/mining-1920-light.png)         |
| Laden, 1440 px      | [Bild](screenshots/phase-2.5/mining-loading-1440-dark.png) | [Bild](screenshots/phase-2.5/mining-loading-1440-light.png) |
| Laden, 390 px       | [Bild](screenshots/phase-2.5/mining-loading-390-dark.png)  | [Bild](screenshots/phase-2.5/mining-loading-390-light.png)  |
| Erstfehler, 1440 px | [Bild](screenshots/phase-2.5/mining-error-1440-dark.png)   | [Bild](screenshots/phase-2.5/mining-error-1440-light.png)   |
| Erstfehler, 390 px  | [Bild](screenshots/phase-2.5/mining-error-390-dark.png)    | [Bild](screenshots/phase-2.5/mining-error-390-light.png)    |
| Veraltet, 1440 px   | [Bild](screenshots/phase-2.5/mining-stale-1440-dark.png)   | [Bild](screenshots/phase-2.5/mining-stale-1440-light.png)   |
| Veraltet, 390 px    | [Bild](screenshots/phase-2.5/mining-stale-390-dark.png)    | [Bild](screenshots/phase-2.5/mining-stale-390-light.png)    |

Zusätzlich: [320 px mit 200 % Text](screenshots/phase-2.5/mining-320-text-200.png).
Die tatsächlich gerenderten Ansichten wurden visuell beurteilt: klare
Zahlenhierarchie, neutrale Prognosefarbe, sichtbare Zeit-/Fehler-/Altersinformationen,
lesbare Umbrüche und getrennte Epochenfakten auf Mobil. Kein Seitenüberlauf bei den
geprüften Breiten; das Fortschrittslabel darf bei stark vergrößerter Schrift
umfließen. Tastatur-Retry, sichtbarer Fokus und bestehende Navigation sind zusätzlich
automatisiert geprüft. Die übrigen Mining-Flächen sind weiterhin als Platzhalter
erkennbar. Weiterer Seitenumbau bleibt bewusst dem nächsten Fachauftrag vorbehalten.

## 8. Bekannte Einschränkungen

- Keine separate Quellzeit: Ein erfolgreicher HTTP-Abruf beweist keine aktuelle
  Provider-Blockbasis. Der Provider darf selbst zeitlich verzögert sein.
- Die Prognose ist besonders früh in der Epoche unsicher. Keine lokale Garantie
  für Termin oder endgültigen Anpassungswert und keine aktuelle Difficulty.
- Zehn Minuten sind eine Produktentscheidung, keine Provider-SLA; unmittelbar
  nach einem Retarget kann bis zum nächsten erfolgreichen Abruf alter Kontext
  erscheinen. Alter und Abrufzeit bleiben sichtbar.
- Cooldown nur pro Browser-Querycache; Neuladen/neuer Tab teilt ihn nicht.
  Keine verbindliche öffentliche Quote oder globale Lastkontrolle.
- Lokale deterministische Tests plus eine öffentliche Schema-Probe belegen keinen
  deployten Access-/Produktionspfad. Deployment und externe Releaseabnahme sind
  nicht Bestandteil des Implementierungs-PR.

## 9. Weiterer Ausbau

Hashrate, aktuelle Difficulty, Mining-Historie, Pools, Halving und Emission bleiben
eigene Arbeitspakete mit jeweils verifiziertem Datensatz, Zeitfenster und UI-Auftrag.
Markt- und Übersichtsumbau, weitere Provider und globales Cache-/Quotenmanagement
sind unverändert außerhalb von AP1.
