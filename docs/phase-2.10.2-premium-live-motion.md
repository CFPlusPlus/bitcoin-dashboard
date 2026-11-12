# Phase 2.10.2 – Premium Live Price Motion

Stand: 12.11.2026. Basis: `efa0623` (Phase 2.10.1, PR #24).
Branch: `feature/phase-2.10.2-premium-live-motion`.

## Befund und Umsetzung

`RollingPrice` verschob geänderte Ziffern 260 ms vertikal. Der
`KrakenService` setzte Richtung und Differenz zusätzlich nach 300 ms zurück.
Dadurch wechselte der Begleittext je Preisänderung zweimal: zunächst zu
„Gestiegen/Gefallen“ mit Differenz, dann zurück zum Quellenhinweis. Die
Richtungsänderung entfernte zugleich die Animationsstruktur. Bei Stellenwechseln
wurde jede Ziffer einzeln neu eingeblendet.

`SoftPrice` ersetzt die Rolling-Komponente vollständig. Bei gleichen
Zeichenpositionen überblenden nur tatsächlich geänderte Ziffern. Alte und neue
Ziffer liegen am selben Platz; ihre gegenläufige Deckkraft folgt 400 ms lang
`cubic-bezier(0.22, 1, 0.36, 1)`. Es gibt keine Transformation, Feder, Rotation,
Zwischenziffer oder interpolierte Finanzzahl. Unveränderte Ziffern und
Trennzeichen behalten ihre DOM-Knoten und volle Deckkraft. Identische auf zwei
Dezimalstellen formatierte Werte lösen keinen Übergang aus.

Feste tabellarische Zeichenpositionen und die vorhandene 11-ch-Zahlenfläche
bleiben erhalten. Wenn sich Zahlengröße oder Trennzeichenpositionen ändern,
überblenden zwei vollständige echte Zahlen innerhalb derselben Fläche.
Außergewöhnlich lange Werte passen ihre Schrift innerhalb dieser Fläche an.

Positions-Keys bleiben stabil. Nur das geänderte Zeichen erhält einen neuen
Glyphen-Knoten. Kommt während einer Überblendung ein neuer Wert, entfernt React
das vorherige Paar und damit dessen CSS-Animationen. Pro Position existieren
höchstens die zuletzt angezeigte und die aktuelle Ziffer. CSS beendet die
Animation; alte Zeichen sind anschließend unsichtbar. Es gibt keine zusätzlichen
Effects, Animations-Timer oder JS-Updates zum Animationsende. Snapshot,
Verbindungsfehler und inaktive Daten setzen die Darstellung sofort neutral.

Die gesamte Kurszahl bleibt neutral. Ein kleines Pfeil-/Minuszeichen hat einen
fest reservierten Platz neben dem dauerhaften Text „Letzter Handelspreis ·
Kraken“. Ausschließlich seine Farbe wechselt dezent über 400 ms. Die letzte
Richtung bleibt bis zum nächsten angezeigten Wert oder Verbindungswechsel stehen;
ein identischer neuer Anzeigewert zeigt das neutrale Minuszeichen. Der alte
Flash-Timer einschließlich `flashUntil` und `flashMs` entfällt. Das vermeidet
zusätzliche Store-Veröffentlichungen und wechselnde Textflächen. Der zugängliche
Symbolname enthält weiterhin Richtung und Differenz zum vorher angezeigten Kurs.
Die Kraken-24h-Änderung bleibt ein unabhängiger Anbieterwert.

## Unveränderte Datenverarbeitung und Zugänglichkeit

Der bestehende WebSocket-v2-Parser und Subskriptionsvertrag, Empfangspuffer,
1.000-ms-Anzeigezyklus pro Paar, unmittelbare Statusmeldungen, Stale-Erkennung,
Backoff und Hintergrund-/Offline-Lebenszyklus bleiben erhalten. Jeder Zyklus
übernimmt den neuesten gültigen empfangenen Wert. Es gibt weder neue
API-Abfragen noch Glättung oder künstliche Kurse. Nur interne Felder für den
entfernten Flash-Effekt entfallen; Anbieter-Verträge ändern sich nicht.

Eine vollständige aktuelle `de-DE`-Zahl mit zwei Dezimalstellen bleibt für
Screenreader lesbar. Die visuellen Schichten sind `aria-hidden`; die Kurszahl
ist weiterhin keine ständig vorlesende Live-Region. Der separate
Verbindungsstatus bleibt zugänglich. Reduced Motion deaktiviert alle
Preisanimationen und den Farbübergang des Symbols und blendet alte Schichten
sofort aus. Abhängigkeiten, Datenquellen, Access, Secrets und Release-Flags
bleiben unverändert.

## Dynamische Abnahme

`e2e/live-price-motion.spec.ts` verwendet ausschließlich simulierte
Kraken-Nachrichten. Vier deterministische Chromium-Tests prüfen Hell/Dunkel bei
390 und 1440 px. Echte CSS-Animationen werden bei 0, 100, 200 und 400 ms
ausgewertet: Deckkraft steigt/fällt monoton und komplementär, die Dauer beträgt
400 ms, Transformationen bleiben `none`, unveränderte Ziffern bleiben vollständig
sichtbar und die vertikale Position bleibt gleich. Weitere Prüfungen betreffen
Nachrichten-Bursts mit ungültigem Schlusswert, gleiche gerundete Kurse,
unabhängige 24h-Werte, Größenordnungswechsel, Extremwerte und Reduced Motion.

Ein zusätzlicher Echtzeittest zeichnet mehrere steigende, fallende und identische
Ticks als WebM auf, wartet jeweils auf das tatsächliche Animationsende und prüft
anschließend ruhende Animationen und unveränderte Zahlengeometrie. Die
Komponententests ersetzen außerdem mehrere geänderte Werte unmittelbar
nacheinander und prüfen das Entfernen veralteter Glyphenpaare, stabile
unveränderte Knoten und timerfreien StrictMode-Betrieb.

| Kriterium        | Bewertung anhand Implementierung und dynamischer Browser-Prüfung                                  |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Ruhe             | Keine vertikale Bewegung, kein Flash-Reset, kein wechselnder sichtbarer Richtungstext.            |
| Eleganz          | Ein einheitlicher, begrenzter Deckkraftübergang; kleiner Farbakzent statt farbiger Kursfläche.    |
| Lesbarkeit       | Ganze zugängliche Zahl, tabellarische Stellen und volle Deckkraft unveränderter Zeichen.          |
| Kontinuität      | Ausschließlich echte alte/neue Werte; keine überlappenden Warteschlangen von Übergängen.          |
| Layoutstabilität | Gleiche Zahlen- und Symbolgeometrie bei Überträgen, Richtungswechseln und langen Werten.          |
| Häufige Updates  | Neuester gültiger Wert im bestehenden Sekundentakt; unmittelbare Glyphenwechsel separat getestet. |

Die manuelle Video-Sichtprüfung wurde versucht, konnte aber nicht abgeschlossen
werden: Computer Use beendete den Zugriff, weil die aktuelle Browseradresse
nicht zuverlässig ermittelt werden konnte. Eine subjektive längere
Beobachtungsabnahme bleibt deshalb offen. Die dynamischen automatisierten
Messungen und die lokale Echtzeit-Aufzeichnung ersetzen diese Aussage nicht.
Weitere Browser-Engines und echte Anbieter-/Produktionsverbindungen wurden
nicht geprüft.

Reproduktion nach `npm run build`:

```powershell
npm.cmd run test:e2e -- e2e/live-price-motion.spec.ts
```

Videos liegen in `test-results/live-price-motion-*/video.webm`; die Messwerte
werden als `crossfade-samples.json` an das jeweilige Testergebnis angehängt.
Diese lokalen Artefakte sind nicht versioniert und werden beim nächsten
Playwright-Lauf ersetzt. Synthetische Prüfdaten sind im Echtzeitvideo beschriftet.

## Qualitätssicherung und Übergabe

Alle angeforderten Prüfungen sind lokal erfolgreich:

| Prüfung                | Ergebnis                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| `npm run lint`         | Erfolgreich, keine Warnungen.                                           |
| `npm run format:check` | Erfolgreich.                                                            |
| `npm run typecheck`    | Alle vier TypeScript-Projekte erfolgreich, auch im Build ausgeführt.    |
| `npm test`             | 743 Tests in 32 Dateien erfolgreich.                                    |
| `npm run build`        | Produktionsbuild erfolgreich.                                           |
| `npm run pages:check`  | Worker erfolgreich lokal kompiliert.                                    |
| `npm run test:e2e`     | 164 Chromium-Tests erfolgreich, einschließlich fünf neuer Motion-Tests. |

Windows verwendet `npm.cmd` aufgrund der lokalen PowerShell-Ausführungsrichtlinie.
Wrangler/Chromium benötigen lokale Rechte außerhalb der Sandbox; die
Wrangler-Telemetrie ist bei diesen Läufen deaktiviert. Keine produktive
Konfiguration wurde dafür geändert.

Pull-Request-Titel: `refactor: Phase 2.10.2 – premium live price motion`.
Der Arbeitspush verwendet den bestehenden Commit-Hinweis `[CF-Pages-Skip]`.
Kein automatischer Merge oder Deployment.
