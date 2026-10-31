# ADR 0002 – Aggregierte Bitcoin-Marktdaten über CoinGecko

Datum: **31. Oktober 2026**. Status: **proposed**.
Umfang: Phase 2.6 / AP2 aus
[Phase 2.4](../phase-2.4-data-function-inventory.md).
Details, Evidenz, Rechnungen und Abnahmekriterien:
[Providerbewertung](../phase-2.6-market-provider-evaluation.md).

## Kontext

Das private Dashboard im öffentlichen Repository hat noch keine echten
Marktdaten. Benötigt werden BTC/USD und BTC/EUR, Marktkennzahlen und getrennte
Preiszeitreihen für 24 h / 7 d / 30 d. Vorhanden sind Pages Functions, Same-Origin,
beidseitige Laufzeitvalidierung, begrenzter Transport und Ressourcenpolicies nach
[ADR 0001](0001-resource-freshness.md), aber kein gemeinsamer Servercache oder
globales Abrufbudget. Access wird außerhalb des Repositorys verwaltet.

## Vorgeschlagene Entscheidung

1. **Provider:** CoinGecko als einzigen aggregierten Marktprovider wählen.
   AP4: ein fester `/coins/bitcoin`-Detailrequest mit deaktivierten Tickers,
   Localization und Sparkline für beide Währungen; AP5: fester
   `/coins/bitcoin/market_chart` nur für die ausgewählte Währung und Spanne.
   Kein FX-Dienst, SDK, Universalframework oder automatischer Börsenfallback.
   [Detailvertrag](https://docs.coingecko.com/demo/reference/coins-id),
   [Historie](https://docs.coingecko.com/demo/reference/coins-id-market-chart).
2. **Datenbedeutung:** Fiat je BTC als aggregierter Referenzkurs. Cap ist der
   Providerwert zur Umlaufmenge, Volumen ist rollierend 24 h in Fiat.
   Währungsbezogene 24-h-/7-d-/30-d-Änderungen werden übernommen, nicht aus
   Charträndern errechnet. ATH und Zeitpunkt gelten je Währung und für die
   Providerabdeckung. Eigener signierter Abstand: `100 × (Preis / ATH − 1)`.
   Keine Aussage über einen ausführbaren Börsenkurs. Historie sind Samples mit
   UTC-ms, keine Kerzen; initial 5 min für 24 h, 1 h für 7/30 d.
3. **Vertrag und Herkunft:** kleine additive Marktmodelle/Validatoren und
   `/api/market/snapshot` sowie `/api/market/history` gemäß Bericht §5.
   `source='coingecko'`, feste Metadaten/Attributions-URL.
   `updatedAt` bleibt erfolgreicher Abruf, Snapshot-`sourceUpdatedAt` ist der
   Marktquellstand; Reihen haben separat `lastPointAt` und keinen erfundenen
   Publikationszeitpunkt. Kernpreise/Quellzeit verpflichtend, optionale Kennzahlen
   explizit null. Zeit-/Geld-/Prozent-/Byte-/Punktgrenzen auf Server und Browser.
4. **Kosten-/Nutzungsrahmen:** Demo nur nach bestätigter Konto- und Rechteprüfung.
   Listenquote: 10.000 Monatscredits; Minutenangaben widersprechen sich
   (100 in Preis-/API-Dokumentation, 30 im Support). Bis Klärung konservativ 30,
   geplante Spitzen höchstens 24/Minute. Ein Erfolg verbraucht einen Credit,
   alle Versuche zählen für das Minutenlimit. Keine kontobestätigte Quote liegt
   vor. Basic ist eine spätere kostenpflichtige Option, kein beauftragter Kauf.
   [Tarife](https://www.coingecko.com/en/api/pricing),
   [Supportabweichung](https://support.coingecko.com/articles/5125303456-what-is-the-rate-limit-for-coingecko-api-public-plan),
   [Credits](https://support.coingecko.com/articles/1864417806-how-does-coingecko-api-count-the-api-usage-credit).
5. **Budget:** 25 % Reserve; im Demo maximal 8.000 geplante Grundabrufe pro
   Kalendermonat, übrige Kontonutzung einbeziehen. Modell B: ein sichtbarer Tab,
   acht Stunden/Tag, inklusive Öffnen/Fokus/manuell 142 Grundabrufe/Tag bzw.
   5.325/30 Tage und 5.503/31 Tage mit Reserve. Zwei solche Tabs passen nicht.
   Keine harte Quote ohne Koordination behaupten. Betreiber muss Nutzungsprofil
   und akzeptiertes Alter bestätigen; Prognose über 80 % löst Neubewertung aus.
6. **Keys:** später nur serverseitiges Pages-Secret in `context.env`, Demoheader
   `x-cg-demo-api-key` am festen Demo-Host. Nie Browser, `VITE_*`, URL, Repository,
   Logs, Dokumentationsbeispiele oder CI-Liveanforderung. Kein Secret wird in
   Phase 2.6 gesucht, angelegt oder geändert.
   [Auth](https://docs.coingecko.com/demo/reference/authentication).
7. **Caching:** bei bestätigtem A/B-Profil kein neuer gemeinsamer Cache;
   Browserqueryspeicher und HTTP-`no-store` erhalten. Cache API wird hinter
   Access nicht als funktionierende Budgetlösung vorausgesetzt: Cloudflare
   dokumentiert die Access-Einschränkung. Zwei anonyme Healthpfade zeigen
   Accessredirects, aber keinen authentifizierten Cachehit. Kein Access-Eingriff.
   Falls Budget/Frequenz/Tarif nicht genügen: AP3 separat; KV ist möglich, aber
   eventual consistent und kein globaler Lock. Zentrale Koordination nur bei
   belegter harter Quote. [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/),
   [Pages-Bindings](https://developers.cloudflare.com/pages/functions/bindings/),
   [KV](https://developers.cloudflare.com/kv/concepts/how-kv-works/).
8. **Intervalle:** Snapshot 5 min, 24-h-Reihe 15 min, 7-/30-d-Reihen 60 min;
   Query-stale entspricht Pollintervall. Abruf-/Quellalterswarnungen nach Bericht
   §8 (10/30/120 min), getrennt von GC. Nur sichtbar/online/aktiv pollen;
   stale Rückkehr aktualisiert einmal. Keine sechs Historykeys vorladen.
9. **Fehler:** acht Sekunden Upstream, 15 Sekunden Browser, kein Serverretry.
   Ein Browserretry nur für transiente Fehler nach 5–10 s.
   Provider-429 → eigenes 429 mit sicherem Code, `Retry-After: 600` und
   zehn Minuten Pause für alle Marktkeys eines QueryClients einschließlich
   Remount/manuell. Das ist keine globale Sperre oder Providerzusage.
   Schema-/Konfigurations-/Zugriffsfehler nicht automatisch wiederholen.
   Letzten Erfolg und alte Zeiten erhalten, niemals Demo-/Providerfallback.
10. **Rechte und Attribution:** sichtbares „Powered by CoinGecko“ mit festem
    API-Link. Speicher/Ableitungen vor Integration gegen aktuellen Tarifvertrag
    bestätigen. Terms §6 nennt mindestens täglichen Refresh bei Speicherung,
    Sicherung/Verschlüsselung und Löschung nach Zugangsbeendigung, zugleich
    Einschränkungen zur Kopie/Ableitung. Keine unbegrenzte Archivierung daraus
    ableiten. Kein Rohdatenarchiv im öffentlichen Repo; kurzfristiger Querycache
    und ATH-Ableitung brauchen die konkrete Betreiberklärung.
    [Terms](https://www.coingecko.com/en/api_terms),
    [Attribution](https://brand.coingecko.com/resources/attribution-guide).

## Alternativen und Folgen

- Zwei CoinGecko-`/coins/markets`-Aufrufe sind kleiner pro Antwort, verdoppeln
  aber das Snapshotbudget für USD/EUR. Nur bei nachgewiesen untragbarer Größe
  oder Detailendpointänderung erneut entscheiden; keine automatische Umschaltung.
- CoinMarketCap ist fachlich geeignet, einschließlich kostenloser Historie im
  aktuellen Basic-Tarif. Punkte-/Währungscredits und zusätzlicher ATH-Vertrag
  machen den Pfad aufwendiger; konkrete Speicher-/Attributionsrechte sind nicht
  belegt. Reservekandidat bei gescheiterter CoinGecko-Freigabe.
- Kraken ist als Börsenquelle geeignet, liefert aber weder globale Cap noch ein
  aggregiertes ATH; 720 jüngste OHLC-Kerzen begrenzen die Historie. Kein
  semantisch gleichwertiger Fallback.
- KV/DO/Scheduler, WebSockets und dauerhafte Datenarchive werden ohne belegten
  Bedarf nicht eingeführt. Die Folge ist ein bewusst begrenzter Startbetrieb,
  keine Garantie für beliebige Nutzer-/Tabzahlen oder Ausfälle.

AP4 und AP5 bleiben getrennte PRs mit eigener Abnahme. AP4 benötigt keinen
echten Chart; AP5 baut auf dem angenommenen Snapshotvertrag auf. Deterministische
Fixtures, beidseitige Validierung, lokale Pages-Runtime-/UI-Tests und visuelle
AP5-Prüfung sind verbindlich; externe Live-Requests sind keine CI-Voraussetzung.
Der Bericht §11/12 enthält die vollständigen Abnahmekriterien.

## Annahmebedingungen und Überprüfung

`proposed` bleibt bestehen, bis der Betreiber Tarif-/Kontolimits samt anderem
Verbrauch, Nutzungsprofil, Datenalter, Rechte für Anzeige/kurzfristigen Speicher/
Ableitung und Kostenrahmen bestätigt. Vor AP4: eine bereinigte begrenzte
Snapshot-Schema-/Größenprobe im freigegebenen Konto. Vor AP5: Historienberechtigung
und erweitertes Budget bestätigen. Deployter SHA und authentifizierter Accesspfad
sind weiterhin separate Release-Nachweise. Keine stillschweigende Annahme durch
Merge dieses Planungs-PR.

Nach einer Betriebswoche und dem ersten vollständigen Monat Verbrauch prüfen;
vor jedem Paket und mindestens quartalsweise Tarife, Terms und Changelog prüfen.
Wiederholte 429, >80-%-Quotenprognose, zusätzliche Geräte/Nutzer, gröbere oder längere
Historie, öffentliche Nutzung oder geänderte Datenmethodik öffnen die Entscheidung
erneut. Die vorliegende Phase implementiert keine dieser Änderungen.
