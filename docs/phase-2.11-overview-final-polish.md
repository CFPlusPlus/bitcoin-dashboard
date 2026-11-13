# Phase 2.11 – Overview Final Polish

Stand: 13. November 2026 (Europe/Berlin). Basis: aktueller `origin/main`
`297a905d2b82119553a90d30609c5f2a0cceab73`, nach `git fetch origin main`.
Branch: `feature/phase-2.11-overview-final-polish`.

## Bestandsaufnahme

Die bestehende Übersicht erfüllt das Bitcoin-Analytical-Konzept bereits weitgehend:
fünf gleich breite KPI-Karten mit Subgrid, zurückhaltende Tokens, getrennte Provider,
ein gemeinsamer historischer Chart und eine ruhige Live-Kursüberblendung.
Untersucht wurden Übersicht, LivePrices, SoftPrice, Markt-/Netzwerkkarten,
Card/DataStatus, Chartintegration, globale Tokens und vorhandene UI-/E2E-Tests.
Die Ausgangsversion wurde zunächst mit deterministischen Fixtures in Chromium
gerendert; Desktop und Mobilansicht wurden visuell geprüft.

**Objektiv nachgewiesen:**

- Die bisherigen Viewport-Breakpoints reagieren nicht auf eine auf 200 % gesetzte
  Root-Schriftgröße. Bei 768 px bricht `900.000` in zwei Zahlenzeilen um; die
  Hashrate mit Einheit benötigt bis zu drei Zeilen. Bei 1440 px bleibt trotz
  Textvergrößerung die enge Fünferreihe erhalten. Ein reiner Test auf Seitenüberlauf
  erkennt dieses Lesbarkeitsproblem nicht.
- Im Prüfverlauf erzeugen die bestehenden Fehler-Schaltflächen bei 320 px und
  200 % Text einen `scrollWidth` von 363 px. Der gemeinsame Button verwendet
  `whitespace-nowrap`; der längere zweite Button war bereits umbrechbar.
- Der Halving-Balken fehlt während des Ladens vollständig. Nach dem Laden kommen
  sechs Pixel vor der Detailauflistung hinzu. Chart-Platzhalter und Canvas haben
  unterschiedliche äußere Abstände und nehmen unterschiedlich am Flexlayout teil.
- DataStatus zeigt pausierte anfängliche Chain-Abfragen bisher als Laden an;
  Hashrate und Markt besitzen bereits einen ausdrücklichen Offline-Hinweis.
- Die README beschreibt noch drei gesperrte Hashrate-Konfigurationen. Tatsächlich
  setzt der Basiscommit Preview und Production auf `true`, lokal bleibt `false`.

**Gestalterische Optimierungen, keine Funktionsfehler:**

- Kontextkarten trennen ihre Quellenbereiche weniger deutlich von den Kennzahlen
  als die KPI-Reihe. Metadata-Text nutzt dort eine andere Zeilenhöhe.
- Der Mempool-Hauptwert nutzt eine andere Größenskala als die benachbarten Werte.
- Verbleibende Halving-Blöcke und veraltete Markt-/Hashratewerte könnten innerhalb
  der vorhandenen Hierarchie deutlicher erkennbar sein.

## Umsetzung und Begründung

- Container-Abfragen mit `rem` ersetzen die beiden Breakpoints für KPI-Grid und
  Kontextlayout. Entscheidend sind verfügbare Inhaltsbreite und berechnete
  Textgröße. Das bestehende Grid/Subgrid bleibt erhalten. Die mobile Regel setzt
  auch die spezifischen Markt-/Fehlerkarten explizit auf eine Spalte zurück.
- Kennzahlen erhalten getrennte Zahl- und Einheitenelemente mit einem gemeinsamen
  Baseline-Flexlayout. Normale Fixturezahlen bleiben bei allen sechs Prüfbreiten
  auch mit 200 % Text in einer Zahlenzeile; bei Platzmangel wandert die Einheit
  darunter. Extremwerte bis zur gültigen Hashrate-Vertragsgrenze dürfen vollständig
  umbrechen, ohne Abschneiden, Rundungsänderung oder verkleinerte Zahlenschrift.
- Quellenbereiche von Halving und Mempool erhalten dieselbe ruhige Trennung und
  Zeilenhöhe wie die KPI-Footer. Der Mempool-Hauptwert übernimmt die vorhandene
  KPI-Typografie; verbleibende Blöcke werden über das bestehende Schriftgewicht
  hervorgehoben. Quelle, Zeiten, Methodik und Status bleiben zugänglich.
- Veraltete bzw. pausierte Markt-/Hashratezustände und Fehlermeldungen verwenden
  das vorhandene Warning-Token. Text und Alert-/Statussemantik bleiben erhalten.
- DataStatus besitzt einen optionalen `showOffline`-Parameter. Nur die Übersicht
  aktiviert ihn, einschließlich Mempool. Er zeigt pausierte Abfragen ausdrücklich
  an und ersetzt bei anfänglich pausierten Abfragen den irreführenden Ladetext.
  Das Standardverhalten anderer Seiten bleibt unverändert und ist mitgetestet.
- Die Übersicht erlaubt Fehlerbuttons einen natürlichen Zeilenumbruch. Andere
  Seiten und der globale Button bleiben unverändert.
- Ein statischer sechs Pixel hoher Halving-Track reserviert Platz. Ohne gültige
  Daten gibt es weiterhin keinen semantischen Fortschrittswert und keine
  indeterminierte Animation. Chart-Platzhalter und Canvas teilen Flexbasis und
  Außenabstände, ausschließlich innerhalb der Übersicht.
- Die README beschreibt den versionierten Hashrate-Stand des Basiscommits korrekt.
  Daraus wird keine Aussage über tatsächlich ausgerollte Umgebungen abgeleitet.

LivePrices, SoftPrice und deren ursprüngliche Viewport-Regeln bleiben unverändert.
Insbesondere bleiben Kraken-Protokoll, Anzeigetakt, Crossfade, Kurs-/Empfangszeiten
und Verbindungsbehandlung erhalten. Gemeinsamer Chart, CoinGecko-Verarbeitung,
Validierung, Query-/Cachinglogik, Releaseflags, Access, APIs, Secrets und
Abhängigkeiten werden nicht geändert.

## Betroffene Dateien

| Datei                                             | Änderung                                       |
| ------------------------------------------------- | ---------------------------------------------- |
| `src/pages/overview.tsx`                          | Offline-Anzeige für Mempool aktivieren         |
| `src/styles/overview.css`                         | Grid, Werte, Metadaten, Warnungen, Ladeslots   |
| `src/components/overview/network.tsx`             | Wertelemente, Halving-Track, Statusdarstellung |
| `src/components/overview/market-metrics.tsx`      | Wertelemente und semantische Statusfarbe       |
| `src/components/bitcoin-data.tsx`                 | Optionale Offline-Darstellung, Standard bleibt |
| `src/test/overview-ui.test.tsx`                   | Offline vor Daten, Erholung, geteilte Defaults |
| `e2e/overview-polish.spec.ts`                     | 20 deterministische Browserprüfungen           |
| `README.md`                                       | Phasenverweis und aktueller Hashrate-Flagstand |
| `docs/screenshots/phase-2.11/` und dieser Bericht | Vorher-/Nachher- und Zustandsnachweise         |

## Responsive Verhalten und Accessibility

Prüfmatrix: 320, 390, 768, 1024, 1440 und 1920 px, jeweils Dark/Light,
jeweils 100 % und 200 % Root-Schriftgröße. Oberhalb von 68,75 rem Inhaltsbreite
stehen fünf KPIs nebeneinander. Darunter stehen zwei Marktkarten über drei
Netzwerkkarten; Chart und Kontext werden gestapelt. Bis 37,5 rem steht jede
Karte einzeln. Container-Abfragen berücksichtigen dabei die Root-Schriftgröße.
Bei 1440/1920 px und Standardschrift bleibt die großzügige Desktopstruktur.
Der Live-Kursbereich behält seine bisherigen Viewport-Breakpoints.

Geprüft werden Zahlenzeilen mit echten DOM-Textrechtecken, intrinsischer Überlauf,
Wert-/Footer-/Kartenkanten pro Gridzeile und fehlender horizontaler Seitenüberlauf.
Die Blocktabelle behält auf schmalen Geräten ihren vorgesehenen lokalen Scrollbereich.
Es gibt keine festen Kartenhöhen. Lange Fehlertexte dürfen die Karte vergrößern.

Die Browserprüfungen decken sichtbaren Tastaturfokus am Währungswähler,
Tab/Enter-Bedienung der Zeiträume, EUR/USD-Wechsel und Reduced Motion ab.
Bestehende Live-Motion-Tests prüfen weiterhin Opacity-Crossfade ohne Transformation,
stabile Ziffern-/Indikatorpositionen und ausgeschaltete Animation bei Reduced Motion.
Überschriften, beschriftete Controls und Fortschrittssemantik bleiben erhalten.
Offline bleibt lesbarer Text; wichtige Warnungen werden nicht in Details versteckt.
Die vorhandenen Texttokens `foreground`, `foreground-secondary` und `warning`
werden auf `surface` in beiden Themes auf mindestens 4,5:1 geprüft.

## Verifikation

Vorhandenes gepinntes Node 22.22.2 / npm 10.9.7 aus `.wrangler/toolchain`.
Keine Installation und keine Lockfileänderung. Lokale Pages-/Chromium-Prozesse
benötigen Zugriff außerhalb der Windows-Dateisandbox auf Loopback und Wranglers
lokale Registry. Telemetrie ist deaktiviert. Kein Deployment.

| Prüfung                | Ergebnis                                         |
| ---------------------- | ------------------------------------------------ |
| `npm run lint`         | Erfolgreich, keine Warnungen                     |
| `npm run format:check` | Erfolgreich                                      |
| `npm run typecheck`    | Alle vier TypeScript-Konfigurationen erfolgreich |
| `npm test`             | 753 Tests in 32 Dateien erfolgreich              |
| `npm run build`        | Erfolgreich, 2.633 Module verarbeitet            |
| `npm run pages:check`  | Worker erfolgreich kompiliert                    |
| `npm run test:e2e`     | 184 Tests erfolgreich, 2,1 Minuten               |
| `git diff --check`     | Erfolgreich                                      |

Die 20 zusätzlichen E2E-Fälle umfassen die zwölf Breiten-/Theme-Kombinationen
inklusive Textvergrößerung, Währung, Tastatur und Reduced Motion sowie je Theme
gültigen Extremwert, Ladewechsel, veraltete/ungültige Antworten und Offline/Kontrast.
Ein zusätzlicher Integrationstest prüft anfängliches Offline und Erholung,
einschließlich unverändertem Standardverhalten der gemeinsamen Komponente.
Bestehende Tests werden vollständig ausgeführt und nicht abgeschwächt.

## Visuelle Nachweise

Alle Bilder tragen sichtbar **Testfixture OV-211 · synthetische Prüfdaten** bzw.
den entsprechenden Zustandszusatz. Es handelt sich um lokale Chromium-Renderings
der tatsächlichen React-Anwendung mit kontrollierten API-/WebSocket-Daten.
Die Vorherbilder wurden vor Änderungen an Anwendungscode vom Basisstand erstellt.
Die Nachherbilder werden von `e2e/overview-polish.spec.ts` erzeugt.

| Ansicht                | Vorher                                                                  | Nachher                                                           |
| ---------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Desktop Dark, 1440 px  | [Vorher](screenshots/phase-2.11/before-overview-1440-dark-fixture.png)  | [Nachher](screenshots/phase-2.11/overview-1440-dark-fixture.png)  |
| Desktop Light, 1440 px | [Vorher](screenshots/phase-2.11/before-overview-1440-light-fixture.png) | [Nachher](screenshots/phase-2.11/overview-1440-light-fixture.png) |
| Mobil Dark, 390 px     | [Vorher](screenshots/phase-2.11/before-overview-390-dark-fixture.png)   | [Nachher](screenshots/phase-2.11/overview-390-dark-fixture.png)   |
| Mobil Light, 390 px    | [Vorher](screenshots/phase-2.11/before-overview-390-light-fixture.png)  | [Nachher](screenshots/phase-2.11/overview-390-light-fixture.png)  |

Zusätzliche Zustandsnachweise:

- 320 px, 200 % Text: [Dark](screenshots/phase-2.11/overview-320-text-200-dark-fixture.png), [Light](screenshots/phase-2.11/overview-320-text-200-light-fixture.png).
- Veraltete Daten: [Dark](screenshots/phase-2.11/overview-stale-dark-fixture.png), [Light](screenshots/phase-2.11/overview-stale-light-fixture.png).
- Fehler, 320 px, 200 % Text: [Dark](screenshots/phase-2.11/overview-error-320-text-200-dark-fixture.png), [Light](screenshots/phase-2.11/overview-error-320-text-200-light-fixture.png).

## Grenzen, Regressionen und offene Punkte

Die Prüfung erfolgt in Chromium, nicht separat in Firefox/WebKit oder mit einem
realen Screenreader. Textvergrößerung wird deterministisch über die Root-Schrift
geprüft; dies ist kein zusätzlicher Nachweis für jede Browser-Zoomimplementierung.
Canvas-Achsentext behält seine bestehende Pixelgröße und zugängliche Chartbeschreibung.
Aktuelle Browser mit Subgrid, Container Queries und Container-Einheiten werden
vorausgesetzt. Der Gridwechsel hängt nun von der Inhaltsbreite ab und kann deshalb
etwas früher als der bisherige Viewport-Breakpoint eintreten.

Reservierte Grafikflächen reduzieren Ladereflow; vollständige Verschiebungsfreiheit
bei unterschiedlich langen Warnungen, neuen Zeitstempeln und Fehlertexten wird
nicht behauptet. Solche Inhalte dürfen natürlich wachsen. Extrem lange gültige
Zahlen können mehrzeilig werden und bleiben vollständig lesbar.

Keine erkannten fachlichen Probleme wurden durch Änderungen an Datenverarbeitung
oder Verträgen behoben. Produktion, externe Access-Policies und echte Provider
wurden in dieser Phase nicht geprüft. Deren Betriebsnachweis bleibt gesondert.
Keine produktiven Konfigurationsänderungen, kein Merge und kein Deployment.
Arbeitscommits verwenden die bestehende Konvention `[CF-Pages-Skip]`.
Der Pull Request ist zur manuellen Prüfung bestimmt; ein späterer Merge-/Squashcommit
muss die Deploymentkonvention ebenfalls berücksichtigen.
