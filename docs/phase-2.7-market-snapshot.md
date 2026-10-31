# Phase 2.7 – CoinGecko-Marktsnapshot (AP4)

Stand: **31. Oktober 2026**, Europe/Berlin. Repository:
`CFPlusPlus/bitcoin-dashboard`. Ausgangscommit:
`8c2fec8f2e14b1ca2647e2972189e2421bca0dd9`.
Branch: `feature/phase-2.7-market-snapshot`.

**Implementierung vorbereitet, produktiver Providerbetrieb gesperrt.**
[ADR 0002](adr/0002-market-data-provider.md) bleibt `proposed`, mit bedingt
freigegebenen Betreiberentscheidungen. Synthetische Fixtures prüfen ausschließlich
den Code; sie sind keine echten Marktwerte oder Kontonachweise.
Grundlagen: [Phase 2.6](phase-2.6-market-provider-evaluation.md),
[ADR 0001](adr/0001-resource-freshness.md) und
[Inventur](phase-2.4-data-function-inventory.md).

## Betreiberentscheidungen und Nachweisgrenze

| Punkt              | Verbindliche Festlegung / Stand                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| Tarif / Kosten     | CoinGecko Demo kostenlos, 0 €, kein automatisches Upgrade                                                      |
| Nutzung            | Ausschließlich privat, nichtkommerziell, hinter Cloudflare Access; gelegentlich einige Stunden pro Woche       |
| Währungen          | EUR und USD aus einem Bitcoin-Detailrequest                                                                    |
| Frequenz           | Zunächst fünf Minuten bei aktivem, sichtbarem Marktbereich                                                     |
| Historie           | Separate Phase 2.8 / AP5; hier keine historischen Requests                                                     |
| Gemeinsamer Cache  | Zunächst nicht vorgesehen; kein KV, DO, Cache-API-Projekt oder Scheduler                                       |
| Vorhandene Quellen | Mempool- und Difficulty-Abfragen/Policies unverändert                                                          |
| Schlüssel          | Ausschließlich serverseitiges Cloudflare-Pages-Secret                                                          |
| Betriebsstatus     | Nicht aktiviert; kein Konto-/Secretauslesen, kein realer Providerrequest, kein Deployment oder Access-Eingriff |

Die öffentlichen Primärquellen wurden am 31.10.2026 erneut gelesen:
[Demo-Authentifizierung](https://docs.coingecko.com/demo/reference/authentication),
[Bitcoin-Detailvertrag](https://docs.coingecko.com/demo/reference/coins-id),
[Preisliste](https://www.coingecko.com/en/api/pricing),
[Supportlimit](https://support.coingecko.com/articles/5125303456-what-is-the-rate-limit-for-coingecko-api-public-plan),
[API Terms](https://www.coingecko.com/en/api_terms) und
[Attribution](https://brand.coingecko.com/resources/attribution-guide).
Die Preisliste nennt für Demo 10.000 Abrufe/Monat und 100/Minute, der Support
weiterhin 30/Minute. Deshalb bleiben die **tatsächlichen Kontolimits offen**.
Die Terms verknüpfen den Nutzungsumfang mit dem Tarif und nennen Bedingungen zur
Zwischenspeicherung; sie ersetzen keine konkrete Betreiberprüfung der privaten
Anzeige, des flüchtigen Queryspeichers und der ATH-Ableitung.

## Fester API-Vertrag

`GET /api/market/snapshot` akzeptiert **keine Queryparameter**. Unbekannte
Ressource → 404, andere Methode → 405 mit `Allow: GET`, Queryparameter → 400,
jeweils vor dem Providerzugriff. `/api/market/history` ist nicht implementiert.

Der Adapter erzeugt genau einen Request neu:

```text
https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&sparkline=false
```

Kein frei wählbarer Host, Asset, Tarif oder FX-Dienst. Nur `Accept` und
`x-cg-demo-api-key` werden gesetzt. Browsercookies, Access-JWT und Authorization
werden nicht weitergeleitet; Redirects werden verworfen. Kein Serverretry.

Der endgültige lokale Vertrag steht in [shared/market.ts](../shared/market.ts).
Die Zuordnung entspricht der öffentlichen Referenz; **keines dieser Felder ist
bereits durch eine authentifizierte Kontoprobe bestätigt**:

| Antwortfeld                        | Providerfeld / Bedeutung                                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data.asset`                       | Eigene Konstante `BTC`, nach `id=bitcoin`, `symbol=btc`                                                                                                        |
| `data.quotes.usd`, `.eur`          | Immer beide Währungen; Kernpreis muss je Währung vorhanden sein                                                                                                |
| `price`                            | `market_data.current_price[c]`, positiver Fiatbetrag je BTC                                                                                                    |
| `marketCap`                        | `market_data.market_cap[c]`, Providerkapitalisierung, nicht FDV                                                                                                |
| `volume24h`                        | `market_data.total_volume[c]`, rollierendes 24-h-Handelsvolumen                                                                                                |
| `changePercent.h24`, `.d7`, `.d30` | `market_data.price_change_percentage_24h_in_currency[c]`, `7d_in_currency[c]`, `30d_in_currency[c]`; Prozentwerte, keine Verhältnisse und keine Chartableitung |
| `ath.price`, `.at`                 | `market_data.ath[c]`, `ath_date[c]`; eigenes Paar je Währung                                                                                                   |
| `distanceFromAthPercent`           | `100 × (price / ath.price − 1)`; signiert, nicht auf null geklemmt                                                                                             |
| `sourceUpdatedAt`                  | Ausschließlich `market_data.last_updated`, kein Fallback auf die Top-Level-Zeit                                                                                |
| `updatedAt`                        | Functionuhr nach erfolgreichem Lesen/Validieren; bleibt bei Browserfehler unverändert                                                                          |
| `source`, `provider`               | Feste Konstanten `coingecko`, `assetId=bitcoin`, `market=aggregated`, `attributionUrl=https://www.coingecko.com/en/api/`                                       |

Fehlende/null optionale Kennzahlen werden explizit null. Bei fehlendem ATH-Teil
werden Paar und Abstand null; vorhandene fehlerhafte Teile bleiben Fehler.
Ein fehlender EUR-Preis verwirft den gesamten Snapshot; keine Wechselkursschätzung.
Zusätzliche Providerfelder werden verworfen. Auch der Browser konstruiert nach
Validierung ein kleines Objekt, statt Rohdaten im Querycache zu behalten.

Geldbeträge sind endlich und höchstens `Number.MAX_SAFE_INTEGER`, Cap/Volumen
dürfen null oder 0 und auch Nachkommastellen enthalten. Prozentänderungen liegen
zwischen −100 und 1.000.000. ATH-Abstand muss endlich und im Browser zur Formel
konsistent sein (relative Toleranz `1e-9 × max(1, |Erwartungswert|)`). Positiver
Abstand bleibt sichtbar und erhält einen Hinweis auf inkonsistenten Providerstand.
Zeitstempel sind kanonisches ISO UTC mit Millisekunden, nicht vor Bitcoin-Genesis
und höchstens fünf Minuten zukünftig; Quellzeit und ATH müssen zusätzlich zur
Abruf-/Quellzeit passen. Falls die Kontoprobe ein anderes zulässiges Zeitformat
belegt, muss der Adapter gezielt angepasst und erneut getestet werden.

## Transport, Fehler und Schutz

Upstreamdeadline **8 s einschließlich Body**, Rohdatenlimit **256 KiB**.
Normalisierte Antwort höchstens **16 KiB**, Browserdeadline **15 s einschließlich
Body**, Fehlerhüllen höchstens **4 KiB**. Der wiederverwendete reine Streamleser
misst tatsächliche UTF-8-Bytes, prüft auch ohne `Content-Length`, verwirft ungültiges
UTF-8 und bricht den Reader bei Abbruch/Überlauf ab. Der Browser importiert nur
diesen Transporthelfer, keinen Provideradapter oder Secretpfad.

Alle Antworten erhalten die vorhandenen Sicherheitsheader und `Cache-Control:
no-store`; keine CORS-Freigabe. Logs enthalten nur eigenes Event, Ressource,
Kategorie und optionalen Status; keine Header, Bodies, URLs oder Fehlerstacks.

| Code                        | HTTP | Browserverhalten                                                                              |
| --------------------------- | ---- | --------------------------------------------------------------------------------------------- |
| `MARKET_NOT_CONFIGURED`     | 503  | Secret fehlt; kein automatischer Retry                                                        |
| `MARKET_NOT_RELEASED`       | 503  | Betriebsfreigabe fehlt; kein automatischer Retry                                              |
| `UPSTREAM_CONFIGURATION`    | 502  | Provider-401/403 bzw. andere Provider-4xx; kein Retry und kein falscher Access-Logout-Hinweis |
| `UPSTREAM_INVALID_RESPONSE` | 502  | Schema, Redirect, HTML, Größen-/UTF-8-Fehler; kein Retry                                      |
| `UPSTREAM_RATE_LIMIT`       | 429  | Eigene Pause 600 s, `Retry-After: 600`, `retryAfterSeconds: 600`                              |
| `UPSTREAM_TIMEOUT`          | 504  | Höchstens ein automatischer Browserretry nach 5–10 s                                          |
| `UPSTREAM_UNAVAILABLE`      | 502  | Netzwerk/Provider-5xx; höchstens ein Browserretry nach 5–10 s                                 |

Sichere Fehlerhülle: `{ error: { code, retryAfterSeconds? } }`. Ungültige/ungeprüfte
Browserfehlerhüllen werden nicht automatisch wiederholt. Browser-401/403 und
Login-HTML/Redirects erhalten eigene Zugriffs-/Anmeldehinweise; sie gelangen nicht
als Erfolg in den Cache. Auch ein beschädigter HTTP-429-Body löst vorsorglich die
lokale Zehn-Minuten-Pause aus. Ein 429 sagt nichts über das Quotenreset aus.

## Query-Policy und Anzeige

Ein Key `['market','snapshot']` versorgt sämtliche Kennzahlen und beide
Währungen; Umschalten erzeugt keinen Request. Aktive sichtbare Verbraucher pollen
alle fünf Minuten; initial verborgene Mounts, verborgene Tabs, Offlinezustand und
inaktive Routen erzeugen keine Regelabrufe. Stale Rückkehr/Reconnect aktualisiert
einmal. Inaktive Daten werden nach 30 Minuten gesammelt; keine Persistenz.

Die Zehn-Minuten-429-Pause lebt in einer WeakMap pro QueryClient und übersteht
Unmount, Query-GC und auch andere Marktkeys desselben Clients. Queryfunktion,
Mount/Erstfehler-Remount, Fokus, Reconnect, Retry und manueller Abruf beachten sie.
Bereits gestartete Requests werden nicht rückwirkend verhindert. Andere Tabs,
Neuladen und andere Functioninstanzen teilen diese Pause nicht. Die manuelle
Taste wartet nach jedem Versuch mindestens 60 Sekunden, gegebenenfalls länger
bis zum Cooldownende. Kein globales Quotenversprechen.

Abruf- und Quellalter werden getrennt ab **zehn Minuten** gewarnt. Eine sichtbare
Anzeigeuhr aktualisiert alle 30 Sekunden und bei Rückkehr; sie führt keine
Requests aus. Ein frisch geladener alter Quellstand bleibt als alt erkennbar.
Refreshfehler erhalten sämtliche Werte und Zeitstempel des letzten Erfolgs.
Fehlende Daten zeigen Gedankenstriche bzw. „nicht verfügbar“, niemals Ersatzwerte.

Die Marktseite behält ihre Gestaltung und die unverbundenen Dominanz-/Sentiment-
und Rechnerbereiche. Der Snapshot zeigt USD-/EUR-Auswahl, Referenzkurs, Cap,
Volumen, ATH/Datum, Änderungen und signierten Abstand sowie Quelle, Attribution
und getrennte Zeitstempel. Der bestehende Chart bleibt ausdrücklich synthetischer
Index mit eigener Kennzeichnung. Historische Reihen gehören in Phase 2.8.
Große Fiatbeträge werden mit deutscher Größenbezeichnung gekürzt (z. B.
„1,44 Bio. €“); der vollständige Betrag mit Cent steht im zugänglichen Namen und
im Titel. Der Quellwert wird nicht gerundet gespeichert.

## Abrufbudget für die gelegentliche Nutzung

„Einige Stunden“ ist keine exakte Monatsgrenze. Als **Rechenbeispiel**, nicht als
neue Betreiberzusage: ein Tab, 6 sichtbare Stunden pro Woche, 31 Tage →
`12 × 6 × 31 / 7 = 318,86` Regelabrufe. Mit angenommenen 20 Öffnungs-/Fokus-/
manuellen Zusatzabrufen pro Woche entstehen rund 407,43 Grundabrufe; mit 25 %
Reserve aufgerundet **510 Abrufe/31 Tage**. Kein Historienanteil. Mehrere Tabs,
Geräte und Preview sowie sonstiger Kontoverbrauch werden addiert. Laufende
Abbrüche können beim Provider trotzdem zählen. Das ist kein harter Quotenschutz.
Vor Betrieb gegen tatsächliche Monats-/Minutenquote und verbleibendes Kontobudget
rechnen; 25 % Reserve und konservative Spitzen aus Phase 2.6 beibehalten.
Verbrauch nach einer Woche und dem ersten Monat prüfen; bei >80-%-Prognose oder
wiederholten 429 Abrufe betrieblich pausieren und Frequenz/AP3 neu entscheiden.
Kein automatischer Wechsel auf kostenpflichtigen Host, Tarif oder Ersatzkey.

## Noch offene Betriebsfreigaben

| Gate                  | Erforderlicher Nachweis                                                                                                                                                                                                                       | Status                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Konto                 | Tatsächlicher Demo-Tarif, Monats-/Minutenlimit, Reset, aktueller/sonstiger Verbrauch und keine kostenpflichtige Option; nur bereinigte Zusammenfassung                                                                                        | **Offen**              |
| Rechte                | Betreiberprüfung der privaten nichtkommerziellen integrierten Anzeige, Attribution, flüchtigen Zwischenspeicherung und ATH-Ableitung; bei Unklarheit Providerklärung                                                                          | **Offen**              |
| Nutzungsbudget        | Beispiel durch tatsächliche Stunden, gleichzeitige Tabs/Geräte und sonstigen Verbrauch ersetzen; gegen Kontoquote prüfen                                                                                                                      | **Offen**              |
| Schema / Größe        | Genau ein authentifizierter fester Snapshot-GET, höchstens 256 KiB und 12 s, ohne Retry; Typen/Feldvorhandensein beider Währungen, Zeitformat/-semantik, Status, gemessene Bytes und UTC-Prüfzeit protokollieren; keine Rohdaten oder Secrets | **Nicht durchgeführt** |
| Probeabgleich         | Adapter/Bytegrenzen gegen die erlaubte Kontoprobe prüfen, Abweichungen korrigieren und deterministische Tests erneut ausführen                                                                                                                | **Offen**              |
| Zielumgebung          | Preview/Produktion getrennt, deployter SHA, UTC-Prüfzeit, neuer authentifizierter Accesspfad und Hostkatalog gemäß bestehendem Releasegate                                                                                                    | **Offen**              |
| Explizite Aktivierung | Erst nach obigen Nachweisen je Zielumgebung freigeben; ADR-Status erst danach neu bewerten                                                                                                                                                    | **Gesperrt**           |

Der Key wird weder gesucht noch aus dem Repository gelesen. Die ausstehende Probe
muss über einen autorisierten serverseitigen Weg mit Pages-Secret erfolgen,
ohne Dauerpolling für die Probe einzuschalten. Kein offener Diagnoseproxy wird
dafür ausgeliefert. Danach nur bereinigte Nachweise hier ergänzen. Eine bewilligte
Probe ist noch keine Freigabe für regelmäßige Requests.

`wrangler.jsonc` enthält `MARKET_SNAPSHOT_ENABLED=false` als nicht geheime
serverseitige Variable. In jeder Zielumgebung muss die effektive Variable bis zur
Freigabe fehlend/false bleiben. Das Secret allein genügt nie: ohne Secret folgt
503 `MARKET_NOT_CONFIGURED`, mit Secret und ohne Freigabe 503
`MARKET_NOT_RELEASED`, jeweils **null Upstreamrequests**. Erst nach abgeschlossenen
Nachweisen darf die separate Variable exakt `true` sein. Deaktivierung über false
stoppt neue Providerabrufe; zuletzt im Browser gespeicherte Erfolge bleiben als
alte Daten erkennbar. Es werden keine Secrets, Account- oder Access-Einstellungen
durch diesen PR angelegt oder verändert.

## Tests und visuelle Prüfung

Die deterministischen Suites umfassen Normalisierung/Browservertrag, Zahlen- und
Zeitgrenzen, Nullwerte, fehlende Kernpreise, ATH-Paare/Formel, Providerfehler,
Credentials-Isolation, Timeout während Header/Body, Bytecap, ungültiges UTF-8,
Releasegates, Retry, Cooldown über GC/Remount, Deduplizierung, Sichtbarkeit,
Offline/Reconnect, Datenalter, Tastatur und Währungswechsel. Die neue echte
Pages-Runtime-Suite fängt alle ausgehenden Requests an der workerd-Grenze ab.
Kein CI-Test benötigt CoinGecko oder einen echten Schlüssel.

| Prüfung                | Lokales Ergebnis am 31.10.2026                                                       |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `npm run lint`         | PASS, keine Warnungen                                                                |
| `npm run format:check` | PASS                                                                                 |
| `npm run typecheck`    | PASS, Frontend, Functions, Functions-Tests und E2E                                   |
| `npm test`             | PASS, 397 Tests / 18 Dateien                                                         |
| `npm run build`        | PASS; keine neue Abhängigkeit, unveränderte Lockdatei                                |
| `npm run pages:check`  | PASS, echte Pages-Functions-Kompilierung                                             |
| `npm run test:e2e`     | PASS, 118 Chromium-/Pages-Tests                                                      |
| Bundleprüfung          | Kein Demo-Host, Secretname/-header, Testkey oder Providerrohpayload im Browserbundle |
| Bestand                | Mempooladapter, Bitcoinquery/-policy und Difficulty-Komponente unverändert           |

Sämtliche oben genannten Qualitätsprüfungen bestanden auch mit der bereits
vorhandenen gepinnten **Node-22.22.2-/npm-10.9.7-Toolchain**, einschließlich aller
397 Tests und 118 E2E-Tests. Die erste Prüfrunde verwendete die lokale
Standardtoolchain Node 26.11.1 / npm 11.20.0. Es wurden keine Pakete installiert
und keine Dependencydateien neu erzeugt. Der CI-Pfad bleibt unverändert gepinnt.
Der erste sandboxierte Pages-Check scheiterte an Wrangler-Log-/Traversierungsrechten;
der genehmigte lokale Compilerlauf bestand ohne Anwendungskorrektur.

Die tatsächliche React-Produktionsansicht wurde mit deterministischen Fixtures
in Chromium gerendert: 320, 390, 768, 1440 und 1920 Pixel, jeweils Dark/Light,
zusätzlich 320 Pixel bei 200 % Text. Die Screenshots liegen unter
[screenshots/phase-2.7](screenshots/phase-2.7/). Bildkontrolliert wurden insbesondere
[Desktop Dark](screenshots/phase-2.7/market-1440-dark.png),
[Tablet Light](screenshots/phase-2.7/market-768-light.png),
[Mobile Light](screenshots/phase-2.7/market-390-light.png),
[200 % Dark](screenshots/phase-2.7/market-320-text-200-dark.png),
[200 % Light](screenshots/phase-2.7/market-320-text-200-light.png),
[Stale Dark](screenshots/phase-2.7/market-stale-390-dark.png) und
[Freigabesperre Light](screenshots/phase-2.7/market-not-released-390-light.png).
Die Kontrolle führte zur kompakten Darstellung großer Geldbeträge sowie zu
Umbrüchen für Steuerelemente, Titel und Änderungswerte bei großer Schrift.
Keine abgeschnittenen Snapshotwerte oder überlagerten Änderungsfelder in den
korrigierten Ansichten; bei 200 % werden lange Wörter und die ATH-Währung
gegebenenfalls umbrochen. Tastaturfokus und Währungswechsel sind sichtbar,
Sperr-/Fehlerzustände bleiben ohne erfundene Zahlen, Alterswarnungen erhalten die
vorhandenen Werte. Der Demochart bleibt separat als synthetischer Index erkennbar.

Das ist lokale visuelle Codeprüfung, keine Pixelbaseline oder Betreiberabnahme.
Die grüne Suite ersetzt keine Konto-, Rechte-, Schema- oder externe Betriebsfreigabe.
