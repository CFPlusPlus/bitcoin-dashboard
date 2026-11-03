# Phase 2.8 – Historische Bitcoin-Kursdaten

Stand: 3. November 2026, Europe/Berlin. Ausgangspunkt `be53471`, Branch
`feature/market-historical-data`. Implementierung und Tests verwenden den
bestehenden React-/Pages-/ECharts-Stack ohne zusätzliche Pakete oder Dienste.
Produktive Konfiguration, Access, Snapshot-Freigabe und Deployment bleiben unverändert.

## Endpunkt und Datenvertrag

`GET /api/market/history?currency=eur&days=30` benötigt genau einmal `currency`
(`eur` oder `usd`) und `days` (`1`, `7`, `30`, `90`, `365`). Fehlende, doppelte,
zusätzliche oder nicht kanonische Werte wie `030`, `1e0`, `max` werden mit
400 `INVALID_REQUEST` abgelehnt, bevor ein Providerzugriff stattfindet.
Andere Methoden erhalten 405 mit `Allow: GET`; unbekannte Ressourcen 404.
Der Snapshot akzeptiert weiterhin keine Queryparameter und liefert beide Währungen.

Vertrag v1: [shared/market.ts](../shared/market.ts), gemeinsame Server-/Browserprüfung
in [market-validation.ts](../shared/market-validation.ts). Antwort:

```ts
type HistoryResponse = {
  data: {
    asset: 'BTC'
    currency: 'eur' | 'usd'
    days: 1 | 7 | 30 | 90 | 365
    points: { timestamp: number; price: number }[]
  }
  source: 'coingecko'
  provider: {
    assetId: 'bitcoin'
    market: 'aggregated'
    attributionUrl: 'https://www.coingecko.com/en/api/'
  }
  updatedAt: string
}
```

`timestamp` ist Unixzeit in **Millisekunden**, `price` der unveränderte Fiatbetrag
je BTC. `updatedAt` ist der Zeitpunkt der erfolgreichen Validierung des Abrufs;
Cache-Hits ändern ihn nicht. Der letzte Messpunkt wird separat angezeigt und ist
kein erfundener Provider-Aktualisierungszeitpunkt. Es gibt kein `sourceUpdatedAt`,
weil der Endpunkt keinen solchen Metadatenwert liefert. Zusätzliche Providerfelder,
Marktkapitalisierungen und Volumina gelangen nicht in die Antwort.

Der Adapter ruft ausschließlich
`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=…&days=…`
auf. `interval` wird nie gesetzt. Automatische Auflösung laut
[offizieller Demo-Dokumentation](https://docs.coingecko.com/demo/reference/coins-id-market-chart)
(geprüft am 03.11.2026):

| Auswahl | Tage | Typische Auflösung | Cache-/Frischeziel |
| ------- | ---- | ------------------ | ------------------ |
| 24 h    | 1    | 5 Minuten          | 5 Minuten          |
| 7 T     | 7    | 1 Stunde           | 10 Minuten         |
| 30 T    | 30   | 1 Stunde           | 15 Minuten         |
| 90 T    | 90   | 1 Stunde           | 30 Minuten         |
| 1 J     | 365  | 1 Tag, 00:00 UTC   | 60 Minuten         |

Die Demo-Historie ist auf die letzten 365 Tage beschränkt. Die tatsächlichen
Messpunkte bestimmen den Verlauf. Keine Interpolation, Glättung, synthetischen
Ersatzwerte oder Annahmen über eine höhere Auflösung. Die Frischeziele sind
Anwendungsentscheidungen; die aktuelle Demo-Referenz nennt keine verbindliche
Cache-Dauer pro Zeitraum. Kontingente bleiben tarif-/kontobezogen und werden
durch die Optimierungen nicht garantiert eingehalten.

## Validierung und Sicherheit

- Fester Host und Asset; URL-Konstruktion ausschließlich mit geprüften Enumerationen.
- API-Key nur als serverseitiger `x-cg-demo-api-key`-Header. Browser-Cookies,
  Authorization und Access-JWTs werden nicht an CoinGecko weitergereicht.
- Keine Redirects, ein Providerversuch, Timeout nach 8 Sekunden einschließlich Body.
- Exakter JSON-Medientyp (`application/json`, optionale Parameter), striktes UTF-8,
  begrenztes Streaming: 1 MiB Providerantwort, 256 KiB normalisierte Browserantwort,
  höchstens 3.000 Messpunkte. Fehlerantworten im Browser maximal 4 KiB.
- Mindestens zwei Messpunkte; jeder Kurs positiv, endlich und höchstens
  `Number.MAX_SAFE_INTEGER`; Zeitstempel sichere Ganzzahlen seit Bitcoin-Genesis.
- Strikt aufsteigende, eindeutige Zeitstempel; keine stille Sortierung, Entfernung,
  Rundung oder Reparatur. Ungültige Reihen werden vollständig abgelehnt.
- Zeitfenster relativ zum ursprünglichen Abruf: maximal 5 Minuten Zukunft;
  Randtoleranz 10 Minuten (24 h), 2 Stunden (7–90 T), 1 Tag (1 J), jeweils plus
  5 Minuten Uhrtoleranz. Die erste Messung muss nahe dem Beginn liegen, die letzte
  nahe dem Abruf; mindestens 90 % des angefragten Fensters müssen abgedeckt sein.
  Das berücksichtigt Stunden-/UTC-Tagesgrenzen, lehnt alte oder kurze Fragmente ab.
- Browser validiert zusätzlich Währung, Zeitraum, Asset und feste Attribution.
- Logs enthalten nur Kategorie, Ressource und gegebenenfalls HTTP-Status;
  keine Providertexte, URLs, Secrets oder Browserdaten.
- Antworten behalten `no-store`, `nosniff`, `DENY` und `no-referrer` sowie kein CORS.

## Fehlervertrag

Bestehendes Format `{ error: { code, retryAfterSeconds? } }` und dieselben Codes:

| Code                               | HTTP      | Bedeutung                                                      |
| ---------------------------------- | --------- | -------------------------------------------------------------- |
| `INVALID_REQUEST`                  | 400       | Ungültige Parameter                                            |
| `NOT_FOUND` / `METHOD_NOT_ALLOWED` | 404 / 405 | Ressource / Methode                                            |
| `MARKET_NOT_CONFIGURED`            | 503       | Serverseitiges Secret fehlt oder ist leer                      |
| `MARKET_NOT_RELEASED`              | 503       | Eigenes Feature-Flag ist nicht exakt `true`                    |
| `UPSTREAM_RATE_LIMIT`              | 429       | 10 Minuten Pause; `Retry-After: 600`, `retryAfterSeconds: 600` |
| `UPSTREAM_TIMEOUT`                 | 504       | Abruf-/Body-Timeout                                            |
| `UPSTREAM_CONFIGURATION`           | 502       | Provider 401/403 oder sonstiger 4xx außer 429                  |
| `UPSTREAM_INVALID_RESPONSE`        | 502       | Schema, Größe, Medientyp, UTF-8, JSON oder Redirect ungültig   |
| `UPSTREAM_UNAVAILABLE`             | 502       | Netzwerkfehler, Provider 5xx oder interner Fehler              |

Browserseitige 401/403 werden als Access-/Anmeldefehler behandelt. HTML und
Redirect-Antworten führen zu einer sicheren API-/Anmeldemeldung, ohne sie als
Providerkonfigurationsfehler auszugeben. Browser-Timeout 15 Sekunden; maximal
ein Retry nach 5–10 Sekunden ausschließlich bei transienten Fehlern.

## Tatsächlich implementiertes Caching

**Kein zuverlässiger gemeinsamer Edge-Cache hinter Access.** Cloudflare sagt
ausdrücklich, dass die
[Cache API für Workers hinter Access nicht verfügbar ist](https://developers.cloudflare.com/workers/runtime-apis/cache/).
Für Pages Functions wäre sie sonst verfügbar, aber nur pro Rechenzentrum.
Deshalb verwendet diese Phase weder `caches.default` noch Cache Rules,
öffentliches CDN-Caching, KV, Durable Objects oder eine Datenbank.

Als begrenzte Optimierung hält jede laufende Function-Instanz bis zu zehn
validierte, öffentliche Datensätze (2 Währungen × 5 Zeiträume) und je Kombination
höchstens eine laufende Anfrage. Identische Anfragen teilen dieses Promise;
gültige Cache-Hits verursachen **keinen** Providerrequest. Die Tabelle oben
bestimmt die TTL. Fehler werden nicht als Daten gecacht. Secret und Feature-Flag
werden vor jedem Cachezugriff geprüft. Der Cache enthält keine Requests,
Schlüssel oder Authentifizierungsdaten. Er geht bei Instanzwechsel verloren.
Verschiedene Instanzen/Standorte und Kaltstarts können zusätzliche Providerabrufe
verursachen; weder Cache-Hits noch globale Anfragebündelung sind garantiert.

Ein Provider-429 sperrt neue Snapshot- und Historienabrufe in derselben Instanz
für zehn Minuten. Gültige Historien-Cachetreffer bleiben verfügbar. Bereits
laufende Anfragen können noch abschließen. Dieser Schutz ist keine globale
Kontingentverwaltung. Der bisherige Snapshot-Abruf und seine Werte bleiben
unverändert; hinzu kommt nur die gemeinsame Providerpause.

Der Client verwendet `['market', 'history', currency, days]`. React Query bündelt
gleiche laufende Queries und verwendet frische Einträge erneut. `staleTime`
berücksichtigt das **ursprüngliche** `updatedAt`, damit ein Servercachetreffer
nicht erneut eine volle Frischeperiode vortäuscht. `gcTime` ist mindestens
30 Minuten, sonst zweimal TTL (bis zwei Stunden). Kein History-Polling und kein
Focus-Refetch; veraltete Einträge dürfen beim erneuten Mount/Reconnect geladen
werden. Die manuelle Aktualisierung unterliegt der bestehenden gemeinsamen
60-Sekunden-Pause. Alle Marktqueries desselben QueryClient teilen den
10-Minuten-429-Cooldown auch nach Query-GC. Dieser gilt pro Browser-QueryClient,
nicht über Tabs, neue Seitenladungen oder Nutzer hinweg.

## Oberfläche

Der Markt verwendet genau eine Währungsauswahl mit Zustand in der Marktseite.
Der Snapshot erhält Props und benötigt beim Fiatwechsel keinen neuen Request.
Der Chart startet bei 30 Tagen; Zeitraumtasten mit `aria-pressed` sind per Tab,
Enter und Leertaste bedienbar. Neue, noch nicht geladene Kombinationen zeigen
einen Ladebereich. Bei Aktualisierungsfehlern bleibt ausschließlich der passende
vorherige Datensatz sichtbar und wird als veraltet gekennzeichnet. Eine
Alterswarnung erscheint zusätzlich ab zweimal TTL, auch ohne neuen Abruf.

ECharts verwendet reale Zeit-/Preispaare, automatische Y-Skalierung ohne
erzwungenen Nullpunkt, deutsche Datum-/Währungsformatierung, Touch-/Maus-Tooltips
und semantische Tokens für beide Themes. Der Canvas ist responsiv; die vorhandene
Grid-Aufteilung und übrigen Marktkarten sind erhalten. Die Übersicht behält ihren
ausdrücklich synthetischen DemoChart. Beide Charts teilen die abgesicherte
Canvas-Lebenszykluskomponente: Instanzwiederverwendung bei Daten-/Themewechsel,
ResizeObserver, StrictMode-Bereinigung und lokale Fehlergrenze auch für Resize
und abgelehnte Lazy-Imports.

## Cloudflare-Konfiguration und Freigabe

Es wurden keine Secrets gelesen oder gesetzt, keine Cloudflare-Einstellungen
geändert und keine Deployments oder Merges durchgeführt. `wrangler.jsonc` bleibt
unverändert, insbesondere das vorhandene Snapshot-Flag. Das neue Historien-Flag
ist nicht gesetzt und daher gesperrt. Ein Secret oder Snapshot-Flag allein
aktiviert die Historie nicht.

Benötigte Schritte **nach separater Prüfung und Freigabe**:

1. Im Cloudflare-Dashboard **Workers & Pages → bitcoin-dashboard → Settings →
   Variables and Secrets** das gewünschte Umfeld (zunächst Preview) wählen.
2. Das bestehende serverseitige Secret `COINGECKO_DEMO_API_KEY` für dieses Umfeld
   verwenden; falls es fehlt, dort als Secret ergänzen. Niemals `VITE_…`,
   Frontendkonfiguration oder Git verwenden.
3. Im selben Umfeld die nicht geheime Variable `MARKET_HISTORY_ENABLED` auf
   exakt `true` setzen. `MARKET_SNAPSHOT_ENABLED` nicht verändern.
4. Erst nach Deploymentfreigabe die geprüfte Branch-Version im gewählten Umfeld
   deployen. Access-Schutz einschließlich Preview-Domains beibehalten und dort
   authentifiziert EUR/USD, alle Zeiträume, Quellenzeiten und reale Providerdaten
   prüfen. Diese Liveprüfung ist durch gemockte Tests nicht ersetzt.
5. Für Production sind eigene Freigabe, Umfeldvariable und Deployment nötig.
   Zum Abschalten Flag entfernen oder auf `false` setzen und die wirksame
   Umgebungskonfiguration per erneutem Deployment prüfen.

Lokale reale Tests können dieselben Variablen in einer ignorierten `.dev.vars`
verwenden. Die automatisierten Tests benötigen sie nicht; sie intercepten jeden
Providerzugriff und verwenden ausschließlich synthetische Fixtures.

## Verifikation und Grenzen

Die Tests decken den gemeinsamen Datenvertrag, alle Parameterkombinationen,
Gate-/Secret-Prüfungen, bösartige Daten, Größenlimits, Timeout, Providerstatus,
Cache-Hit/-Trennung/-Ablauf und gemeinsame Cooldowns ab. UI-Tests prüfen
Währungs-/Zeitraumwechsel, fehlende/falsche Daten, Wiederholung, veraltete Daten,
Time-/Währungsachsen, Tooltips und Canvas-Cleanup. Playwright prüft die reale
Oberfläche in Chromium und den kompilierten Pages-Worker mit interceptetem
Provider. Die Testbefehle entsprechen der README.

Offen bleibt nur die freizugebende Live-/Access-/Kontoprüfung im Zielumfeld sowie
die bewusst fehlende instanzübergreifende Cache-/Quota-Garantie. Keine Erweiterung
auf bezahlte Funktionen, mehr als 365 Tage, Indikatoren oder weitere Assets.

## Abschließende Prüfergebnisse

Alle Prüfungen wurden lokal am 03.11.2026 erfolgreich ausgeführt (unter Windows
jeweils mit `npm.cmd`). Tatsächliche Laufzeit: Node 26.11.1, npm 11.20.0;
die in der README gepinnte CI-Laufzeit wurde hier nicht zusätzlich installiert.
Abhängigkeiten und Lockfile wurden nicht geändert.

| Prüfung                | Ergebnis                                                       |
| ---------------------- | -------------------------------------------------------------- |
| `npm run typecheck`    | Frontend, Functions, Functions-Tests und E2E-Typen erfolgreich |
| `npm run lint`         | Erfolgreich, keine Warnungen                                   |
| `npm run format:check` | Erfolgreich                                                    |
| `npm run test`         | 504 Tests in 22 Dateien erfolgreich                            |
| `npm run build`        | Erfolgreicher Produktionsbuild                                 |
| `npm run pages:check`  | Worker erfolgreich kompiliert, ohne Deployment                 |
| `npm run test:e2e`     | 128 Chromium-/Pages-Tests erfolgreich, ca. 1,2 Minuten         |
| `git diff --check`     | Erfolgreich                                                    |

Wrangler benötigte für den lokalen Compiler/Testserver Zugriff außerhalb der
Dateisandbox. Logs wurden nach `.wrangler/analysis-logs` umgeleitet und Telemetrie
für diese Läufe abgeschaltet. Das war ausschließlich lokale Verifikation.
Alle API-Antworten in Tests sind gemockt; kein echter Key oder Providerrequest
war erforderlich. Bestehende Snapshot-, Blockchain-, Mining-, Shell- und
Demo-Chart-Prüfungen sind ebenfalls erfolgreich.

Visuell geprüfte Referenzen (ausschließlich synthetische Testfixtures):
[Desktop Dark](screenshots/phase-2.8/history-1440-dark.png),
[Mobile Light](screenshots/phase-2.8/history-390-light.png),
[320 px Dark](screenshots/phase-2.8/history-320-dark.png),
[320 px bei 200 % Textgröße](screenshots/phase-2.8/market-320-text-200-light.png).
Die übrigen reproduzierbaren Screenshots liegen nach dem Testlauf unter
`test-results/phase-2.8/` und sind ignorierte Testartefakte.

## Geänderte Dateien und Git

Neu erstellt:

- `functions/lib/market-cache.ts`
- `src/components/chart-canvas.tsx`
- `src/components/market/history.tsx`
- `src/components/market/history-chart.tsx`
- `src/test/market-history-fixtures.ts`
- `src/test/market-history-contract.test.ts`
- `src/test/market-history-functions.test.ts`
- `src/test/market-history-ui.test.tsx`
- `src/test/history-chart-load-error.test.tsx`
- `e2e/market-history.spec.ts`
- `e2e/pages-market-history.spec.ts`
- `docs/phase-2.8-market-history.md`
- Die vier oben verlinkten PNG-Referenzen in `docs/screenshots/phase-2.8/`.

Geändert:

- Backend: `functions/api/market/[resource].ts`, `functions/lib/coingecko.ts`.
- Vertrag: `shared/market.ts`, `shared/market-validation.ts`.
- Frontend: `src/pages/market.tsx`, `src/components/market/snapshot.tsx`,
  `src/components/demo-chart.tsx`, `src/lib/market.ts`, `src/styles/market.css`.
- Bestehende Tests: `src/test/market-functions.test.ts`, `src/test/market-ui.test.tsx`,
  `src/test/demo-chart.test.tsx`, `src/test/error-boundaries.test.tsx`.
- Browser-Tests: `e2e/fixtures.ts`, `e2e/market.spec.ts`, `e2e/pages-market.spec.ts`.
- Typprüfung: `tsconfig.json`, `tsconfig.functions-tests.json`.
- Dokumentation: `README.md`, `docs/phase-2.7-market-snapshot.md`.

Keine Dateien entfernt. `functions/lib/upstream.ts`, `functions/lib/response.ts`,
`src/components/dashboard.tsx`, QueryClient-Grundkonfiguration, Design-Tokens,
Fehlergrenze, übrige Markt-Platzhalter und `wrangler.jsonc` bleiben unverändert.
Die Lebenszyklustests wurden fachlich angepasst: Daten-/Themewechsel aktualisieren
jetzt dieselbe ECharts-Instanz; Unmount und Fehler müssen weiterhin alle Ressourcen
genau einmal freigeben. Browser-Tests warten nach Resize auf den Observer und vor
Zeitsprüngen auf den abgeschlossenen Routenwechsel.

Lokale Implementierungscommits auf `feature/market-historical-data`:

- `4eab6bb` – `feat: add gated Bitcoin market history API and bounded caching`
- `ef6cda5` – `feat: replace market demo with shared-currency historical chart`

Dieser Bericht und die Referenzbilder folgen in einem Dokumentationscommit.
Kein Push, Merge, PR oder Deployment wurde ausgelöst; dadurch wurde auch kein
automatischer Cloudflare-Previewbuild durch einen Branch-Push gestartet.
