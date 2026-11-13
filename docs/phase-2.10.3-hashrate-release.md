# Phase 2.10.3 – Hashrate-Freigabe und Produktionsvalidierung

Stand: 13. November 2026, Europe/Berlin. Status: **Freigabe vorbereitet**.
Branch: `feature/phase-2.10.3-hashrate-release`. Basis nach `git fetch origin main`:
`31299ac5e0d020ededc7f0561a3ef6a76018a529` (aktueller `main`, inklusive Phase 2.10.2).

| Stufe                         | Nachweis / Status                                              |
| ----------------------------- | -------------------------------------------------------------- |
| Freigabe vorbereitet          | Umgebungen explizit getrennt, Anleitung und Rollback vorhanden |
| Lokal getestet                | Automatisierte Fixtures und ein echter Anbieterabruf           |
| In Cloudflare Preview geprüft | Offen; kein Preview-Deployment ausgeführt                      |
| Produktiv freigegeben         | Offen; separate manuelle Zustimmung erforderlich               |
| Produktiv sicher validiert    | Offen; lokale Tests beweisen keinen Access-Schutz              |

## Ausgangssituation und Änderungen

Alle im Auftrag genannten Dateien sowie Unit-/Integrations-/E2E-Tests und
`docs/phase-2.10-dynamic-overview.md` wurden vor der Änderung geprüft.
Abweichend von der Auftragsannahme enthält der aktuelle `main` bereits ein globales
`MINING_HASHRATE_ENABLED="true"`, eingeführt mit `31299ac` nach Phase 2.10.2.
Die README beschreibt dagegen noch ein fehlendes Flag. Daraus lässt sich weder ein
tatsächliches Deployment noch ein wirksamer produktiver Access-Schutz ableiten.

Die vorhandene Implementierung kann ausschließlich über das serverseitige Flag
aktiviert werden. API, Parser, Cache und Browserabfrage benötigen dafür keine
Änderung. Ein zuvor empfangenes `HASHRATE_NOT_RELEASED` blockiert spätere erfolgreiche
Abfragen nicht; dies ist jetzt server- und browserseitig ausdrücklich getestet.

Gezielte Änderungen:

- `wrangler.jsonc`: Hashrate im vorbereiteten Stand lokal, in Preview und Production
  explizit `"false"`; vollständige getrennte `vars`-Blöcke. Alle vier bestehenden
  Marktflags bleiben jeweils `"true"`.
- `src/components/overview/network.tsx`: ausschließlich die Hashrate-Zahl erhält
  genau zwei Nachkommastellen. Der bisherige gemeinsame Formatter setzt nur die
  maximale Stellenzahl und zeigte beispielsweise `1.050` statt `1.050,00`.
- `src/test/hashrate-functions.test.ts`: Freigabe nach 503, Erholung nach 500/429,
  exakte Cooldown-Grenze, Nullwert und JSON-Zahlenüberlauf zusätzlich abgesichert.
- `src/test/overview-ui.test.tsx`: nächste automatische Abfrage nach Freigabe oder
  Netzwerkfehler, genaue Anzeige einschließlich Quelle/Methodik/Abrufzeit,
  Cooldown-Ende, gemeinsame Verbraucher, Re-Render und Hintergrundpause geprüft.
- README und dieser Bericht beschreiben den aktuellen Freigabestand.

Keine neuen Abhängigkeiten, Datenquellen, Routen, Secrets, Animationen oder
Designänderungen. Live-Kursanimation, Fehlerbehandlung, Cachelogik, Security-Header,
CSP und Access-Konfiguration bleiben unverändert.

## Feature-Flag und getrennte Zielumgebungen

Nur der exakte String `"true"` aktiviert die Route; fehlend, leer oder `"false"`
bleibt gesperrt. Das Flag ist kein `VITE_*`-Wert und gelangt nicht ins Browserbundle.

| Konfiguration                                 | Vorbereiteter Wert | Änderung nach jeweiliger Freigabe      |
| --------------------------------------------- | ------------------ | -------------------------------------- |
| `vars.MINING_HASHRATE_ENABLED`                | `"false"`          | Lokal bei Bedarf temporär testen       |
| `env.preview.vars.MINING_HASHRATE_ENABLED`    | `"false"`          | Nur für genehmigte Preview `"true"`    |
| `env.production.vars.MINING_HASHRATE_ENABLED` | `"false"`          | Erst nach Produktionsfreigabe `"true"` |

Die [Cloudflare-Pages-Konfiguration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
unterstützt ausschließlich `env.preview` und `env.production`. Weil `vars` nicht
vererbt werden, enthalten beide Blöcke auch alle unveränderten Marktflags.
Die installierte Wrangler-Version hat alle drei effektiven Konfigurationen ohne
Deployment eingelesen: Hashrate jeweils `false`, Marktflags jeweils `true`.

Das globale Flag darf nicht als Produktionsschalter verwendet werden. Nach
expliziter Preview-Freigabe wird ausschließlich der Preview-Eintrag geändert und
die genehmigte Branchrevision gezielt bereitgestellt; Production bleibt `false`.
`env.preview` ist eine Umgebung und kein frei wählbarer einzelner Branchschalter.
Branch, Commit und Ziel-URL müssen deshalb vor dem Preview-Deployment feststehen.
Nach erfolgreicher Preview-Abnahme und separater Produktionsfreigabe wird nur der
Production-Eintrag geändert und eine geprüfte Revision manuell bereitgestellt.
Der Preview-Wert erhält dadurch keine zusätzliche Freigabe.

Mit `pages_build_output_dir` ist die versionierte Wrangler-Konfiguration die
Konfigurationsquelle. Eine alleinige Dashboard-Änderung kann beim nächsten
Deployment überschrieben werden; Änderungen müssen mit der freigegebenen Revision
übereinstimmen. Server-Secrets wie `COINGECKO_DEMO_API_KEY` bleiben extern und werden
weder in `vars` kopiert noch verändert. Ignorierte `.dev.vars` können lokale Werte
überlagern und sind kein Nachweis einer bereitgestellten Umgebung.

**Auswirkung einer späteren Bereitstellung dieses vorbereiteten Standes:** Sie
setzt die Hashrate in beiden Deploymentumgebungen auf `false`, auch wenn der
bisherige globale `true`-Wert dort schon ausgerollt wurde. Der aktuelle externe
Betriebszustand wurde nicht geprüft. Dieser PR wird nicht automatisch ausgerollt.

## API-Vertrag und Datenmethodik

Bestehende Route: `GET /api/mining/hashrate` unter derselben Domain, ohne
Queryparameter. Feste Quelle:
`https://mempool.space/api/v1/mining/hashrate/1m`.

Der [offizielle Provider-Code](https://github.com/mempool/mempool/blob/master/backend/src/api/mining/mining-routes.ts)
ruft für `currentHashrate` `getNetworkHashPs(1008)` auf. Dieser aktuelle
Netzwerkschätzwert wird in **H/s** übernommen. `1m` beschränkt lediglich den
historischen Teil der Anbieterantwort; es ist nicht das Schätzfenster des
aktuellen Wertes. Historische Tageswerte und Difficulty werden nicht verwendet.
EH/s entsteht durch einmalige Division durch `1e18`; die Karte formatiert
deutsch mit genau zwei Dezimalstellen.

Die normalisierte Antwort enthält nur
`data: {hashesPerSecond, estimationBlocks: 1008, unit: "H/s"}`,
`source: "mempool.space"` und `updatedAt`. Letzteres ist der erfolgreiche Abrufzeitpunkt,
kein separater Messzeitpunkt des Anbieters. Serverseitige Cachehits behalten ihn bei.
Der Zahlenwert muss numerisch, endlich, positiv und höchstens `1e30` sein.
Browser und Server validieren unabhängig; falsche Einheit, Methodik oder Zeitmetadaten
werden abgelehnt. Fehlende Werte, `null`, Strings, Null, negative Werte und
Zahlenüberlauf werden nicht als Hashrate angezeigt.

| Situation                      | HTTP | Sichere Fehlerhülle / Zusatzheader            |
| ------------------------------ | ---- | --------------------------------------------- |
| Gültig, freigegeben            | 200  | Normalisierte Antwort                         |
| Queryparameter                 | 400  | `INVALID_REQUEST`                             |
| Andere Methode                 | 405  | `METHOD_NOT_ALLOWED`, `Allow: GET`            |
| Flag nicht exakt `true`        | 503  | `HASHRATE_NOT_RELEASED`, kein Anbieterrequest |
| Anbieter-429 / Cooldown        | 429  | `UPSTREAM_RATE_LIMIT`, `Retry-After: 600`     |
| Timeout                        | 504  | `UPSTREAM_TIMEOUT`                            |
| Ungültige/zu große Antwort     | 502  | `UPSTREAM_INVALID_RESPONSE`                   |
| HTTP-Fehler / nicht erreichbar | 502  | `UPSTREAM_UNAVAILABLE`                        |

Fehlerformat: `{ "error": { "code": "…" } }`. Keine Providertexte, internen
Exceptions, URLs oder Credentials im Browser. Logs enthalten nur Ereignis,
Fehlerkategorie und gegebenenfalls HTTP-Status. Der Providerrequest erhält nur
den neu erzeugten Accept-Header; Cookie, Authorization und Access-JWT werden
nicht weitergegeben. Redirects werden nicht verfolgt.

## Aktualisierung, Cache und Anzeige

- Server: acht Sekunden Deadline einschließlich Body; höchstens 128 KiB Provider-
  und 4 KiB normalisierte Daten; 15 Minuten Cache pro Function-Isolate; ein laufendes
  Promise dedupliziert parallele Abrufe. Kein global koordinierter Cache.
- Browser: gleichbleibender Querykey `['mining', 'hashrate']`, 15 Sekunden Deadline,
  4 KiB Antwortlimit, 15 Minuten Frische/Polling, eine Stunde Garbage Collection.
  Gemeinsame Verbraucher teilen Requests; Re-Render erzeugn keine neuen Abrufe.
- Polling pausiert im Hintergrund. Mount, Fokus und Reconnect können veraltete Daten
  erneut laden, respektieren aber den eigenen Cooldown. Offline-Abrufe pausieren
  entsprechend der vorhandenen React-Query-Architektur.
- HTTP 429 setzt auf beiden Seiten zehn Minuten Cooldown. Kein automatischer
  Retry-Loop. Ein neuer regulärer Abruf ist nach Ende der Pause wieder möglich;
  der Browser pollt weiterhin im 15-Minuten-Rhythmus.
- Jede API-Antwort hat `Cache-Control: no-store`, auch 503. Fehler werden nicht als
  gültiger Datensatz gecacht. Die nächste erfolgreiche Browserabfrage ersetzt
  `HASHRATE_NOT_RELEASED` automatisch; kein Reload oder Cache-Purge erforderlich.
- Nach Fehlern bleibt ein vorhandener gültiger Browserwert mit ursprünglicher
  Abrufzeit erhalten und wird als veraltet markiert. Auch ohne Fehler wird ein
  mindestens 30 Minuten alter Wert entsprechend gekennzeichnet.
- Ladezustand, Freigabehinweis, Quelle, 1.008-Blöcke-Methodik und Abrufdatum bleiben
  erhalten. Andere Karten funktionieren unabhängig von Hashratefehlern weiter.

## Verifikation

Laufzeit: vorhandenes gepinntes Node 22.22.2 / npm 10.9.7 unter
`.wrangler/toolchain`, Wrangler 4.152.0. Keine Installation oder Lockfileänderung.
Wrangler-Logs liegen im ignorierten `.wrangler/logs`; Telemetrie ist deaktiviert.
Lokale Worker-/Browserprozesse benötigen außerhalb der Windows-Dateisandbox
Loopbackzugriff. Es wurde kein Cloudflare-Deployment ausgeführt.

| Prüfung                | Ergebnis                                      |
| ---------------------- | --------------------------------------------- |
| `npm run lint`         | Erfolgreich, 0 Warnungen                      |
| `npm run format:check` | Erfolgreich                                   |
| `npm run typecheck`    | Alle 4 TypeScript-Konfigurationen erfolgreich |
| `npm test`             | 752 Tests in 32 Dateien erfolgreich           |
| `npm run build`        | Erfolgreich, 2.633 Module verarbeitet         |
| `npm run pages:check`  | Worker erfolgreich kompiliert                 |
| `npm run test:e2e`     | 164 Tests erfolgreich, 1,8 Minuten            |
| `git diff --check`     | Erfolgreich                                   |

**Simulierte Tests:** Alle regulären Unit-/Integrations-/Chromium-/Pages-Tests
verwenden kontrollierte Providerfixtures. Sie decken Flags an/aus, gültige und
ungültige Daten, HTTP-/Transportfehler, Body-Timeout, Rate-Limit, Cachehit/-ablauf,
Deduplication, Erholung, Hintergrundpause und unabhängige Dashboardkarten ab.
Die 39 gezielten Hashrate-/Übersichtsprüfungen bestehen; neun davon sind in dieser
Phase ergänzte Fälle. Kein Test wurde entfernt oder abgeschwächt.

**Echter Anbieterabruf, lokal:** Am 13.11.2026 um 13:42:14 MEZ
(`2026-11-13T12:42:14.625Z`) wurde der kompilierte Worker in lokalem Miniflare mit
`MINING_HASHRATE_ENABLED=true` ausschließlich im Testspeicher ausgeführt. Sein
festes Outbound-Ziel wurde einmal tatsächlich per HTTPS abgerufen und die echte
Antwort unverändert an den Worker weitergereicht. Provider und eigene Route:
HTTP 200, 2.195 Providerbytes, `currentHashrate=925666774824027600000` H/s,
also `925,67 EH/s`. Der normalisierte Wert stimmt mit dem Provider überein;
`unit`, `estimationBlocks`, Quelle, `no-store` und fehlende Credentialweitergabe
wurden geprüft. Ein zweiter Aufruf lieferte denselben Datensatz samt Abrufzeit aus
dem Cache; insgesamt genau ein echter Anbieterrequest in dieser lokalen Prüfung.
Die öffentliche Anbieterantwort wurde zusätzlich einmal über das Recherchetool
eingesehen. Das sind Momentaufnahmen, keine Verfügbarkeitszusage.

**Produktive End-to-End-/Access-Prüfung:** Nicht durchgeführt. Weder die lokale
Echtabfrage noch Fixturetests belegen Cloudflare-Preview, produktiven API-Betrieb,
aktuelle Access-Policies oder Schutz aller Hostnamen.

## Manuelle Abnahme nach gezieltem Deployment

Vor jeder Bereitstellung Umgebung, Branch/Commit, Freigebenden und Zeitpunkt
festhalten. Für Preview zunächst nur `env.preview.vars` freigeben. Für Production
erst nach dokumentierter Preview-Abnahme eine separate manuelle Freigabe einholen.

- [ ] Konkrete Preview-URL einschließlich Deploymenthash/Branchalias und alle
      produktiven Hostnamen inventarisieren: `bitcoin.falkner.info`,
      `bitcoin-dashboard-erm.pages.dev` sowie weitere vorhandene Deploymentadressen.
- [ ] Vor einem positiven Datentest anonymen Access-Schutz je Zielhostname für
      HTML, ein tatsächlich vorhandenes JS-/CSS-/Fontasset und
      `/api/mining/hashrate` prüfen. Redirect/Login/Access-Denial identifizieren;
      es dürfen keine geschützten Anwendungsbytes erscheinen. Auch ein
      anonymes Anwendungs-503 ist kein Access-Nachweis. Vollständige Anleitung:
      [externe Access-Abnahme](cloudflare-pages-verification.md#manual-external-access-verification-separate-release-gate).
- [ ] Mit autorisiertem Konto laden: API 200 mit positivem endlichem H/s-Wert,
      Quelle mempool.space, 1.008 Blöcke, plausibler erfolgreicher Abrufzeitpunkt;
      Karte in EH/s mit zwei Dezimalstellen, ohne Konsolenfehler.
- [ ] Wiederholten Abruf innerhalb von 15 Minuten prüfen: unverändertes `updatedAt`
      bei Cachehit. Isolatewechsel können neue Abrufzeiten erzeugen. Nach Ablauf
      erneuten erfolgreichen Abruf und im Hintergrund ausbleibendes Polling prüfen.
- [ ] Vorherigen Freigabehinweis nach Aktivierung durch reguläre Neuabfrage
      verschwinden lassen; keine manuelle Browsercachelöschung erforderlich.
- [ ] Laden/Fehler/alten Wert und Unabhängigkeit von Kursen, Markt, Blockchain,
      Halving und Historie prüfen. Anbieterfehler/Rate-Limits nur kontrolliert
      simulieren; keine echte Überlast erzeugen.
- [ ] Bestehende Header und CSP auf statischen/API-Antworten prüfen; Browser ruft
      Hashrate nur same-origin ab; keine Tokens/Secrets in Bundle oder Logs.
- [ ] Ergebnis je Umgebung mit Commit, UTC-Zeit, URL, HTTP-Status, UI-Befund und
      Access-Nachweis dokumentieren, ohne Cookies/Tokens/Loginparameter zu speichern.
- [ ] Nach erfolgreicher Preview-Abnahme Production separat freigeben, gezielt
      ausrollen und sämtliche Access-/Funktionsprüfungen dort wiederholen.

Offene Nachweise bleiben offen; erst nach erfolgreichem echten Betrieb und
Sicherheitsprüfung der vorgesehenen Umgebung darf diese als freigegeben gelten.

## Git-Workflow und Rollback

Arbeitscommit mit Präfix `[CF-Pages-Skip]`, um nach der
[Cloudflare-Git-Konvention](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
ein automatisches Pages-Deployment dieses Pushes zu unterdrücken. PR gegen `main`,
kein Auto-Merge. Ein späterer Merge-/Squashcommit und manuelle Deployments müssen
eigens kontrolliert werden; das Präfix im Arbeitscommit schützt nicht automatisch
einen anders benannten Mergecommit. GitHub CI enthält keinen Deploymentjob.

Rollback einer freigegebenen Umgebung:

1. Ausschließlich deren `env.preview.vars.MINING_HASHRATE_ENABLED` bzw.
   `env.production.vars.MINING_HASHRATE_ENABLED` wieder auf `"false"` setzen.
   Andere Umgebung, Marktflags, Secrets und Access unverändert lassen.
2. Änderung prüfen und das manuell genehmigte Deployment für genau dieses Ziel
   ausführen. Eine reine Repo-/Dashboardänderung beendet keinen laufenden Worker.
3. Authentifiziert 503 mit `HASHRATE_NOT_RELEASED` und `Cache-Control: no-store`
   bestätigen. Das Gate liegt vor dem Datencache; kein Servercache-Purge nötig.
4. Im Browser kann der letzte gültige Wert bis zur nächsten Abfrage sichtbar
   bleiben; dann bleibt er als veraltet mit Freigabehinweis erhalten. Andere
   Dashboardkarten und anonymen Access-Schutz erneut prüfen.

Kein blindes Zurückrollen auf die Ausgangsrevision `31299ac`: Sie enthält gerade
das globale `true`. Bei einem vollständigen Deploymentrollback muss deshalb
auch der effektive Hashrate-Flagwert der Zielrevision geprüft werden.
