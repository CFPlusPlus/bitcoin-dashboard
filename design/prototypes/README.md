# Phase 2.1 / 2.1.1 — lokale Observatory-Prototypen

Vier Designexperimente für dieselbe Blockchain-Ansicht. Ausschließlich statische,
synthetische Beispieldaten, keine Verbindung zu Bitcoin-APIs und kein Deployment.
Die React-Anwendung und ihre Abhängigkeiten bleiben unverändert.

## Starten

Im Repository mit Node.js gemäß Projekt-README:

```sh
node design/prototypes/serve.mjs
```

Öffnen: <http://127.0.0.1:4175/>. Beenden mit `Ctrl+C`.
Der Server lauscht ausschließlich auf Loopback und liefert ausschließlich diesen
Prototypordner aus. Er braucht weder Vite noch eine Installation von Abhängigkeiten.
Alternativer Port über die Umgebungsvariable `PROTOTYPE_PORT`.

| Variante                      | Dark                                            | Light                                                       |
| ----------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| A — Analytical                | <http://127.0.0.1:4175/analytical-observatory/> | <http://127.0.0.1:4175/analytical-observatory/?theme=light> |
| B — Refined                   | <http://127.0.0.1:4175/refined-observatory/>    | <http://127.0.0.1:4175/refined-observatory/?theme=light>    |
| B2-A — Contemporary Precision | <http://127.0.0.1:4175/contemporary-precision/> | <http://127.0.0.1:4175/contemporary-precision/?theme=light> |
| B2-B — Expressive Observatory | <http://127.0.0.1:4175/expressive-observatory/> | <http://127.0.0.1:4175/expressive-observatory/?theme=light> |

Alle Seiten bieten Themewechsel, Histogramminspektion mit Maus/Tastatur/Touch,
Blockauswahl sowie unter „Prototyp prüfen“ Datenzustände, Fixture-Wiederholung
und den Vergleich IBM Plex Sans / Inter. Andere Hauptrouten verweisen auf die
sichtbare Erläuterung des Prototypumfangs.

URL-Parameter: `theme=dark|light`, `font=plex|inter`,
`state=snapshot|stale|missing`. Beispiel:
<http://127.0.0.1:4175/refined-observatory/?theme=light&state=missing>.
Alle Zustände sind Beispiele; „erneut laden“ setzt denselben lokalen Fixture-Stand.

Bei B2-A/B2-B außerdem `font=inter|manrope|plex`; Standard ist Inter für B2-A,
Manrope für B2-B. Der Themewechsel aktualisiert auch den Link zur jeweils anderen
neuen Richtung. Eine Neuladung ohne Parameter setzt wieder den Variantenstandard.
Die Oberfläche speichert keine persönlichen Einstellungen.

[Desktop-Vergleichstafeln](http://127.0.0.1:4175/compare.html) zeigen B / B2-A / B2-B
mit identischen Viewports, Themes, Daten und Ausgangsauswahl. Die Einzelbilder
sind echte Browserrenderings, in der Tafel auf 50 % verkleinert.

## Aufbau und Isolation

- `analytical-observatory/`, `refined-observatory/`: eigene HTML-Einstiege und Layouts.
- `shared/fixture.js`: identischer Datenkern und feste Beispielabrufzeiten.
- `shared/app.js`, `shared/base.css`: gemeinsame Datendarstellung und Bedienung.
- `contemporary-precision/`, `expressive-observatory/`: neue HTML-Einstiege und Art Directions.
- `shared/refinement.js`, `shared/refinement.css`, `shared/refinement-interactions.js`:
  identisches Markup, Grundstile und ein gemeinsamer Controller für beide neuen Varianten.
  Die alten Einstiege und ihr Controller bleiben unverändert.
- `shared/fonts/`: lokale, unveränderte WOFF2-Dateien und OFL-Lizenztexte.
- `screenshots/`: acht ursprüngliche und acht neue Viewportbilder, vier neue
  vollständige Desktopansichten und zwei Vergleichstafeln.
- `verify.mjs`: isolierte Browser- und Build-Prüfung mit vorhandenem Playwright.

Der Ordner liegt außerhalb von `public/`, `src/` und Vites Einstieg.
Es gibt keine Imports aus der produktiven Anwendung und keine Änderung an
Vite, Cloudflare, API, Tests, Paketmanifest oder Lockfile. Ein Vite-Devserver
aus der Repositorywurzel ist kein isolierter Prototypserver; dafür diesen Server nutzen.

## Prüfung wiederholen

Nach der normalen Entwicklungsinstallation aus dem Projekt-README und mit
vorhandenem Playwright-Chromium, während der Prototypserver läuft:

```sh
npm run build
node design/prototypes/verify.mjs
node design/prototypes/verify-refinement.mjs
```

Unter Windows bei gesperrten PowerShell-Skripten `npm.cmd` verwenden.
Bei anderem Serverport zusätzlich `PROTOTYPE_URL` auf dessen Loopback-URL setzen.
Die Prüfung erzeugt die acht Viewport-Screenshots neu und legt vollständige
Seitenansichten unter dem bereits ignorierten `test-results/prototypes/` ab.
Sie prüft Datenkonsistenz, Überlauf, SVG-Beschriftungsgrenzen, lokale Fonts,
Themewechsel, Tastatur-/Touch-Auswahl, Blockdetails, Fehlerzustände und Wiederholung.
Anschließend durchsucht sie das tatsächliche `dist/` nach Prototypinhalten.

Die unveränderten Projektprüfungen weiterhin gemäß Haupt-README ausführen.
Technische Checks ersetzen keine visuelle Betreiberabnahme.

`verify-refinement.mjs` prüft zusätzlich die acht neuen Ansichten, 84 weitere
Kombinationen aus Breite/Theme/Datenzustand, berechnete Kontraste, Maus-Hover,
echtes emuliertes Touch-Tippen, Home/End/Space, Retry-Fokus und reduzierte Bewegung.
Es schreibt die neuen Viewportbilder und vollständigen Desktopansichten nach
`screenshots/` sowie mobile Gesamtseiten, Fehlerzustände und einen JSON-Prüfbericht
nach `test-results/prototypes/`. B wird für die Tafeln im selben Browser neu
gerendert; seine bisherigen PNGs bleiben bei identischer Umgebung bytegleich.
Das Skript prüft auch die Bytes der neuen Schriftassets gegen alle Builddateien.
`npm run test:e2e` leert `test-results/`; die Prototypprüfungen deshalb danach
ausführen, wenn deren lokale Zusatzbilder erhalten bleiben sollen.

Designvergleich, Empfehlung und Grenzen:
[Phase 2.1](../../docs/phase-2.1-visual-prototyping.md).

Aktuelle Designkritik, Screenshots und Empfehlung:
[Phase 2.1.1](../../docs/phase-2.1.1-design-refinement.md).
