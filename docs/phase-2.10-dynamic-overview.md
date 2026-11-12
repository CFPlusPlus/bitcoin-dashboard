# Phase 2.10 – Dynamische Übersicht und Bitcoin-Live-Kurse

Stand: 12. November 2026, Europe/Berlin. Branch:
`feature/phase-2.10-dynamic-overview`, Basis nach `git fetch origin`:
`6c69e0cbc97cd4f017774a9b3ae9cdd02a4a1b07`. Seit diesem Phase-2.9-Merge gab
es keine weiteren Änderungen auf `origin/main`. Die vorhandenen vier Marktflags
in `wrangler.jsonc` sind bereits `true` und bleiben unverändert. Frühere
Phasenberichte beschreiben deren damaligen Stand.

## Umsetzung und Informationsarchitektur

Die Übersicht ersetzt sämtliche bisherigen Kennzahlen-Platzhalter und den
synthetischen Chart. Oben stehen Begrüßung und zwei gleichwertige Kraken-Kurse.
Danach folgen Marktkapitalisierung, 24h-Volumen, Blockhöhe, Netzwerk-Hashrate und
Gebührenempfehlung. Der echte CoinGecko-Kursverlauf steht neben Halving-Zyklus
und Mempool, darunter die letzten Blöcke. Navigation und Dokumenttitel heißen
weiterhin „Übersicht“. Globale Gestaltung, Markt, Blockchain und Mining behalten
ihre bisherigen Funktionen.

Neue UI: `LivePrices`, `OverviewMarketMetrics`, `HalvingCard`, `HashrateCard`,
lokale Übersichtsstile. Wiederverwendet: `PageHeading` mit optionalem abweichendem
Heading, `Card`, `ErrorBoundary`, `HeightMetric`, `FeeMetric`, `MempoolCard`,
`LiveBlocksTable`, `MarketHistory`, dessen Lazy-Import und abgesicherter ECharts-Canvas.
Die fünf Datenquellen können unabhängig laden, ausfallen und alte Daten behalten.
Lokale Fehlergrenzen isolieren Live-Kurse, Marktzahlen, Historie, Hashrate und Halving.
Eine Quellenangabe am Seitenkopf behauptet keine globale Live-Aktualität.

## Lokale Begrüßung

Browserlokale `Date.getHours()`: 05–10 Uhr Guten Morgen, 11–17 Uhr Guten Tag,
18–22 Uhr Guten Abend, sonst Gute Nacht. Ein lokaler Timer trifft die nächste
Grenzuhrzeit und liest Uhrzeit/Zeitzone spätestens alle 30 Sekunden neu.
Focus-, Pageshow- und Sichtbarkeitsevents erfassen Änderungen sofort; verborgen
pausiert der Begrüßungstimer. Es gibt
keine Zeit-API oder Geolokalisierung. Gleiche Begrüßungsstrings lösen keine
laufenden Re-Renders aus. Der initiale Text ist für eine mögliche spätere
Hydration stabil; nach Mount gilt die lokale Uhr. Cleanup entfernt alle Listener
und den Timer.

## Geprüfte Kraken-Verträge

Offizielle Quellen, am 12.11.2026 gelesen:

- [Ticker v2](https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/ticker)
  und [Verbindungsdetails](https://docs.kraken.com/exchange/guides/websockets/introduction).
- [Heartbeat](https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/heartbeat),
  [Status](https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/status)
  und [Reconnect](https://docs.kraken.com/exchange/guides/websockets/reconnection).
- [EEA-Nutzungsbedingungen](https://www.kraken.com/legal/eea-terms), insbesondere
  Teil A, Abschnitt 11, wirksam seit 14.10.2026: Inhalte einschließlich Preisdaten
  bleiben Kraken zugeordnet; Verwendung für eigene Zwecke ist begrenzt erlaubt,
  andere Zwecke erfordern Erlaubnis. Daraus folgt hier ausschließlich der private,
  zugangsgeschützte Beobachtungsumfang. Das ist keine Freigabe zur Weiterverteilung
  oder kommerziellen Nutzung und keine Bestätigung individueller Vertragsrechte.

Direkter Browser-Socket: `wss://ws.kraken.com/v2`. Eine Verbindung für beide Paare:

```json
{
  "method": "subscribe",
  "params": {
    "channel": "ticker",
    "symbol": ["BTC/EUR", "BTC/USD"],
    "event_trigger": "trades",
    "snapshot": true
  },
  "req_id": 1
}
```

Bestätigung pro Paar: `method: subscribe`, passende `req_id`, `success: true`,
`result.channel: ticker`, erwartetes `result.symbol`, `result.snapshot: true`,
gültige RFC3339-`time_in`/`time_out`. Ohne Bestätigung werden Ticks verworfen.
Ein explizites `success: false` wird als sicherer, eigener Fehlerzustand angezeigt;
Providerfehlertexte gelangen nicht in die Oberfläche.

Snapshot/Update: `{channel: 'ticker', type: 'snapshot' | 'update', data: [...]}`.
Verwendet werden ausschließlich `symbol`, positiver endlicher `last`, optionaler
RFC3339-`timestamp` und endlicher `change_pct`. `last` bleibt der letzte
Handelspreis, unabhängig von `bid`/`ask`. `change_pct` ist die vom Provider
gelieferte 24h-Prozentänderung. Fehlende Zeitfelder oder 24h-Werte bleiben sichtbar
fehlend; es wird kein Providerzeitpunkt erfunden. Zusätzliche Orderbuchfelder
werden verworfen. Nachrichten über 32.768 Zeichen, falsche Typen, Symbole,
Kalenderdaten, Zukunftszeiten über fünf Minuten, nicht endliche Zahlen und
unbekannte Strukturen werden ignoriert. Innerhalb derselben Verbindung werden
rückläufige Providerzeiten verworfen. Arrays enthalten höchstens die beiden
erwarteten Paare ohne Duplikate.

`{channel: 'heartbeat'}` zählt als Verbindungstätigkeit, aktualisiert aber keinen
Kurszeitpunkt. Der eigene Heartbeat-Kanal wird entsprechend seiner speziellen
Referenz automatisch geliefert, nicht separat abonniert. Gültiger v2-Status
unterscheidet `online` von Wartungs-/eingeschränkten Betriebszuständen.

## WebSocket-Service, Zustände und Lebenszyklus

`src/lib/kraken-protocol.ts` kapselt die reine Validierung. `KrakenService` in
`src/lib/kraken.ts` verwaltet Verbindung, Timer und unveränderliche Snapshots;
`useSyncExternalStore` bindet die Oberfläche an. Abonnenten teilen einen Service.
Ohne Verbraucher gibt es keinen Socket. StrictMode-Effektwiederholung wird durch
einen abbrechbaren Verbindungsstart im nächsten Eventloop berücksichtigt.

Zustände: `connecting`, `subscribing`, `live`, `reconnecting`, `stale`,
`disconnected`, `error`, ergänzt um Offline- und Hintergrundhinweis. Jedes Paar
hat einen eigenen Status. Gesamt-„Live“ setzt beide bestätigten, frischen Werte
derselben Verbindung voraus. Ein offener Socket allein genügt nicht. Alter ab
60 Sekunden wird als veraltet markiert; der Watchdog prüft alle fünf Sekunden.
Bei vorhandener Providerzeit gilt zusätzlich deren Alter, sonst ausschließlich
das ausdrücklich als Empfang bezeichnete Datum. Alte Werte behalten Herkunft und
Datum, auch während Reconnect; kein CoinGecko-Fallback.

Nach 20 Sekunden ohne gültige Verbindungstätigkeit wird der Socket ersetzt.
Ausbleibende Trades bei laufenden Heartbeats verursachen keinen Reconnect.
Unbestätigte/fehlende Initialwerte oder Subskriptionsfehler erhalten eine
15-Sekunden-Handshake-Frist, geprüft durch denselben Watchdog. Fehler/Close
führen ebenfalls zur kontrollierten Wiederverbindung.

Exponentielles Backoff: Startbasis fünf Sekunden, Faktor zwei, Basisdeckel 50
Sekunden, zufälliger Faktor 0,8–1,2, Maximum 60 Sekunden. Jitter bleibt auch am
Deckel aktiv. Zurücksetzen erst nach 30 Sekunden gesunder
Live-Daten. Nach Reconnect werden beide Paare vollständig neu abonniert. Alte
Handler sind entfernt, zusätzlich prüfen Handler Socket-Identität und Generation.
Reconnect, Error und Close können keine parallelen doppelten Verbindungen öffnen.
Die erste neue Momentaufnahme wird nicht mit einem Kurs vor der Unterbrechung
verglichen.

Kurze Tabwechsel behalten den Socket. Nach 30 Sekunden verborgenem Betrieb wird
kontrolliert geschlossen; beim Aktivieren wird neu abonniert. Offline schließt
und pausiert Versuche, Online setzt sie fort. Standby-Rückkehr wird über
Sichtbarkeit/Pageshow und den Aktivitätswatchdog erkannt. Unmount entfernt
Browserlistener, Watchdog, Flush-, Highlight-, Hintergrund- und Reconnect-Timer
und schließt den letzten Socket.

Alle gültigen Ticks werden sequenziell verarbeitet. React erhält gebündelte
Kursaktualisierungen im Abstand von 250 ms, keinen Mittelwert. Der Richtungshinweis
vergleicht den letzten empfangenen gültigen Tick mit dessen Vorgänger; er ist
von der separat beschrifteten Kraken-24h-Änderung unabhängig. Keine Änderung
erzeugt keine Hervorhebung. Ein zeitlich begrenzter Pfeil mit Text ergänzt die
positive/negative Farbe. Tabellarische Ziffern, reservierter Platz und Reduced
Motion verhindern unnötige Unruhe. Preisregionen sind keine laufend vorlesenden
ARIA-Live-Regionen; der Verbindungsstatus bleibt zugänglich.

## CoinGecko, Cache und historischer Chart

`GET /api/market/snapshot` mit dem bestehenden `['market', 'snapshot']`-Key
liefert Marktkapitalisierung und 24h-Volumen. Keine zweite dominante
Referenzkursanzeige. Datum, Herkunft, Offline-, Lade-, Fehler- und Alterszustände
sind für diese Kennzahlen gemeinsam sichtbar. Die bestehende Fünf-Minuten-Policy,
Alterswarnung nach zehn Minuten und der gemeinsame Provider-Cooldown bleiben.

Die EUR/USD-Auswahl der Übersicht steuert Kennzahlen und Chart; beide Live-Paare
bleiben gleichzeitig sichtbar. `MarketHistory` nutzt unverändert
`['market', 'history', currency, days]`, Tage 1/7/30/90/365, Start 30 Tage. Die
Marktseite behält ihre eigene bisherige Auswahl. Gültige Cache-Datensätze werden
beim Routenwechsel wiederverwendet. Keine Verlängerung der CoinGecko-Zeitreihe
mit Kraken-Ticks, keine synthetische Produktionskurve. Lazy Loading,
Token-Themes, Tooltips, responsive Achsen und lokale Canvas-Fehlerbehandlung
kommen aus Phase 2.8. Es gibt keine neue Chartbibliothek oder Abhängigkeit.

## Halving

Reine Funktion `halvingAt(height)` nutzt validierte Blockhöhen:
`cycle = floor(height / 210000)`, nächste Höhe `(cycle + 1) * 210000`, Restblöcke
`210000 - height % 210000`, Fortschritt `(height % 210000) / 210000 * 100`.
Auf exakter Halving-Höhe startet bereits der neue Zyklus. Die Subvention wird
mit ganzzahligem Satoshi-Rechtsshift berechnet, ab 64 Halbierungen null. Kein
hartcodierter nächster Termin und keine zusätzliche API-Abfrage: Höhenkarte und
Halving teilen `['bitcoin', 'height']`. Die Anzeige nennt Höhe, Ziel, Rest,
Prozent und Subvention; ein Kalendertermin wird nicht prognostiziert.

## Hashrate-Methodik und neuer API-Vertrag

Geprüft: [offizielle REST-Dokumentation](https://mempool.space/docs/api/rest),
[Provider-Routenimplementierung](https://github.com/mempool/mempool/blob/master/backend/src/api/mining/mining-routes.ts)
und [Bitcoin Core `getnetworkhashps`](https://bitcoincore.org/en/doc/30.0.0/rpc/mining/getnetworkhashps/).
Der Provider liefert `hashrates`, `difficulty`, `currentHashrate`,
`currentDifficulty`. Seine aktuelle Routenimplementierung berechnet
`currentHashrate` über `getNetworkHashPs(1008)`. Die Einheit ist H/s.
Die `1m`-URL begrenzt den mitgelieferten historischen Anteil und bezeichnet
**nicht** die Aggregation dieses aktuellen Schätzwerts. Historische Tageswerte
und Difficulty werden hier nicht verwendet. Die Route setzt eine
Fünf-Minuten-Cachelaufzeit; daraus folgt keine zugesicherte Messfrequenz oder SLA.
Ein gesonderter Quellzeitpunkt für `currentHashrate` fehlt. Provider-Nullwerte bei
fehlendem Core-Zugriff werden als ungültige Daten abgelehnt. Keine belegte feste
öffentliche Requestquote wird behauptet; die Anwendung aktualisiert konservativ.

Neue Route: ausschließlich `GET /api/mining/hashrate`, ohne Queryparameter.
Neues serverseitiges Gate: exakt `MINING_HASHRATE_ENABLED=true`; fehlt das Flag,
bleibt die Ressource gesperrt. Gate und Parameterprüfung gelten auch vor Cachehits.
Keine Änderung an `wrangler.jsonc`, Access oder bestehenden Bitcoin-Endpunkten.

```ts
type HashrateResponse = {
  data: {
    hashesPerSecond: number // positiv, endlich, höchstens 1e30
    estimationBlocks: 1008
    unit: 'H/s'
  }
  source: 'mempool.space'
  updatedAt: string // ursprünglicher erfolgreicher Abruf, kanonisches ISO UTC
}
```

Feste Provider-URL `https://mempool.space/api/v1/mining/hashrate/1m`, frisch
erstellter Accept-Header, keine weitergereichten Credentials oder Redirects.
Transport aus `fetchProviderJson`: Acht-Sekunden-Deadline einschließlich Body,
128 KiB Rohdaten, höchstens 4 KiB normalisierte Antwort. Browser: 15 Sekunden und
4 KiB, unabhängige gemeinsame Vertragsvalidierung. EH/s entsteht ausschließlich
durch Division durch `1e18`. Sichtbare Grundlage: 1.008 Blöcke, ungefähr eine Woche.

Fehlerhülle `{error: {code}}`: 400 `INVALID_REQUEST`, 405 `METHOD_NOT_ALLOWED`
mit `Allow: GET`, 503 `HASHRATE_NOT_RELEASED`, 429 `UPSTREAM_RATE_LIMIT` mit
`Retry-After: 600`, 504 `UPSTREAM_TIMEOUT`, 502 `UPSTREAM_INVALID_RESPONSE` oder
`UPSTREAM_UNAVAILABLE`. Kein Providertext wird reflektiert. `no-store`,
`nosniff`, `DENY`, `no-referrer`, kein CORS und keine Cookies in Antworten.
Logs enthalten nur Ereignis, sichere Fehlerkategorie und gegebenenfalls Status.

Pro Function-Isolate höchstens ein öffentlicher Datensatz und ein laufender
Request, 15 Minuten Cache und Deduplication. Kein Cache API, KV, D1 oder Durable
Object. Dieser Best-Effort-Cache garantiert keine globale Providerquote.
Browserkey `['mining', 'hashrate']`: 15 Minuten Frische/Polling nur im Vordergrund,
eine Stunde GC, Alterswarnung nach 30 Minuten. Originales Abrufdatum bleibt bei
Servercachehits erhalten. 429 pausiert diese Ressource zehn Minuten, auch nach
Remount; kein Retry-Loop und kein Einfluss auf CoinGecko oder Blockchain.
Der Adapter ist für eine spätere Mining-Integration wiederverwendbar.

## Sicherheit, Datenschutz und CSP

Der Browser verbindet sich unmittelbar mit Kraken. Dabei erhält Kraken die
öffentliche Client-IP und normale TLS-/WebSocket-Verbindungsmetadaten. Es gibt
keinen Schlüssel, kein Konto, keine Trading-Nachricht und keine Speicherung des
Streams. Keine Cloudflare-Access-Tokens oder API-Secrets werden an Kraken
übertragen. Ein aufklappbarer Hinweis erklärt dies direkt im Kursbereich.
Die üblichen browserverwalteten Metadaten lassen sich durch den JS-Socket nicht
vollständig unterdrücken.

Im Repository existierte bisher keine CSP. `public/_headers` ergänzt gezielt
`Content-Security-Policy: connect-src 'self' wss://ws.kraken.com/v2` ohne Wildcard
oder andere neue Hosts. Andere Sicherheitsheader bleiben bestehen. Falls eine
CSP zusätzlich extern über Cloudflare gesetzt wird, muss der Betreiber dort
dieselbe gezielte Freigabe prüfen: mehrere Richtlinien wirken gemeinsam. Eine
lokale Headerprüfung beweist keine wirksame Produktionsrichtlinie.

## Verifikation und Referenzen

Alle automatisierten Daten sind kontrollierte synthetische Fixtures. WebSocket-
Mocks öffnen keine echte Verbindung. Die gemeinsame Browserfixture fängt alle
WebSockets ab und verweigert unerwartete externe Verbindungen. API-Fixturezeiten
folgen der jeweiligen kontrollierten Browseruhr, damit Validierungsfehler durch
unterschiedliche Testuhren keine Erfolgsbilder verfälschen.

Abgedeckt: Begrüßungsgrenzen und Cleanup; Halving-Grenzen und Satoshi-Rundung;
v2-Parser und Preis-/Zeitvalidierung; beide Paare; steigende/fallende/gleiche Ticks;
UI-Bündelung; Heartbeat gegen Tickalter; Bestätigungen und Fehler; Backoff/Jitter;
alte Socket-Nachrichten; Offline/Online; kurze/lange Tabwechsel; StrictMode;
vollständiges Cleanup; simulierte sechs Stunden ohne Socket-/Timerwachstum;
Hashrate-Validierung, Begrenzung, Body-Timeout, Cache, Releasegate und Cooldown;
Quellenfehler-Isolation; Routen-/Währungs-/Zeitraumwechsel und Cachewiederverwendung.
Pages-Tests führen auch den kompilierten Worker mit interceptetem Provider aus.

Browserprüfungen: 320, 390, 768, 1440 und 1920 px in Dark/Light; 200 % Text bei
320 px; Reduced Motion; Tastatur; keine horizontalen Seitenüberläufe; konstante
Preisgeometrie. Referenzbilder mit sichtbarem OV-210-Fixturehinweis:

- [Desktop Dark](screenshots/phase-2.10/overview-1440-dark-fixture.png)
- [Desktop Light](screenshots/phase-2.10/overview-1440-light-fixture.png)
- [Mobil Dark](screenshots/phase-2.10/overview-390-dark-fixture.png)
- [Mobil Light](screenshots/phase-2.10/overview-390-light-fixture.png)

Abschließende lokale Prüfergebnisse:

| Prüfung                | Ergebnis                                                |
| ---------------------- | ------------------------------------------------------- |
| `npm run lint`         | Erfolgreich, keine Warnungen                            |
| `npm run format:check` | Erfolgreich                                             |
| `npm run typecheck`    | Alle vier TypeScript-Konfigurationen erfolgreich        |
| `npm test`             | 732 Tests in 31 Dateien erfolgreich                     |
| `npm run build`        | Produktionsbuild erfolgreich                            |
| `npm run pages:check`  | Worker erfolgreich kompiliert, ohne Deployment          |
| `npm run test:e2e`     | 153 Chromium-/Pages-Tests erfolgreich, etwa 1,5 Minuten |
| `git diff --check`     | Erfolgreich                                             |

Nach der letzten zusätzlichen Verschärfung der Statusfeldvalidierung wurden die
gesamten Unit-/API-Tests und der Build erneut ausgeführt; Übersicht, Hashrate und
Pages-Header wurden zusätzlich mit 32 erfolgreichen Browser-/Workerprüfungen
gezielt am abschließenden Build geprüft.
Verwendete Laufzeit: gepinntes Node **22.22.2**, npm **10.9.7**,
lokal im ignorierten `.wrangler/toolchain` statt einer Änderung am System-Node.
Abhängigkeiten und Lockfile bleiben unverändert. Wrangler benötigt außerhalb der
Windows-Dateisandbox Lesezugriff für esbuild und lokale Workerd-/Browserprozesse;
dies ist ausschließlich lokale Prüfung, Telemetrie ist abgeschaltet.

## Betriebsgrenzen und manuelle Freigabe

| Evidenz                      | Status                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------- |
| Implementiert                | Übersicht, Kraken-Service, Hashrate-API und Verträge                             |
| Automatisiert getestet       | Kontrollierte Parser-, Service-, UI-, Worker- und Browserfixtures                |
| Mit echten Providern geprüft | Offizielle Dokumentation/Quellcode geprüft; kein echter Stream-/API-Betriebstest |
| In Produktion verifiziert    | Nicht durchgeführt                                                               |

Vor dem Betrieb erforderlich:

1. PR manuell prüfen und mergen. Kein Auto-Merge. Cloudflare-Builds für diesen
   Arbeitspush per `[CF-Pages-Skip]` im Commit unterdrücken, entsprechend der
   [offiziellen GitHub-Integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/);
   keine Deployment-API.
2. Providerbedingungen für den konkreten privaten Betrieb und den vorgesehenen
   Zugriffskreis bestätigen. Öffentliche oder kommerzielle Weitergabe ist nicht
   durch diese Implementierung freigegeben. Es gibt keine lokale Tickhistorie.
3. Im vorgesehenen Preview-Umfeld `MINING_HASHRATE_ENABLED=true` nach separater
   Freigabe setzen; für Production separat entscheiden. Abschalten durch Entfernen
   oder `false`. Die bestehenden vier Marktflags und das CoinGecko-Secret erhalten.
4. Access-Schutz für Custom-Domain, Pages-Domain, Hash-URLs und Branch-Aliase
   anhand der [bestehenden Checkliste](cloudflare-pages-verification.md) prüfen.
   Kein anonymer Zugriff auf HTML, Assets oder API. Keine Access-Regeln ändern.
5. Extern gesetzte CSP kontrollieren, freigegebenes Preview deployen und dort
   authentifiziert beide echten Kraken-Paare, Providerzeiten, Reconnect,
   Hintergrundbetrieb, reales Hashrate-Schema, Quellenfehler und CoinGecko prüfen.
   Ein gestörter Stream darf keinen alten Kurs als live kennzeichnen.
6. Erst nach separater Produktionsfreigabe deployen und die wirksamen Flags,
   Securityheader, Access und echten Quellen nochmals prüfen.

Bekannte Grenzen: Betrieb hängt von Internetzugang/Providerverfügbarkeit und
korrekter Clientuhr ab; Frischegrenzen sind lokale Anzeigeentscheidungen und keine
SLA. Hashrate ist eine Schätzung und hat keinen Providerzeitstempel. Cache und
429-Budget sind nicht instanz-/tabübergreifend. Ohne eigenes Hashrate-Releaseflag
zeigt die Karte den expliziten Freigabehinweis. Simulierte sechs Stunden ersetzen
keinen mehrstündigen realen Browser-/Standby-Test. Keine Live-/Access-/Produktions-
Verifikation wird durch Fixtures behauptet.
