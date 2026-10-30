# Phase 1.6 – Abschließendes technisches Audit

Auditdatum: **30. Oktober 2026**. Repository: `CFPlusPlus/bitcoin-dashboard`.

## 1. Executive Summary

**Empfehlung: CONDITIONAL GO.** Das vorhandene Fundament erlaubt den Beginn von
Phase 2. Es wurden keine BLOCKER und keine HIGH-Findings nachgewiesen. Alle acht
beauftragten Qualitätsprüfungen bestehen mit **Node 22.22.2 und npm 10.9.7**:
154 Vitest-Tests sowie 23 Chromium-E2E-Tests sind erfolgreich. Ein vorhandener
GitHub-Actions-Lauf zum geprüften Entwicklungscommit ist ebenfalls erfolgreich.

Die wesentlichen Restpunkte betreffen die Fehlerpfade der echten ECharts-Instanz:
Nach einer fehlgeschlagenen Teilinitialisierung fehlt die Freigabe bereits
erzeugter Ressourcen; Fehler im ResizeObserver erreichen die React Boundary
nicht. Diese Pfade werden von den bestehenden Diagrammtests nicht nachgewiesen.
Sie sollten bei Beginn der Diagramm-/Layoutarbeiten kurzfristig abgesichert
werden. Außerdem unterscheiden sich die Zahlenobergrenzen der beiden Validatoren.
Keiner dieser Befunde belegt einen Ausfall des gegenwärtigen Normalbetriebs.

Die Freigabe betrifft die Weiterentwicklung. Sie ist keine vollständige externe
Sicherheitsfreigabe für Cloudflare Access. Die vom Betreiber gelieferten
anonymen Prüfungen sind positive externe Evidenz für die konkret geprüften
Adressen und Pfade; weitere Aliasse, Dashboard-Policies, berechtigte Anmeldungen
und künftige Deployments bleiben gesondert zu prüfen.

Dieser PR enthält ausschließlich diesen Bericht. Es wurden keine Findings
implementiert, keine Abhängigkeiten aktualisiert und keine Cloudflare-Einstellungen
oder Deployments geändert.

## 2. Geprüfter Commit und Auditumfang

- Ursprünglicher lokaler HEAD und geprüfter Entwicklungscommit:
  [`2ce4d206f1a432be2f37ea9b33c0358cfbd1c054`](https://github.com/CFPlusPlus/bitcoin-dashboard/commit/2ce4d206f1a432be2f37ea9b33c0358cfbd1c054).
- Nach Abruf der Remote-Refs aktueller `main` und Basis des Auditbranches:
  [`9a20a1084cf7d68105e62e485f4d95e0ad183ab3`](https://github.com/CFPlusPlus/bitcoin-dashboard/commit/9a20a1084cf7d68105e62e485f4d95e0ad183ab3)
  (Merge von Phase 1.5). `git diff HEAD origin/main` war vor Branchwechsel leer:
  Beide Commits haben denselben Dateistand. Sämtliche hier angegebenen
  Codezeilen beziehen sich auf diesen Stand vor Hinzufügen des Berichts.
- Separater Branch: `feature/phase-1.6-final-audit`, von diesem `origin/main`.
- Geprüft: sämtliche Anwendungs-, Shared-, Functions- und Testmodule,
  Toolchain-/Build-/Routing-/Header-Konfiguration, Lockfile, Workflow, README
  und beide bisherigen technischen Dokumente.

Methodik: manuelle Verfolgung der Modulabhängigkeiten und Daten-/Fehlerpfade,
Ausführung der vorhandenen Gates, npm-Registry-Abfragen, Prüfung eines realen
CI-Laufs und kontrollierte zusätzliche Fehler-Injektionen. Dokumentationsaussagen
wurden mit Code und Ergebnissen verglichen. Offizielle Referenzen werden dort
verlinkt, wo die Bewertung vom Framework- oder Plattformverhalten abhängt.

Die zusätzlichen lokalen Proben transpilierten unveränderte Quellmodule mit dem
vorhandenen TypeScript-Compiler und luden sie mit kontrollierten Hook-/ECharts-
bzw. Fetch-Doubles. Sie prüften Teilinitialisierung, Resize-Callback,
Validatorgrenzen und ein bereits abgebrochenes eingehendes Request-Signal.
Der Hilfscode liegt ausschließlich im ignorierten `.wrangler/audit/`; er gehört
nicht zum PR und ersetzt keinen React-/Browser-Integrationstest. Die Findings
enthalten zusätzlich die unabhängig nachvollziehbare Code-Evidenz.

## 3. Ergebnisse der Qualitätsprüfungen

Windows/PowerShell blockiert hier `npm.ps1`; verwendet wurde `npm.cmd`.
Die Hostinstallation ist Node 26.11.1/npm 11.20.0. Ein erster Lauf damit bestand
Installation, Lint, Format, Typprüfung, Vitest und Vite-Build. Wrangler und
E2E-Serverstart scheiterten zunächst an Sandbox-Dateirechten, unter anderem
Verzeichnistraversierung und dem Wrangler-Logverzeichnis. Das ist kein
nachgewiesener Projektfehler.

Anschließend wurde die projektkonforme Toolchain temporär über npm exec bezogen,
ohne Änderung der globalen Installation, des Manifests oder Lockfiles. Mit
freigegebenem Dateizugriff wurde die gesamte Folge erneut ausgeführt:

```powershell
npm.cmd exec --yes --package=node@22.22.2 --package=npm@10.9.7 -- cmd /d /c "node --version && npm.cmd --version && npm.cmd ci && npm.cmd run lint && npm.cmd run format:check && npm.cmd run typecheck && npm.cmd test && npm.cmd run build && npm.cmd run pages:check && npm.cmd run test:e2e"
```

Die ausgegebenen Versionen waren `v22.22.2` und `10.9.7`. Die offizielle
[Node-Archivseite](https://nodejs.org/en/download/archive/v22.22.2) bestätigt
die Zuordnung dieser npm-Version. Chromium war lokal bereits verfügbar.

| Prüfung                | Ergebnis mit vorgesehener Toolchain                                  | Aussage                                                      |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `npm ci`               | PASS; 300 Pakete hinzugefügt, 301 geprüft, 0 bekannte Schwachstellen | Lockfile installierbar; kein Engine-Warning                  |
| `npm run lint`         | PASS                                                                 | Keine Fehler oder Warnungen                                  |
| `npm run format:check` | PASS                                                                 | Vorhandener Projektstand Prettier-konform                    |
| `npm run typecheck`    | PASS                                                                 | Frontend, Functions, Functions-Tests und E2E jeweils geprüft |
| `npm test`             | PASS; 154 Tests in 9 Dateien, 4,05 s                                 | Kontrollierte Unit-/DOM-/Vertragstests                       |
| `npm run build`        | PASS; einschließlich erneuter Typechecks                             | Produktionsbuild erzeugt                                     |
| `npm run pages:check`  | PASS; `Compiled Worker successfully`                                 | Functions erfolgreich gebündelt                              |
| `npm run test:e2e`     | PASS; 23 Tests, ein Chromium-Worker, 8,2 s                           | Lokale Pages-/Browserintegration                             |

Vite meldete 348,09 kB/109,70 kB gzip für den initialen JS-Chunk und
497,40 kB/168,63 kB gzip für den separaten Diagrammchunk; CSS 15,67 kB/4,22 kB
gzip. Keine 500-kB-Chunkwarnung in diesem Lauf. Die Zahlen sind gemessene
Buildartefakte, keine Messung von Ladezeit oder Nutzererlebnis.

Die Prüfungen wurden einmal vollständig mit der festgelegten Toolchain
ausgeführt. Daraus folgt keine statistische Aussage zu Flakiness oder allen
unterstützten Betriebssystemen. Der anfängliche Node-26-Lauf ist nur ergänzende
Evidenz, keine Erweiterung der unterstützten Toolchain.

## 4. Priorisierte Findings

**0 BLOCKER, 0 HIGH, 3 MEDIUM, 3 LOW.** Bestätigte Kontrollflussfehler sind von
bewussten Grenzen und optionaler Härtung unterschieden. Fehlende externe
Verifikation wird in Abschnitt 11 geführt und nicht als bewiesene Lücke gezählt.

### A16-01 – MEDIUM – Ressourcenleck bei fehlgeschlagener Chart-Initialisierung

- **Dateien/Zeilen:** `src/components/demo-chart.tsx:19–62`, insbesondere
  `21–23` und `56–60`; `src/test/error-boundaries.test.tsx:23–28, 135–147`.
- **Status:** Bestätigter Fehlerpfad; kein beobachteter Fehler im Normalbetrieb.
- **Beschreibung:** Nach erfolgreichem `init()` können `setOption()`, die
  Observer-Erzeugung oder `observe()` werfen. Die Effect-Cleanup-Funktion wird
  erst danach zurückgegeben. Bei vorherigem Throw kann React diese Funktion
  nicht registrieren; die bereits erzeugte ECharts-Instanz wird nicht disposed.
- **Auswirkung:** Die Boundary kann einen Fallback anzeigen, während Chart-
  Ressourcen zurückbleiben. Wiederholte Retries können weitere Instanzen
  zurücklassen. Der normale Unmount-/Themewechselpfad ist dagegen korrekt.
- **Nachweis:** Die kontrollierte Probe ließ `init()` eine Instanz mit
  gezähltem `dispose()` zurückgeben und `setOption()` werfen. Der originale
  Effect warf erwartungsgemäß; `dispose` wurde **0-mal** aufgerufen. Der
  vorhandene Chart-Boundary-Test wirft bereits beim Rendern eines gemockten
  Diagramms und führt diesen Effect überhaupt nicht aus.
- **Empfehlung:** Teilinitialisierung mit garantierter Freigabe absichern;
  auch einen bereits erzeugten Observer bei Setupfehlern aufräumen. Einen
  gezielten Test mit erfolgreichem `init`, werfendem `setOption` und genau einer
  Freigabe sowie Wiederherstellung ergänzen.
- **Phase 2:** Kein Startverbot; kurzfristig beim Einstieg in Chart-/Layoutarbeit
  beheben, bevor dieser Lebenszyklus erweitert wird.

### A16-02 – MEDIUM – Resize-Fehler umgehen die lokale Chart-Fehlerbehandlung

- **Dateien/Zeilen:** `src/components/demo-chart.tsx:56–57`;
  `src/components/dashboard.tsx:87–97`;
  `src/test/error-boundaries.test.tsx:23–28, 135–147`.
- **Status:** Bestätigte Abdeckungslücke im Kontrollfluss; ein spontaner
  ECharts-Resizefehler wurde nicht beobachtet.
- **Beschreibung:** Der ResizeObserver ruft `chart.resize()` ohne lokale
  Fehlerweitergabe auf. Dieser spätere Browser-Callback läuft außerhalb des
  React-Render-/Effect-Aufrufs. Eine umgebende Error Boundary fängt solche
  asynchronen Fehler nicht ab; siehe die
  [React-Dokumentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).
- **Auswirkung:** Bei einem Resizefehler erscheint kein Chart-Fallback mit
  Retry. Ein Fehler kann unhandled gemeldet werden, während ein defektes Diagramm
  sichtbar bleibt. Navigation fällt dadurch nicht zwangsläufig aus.
- **Nachweis:** Die Probe registrierte den echten Callback mit einem
  Observer-Double und ließ dessen Chart-`resize` werfen. Der Fehler verließ den
  Callback unverändert. Im Code gibt es keinen Catch oder Zustandsübergang zur
  Boundary. Die bestehenden Boundary-Tests ersetzen den gesamten Chart; die
  E2E-Suite injiziert keinen Resizefehler.
- **Empfehlung:** Callbackfehler kontrolliert in einen React-Fehlerzustand
  überführen und dabei Ressourcen freigeben. Einen gezielten Test für
  Observer-Fehler, lokalen Fallback, Retry und weiterhin nutzbare Navigation
  hinzufügen. Fehler nicht pauschal verschlucken.
- **Phase 2:** Kein Startverbot; zusammen mit A16-01 kurzfristig vor einer
  Erweiterung des Diagrammverhaltens absichern.

### A16-03 – MEDIUM – Unterschiedliche numerische Grenzen der Validatoren

- **Dateien/Zeilen:** `functions/lib/mempool.ts:10–18, 57–74, 133–134`;
  `shared/bitcoin-validation.ts:10–18, 52–59, 74`.
- **Status:** Bestätigte Vertragsinkonsistenz bei künstlichen Extremwerten.
- **Beschreibung:** Der Providerparser erlaubt für nicht ganzzahlige Werte jede
  endliche nichtnegative Zahl. Der normalisierte Validator begrenzt auch diese
  Werte standardmäßig auf `Number.MAX_SAFE_INTEGER`. Betroffen sind Gebühren
  und Histogramm-Gebührenraten. Ein erfolgreicher Adapterdurchlauf garantiert
  damit keinen vom Browser akzeptierten Vertrag.
- **Auswirkung:** Die Function kann HTTP 200 und einen Erfolgszeitstempel
  liefern, während die UI dieselben Daten als ungültig zurückweist. Die UI
  bleibt sicher und behält vorhandene Daten; serverseitige Fehlerdiagnose und
  Erfolgssignal sind aber widersprüchlich. Keine Evidenz für solche Werte im
  tatsächlichen Providerbetrieb.
- **Nachweis:** `parseFees({ fastestFee: 1e100, halfHourFee: 1, hourFee: 1,
economyFee: 1, minimumFee: 0 })` akzeptiert die Eingabe. Wird das Ergebnis
  mit `source: 'mempool.space'` und gültigem `updatedAt` an
  `parseBitcoinResponse('fees', ...)` übergeben, entsteht `Invalid number`.
  Beide Ergebnisse wurden mit den unveränderten Modulen reproduziert.
- **Empfehlung:** Akzeptanzgrenzen angleichen und normalisierte Ausgaben aller
  Adapter einschließlich Grenzwerten gegen die gemeinsame Validierung prüfen.
  Das erfordert keine größere Architekturänderung oder neue Bibliothek.
- **Phase 2:** Später möglich; bei der nächsten Änderung an Datenvalidierung
  oder Fehlerdiagnose erledigen.

### A16-04 – LOW – Eingehender Request-Abbruch wird nicht weitergegeben

- **Dateien/Zeilen:** `functions/api/bitcoin/[resource].ts:8–13`;
  `functions/lib/mempool.ts:96–109, 112–116`.
- **Status:** Bestätigte Implementierungsgrenze; optionale Effizienzverbesserung.
- **Beschreibung:** Die Route liest Methode und Ressource, übergibt aber kein
  `request.signal`. Der Adapter kombiniert ausschließlich seinen 8-s-Timeout
  mit seinem eigenen Controller. Browser-/Query-Abbruch und Upstream-Abbruch
  sind somit nicht durchgehend gekoppelt.
- **Auswirkung:** Wenn die Laufzeit ein Abbruchsignal am eingehenden Request
  bereitstellt, kann eine nicht mehr benötigte Upstream-Anfrage weiterlaufen.
  Der vorhandene Timeout begrenzt sie; Datenintegrität und Zugriffsschutz sind
  dadurch nicht nachweislich verletzt.
- **Nachweis:** Die Route wurde mit bereits abgebrochenem `Request.signal` und
  einem Fetch-Double aufgerufen. Sie startete Fetch mit einem nicht abgebrochenen
  Upstream-Signal und lieferte 200. Die Signalweitergabe fehlt auch direkt im
  Code. Ob/wann reale Clientdisconnects auf Cloudflare das eingehende Signal
  auslösen, wurde nicht geprüft und wird hier nicht behauptet.
- **Empfehlung:** Bei Bedarf ein optionales Eingangssignal weiterreichen und
  mit dem Timeout kombinieren; Clientabbruch getrennt von Providerfehlern
  behandeln und in der Zielruntime verifizieren.
- **Phase 2:** Später möglich; kein notwendiger Freigabeschritt.

### A16-05 – LOW – Keine versionierte CSP als zusätzliche XSS-Begrenzung

- **Dateien/Zeilen:** `public/_headers:1–4`; `index.html:11–17`.
- **Status:** Optionale Härtung; keine nachgewiesene XSS-Schwachstelle.
- **Beschreibung/Auswirkung:** Der Repository-Stand setzt keine Content Security
  Policy. Damit fehlt eine zusätzliche browserseitige Begrenzung von Skript- und
  Verbindungsquellen. Eine eventuell extern gesetzte CSP wurde nicht verifiziert.
  Die gegenwärtige Verarbeitung ergibt keinen bestätigten Injectionpfad.
- **Nachweis:** `_headers` enthält nur nosniff, Referrer-Policy und Frame-Schutz;
  `index.html` enthält ein bewusstes Inline-Theme-Skript und keine CSP-Metaangabe.
- **Empfehlung:** Bei späterer Härtung zuerst Report-Only und einen passenden
  Hash für das Theme-Skript prüfen; Lazy-Module, selbst gehostete Fonts und
  ECharts-Styles berücksichtigen. Keine ungeprüfte restriktive Policy einschalten.
- **Phase 2:** Später möglich; bei neuen HTML-/Tooltip-/externen Integrationen
  erneut bewerten.

### A16-06 – LOW – README-Bundleaussage entspricht dem aktuellen Build nicht

- **Dateien/Zeilen:** `README.md:47`.
- **Status:** Bestätigte kleine Dokumentationsabweichung.
- **Beschreibung/Auswirkung:** Die README behauptet eine aktuelle
  500-kB-Vite-Warnung und ungefähr 171 kB gzip. Der mit der vorgesehenen Toolchain
  erzeugte Chartchunk hat 497,40 kB und 168,63 kB gzip; eine solche Warnung wurde
  nicht ausgegeben. Das kann zu unnötiger Optimierungsarbeit führen.
- **Nachweis:** Ausgabe von `npm run build` in Abschnitt 3.
- **Empfehlung:** Die Aussage bei nächster Dokumentationspflege aktualisieren
  oder als historisch kennzeichnen; Größen nicht als dauerhafte Konstante führen.
- **Phase 2:** Später möglich; in diesem reinen Audit-PR nicht korrigiert.

## 5. Sicherheitsbewertung

### Bestätigte Schutzmaßnahmen und Datenfluss

Die fünf Ressourcen werden durch eine Allowlist begrenzt. Der einzige
Upstream-Origin ist festes `https://mempool.space`; Pfade stammen aus einem
internen Mapping. Benutzerwerte erzeugen keine frei wählbare Ziel-URL.
`redirect: 'manual'` verhindert das automatische Folgen von Providerredirects;
deren Status wird abgewiesen. Es werden ausschließlich definierte Accept-Header
gesetzt, keine eingehenden Cookies oder Authorization-Werte weitergereicht.
Ein SSRF-Pfad wurde nicht gefunden.

Providerdaten durchlaufen Größenlimit, strikte UTF-8-Dekodierung, JSON-Parsing
und ressourcenspezifische Prüfung. Normalisierung verwirft zusätzliche Felder.
Der Browser prüft Quelle, Zeitstempel und normalisierte Daten erneut. Hashes
werden auf 64 kleingeschriebene Hexzeichen begrenzt, bevor sie in den festen
Explorerlink eingehen. Zahlen werden als React-Text gerendert; kein
`dangerouslySetInnerHTML`, `innerHTML` oder `eval` im geprüften Anwendungscode.
Der Chart erhält ausschließlich die gekennzeichnete synthetische Zahlenreihe;
sein Tooltip übernimmt keine unkontrollierten Providerstrings.

Die Functions akzeptieren GET für bekannte Endpunkte; andere Methoden ergeben
405 mit `Allow: GET`. Unbekannte Ressourcen/Pfade liefern JSON 404. HEAD und
OPTIONS sind keine freigeschalteten Datenmethoden. Keine CORS-Freigabe; der
Browser nutzt Same-Origin. CORS ist keine Zugriffskontrolle für direkte Clients.

Statische Antworten erhalten nosniff, `X-Frame-Options: DENY` und
`Referrer-Policy: strict-origin-when-cross-origin`. Function-Antworten setzen
ihre Header selbst, zusätzlich `Cache-Control: no-store` und `no-referrer`,
einschließlich Fehlerfällen. Das passt zum dokumentierten
[Geltungsbereich von Pages `_headers`](https://developers.cloudflare.com/pages/configuration/headers/).
HSTS/TLS-/Access-Header am Edge wurden nicht unabhängig geprüft.

Die eigene Upstream-Fehlerprotokollierung schreibt nur Eventname, erlaubte
Ressource, Fehlerkategorie und optional Providerstatus. Keine Bodies, URLs,
Tokens, Cookies oder Originalexception. Die Tests prüfen das genaue Logobjekt
und generische öffentliche Fehlermeldungen. React behält seine Standard-
Konsolendiagnostik; keine eigene externe Telemetrie. Aussagen zur Aufbewahrung
oder Zugriffskontrolle realer Cloudflare-Logs sind daraus nicht ableitbar.

Die Sichtung des versionierten Stands und eine gezielte Mustersuche ergaben
keine erkennbaren produktiven Zugangsdaten. `secret`/`token=secret` in Tests sind
absichtliche Leckage-Prüfwerte. `.env*` und `.dev.vars*` sind grundsätzlich
ignoriert; Beispiele ausgenommen. Keine Cloudflare-Credentials im Workflow und
keine privaten Node-Verbindungen. Dies ist kein vollständiger Secret-Scan der
gesamten Git-Historie oder der externen Buildumgebung.

### Grenzen und Einordnung

Keine bestätigte ausnutzbare Sicherheitslücke im geprüften Stand. Fehlende CSP
ist A16-05, keine bewiesene XSS-Lücke. Das Fehlen einer JWT-Prüfung innerhalb
der Functions ist bei der vorgegebenen externen Access-Grenze ebenfalls kein
eigenständiger Beweis für offenen Zugriff. Richtige Hostname-/Pfadabdeckung und
keine Bypass-Policies bleiben Voraussetzungen des Betriebs.

Der Browser liest `response.json()` ohne eigenes Bytebudget. Die Anwendungs-
Function begrenzt jedoch den Providerstream und die ausgegebene Struktur;
Redirects und HTML werden abgewiesen. Ein zusätzliches Browserbudget wäre
optionale Härtung gegen fehlerhafte Zwischenantworten, kein belegter aktueller
Angriffspfad. Schema-/Histogrammprüfung erfolgt erst nach JSON-Parsing.

### Abhängigkeiten

`npm audit --json` konnte nach einem anfänglichen Sandbox-Netzwerkfehler
erfolgreich die öffentliche npm-Registry abfragen: **0 bekannte Warnungen**
für den aufgelösten Graphen, einschließlich Entwicklungsabhängigkeiten.
Auch das projektkonforme `npm ci` meldete 0. Dies beweist keine allgemeine
Schwachstellenfreiheit und ersetzt keine laufende Überwachung.

`npm ls undici` bestätigt Miniflare → Undici **7.30.1 overridden** und
jsdom → Undici **8.12.3**. Der versionsgebundene Override wirkt wie dokumentiert.
Direkte Abhängigkeiten sind plausibel getrennt: React/Router/Query/Chart/UI/Fonts
zur Laufzeit; Build-/Test-/Cloudflare-Werkzeuge als devDependencies. Kein klar
unnötiges Produktionspaket identifiziert. Der nach `npm ci` sichtbare Graph
enthält plattformabhängige optionale Pakete; nicht installierte fremde
Plattformbinaries sind kein Dependency-Defekt.

Die Registry meldete folgende Updates. Das sind **Updateangebote, keine
nachgewiesenen Sicherheitsprobleme**; es wurde nichts aktualisiert:

| Paket                       | Installiert  | Latest laut Registry |
| --------------------------- | ------------ | -------------------- |
| `@cloudflare/workers-types` | 5.20261026.1 | 5.20261030.1         |
| `@types/node`               | 26.6.5       | 26.6.6               |
| `lucide-react`              | 1.61.0       | 1.65.0               |
| `react-router-dom`          | 7.18.4       | 7.18.5               |
| `wrangler`                  | 4.152.0      | 4.156.0              |
| `typescript`                | 5.9.3        | 7.0.2                |

Ein TypeScript-Majorupgrade ist daraus nicht erforderlich. Die tatsächlich
verwendeten APIs der Hauptbibliotheken funktionieren in den ausgeführten
Prüfungen zusammen. Node 22 ist gemäß dem
[offiziellen Releaseplan](https://github.com/nodejs/Release#release-schedule)
zum Auditdatum noch unterstützt; kein Zwang zu Node 26. Die Node-Typen aus
Major 26 sind breiter als die Zielruntime 22: Künftige Node-APIs in Konfiguration
oder E2E benötigen weiterhin Runtimeprüfung. Kein aktueller daraus resultierender
Laufzeitfehler wurde festgestellt. Eine vollständige manuelle Wartungs-/EOL-
Prüfung jedes transitiven Pakets wurde nicht durchgeführt. Im Lockfile wurden
keine `deprecated`-Markierungen gefunden; fehlende Markierungen sind keine
Garantie fortlaufender Paketwartung.

## 6. Architektur und Wartbarkeit

Die überschaubare Struktur ist für Phase 2 angemessen. `main.tsx` erzeugt einen
QueryClient außerhalb des Renderns und ordnet globale Boundary, Query-, Theme-
und BrowserRouter-Provider sinnvoll. `App.tsx` enthält Shell, Navigation und
vier explizite Routen mit React-404. Seiten komponieren kleine Karten und
Tabellen. UI-Primitives, Datenanzeigen, Queryzugriff, Provideradapter und
gemeinsame Modelle sind erkennbar getrennt.

Der Browser importiert die gemeinsame Validierung, keine serverseitigen
Adapter. Functions importieren keine UI-Module. `shared/bitcoin.ts` definiert
Einheiten und Envelope; `shared/bitcoin-limits.ts` vereinheitlicht die
Histogrammgrenze. Separate Provider- und Vertragsvalidierung ist sachlich
gerechtfertigt; ihre teilweise duplizierten numerischen Regeln haben mit
A16-03 allerdings eine konkrete Driftstelle.

`DataStatus`, Metriken, Tabellen und UI-Primitives sind gut wiederverwendbar.
Einige nicht verwendete Scaffold-Komponenten wie `BlocksTable` bleiben im
Dashboardmodul; das ist gegenwärtig lediglich kleines Aufräumpotenzial.
`ErrorBoundary` importiert den Reloadhelper aus dem Bitcoin-Querymodul. Diese
kleine fachfremde Kopplung könnte beim nächsten Ausbau in ein neutrales
Browserhelper-Modul wandern; sie verursacht aktuell keinen Providerbedarf im
Fallback und rechtfertigt keinen grundlegenden Refactor.

Hooks werden konsistent verwendet, mit Hooks-Regeln für Produktionscode.
Theme-Lesen und -Schreiben fängt Storagefehler ab. Der Chart verwendet selektive
ECharts-Registrierung und einen echten dynamischen Import; die Seiten selbst
sind synchron geladen. Normaler Unmount/Themewechsel trennt Observer und
disposed die Instanz. Die Ausnahmefälle A16-01/-02 sind davon zu unterscheiden;
die [ECharts-Lebenszyklusdokumentation](https://echarts.apache.org/handbook/en/concepts/chart-size/)
empfiehlt explizite Freigabe beim Entfernen des Containers.

### Query- und Datenverhalten

`bitcoinOptions` definiert je Ressource denselben Query-Key über Seiten hinweg,
60 s staleTime, 60 s sichtbares Polling, 10 min gcTime sowie Refetch bei Fokus
und Reconnect. Die Defaults des allgemeinen QueryClients werden für Bitcoin
gezielt überschrieben. Mehrere Gebührenkarten und alle letzten Blockmetriken
teilen dieselben Requests; die Blockchain-Testseite benötigt vier Ressourcen.
Die UI verwendet bewusst `blocks` auch für Größe/Gewicht statt eines zusätzlichen
`latest-block`-Requests. Unabhängige Height-/Blocks-Samples können bei einem
neuen Block kurzfristig abweichen; die README beschreibt diese Grenze korrekt.

Browserfetch verbindet Query-Abbruch mit einem 15-s-Timeout und blockiert
Redirects. 4xx und ungültige Browserverträge werden nicht automatisch wiederholt;
Netzwerk-/Bodytransportfehler und 5xx höchstens einmal. Provider-429 und ungültige
Providerdaten werden öffentlich zu 502 und deshalb einmal erneut versucht.
Das ist dokumentiert und begrenzt, kein unbegrenzter Retry. `Retry-After` wird
nicht übernommen; für private Nutzung mit geringer Last ist das gegenwärtig
kein Freigabeblocker. Kein zusätzlicher Serverretry, kein gemeinsamer Servercache.

Der Upstreamtimeout beträgt 8 s und umfasst Header und Body. Bytebudgets:
128 für Höhe, je 64 KiB für Blockressourcen, 4 KiB für Gebühren und 1 MiB für
Mempool; höchstens 10.000 Histogrammeinträge. Der Reader zählt gelieferte Bytes
auch ohne/mit falschem Content-Length, dekodiert UTF-8 inkrementell und parst
erst danach. Fehler-/Abbruchpfade canceln ohne auf potenziell hängende
Cancellation-Promises zu warten, entfernen Listener und geben Readerlocks frei.
Die Tests prüfen geteilte UTF-8-Sequenzen, Budgetgrenzen, falsche Längen,
Transportfehler und Abbruch nach Headern. Kein zusätzlicher unbeschränkter
Provider-Bodypfad gefunden. Ein einzelner vom Runtime-Stream erzeugter großer
Chunk kann bereits vor Anwendungskontrolle allokiert sein; das Budget begrenzt
die von der Anwendung behaltenen/dekodierten Daten.

Erstfehler zeigen Striche statt erfundener Werte. Refetchfehler behalten validierte
Daten und den letzten Erfolgszeitpunkt mit Stale-Hinweis. `updatedAt` bezeichnet
Abrufzeit, nicht garantierte Providerfrische; Blockzeit bleibt minerbestimmt.
Blockgrößen, Gewicht und Mempoolgröße haben erkennbare Einheiten. Synthetische
Chartdaten und absichtliche Platzhalter sind eindeutig beschriftet und werden
nicht als Findings gewertet.

## 7. TypeScript, Codequalität und React-Fehlerbehandlung

Alle vier tsconfig-Projekte verwenden `strict` und `noEmit`. Frontend schließt
`src` und Vite-Konfiguration ein; der separat geprüfte Functions-Test wird dort
ausgenommen. Functions nutzen Worker-Typen ohne Browser-DOM-Lib; der eigene
Functions-Testcheck erbt diese Konfiguration. E2E und Playwright-Konfiguration
werden ebenfalls geprüft. Gemeinsame Modelle/Validatoren sind über Imports
eingeschlossen. Die anderen Adaptertests laufen unter Node in Vitest, werden
jedoch im Frontend-Typcheck mit DOM-Typen geprüft; Kompilierbarkeit des eigentlichen
Servercodes wird zusätzlich im Worker-Projekt geprüft.

Keine unnötigen `any`, ts-ignore-Unterdrückungen oder breiten ESLint-Ausnahmen
im gesichteten Anwendungscode. Object-Assertions erfolgen nach Strukturprüfung.
`params.resource as Resource` wird unmittelbar per Allowlist abgesichert.
Die generische Parserassertion in `mempool.ts:133` ist eine manuelle Typkorrelation;
eine explizit gemappte Parsertypisierung wäre eine kleine künftige Verbesserung.
`root!` in `main.tsx` entspricht dem festen Root-Element in `index.html`;
Fehler vor Reactstart werden erwartbar nicht von einer Boundary gefangen.

ESLint prüft empfohlene JS-/TS-Regeln, Produktions-Hooks und React Refresh;
Warnungen schlagen fehl. Prettier und Tailwind-Sortierung sind sauber integriert.
Es gibt kein typgestütztes ESLint-Preset wie `no-floating-promises`, keine
`noUncheckedIndexedAccess`-Pflicht und keine Laufzeit-Typprüfung durch TypeScript.
Das sind bekannte Werkzeuggrenzen, keine gegenwärtig nachgewiesenen Fehler.
Die vorhandenen Checks sind für den nächsten Entwicklungsschritt ausreichend.

Die globale Boundary umschließt Provider und Router und benötigt im Fallback
keinen dieser Kontexte. Die View-Boundary remountet über `location.key`;
Navigation/Theme/Footer liegen außerhalb. Die Chart-Boundary liegt um Suspense
und Lazy-Chart innerhalb der Karte. Renderfehler bieten lokalen Retry,
wiederholte Fehler kehren zum Fallback zurück. Lazy-Importfehler werden als
`ComponentLoadError` markiert und bieten nur Dokumentreload, sinnvoll wegen
des gecachten Lazy-Promise. Reload garantiert keine Erholung bei weiter
bestehendem Netzwerk-/Codeproblem.

Die Tests beweisen globalen Fallback in beiden Themezuständen, Retry,
persistente Fehler, Navigation zurück zur Route, Suspense-Auflösung,
Importrejection und den Aufruf des Reloadhelpers. Sie beweisen keinen realen
Access-Login und keine Erholung von einem tatsächlich fehlgeschlagenen
Produktionschunk. APIfehler bleiben Query-/UI-Zustände, kein Boundaryabsturz.
Fehlertexte sind deutsch, mit semantischen Überschriften, Buttons und Alerts;
Statusbereiche verwenden `aria-live`. Keine vollständige Screenreader-/Fokus-
oder visuelle Barrierefreiheitsprüfung. Asynchrone Callbackfehler sind ausdrücklich
von React-Boundaries ausgenommen; für den konkreten Chart siehe A16-02.

## 8. Cloudflare Pages, Tests und CI

`wrangler.jsonc` definiert `./dist`, das Kompatibilitätsdatum 2026-10-26 und
keine unnötigen Bindings/Node-Flags. Vite kopiert `_routes.json` und `_headers`
aus `public`. Invocation ist auf `/api/*` begrenzt; bekannte Dateien haben
Vorrang vor dem Catch-all. Auch `/api`, `/api/` und verschachtelte unbekannte
API-Pfade wurden lokal tatsächlich als JSON 404 geprüft, nicht nur aus dem
Pattern abgeleitet. Das Frontend benötigt keine Functions-Invocation.

Es gibt keine widersprüchlichen Rewrite-Regeln und keine Top-Level-404-Datei.
Deep Links liefern die SPA; unbekannte Frontendpfade bewusst HTML/200 und
anschließend die React-404. Das entspricht dem
[dokumentierten Pages-SPA-Fallback](https://developers.cloudflare.com/pages/configuration/serving-pages/).
Vite-Proxy gilt nur für Entwicklung, `vite preview` ersetzt keine Functions.
Produktionsbuild und lokal gebündelte Functions sind kompatibel; tatsächliche
Pages-Buildsettings und Edgeausführung sind gesonderte externe Punkte.

### Aussagekraft und Isolation

- Vitest: gute Abdeckung von Parsern, Budgetgrenzen, Fehlerklassifikation,
  redigierten Logs, Headern, Retryanzahl, Cacheerhalt, Pollingpause und
  Query-Abbruch. Fetch-/Timer-/Fokus-Doubles erlauben deterministische Fehler;
  Wiederherstellung und frische QueryClients sind in den datenorientierten
  Tests vorhanden. Einige Shelltests verwenden dauerhaft ausstehende Fetch-
  Promises und verlassen sich auf DOMcleanup; daraus folgt keine Prüfung
  realer Abbrüche. Keine gemessene Coveragequote oder vollständige Pfadabdeckung.
- React-Charttests mocken die Chartkomponente und beweisen daher die Boundary,
  nicht `init/setOption/ResizeObserver/dispose`. Die zusätzlichen Proben belegen
  gerade hier die Lücken A16-01/-02. Browser-Shelltests prüfen zwar den realen
  Build, warten aber nicht ausdrücklich auf eine gezeichnete Serie; ein
  fehlender Chart kann unter Umständen durchrutschen, wenn kein rechtzeitig
  erfasster Konsolenfehler entsteht.
- UI-E2E: reale HTML-/CSS-/JS-Assets, Mockdaten auf Same-Origin, blockierte
  ServiceWorker, unerwartete externe/unbekannte APIanfragen und Browserfehler
  lassen Tests scheitern. Gezielt erwartete HTTP-Konsolenfehler sind nach
  Status und API-URL begrenzt. Getestet sind alle Routen, Direktaufruf/Reload,
  404-Rückweg, Theme-Persistenz und Navigation bei 401/403/502/504.
- HTTP-E2E: echtes lokales Wrangler/workerd für Health, JSONfehler,
  Methodendispatch und Assets. Unterstützte Bitcoinrouten werden mit POST/405
  geprüft, also ohne Upstream. Ein erfolgreicher echter Provider-GET vom Edge
  zum UI ist damit ausdrücklich nicht bewiesen. Diese Begrenzung wird in der
  vorhandenen Dokumentation korrekt benannt.

### CI-Zuverlässigkeit und Diagnose

Der tatsächlich abgefragte
[CI-Lauf 41046587670](https://github.com/CFPlusPlus/bitcoin-dashboard/actions/runs/41046587670)
für `2ce4d206` ist `completed/success`. Die Job-/Step-Abfrage bestätigt den
Erfolg von Toolchainprüfung, Installation, Lint, Format, Tests, Typechecks,
Build, Functions-Build, Chromiuminstallation und E2E. Zusätzlich wurden die
Joblogs gelesen: Node 22.22.2/npm 10.9.7, Vitest 3,83 s und 23 erfolgreiche
E2E-Tests in 9,7 s. Zwischen erstem und letztem Joblogeintrag lagen rund
58 Sekunden (11:14:01–11:14:59 UTC). Das ist eigenständig abgerufene
GitHub-Evidenz, keine übernommene README-Aussage.

Der Workflow läuft für alle PRs und ausgewählte Pushbranches. Für den neuen
Auditbranch greift der PR-Trigger. Read-only `contents`-Permission und kein
Deployschritt reduzieren Seiteneffekte. Node wird über `.nvmrc` ausgewählt;
die gebündelte npm-Version wird gegen `packageManager` geprüft. Ein absichtlich
vorhandenes doppeltes Typechecking vor und innerhalb des Builds kostet etwas
Zeit, ist aber kein Zuverlässigkeitsproblem.

Ein Browserworker, keine Retries, `forbidOnly` in CI, 30 s Testtimeout,
60 s Serverstart, 180 s globale Suite und 15 min Jobtimeout begrenzen Fehler.
Playwright verwendet Port 8799 und lehnt bestehende Server ab. Das verhindert
versehentliche Tests gegen einen fremden laufenden Stand. Ein frischer Build
ist Voraussetzung; `test:e2e` baut nicht selbst, CI stellt die Reihenfolge her.
Fehlerdiagnose: Listenreport, Trace/Screenshot bei Testfehlern und Upload von
`test-results/` für drei Tage. Bei Startfehlern können nur Konsolenlogs und keine
Browserartefakte vorliegen.

Die lokale E2E-Laufzeit von 8,2 s und der beobachtete CI-Job mit rund 58 s sind
klein gegenüber den jeweiligen Timeouts. Queuezeit ist in der aus Joblogs
ermittelten Dauer nicht enthalten. Ein erfolgreicher Lauf erlaubt keine Aussage
über langfristige Flakiness, Actions-Ausfälle oder Downloadzuverlässigkeit.
Actions sind auf Major-Tags statt Commit-SHAs referenziert; SHA-Pinning wäre
optionale Lieferkettenhärtung. Kein automatischer npm-Audit-Gate im Workflow;
laufende Advisoryprüfung kann später ergänzt werden.

## 9. Dokumentationsprüfung

README und technische Dokumente stimmen im Wesentlichen mit dem Code überein:
Node/npm, npm-Befehle, getrennte Typechecks, E2E-Voraussetzung, Vite-Proxy,
reine Preview, Datenquellen, Einheiten, Query-Caching, Staleverhalten,
Retrygrenzen, Bodieslimits, sichere Logs, Error-Boundary-Platzierung,
Importfehler und externe Access-Grenze wurden jeweils gegengeprüft.

Konkrete Abweichung ist die Bundlewarnung in A16-06. Die Beschreibung
„charts resize and dispose“ gilt nur für den erfolgreichen Setup-/Cleanup-Pfad;
sie darf angesichts A16-01/-02 nicht als Garantie für alle Fehlerfälle gelesen
werden. Die allgemeine React-Grenze für asynchrone Fehler wird bereits benannt.
Der knappe Typecheck-Skripttext nennt E2E nicht einzeln, die tatsächlichen
Skripte, CI- und Pages-Dokumentation berücksichtigen es aber.

Die Aussage in `docs/cloudflare-pages-verification.md`, in Phase 1.5 seien keine
externen anonymen Antworten gesichtet worden, ist eine historische
Umfangsbeschreibung. Sie widerspricht nicht den nun vom Betreiber zusätzlich
gelieferten Beobachtungen in Abschnitt 11. Die damaligen Node-26-Prüfungen im
Phase-1.4-Bericht sind ebenfalls historische Evidenz; dieser Audit ergänzt den
vollständigen lokalen Lauf mit der festgelegten Toolchain.

## 10. Bekannte Einschränkungen

- Kein authentifizierter Zugriff auf Cloudflare-Dashboard oder produktive
  Access-/Pages-Einstellungen; keine Änderung, Anmeldung oder Deploymentaktion.
- Die Betreiberangaben wurden nicht als selbst durchgeführte externe Tests
  ausgegeben. Keine vollständige Alias-/Deploymentinventur.
- Kein echter Provider-GET-End-to-End-Test am Cloudflare-Edge; absichtlich keine
  zusätzlichen Bitcoinquellen oder privaten Nodezugriffe.
- Lokales Windows/workerd und eine Chromiumkonfiguration; keine unabhängigen
  Firefox-/WebKit-/Mobiltests, Lasttests, Langzeitmessungen oder vollständigen
  visuellen/assistiven Prüfungen.
- Die Chartfehler-Proben injizieren künstliche Exceptions. Sie beweisen den
  Kontrollfluss und die fehlende Absicherung, keine Häufigkeit im Realbetrieb.
- Keine vollständige Git-Historien-/Secret-/Lieferkettenanalyse und kein
  Sicherheitsnachweis für externe Buildbindings oder alle Transitiven.
- Keine Implementierung, Dependency-Upgrades oder Änderung von Anwendung,
  UI, API, Architektur oder Konfiguration. Generierte Build-/Testartefakte und
  lokale Prüfhilfen bleiben unversioniert.

## 11. Externe Cloudflare-Prüfpunkte

### Vom Betreiber gelieferte Beobachtungen vom 30. Oktober 2026

Diese Ergebnisse sind **externe Betreiberangaben**, keine vollständig selbst
verifizierte Access-Konfiguration. Über die genannten Pfade hinaus wird keine
Abdeckung behauptet.

| Host / Objekt                                               | Mitgeteiltes Ergebnis ohne Access-Authentifizierung                              |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `bitcoin.falkner.info`                                      | Startseite, Unterseiten und getestete API-Pfade: HTTP 302 zu Cloudflare Access   |
| `bitcoin-dashboard-erm.pages.dev`                           | Startseite, Unterseiten und getestete API-Pfade: HTTP 302 mit Access-Anforderung |
| `8c1211b0.bitcoin-dashboard-erm.pages.dev`                  | Startseite und `/api/health` durch Access abgefangen                             |
| Tatsächlich vorhandenes `/assets/…js` auf der Custom Domain | Ebenfalls durch Access abgefangen                                                |
| Antworten                                                   | `Www-Authenticate: Cloudflare-Access` laut Betreiber                             |

Das ist konkrete positive Evidenz für den Access-Gate an den geprüften Objekten.
Es ist kein Beweis für alle Assets, Hostnamen, Policies oder Folge-Deployments.
Deployter SHA, vollständige Pfadliste, exakte Prüfzeiten und berechtigte
Login-Ergebnisse wurden im Auftrag nicht vollständig bereitgestellt.

### Offen für die separate externe Betriebsfreigabe

1. Produktions-/Preview-Projekte, Hashdeployments und alle vorhandenen Branch-
   Aliasse inventarisieren; Hostname-/Pfadregeln, Allow-/Bypass-Entscheidungen
   sowie Pages-/Access-Einstellungen im Dashboard lesen und abgleichen.
2. Den anonymen Pfad-/Asset-/API-Katalog aus
   [der vorhandenen Prüfanleitung](cloudflare-pages-verification.md#manual-external-access-verification-separate-release-gate)
   für die verbleibenden Adressen vervollständigen. Redirectziel und
   Schutzschicht identifizieren; keine geschützten Appbytes anonym ausgeben.
3. Berechtigte Identität einschließlich Deep Links, Assets und API testen;
   unberechtigte Identität muss abgewiesen werden. Ablauf/Erneuerung einer
   echten Access-Sitzung ist durch die Fetch-Mocks nicht nachgewiesen.
4. Produktions-/Preview-Buildsettings gegen Node 22.22.2, npm 10.9.7,
   `npm run build`, Repositorywurzel und `dist` prüfen; auf dem tatsächlich
   deployten Stand Functions und Routing-/Headerdateien verifizieren.
5. Künftige Deployments mit SHA und geprüftem Host-/Pfadumfang protokollieren;
   die heutigen Beobachtungen gelten nicht automatisch für neue Aliasse.

Diese offenen Punkte sind **nicht verifiziert**, keine Feststellung eines
Access-Bypass. Sie verhindern Designsystemarbeit im Repository nicht; sie
begrenzen die Aussage zur externen Betriebssicherheit.

## 12. Abschließende Bewertung

| Kriterium                      | Bewertung und praktische Grenze                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| Architektur und Wartbarkeit    | Solide, angemessen kleine Module; kein grundlegender Umbau nötig                              |
| Codequalität und Typsicherheit | Gut; alle Bereiche strikt geprüft, einzelne manuelle Typkorrelationen                         |
| Fehlerbehandlung               | Gut für Render-/Import-/APIfehler; Chart-Lebenszykluslücken A16-01/-02                        |
| API-Robustheit                 | Gut begrenzt und getestet; Vertragsdrift A16-03, Abbruchgrenze A16-04                         |
| Sicherheit                     | Kein bestätigtes ausnutzbares Problem; CSP optional, externe Access-Prüfung begrenzt          |
| Pages-Kompatibilität           | Build und reale lokale Routing-/Headertests erfolgreich; Edge nicht vollständig geprüft       |
| Testabdeckung                  | Gute verhaltensbezogene Basis; echte Chartfehler und Edgeintegration nicht vollständig belegt |
| CI-Zuverlässigkeit             | Vorhandener echter Lauf erfolgreich, sinnvolle Grenzen/Diagnose; keine Langzeitmessung        |
| Dokumentation                  | Weitgehend zutreffend; kleine aktuelle Größenabweichung A16-06                                |

**CONDITIONAL GO – Phase 2 kann beginnen.** A16-01 und A16-02 sollten beim
Einstieg in die Chart-/Layoutarbeiten kurzfristig mit gezielten Fehlerpfadtests
behoben werden. A16-03 wird als konkreter Datenvertrags-Restpunkt übernommen;
die LOW-Punkte können später bearbeitet werden. Vor einer vollständigen externen
Betriebsfreigabe bleiben die in Abschnitt 11 benannten Access-/Deploymentprüfungen
offen. Es gibt keinen nachgewiesenen kritischen Fehler, der den Beginn von
Designsystem- und UX-Arbeit verhindert.

---

## 13. Nachtrag Phase 1.6.1 – Behebung der MEDIUM-Findings

**Stand: 30. Oktober 2026.** Dieser Nachtrag dokumentiert die Implementierung
nach dem ursprünglichen Audit. Die Abschnitte 1–12 einschließlich ihrer damaligen
Feststellungen und Bewertung bleiben unverändert. Basis ist der Auditcommit
`e5f3f13`; separater Korrekturbranch: `feature/phase-1.6.1-medium-fixes`.

### A16-01 – Behoben: Freigabe bei fehlgeschlagener Initialisierung

**Ursache:** Der bisherige Effect registrierte sein Cleanup erst nach erfolgreichem
`init()`, `setOption()`, Observer-Konstruktor und `observe()`. Ein vorheriger Throw
ließ bereits erworbene Ressourcen zurück.

**Korrektur:** `src/components/demo-chart.tsx` hält Chart und Observer im lokalen
Effect-Lebenszyklus. Dieselbe idempotente Cleanup-Funktion läuft bei Setupfehlern,
Resizefehlern, Themewechsel und Unmount. Sie deaktiviert zuerst weitere Callbacks,
trennt einen vorhandenen Observer und disposed die Instanz. `try/finally` stellt
den Dispose-Aufruf auch bei einem Fehler in `disconnect()` sicher. Der einmalige
Stopzustand verhindert doppelte Freigabe durch den späteren React-Cleanup.

Wirft `init()` vor der Rückgabe, wird zusätzlich `getInstanceByDom()` verwendet:
ECharts registriert die Instanz vor dem `afterinit`-Lifecyclehook. Eine dort
geworfene Exception lässt somit eine über die öffentliche API auffindbare
Instanz zurück, die nun ebenfalls freigegeben wird. Ohne erzeugte/registrierte
Instanz gibt es keinen Dispose-Aufruf. Bibliotheksinterne, vor Registrierung
fehlgeschlagene Konstruktorallokationen sind über diese API nicht zugänglich.

**Regressionstests:** `src/test/demo-chart.test.tsx` führt die echte Chartkomponente
innerhalb der vorhandenen `PriceChart`-Boundary aus; nur ECharts und der Observer
werden als kontrollierte Ressourcen ersetzt. Fehler vor und nach der Registrierung
in `init()`, in `setOption()`, im Observer-Konstruktor und in `observe()` werden
gezielt injiziert. Die Tests prüfen tatsächlich erzeugte Ressourcen und exakt einen
`dispose()`-/`disconnect()`-Aufruf pro Ressource, den lokalen Fallback, unverändert
verfügbare Dashboard-Inhalte und erfolgreichen Retry. Themewechsel, StrictMode und
Unmount sind zusätzlich abgesichert.

### A16-02 – Behoben: Resizefehler im lokalen React-Fehlerzustand

**Ursache:** Ein späterer ResizeObserver-Callback läuft außerhalb der von React
überwachten Render-/Effect-Ausführung und erreichte deshalb die Boundary nicht.

**Korrektur:** Der Callback fängt `resize()`-Exceptions ab, räumt die Ressourcen
sofort auf und speichert den Fehler als Objekt in React-State. Im nächsten Render
wird dieser Fehler geworfen und von der bestehenden lokalen Chart-Boundary
behandelt. Das verwendet React-19-kompatible State-/Rendermechanismen; die
[React-Dokumentation zur Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
beschreibt deren Renderfehler-Behandlung und die Grenze für asynchrone Callbacks.
Auch ein zusätzlicher Cleanupfehler wird in diesen Fehlerzustand überführt und
entweicht nicht aus dem Callback. Fehler werden weder nur geloggt noch verschluckt.

Der bestehende verständliche Diagramm-Fallback und sein Retry bleiben unverändert.
Retry remountet die Komponente mit frischem State, neuer Instanz und neuem Observer.
Bereits vorgemerkte Callbacks alter Observer werden nach Freigabe ignoriert.

**Regressionstests:** Der Resize-Test ruft den erfassten Observer-Callback auf,
lässt `resize()` werfen und prüft, dass der Aufruf keine Exception weitergibt.
Er prüft den lokalen Alert ohne interne Fehlerdetails, weiterhin sichtbare übrige
Dashboard-Inhalte, exakt einmalige Freigabe sowie das Ignorieren weiterer alter
Callbacks vor und nach Retry. Eine neue Instanz nach Retry lässt sich erfolgreich
resizen. Die Tests laufen mit React StrictMode.

### A16-03 – Behoben: Einheitliche numerische Akzeptanzgrenzen

**Ursache:** Der Adapter akzeptierte bei Gebühren jede endliche nichtnegative Zahl;
der Browser begrenzte dieselben Werte zusätzlich auf `Number.MAX_SAFE_INTEGER`.

**Korrektur:** Beide Schichten verwenden jetzt dieselbe reine Zahlenprüfung aus
`shared/bitcoin-number.ts` und dieselben expliziten Grenzen aus
`shared/bitcoin-limits.ts`. Gebührenempfehlungen und Histogrammraten akzeptieren
`0` bis einschließlich `2_100_000_000_000_000` sat/vB, einschließlich gebrochener
Werte und Sub-sat/vB. Die bewusst großzügige Plausibilitätsgrenze entspricht
21 Millionen BTC in Satoshis pro vByte; sie liegt unterhalb der sicheren
Ganzzahlgrenze und vermeidet einen willkürlichen, marktpreisabhängigen Grenzwert.
Sie ist keine Aussage über übliche Gebühren oder eine neue APIeinheit.

Zähler, Höhen, aggregierte Satoshis und virtuelle Größen bleiben nichtnegative
sichere Ganzzahlen bis `Number.MAX_SAFE_INTEGER`. Die bestehenden Grenzen von
4.000.000 für Blockbytes/-gewicht und 8.640.000.000.000 Sekunden für Blockzeiten
bleiben erhalten und werden nun ebenfalls gemeinsam referenziert. JSONstruktur,
Feldnamen, Metadaten und öffentliche Fehlerantworten bleiben unverändert; es gibt
keine zusätzliche Produktionsabhängigkeit und keinen Browserimport des Adapters.

**Regressionstests:** `src/test/bitcoin-numeric-contract.test.ts` prüft 21 numerische
Feld-/Ressourcenkombinationen mit jeweils einem Akzeptanz- und Ablehnungstest
(42 Tests). Dazu gehören Höhe, Einzelblock und Blockliste, alle fünf Gebührenwerte,
alle Mempoolzähler und beide Histogrammwerte. Geprüft werden Null, exakte Obergrenze,
Werte unmittelbar darunter/darüber, gebrochene Gebühren, unerlaubte gebrochene
Ganzzahlen, negative Werte, unsichere Ganzzahlen, `Number.MAX_VALUE`, NaN und beide
Unendlichkeiten. Jeder akzeptierte normalisierte Adapterwert wird anschließend
auch durch den Browservertrag validiert und auf unveränderte Werte geprüft.

### Qualitätsprüfungen und Abschlussbewertung

Alle Prüfungen wurden lokal mit **Node 22.22.2 und npm 10.9.7** ausgeführt. Die
Toolchain wurde wie im ursprünglichen Audit temporär per `npm.cmd exec` gewählt;
Manifest, Lockfile und globale Installation wurden nicht geändert.

| Prüfung                | Ergebnis                                                      |
| ---------------------- | ------------------------------------------------------------- |
| `npm ci`               | PASS; 300 Pakete hinzugefügt, 301 geprüft, 0 Schwachstellen   |
| `npm run lint`         | PASS; keine Fehler oder Warnungen                             |
| `npm run format:check` | PASS                                                          |
| `npm run typecheck`    | PASS; Frontend, Functions, Functions-Tests und E2E            |
| `npm test`             | PASS; 203 Tests in 11 Dateien, davon 49 neue Regressionstests |
| `npm run build`        | PASS; einschließlich erneuter Typechecks                      |
| `npm run pages:check`  | PASS; `Compiled Worker successfully`                          |
| `npm run test:e2e`     | PASS; 23 Tests mit einem Chromium-Worker gegen lokales Pages  |

Die vorhandenen 154 Tests und 23 E2E-Tests wurden nicht abgeschwächt. Der
Produktionsbuild bleibt ohne 500-kB-Chunkwarnung. Die gezielten Fehler werden in
DOMtests injiziert; die E2E-Suite prüft den realen Build mit der bisherigen
Browser-/Pages-Abdeckung, keine echten Provider- oder Access-Anmeldungen.

**Aktualisierte Bewertung: GO – Phase 1 ist technisch vollständig abgeschlossen;
Phase 2 kann beginnen.** A16-01, A16-02 und A16-03 sind behoben und durch
Regressionstests abgesichert. Die LOW-Findings A16-04 bis A16-06 bleiben bewusst
unbearbeitet. Es wurden keine Funktionen, Designs, Datenquellen oder
Cloudflare-Access-Einstellungen geändert. Die separate externe Betriebsfreigabe
und die dafür offenen Prüfungen aus Abschnitt 11 behalten ihren eigenen Umfang;
dieser Nachtrag behauptet hierfür keine neue Verifikation.
