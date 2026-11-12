# Phase 2.10.1 – Live-Kurs-Animation und Layout-Refinement

Stand: 12.11.2026. Basis: aktueller `origin/main`, `6b1f6f0` (Phase 2.10,
PR #23). Feature-Branch: `feature/phase-2.10.1-overview-refinement`.

## Bestandsanalyse und Ergebnis

Die bisherige Übersicht verarbeitete jede gültige Kraken-Nachricht sofort und
veröffentlichte Kurse über einen nachrichtengetriebenen 250-ms-Timeout. Der
5-Sekunden-Watchdog und Statusnachrichten konnten diesen Timeout zusätzlich
auslösen. Richtung und Differenz bezogen sich auf die letzten empfangenen Ticks,
auch wenn der vorherige Tick nie auf dem Bildschirm erschienen war.

Das Kennzahlenraster bestand aus `2fr 1fr 1fr 1fr` und einem weiteren Zweiergrid
für Marktdaten. Dessen Quellenbereich stand unter den Karten. Ab 1100 px wechselte
die Komposition; im Analysebereich waren die Außenkanten durch `align-items:
start` unabhängig voneinander.

| Bereich      | Vorher                                           | Jetzt                                                     |
| ------------ | ------------------------------------------------ | --------------------------------------------------------- |
| Live-Kurs    | Nachrichtengetriebene 250-ms-Bündelung           | Feste 1000-ms-Anzeigeintervalle pro Paar                  |
| Richtung     | Gegenüber letztem Empfang                        | Gegenüber tatsächlich angezeigtem Preis                   |
| Ziffern      | Textwechsel, gesamte Zahl zeitweise farbig       | Nur geänderte Ziffern rollen; kurzer farbiger Texthinweis |
| Kennzahlen   | Verschachtelte Raster, externer Marktstatus      | Fünf gleichwertige Karten, Status und Herkunft innen      |
| Karteninhalt | Unterschiedliche Titel-, Wert- und Fußpositionen | Gemeinsame vier Zeilen mit CSS Subgrid                    |
| Analyse      | Unterschiedliche Unterkanten                     | 12 Spalten, Chart 8 / Kontext 4, gemeinsame Außenkanten   |
| Mobil        | Abweichende Kartenstrukturen                     | Einspaltig, natürliche Inhaltshöhen                       |

Vorher: [Desktop Dark](screenshots/phase-2.10/overview-1440-dark-fixture.png),
[Mobil Light](screenshots/phase-2.10/overview-390-light-fixture.png).
Nachher: [Desktop Dark](screenshots/phase-2.10.1/overview-1440-dark-fixture.png),
[Mobil Light](screenshots/phase-2.10.1/overview-390-light-fixture.png).
Beide Generationen zeigen ausdrücklich synthetische, kontrollierte Prüfdaten.

## Empfang, Anzeige und Lebenszyklus

`KrakenService` behält den bestehenden Socket, Parser, Subskriptionsvertrag,
Backoff und `useSyncExternalStore`. Der Empfangspuffer enthält pro Paar sofort
den neuesten gültigen Wert, seinen echten Empfangszeitpunkt, die Providerzeit
und die Verbindungsgeneration. `getLatestQuote` erlaubt die unabhängige Prüfung
dieses Empfangsstands. Ungültige oder innerhalb einer Verbindung zeitlich
rückläufige Nachrichten werden weiterhin verworfen.

Die sichtbaren Kurse liegen separat vor. Der erste bestätigte gültige Wert einer
Verbindung erscheint unmittelbar. Pro Paar beginnt dann ein festes Intervall von
1000 ms, unabhängig von der Nachrichtenfrequenz und vom anderen Währungspaar.
Jeder Intervallschritt übernimmt höchstens den neuesten noch nicht angezeigten
Empfang. Ohne neue Daten bleibt derselbe React-Snapshot erhalten. Es werden weder
Durchschnittswerte noch zusätzliche Kurse oder API-Aufrufe erzeugt.

Verbindungs-, Provider-, Offline- und Abonnementzustände werden sofort aus dem
Empfangsstand veröffentlicht; sie ziehen keine gepufferten Preisänderungen vor.
Frische beruht weiterhin auf dem älteren von Provider- und Empfangszeitpunkt,
beziehungsweise nur dem Empfang, wenn die Providerzeit fehlt. Der Anzeige-Timer
erneuert keinen dieser Zeitpunkte. Der vorhandene Watchdog prüft weiterhin alle
fünf Sekunden; Heartbeats halten ausschließlich die Verbindung aktiv.

Die Differenz wird aus den beiden auf zwei Dezimalstellen gerundeten sichtbaren
Preisen berechnet. Beispiel: sichtbar 72.000,00, empfangen 72.010,00 und danach
72.005,00 ergibt beim nächsten Schritt **+5,00**, keinen Rückgang um 5,00.
Ein unveränderter sichtbarer Preis hat weder Animation noch Richtungshinweis.
Der Hinweis verschwindet nach 300 ms, unabhängig von weiteren Empfängen.

Neue Snapshots, Reconnects und Rückkehr aus einem verborgenen Tab setzen eine
neutrale Vergleichsbasis. Während kurzer Tabwechsel wird weiter empfangen, aber
keine Preisanimation abgespielt. Nach 30 Sekunden im Hintergrund gilt weiterhin
die bestehende Socket-Pause. Offline, Verbindungswechsel und Unmount räumen
Anzeigeintervalle und Feedback-Timer auf. Alte Handler und Generationen können
keine gepufferten Werte nachreichen. Der abbrechbare Verbindungsstart verhindert
weiterhin doppelte Sockets unter React StrictMode.

## Animationskonzept und Zugänglichkeit

`RollingPrice` verwendet React und CSS ohne neue Abhängigkeit. Jede Ziffer hat
einen festen tabellarischen Platz. Nur tatsächlich geänderte Ziffern bewegen
sich 260 ms vertikal; Aufwärts- und Abwärtsbewegung folgen der sichtbaren
Kursdifferenz. Jede Bewegung enthält ausschließlich die alte und neue Ziffer.
Trennzeichen bleiben fest. Es existiert kein Zähler über Zwischenwerte.
Bei einem Stellenwechsel oder einem Sprung ab 5 % ersetzt eine kurze Überblendung
die Rollbewegung. Neue Snapshots erscheinen ohne Richtungsanimation.

Eine feste Zahlenfläche hält auch beim Übergang von 99.999,99 zu 100.000,00
und bei größeren Sprüngen die horizontale Geometrie stabil. Außergewöhnlich lange
Zahlen passen ihre Schrift innerhalb dieser Fläche an. Auf engen Ansichten und
bei vergrößertem Text kann die Währungskennung in die nächste Zeile wechseln.
Die Formatierung bleibt `de-DE` mit zwei Dezimalstellen und explizitem EUR/USD.

Der positive/negative Akzent liegt nur auf dem kurzen Hinweis mit Pfeil und Text;
die ganze Kurszahl bleibt neutral. Eine vollständige aktuelle Zahl steht für
Screenreader bereit, die bewegten Zeichen sind `aria-hidden`. Die Preisfläche
ist keine ständig vorlesende Live-Region. Der Verbindungsstatus bleibt separat
zugänglich. `prefers-reduced-motion: reduce` deaktiviert Rollbewegung und
Überblendung und blendet die alten Zeichen aus.

## Raster und Umfang

Die fünf Kennzahlen sind direkte Kinder eines gleichmäßigen Fünfspaltenrasters.
CSS Subgrid teilt Titel, Zahlen, Erklärung und Fußbereich über alle Karten einer
Zeile. Die Höhe folgt dem tatsächlichen Inhalt einschließlich Fehlerhinweisen;
es gibt keine künstliche Mindesthöhe. Beide CoinGecko-Karten enthalten ihre
eigene Quellen- und Statuszuordnung, verwenden aber denselben bestehenden Query.
Die neuen Übersichtsvarianten für Höhe und Gebühren verwenden unverändert die
bisherigen Ressourcen und `DataStatus` inklusive Retry und Anmeldungshinweis.

Über 1100 px steht der Chart in acht von zwölf Spalten. Halving und Mempool
belegen gemeinsam vier Spalten. Die Chartfläche nutzt den verfügbaren Platz;
die rechten Karten behalten ihre natürlichen Inhaltshöhen. Bis 1100 px folgt der
Chart über die ganze Breite, darunter stehen die Kontextkarten nebeneinander.
Die Kennzahlen zeigen dann zwei Marktkarten und darunter drei Netzwerkkarten.
Bis 600 px stehen alle Karten untereinander. Die Blocktabelle folgt denselben
äußeren Containerkanten und behält auf kleinen Bildschirmen ihren internen
Tabellenscrollbereich.

Die Prüfung mit 200 % Text deckte bei 1100 px einen überlaufenden Navigationskopf
auf. Eine ausschließlich bei vorhandener `.overview-layout` aktive Regel erlaubt
den Umbruch der Navigation. Andere Seiten und die globalen Designtokens bleiben
unverändert. Radien, Farben, Rahmen und Abstände stammen weiter aus Bitcoin
Analytical. Providerarchitektur, API-Verträge, Ressourcen, Access, Secrets und
produktive Release-Flags wurden nicht geändert.

## Tests und visuelle Abnahme

Deterministische Fake-Timer und kontrollierte WebSocket-Nachrichten prüfen
sofortigen Empfang, exakte Intervallgrenzen, Zusammenfassung, unabhängige Paare,
unveränderte Preise, sichtbare Richtung, Status ohne vorzeitigen Kurswechsel,
alte Providerzeiten, Snapshots/Reconnects, kurze und lange Tabwechsel, Offline,
Cleanup, StrictMode und den bestehenden simulierten Sechsstundenbetrieb.
Komponententests prüfen einzelne geänderte Zeichen, ruhige Trennzeichen,
unveränderte DOM-Zeichen und die vollständige zugängliche Zahl.

Chromium prüft **320, 390, 768, 1100, 1440 und 1920 px**, jeweils Dark/Light und
zusätzlich 200 % Text an jeder Breite. Geometrieprüfungen vergleichen Kartenhöhe,
Titel-/Zahlen-/Fußpositionen, äußere Kanten und die beiden Analysespalten.
Weitere Fälle prüfen Laden, Fehler, Ziffernwechsel, Stellenwechsel, große Sprünge,
Reduced Motion, Statusfrische, Reconnect, Navigation, Währung, Zeiträume und die
bestehende Query-Wiederverwendung. Alle Providerzugriffe sind kontrolliert;
Screenshots sind kein Nachweis echter Live-Daten.

| Prüfung                | Ergebnis                                                |
| ---------------------- | ------------------------------------------------------- |
| `npm run lint`         | Erfolgreich, keine Warnungen                            |
| `npm run format:check` | Erfolgreich                                             |
| `npm run typecheck`    | Alle vier TypeScript-Konfigurationen erfolgreich        |
| `npm test`             | 741 Tests in 32 Dateien erfolgreich                     |
| `npm run build`        | Produktionsbuild erfolgreich                            |
| `npm run pages:check`  | Worker erfolgreich kompiliert, ohne Deployment          |
| `npm run test:e2e`     | 160 Chromium-/Pages-Tests erfolgreich, etwa 1,7 Minuten |
| `git diff --check`     | Erfolgreich                                             |

Nach der Absicherung der festen Zahlenfläche bei sehr großen Sprüngen und der
Intl-konsistenten Rundung an Halbcent-Grenzen wurden Unit-Tests und Build erneut
ausgeführt. Die 20 Übersichtstests prüfen auch den abschließenden Build, darunter
den Sprung auf 1.000.000.000.000,00 ohne horizontale Geometrieänderung.

Laufzeit: Node 22.22.2 und npm 10.9.7 aus der vorhandenen lokalen Toolchain.
Wrangler-/Chromium-Prüfungen benötigen außerhalb der Windows-Dateisandbox Zugriff
für lokale Worker und esbuild. Telemetrie ist ausgeschaltet; es erfolgt kein
Deployment. Abhängigkeiten und Lockfile bleiben unverändert.

Referenzbilder mit sichtbarem Fixturehinweis:

- [1440 px Dark](screenshots/phase-2.10.1/overview-1440-dark-fixture.png)
- [1440 px Light](screenshots/phase-2.10.1/overview-1440-light-fixture.png)
- [390 px Dark](screenshots/phase-2.10.1/overview-390-dark-fixture.png)
- [390 px Light](screenshots/phase-2.10.1/overview-390-light-fixture.png)
- [1100 px Dark](screenshots/phase-2.10.1/overview-1100-dark-fixture.png)
- [1100 px Light](screenshots/phase-2.10.1/overview-1100-light-fixture.png)
- [200 % Text, 320 px Dark](screenshots/phase-2.10.1/overview-320-text-200-dark-fixture.png)
- [200 % Text, 320 px Light](screenshots/phase-2.10.1/overview-320-text-200-light-fixture.png)
- [Ziffernübergang bei 130 ms](screenshots/phase-2.10.1/overview-rolling-fixture.png)

## Bekannte Einschränkungen

Die visuelle Prüfung und Automatisierung erfolgen in Chromium; andere Engines
wurden nicht separat geprüft. Subgrid und Container-Einheiten setzen einen
aktuellen Browser voraus. Browser können Timer in verborgenen Tabs oder bei
blockiertem Hauptthread verzögern; die 1000-ms-Taktung ist keine Echtzeitzusage.
Nach Rückkehr erfolgt keine Wiedergabe versäumter Ticks. Die Frischeüberwachung
und Providerabhängigkeiten aus Phase 2.10 bleiben bestehen.

Keine Änderung produktiver Konfiguration und kein Test gegen echte Provider,
Cloudflare Access oder Produktion. Pull Request zur manuellen Prüfung; kein
automatischer Merge und kein automatisches Deployment. Arbeitspushes verwenden
den bestehenden Commit-Hinweis `[CF-Pages-Skip]`.
