# Phase 2.1 — lokale Observatory-Prototypen

Zwei Designexperimente für dieselbe Blockchain-Ansicht. Ausschließlich statische,
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

| Variante       | Dark                                            | Light                                                       |
| -------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| A — Analytical | <http://127.0.0.1:4175/analytical-observatory/> | <http://127.0.0.1:4175/analytical-observatory/?theme=light> |
| B — Refined    | <http://127.0.0.1:4175/refined-observatory/>    | <http://127.0.0.1:4175/refined-observatory/?theme=light>    |

Beide Seiten bieten Themewechsel, Histogramminspektion mit Maus/Tastatur/Touch,
Blockauswahl sowie unter „Prototyp prüfen“ Datenzustände, Fixture-Wiederholung
und den Vergleich IBM Plex Sans / Inter. Andere Hauptrouten verweisen auf die
sichtbare Erläuterung des Prototypumfangs.

URL-Parameter: `theme=dark|light`, `font=plex|inter`,
`state=snapshot|stale|missing`. Beispiel:
<http://127.0.0.1:4175/refined-observatory/?theme=light&state=missing>.
Alle Zustände sind Beispiele; „erneut laden“ setzt denselben lokalen Fixture-Stand.

## Aufbau und Isolation

- `analytical-observatory/`, `refined-observatory/`: eigene HTML-Einstiege und Layouts.
- `shared/fixture.js`: identischer Datenkern und feste Beispielabrufzeiten.
- `shared/app.js`, `shared/base.css`: gemeinsame Datendarstellung und Bedienung.
- `shared/fonts/`: lokale, unveränderte WOFF2-Dateien und OFL-Lizenztexte.
- `screenshots/`: acht tatsächlich gerenderte Zielansichten.
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

Designvergleich, Empfehlung und Grenzen:
[Phase 2.1](../../docs/phase-2.1-visual-prototyping.md).
