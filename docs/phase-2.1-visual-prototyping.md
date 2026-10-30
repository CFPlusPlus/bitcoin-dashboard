# Phase 2.1 — Visual Prototyping & Art Direction

Stand: 30. Oktober 2026. Grundlage: [Design Discovery 2.0](phase-2.0-design-discovery.md),
Konzept C — Digital Asset Observatory. **Zwei prüfbare Entwürfe, keine gestalterische
Freigabe und keine produktive UI-Änderung.**

## 1. Ziel und Vorgehensweise

Die ausgewählte Richtung wird anhand derselben vollständigen Blockchain-Ansicht
in zwei eigenständigen Kompositionen erprobt. A optimiert den parallelen Vergleich,
B die Gewichtung von Analyse und zugeordnetem Kontext. Der Datenumfang bleibt gleich.
Die Unterschiede liegen in DOM-Reihenfolge, Flächenaufteilung, Typografie und
Informationsdichte, nicht allein in Farben.

Beide Prototypen bestehen aus HTML, CSS und JavaScript unter
[`design/prototypes/`](../design/prototypes/README.md). Gemeinsame Fixtures und
Interaktionslogik verhindern unbeabsichtigte Datenunterschiede. Es gibt keine
Produktionsimporte, API-Anfragen, zusätzlichen Paketabhängigkeiten oder Änderungen
an React, Cloudflare und bestehenden Tests.

Vorgehen: Datenumfang der vorhandenen Blockchain-Seite abgleichen → zwei Layouts
ausarbeiten → lokale Fonts und beide Themes integrieren → Interaktionen ergänzen →
in Chromium rendern → sichtbare Schwächen korrigieren → technische Isolation prüfen.

## 2. Variante A — Analytical Observatory

Ein offenes Messband ordnet Blockhöhe, letzten Block, Mempool-Volumen und
Gesamtgebühren entlang gemeinsamer Bezugslinien. Darunter steht ein durchgehendes
Analysefeld: links das Histogramm, rechts die Gebührenempfehlungen. Die anschließende
Blocktabelle nutzt auf Desktop die gesamte Breite und zeigt zusätzlich Gewicht
und Hashausschnitt. Vollständige Blockdetails bleiben unter der Tabelle sichtbar.

Schmale Ränder, 34-px-Seitentitel, 37-px-Blockhöhe und konsequente Zahlenausrichtung
geben A den Charakter eines Messinstruments. Die Flächen bleiben eckig und
funktional. Es gibt keine KPI-Kartenreihe oder Seitenleiste. Dadurch bleibt die
Variante dem Observatory-Prinzip aus C verpflichtet, obwohl sie kompakter arbeitet.

Stärke: Gebühren und Blockspace sind direkt vergleichbar. Schwäche: Das sehr
gleichmäßige Raster wirkt ruhiger, besitzt aber weniger eigene visuelle Spannung.
Auf Mobilgeräten stehen Kennzahlen vor dem Diagramm und beanspruchen den ersten
Bildschirm weitgehend.

## 3. Variante B — Refined Observatory

Der Mempool bildet eine große Analysefläche mit einem führenden 62-px-Wert.
Transaktionsanzahl und Gesamtgebühren bleiben unmittelbar daneben. Eine offene
Kontextspalte zeigt Blockhöhe, Größe und Gewicht des letzten Blocks. Der
Gewichtsindikator bezieht sich ausdrücklich auf das Limit von 4 MWU; der exakte
Prozentwert ist beschriftet und wird aus dem Fixture berechnet.

Darunter kehrt sich das Verhältnis um: schmale Gebührenleiter links, breite
Blocktabelle rechts. Die zweiteilige Komposition, 48-px-Seitentitel und
unterschiedlichen Wertgrößen schaffen einen bewussten Rhythmus. Kupfer markiert
Blockhöhe, Auswahl und Priorität; Grün bezeichnet Daten, keine Kursentwicklung.

Stärke: Eigenständige Produktwirkung durch räumliche Datenbeziehungen. Schwäche:
Gebühren und jüngste Blöcke beginnen bei 1440 × 900 unterhalb des ersten
Bildschirms. Die Entscheidung für mehr Analysegewicht kostet direkte Übersicht.
Es gibt keine redaktionelle Inszenierung durch Serifentitel, Essays oder Bildmaterial.

## 4. Konkrete gestalterische Unterschiede

| Aspekt             | A — Analytical                                      | B — Refined                                                   |
| ------------------ | --------------------------------------------------- | ------------------------------------------------------------- |
| Einstieg           | Blockhöhe und offenes Messband                      | Mempool-Volumen als führender Analysewert                     |
| Hauptkomposition   | Messband → Histogramm / Gebühren → breite Tabelle   | Histogramm / Netzwerkkontext → Gebühren / Tabelle             |
| Spaltenlogik       | Rund 69:31 im gemeinsamen Analysefeld               | Rund 71:29, darunter umgekehrte Gewichtung                    |
| Raum               | 36 px Desktop-Außenraum, kompakte Abschnittswechsel | 48 px Außenraum, 36 px Spaltenabstand, größere Analysefläche  |
| Typografie         | Gleichmäßiger, stärker an Messgrößen orientiert     | Deutlichere Abstufung von Titel, Leitwert und Kontext         |
| Flächen            | Dünn umrahmtes gemeinsames Instrument               | Betontes Analysefeld neben offenem Kontext                    |
| Gebühren           | Zahlenliste neben dem Histogramm                    | Eigene Leiter mit proportionalen, direkt beschrifteten Linien |
| Mobile Reihenfolge | Kennzahlen → Histogramm → Gebühren → Blöcke         | Mempool / Histogramm → Blockkontext → Gebühren → Blöcke       |

Die Gebührenlinien in B zeigen jeweils den Empfehlungswert relativ zu 6 sat/vB,
dem Maximum dieser Fixture-Liste. Sie sind keine Wartezeitprognose und werden
nicht mit Histogrammbereichen gekoppelt.

## 5. Farben und Typografie

### Themes

A verwendet Graphit und Kalkweiß aus Phase 2.0 weitgehend unverändert.
B differenziert die Hauptanalyse stärker über ein gedämpftes Salbeifeld.
Das Light-Theme von B ist etwas wärmer; die Datenfarben sind ausdrücklich
abgedunkelt. Keine Verläufe, Schatten, Neonfarben oder transparenten Glasflächen.

| Rolle             | A Dark / Light        | B Dark / Light        |
| ----------------- | --------------------- | --------------------- |
| Hintergrund       | `#111817` / `#F3F3EC` | `#131B19` / `#F4F2E9` |
| Analysefläche     | `#192321` / `#FDFDF8` | `#1C2924` / `#E8EDE3` |
| Haupttext         | `#E7EEE9` / `#202E29` | gleich A              |
| Sekundärtext      | `#A7B7AE` / `#52665C` | gleich A              |
| Kupfer            | `#E3AB7A` / `#8A4D25` | `#E7B98D` / `#865127` |
| Ausgewählte Daten | `#89CBB8` / `#226855` | `#B6D3BD` / `#315F48` |
| Histogrammbalken  | `#508D7A` / `#5B8B78` | `#608575` / `#628770` |

Stichproben aus den tatsächlich berechneten CSS-Tokens, Verhältnis nach
sRGB-Relativluminanz; jeweils der niedrigere Kontrast gegen Hintergrund oder
Analysefläche, bei Balken gegen die Analysefläche:

| Kombination    |  A Dark | A Light |  B Dark | B Light |
| -------------- | ------: | ------: | ------: | ------: |
| Haupttext      | 13,66:1 | 12,70:1 | 12,79:1 | 11,89:1 |
| Sekundärtext   |  7,69:1 |  5,52:1 |  7,20:1 |  5,17:1 |
| Kupfertext     |  7,96:1 |  5,95:1 |  8,42:1 |  5,48:1 |
| Balken         |  4,17:1 |  3,81:1 |  3,67:1 |  3,38:1 |
| Control-Kontur |  4,72:1 |  3,49:1 |  4,42:1 |  3,27:1 |

Das sind konkrete Stichproben, keine vollständige Accessibility-Zertifizierung.
Dekorative Gitterlinien sind absichtlich schwächer. Auswahl erhält zusätzlich
eine Unterkante, Textwerte und `aria-pressed`; Farbe ist nicht das einzige Signal.

### Schriftprüfung

IBM Plex Sans 400/500/600 trägt Oberfläche und Hauptwerte, IBM Plex Mono 400/500
Blockhöhen, Hashes, Inspektionswerte und technische Identifikatoren. Alle Zahlen
verwenden tabellarische Ziffern. Die Sans bleibt für deutsche Labels zuständig;
eine durchgängige Mono-Oberfläche wäre unnötig breit.

Unter „Prototyp prüfen“ stehen eine direkte Schriftprobe und ein Umschalter
auf die bestehende Inter bereit. Der Umschalter wechselt die gesamte
Sans-Oberfläche; technische Mono-Rollen bleiben gleich, damit die Komposition
vergleichbar bleibt.

| Kriterium        | Beobachtung und Entscheidung                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ziffern          | Inter bleibt sehr ruhig und kompakt. Plex Sans wirkt etwas technischer; Plex Mono macht Blockhöhen und präzise Werte gleichmäßig ablesbar.                         |
| Blockhöhen       | Die Mono-Ziffern verleihen `968.421` klare Kontur und stabile Breite; negative Laufweite bleibt auf den großen Leitwert begrenzt.                                  |
| Lange Hashes     | Mono strukturiert Identifikatoren besser als Fließtext-Sans. Ganze synthetische Hashes brechen in den Details um; Desktop-Ausschnitte allein ersetzen diese nicht. |
| Deutsche Texte   | Umlaute und ß werden lokal geladen. Lange Labels dürfen umbrechen. Die mobile Einheit MWU wurde nach dem ersten Rendering korrigiert.                              |
| Überschriften    | Plex Sans 500 erzeugt in B bereits genug Charakter; eine zusätzliche Display- oder Serifenschrift ist nicht nötig.                                                 |
| Eigenständigkeit | Plex unterstützt den Instrumentcharakter, trägt aber erkennbare IBM-Assoziationen. Die Identität muss aus Komposition und Datenbeziehungen entstehen.              |
| Sans / Mono      | Plex Sans und Mono harmonieren gut. Inter + Plex Mono bleibt eine brauchbare, zurückhaltendere Alternative.                                                        |

**Empfehlung für die nächste Begutachtung: Plex Sans + sparsame Plex Mono.**
Die Entscheidung bleibt offen, insbesondere hinsichtlich der IBM-Assoziation.
Es gibt keine synthetischen Fontgewichte und keine externen Schriftendienste.
Alle acht lokalen WOFF2-Dateien, Quellen, Versionen und OFL-Lizenzen sind im
[Assetverzeichnis](../design/prototypes/shared/fonts/README.md) dokumentiert.
IBM beschreibt die Familie als unter OFL verfügbare Sans-/Mono-Familie:
[Herstellerquelle](https://github.com/IBM/plex).

## 6. Datenumfang und Diagrammsystem

Fixture `OBS-01` ist vollständig synthetisch, fest datiert auf den **22.10.2026**
und auf jeder Seite als Beispiel gekennzeichnet. Das Datum ist kein aktueller
Abruf. Alle Block-Hashes sind ausdrücklich synthetisch und werden nicht mit
echten Block-Explorern verlinkt. Beide Varianten importieren dieselbe
[`fixture.js`](../design/prototypes/shared/fixture.js).

Enthalten sind Blockhöhe, Blockgröße und Gewicht, Mempool-Volumen,
Transaktionsanzahl und Gesamtgebühren, alle fünf Gebührenempfehlungen,
Histogramm, fünf jüngste Beispielblöcke und Abrufzeiten je Ressource.
Ø Blockzeit und Transaktionsdurchsatz bleiben als nicht angebunden sichtbar.
Damit gehen keine Inhaltsgruppen der vorhandenen Blockchain-Seite verloren.

Das Histogramm zeigt **virtuelles Volumen in MvB pro Gebührenbereich**, keine
Historie, Transaktionsanzahl oder Wahrscheinlichkeitsdichte. Bereiche sind
unterseitig inklusive und oberseitig exklusiv; der letzte ist offen.
Die sieben Werte `0,92 / 4,38 / 3,26 / 2,18 / 1,48 / 0,96 / 0,66 MvB`
summieren sich auf exakt **13,84 MvB**. Die ausgewählte Gruppe `1–<2 sat/vB`
entspricht 4.380.000 vB bzw. 31,6 % des Beispiel-Mempools.

Die Fixture-Gruppen orientieren sich am vorhandenen Modell aus Gebührenrate
und virtuellem Volumen. Sie sind explizit definierte Prototyp-Aggregate; sie
behaupten keine identische Bucketstruktur des Providers. Bei späterer produktiver
Umsetzung muss die Gruppierung aus den tatsächlichen Rate-/Volumenpaaren
fachlich bestätigt werden. Insbesondere haben Bereiche unterschiedliche Breiten;
gleiche Balkenbreite bezeichnet hier Kategorien, keine lineare Gebührenachse.

Eine feste y-Skala von 0 bis 5 MvB macht A/B vergleichbar. Gitterlinien liegen
unter den Daten, alle Einheiten sind benannt. SVG-Breite und Beschriftungspositionen
werden an der tatsächlichen Containerbreite berechnet. Es gibt keine abgeschnittenen
Achsen oder erfundene historische Bitcoin-Zeitreihe.

Statt eines schwebenden Tooltips erscheint die Inspektion direkt unter dem Chart:
Bereich, MvB, exakte vB und Anteil. So bleibt der Datenkontext auf Touch-Geräten
sichtbar und kann nicht am Viewportrand abgeschnitten werden. Die Diagramm-
Legende bezeichnet Volumen; Empfehlungen bleiben eine separate Ressource mit
eigenem Beispielabruf.

## 7. Interaktionen und Datenzustände

- Themewechsel über einen beschrifteten Button; initial reproduzierbar mit `?theme=light`.
- Sichtbare Hover- und Fokuszustände, Skip-Link und vollständige Navigationslabels.
- Histogramm mit Mausinspektion, Touch-Auswahl und fixierter Auswahl per Klick/Enter.
  Pfeile sowie Home/End wechseln den Balken; Escape hebt die Fixierung auf.
- Auf Mobilgeräten ergänzt eine native, mindestens 44 px hohe Auswahl die schmalen
  Histogrammbalken. Die Inspektion ist nicht von Hover abhängig.
- Blockhöhe wählen: markierte Tabellenzeile und korrespondierende exakte Details,
  einschließlich vollständigem Hash, Größe in Byte und Gewicht in WU.
- Lokale Fixture-Wiederholung bestätigt denselben Stand. Kein Zeitstempel wird auf
  „jetzt“ gesetzt; es gibt kein Polling, keinen Puls und keine simulierten Netzwerkereignisse.
- Unter „Prototyp prüfen“: Mempool vorhanden / veraltet nach Refreshfehler / fehlend
  nach Initialfehler. Veraltet erhält Werte und letzten erfolgreichen Zeitpunkt;
  fehlend entfernt Mempool-Zahlen und Balken sowie die erfolgreiche Abrufzeit.
  Block- und Gebührenressourcen bleiben unabhängig sichtbar.

Die übrigen Hauptrouten öffnen den erläuterten Prototypumfang. Sie sind keine
ausgearbeiteten Produktseiten. Übergänge beschränken sich auf kurze Farbwechsel;
`prefers-reduced-motion` deaktiviert sie vollständig.

## 8. Responsive Verhalten

Desktop nutzt bei A vier offene Messgruppen und ein gemeinsames Analysefeld,
bei B eine große Analyse und eine kleinere Kontextspalte. Tablet löst zunächst
die Messzeile beziehungsweise die breite Hauptkomposition auf. Bei 390 px stehen
die vier Routen in einem sichtbaren 2×2-Raster, einschließlich „Netzwerk & Mining“.

A ordnet Messgrößen in einem 2×2-Band, B beginnt unmittelbar mit Mempool und
Histogramm. Gebühren und Blöcke folgen linear. Tabellen reduzieren sichtbare
Zusatzspalten; sämtliche exakten Werte einschließlich Gewicht und Hash bleiben
über die Auswahl unter der Tabelle erreichbar. Ein lokaler, fokussierbarer
Scrollcontainer fängt engere Tabellenbreiten auf. Die Gesamtseite bleibt ohne
horizontalen Überlauf. Lange Hashes umbrechen; Größen und Einheiten bleiben zusammen.

## 9. Tatsächliche visuelle Prüfung und Screenshots

Am 30.10.2026 wurden beide Seiten im lokal gestarteten Server mit dem vorhandenen
Playwright-Chromium tatsächlich gerendert. Alle acht folgenden Viewport-Screenshots
wurden erstellt und visuell betrachtet; zusätzlich wurden vollständige mobile
Seitenansichten stichprobenartig betrachtet. Die Bilder zeigen jeweils den ersten
Viewport, keine verkleinerten Gesamtseiten. Weitere Inhalte sind durch Scrollen
erreichbar.

| Variante / Viewport | Dark                                                                        | Light                                                                        |
| ------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A · 1440 × 900      | [Screenshot](../design/prototypes/screenshots/analytical-1440x900-dark.png) | [Screenshot](../design/prototypes/screenshots/analytical-1440x900-light.png) |
| A · 390 × 844       | [Screenshot](../design/prototypes/screenshots/analytical-390x844-dark.png)  | [Screenshot](../design/prototypes/screenshots/analytical-390x844-light.png)  |
| B · 1440 × 900      | [Screenshot](../design/prototypes/screenshots/refined-1440x900-dark.png)    | [Screenshot](../design/prototypes/screenshots/refined-1440x900-light.png)    |
| B · 390 × 844       | [Screenshot](../design/prototypes/screenshots/refined-390x844-dark.png)     | [Screenshot](../design/prototypes/screenshots/refined-390x844-light.png)     |

Sichtbare Korrektur nach dem ersten Rendering: In A brach mobil „MWU“ vom Wert
ab. Gezielt angepasste Schriftgröße, Labelgröße und untrennbarer Zahlen-/Einheiten-
Satz korrigieren das, ohne die ganze Oberfläche zu verkleinern. Zusätzlich wurde
die mobile Gebührenbereichsauswahl ergänzt und die fehlende Ressource so
korrigiert, dass sie keinen erfolgreichen Abrufzeitpunkt suggeriert.

Die automatisierte Prototypprüfung bestätigt für alle acht Ansichten: kein
Seitenüberlauf, alle SVG-Beschriftungen innerhalb der Zeichenfläche, geladene
lokale Fonts, keine JavaScript-/Consolefehler und keine externen Requests.
Theme, Tastaturinspektion, mobile Bereichsauswahl, Blockdetails, Datenzustände,
lokale Wiederholung und Inter-Umschaltung wurden funktional geprüft.
Zusätzliche Überlaufprüfungen bestanden bei 320, 560, 768, 1024 und 1920 CSS-px.

## 10. Technische Prüfungen und Build-Trennung

| Prüfung                   | Ergebnis                                                       |
| ------------------------- | -------------------------------------------------------------- |
| Lint                      | erfolgreich                                                    |
| Format                    | erfolgreich                                                    |
| Typecheck                 | alle vier TypeScript-Konfigurationen erfolgreich, über `build` |
| Unit-Tests                | 11 Dateien, 203 Tests erfolgreich                              |
| Build                     | erfolgreich                                                    |
| Pages-Check               | Functions-Kompilierung erfolgreich, kein Deployment            |
| E2E                       | 23 bestehende Chromium-/Pages-Tests erfolgreich                |
| Isolierte Prototypprüfung | acht Zielansichten und fünf weitere Breiten erfolgreich        |

`design/` liegt außerhalb von `public/` und wird von keinem produktiven Einstieg
importiert. Vites Konfiguration und das Produktionsmanifest bleiben unverändert.
Nach dem tatsächlichen Build wurden **alle zwölf Dateien in `dist/`** auf Namen
und in Textartefakten zusätzlich auf Prototypkennungen untersucht: keine
Observatory-Prototypen, keine Plex-Fonts, keine Fixtures oder Experimenttexte.
Die acht Schriftdateien, Screenshots und der lokale Server gehören ausschließlich
zum Designordner. Die produktiven Quelldateien, Einstiegspunkte und
Abhängigkeitsversionen sind gegenüber `main` unverändert.

Wranglers erster lokaler Aufruf scheiterte an Sandbox-Dateirechten; derselbe
Check und anschließend E2E bestanden mit den erforderlichen lokalen Prozess-
und Dateirechten. Es wurden keine Prüfungen abgeschwächt oder Hostingänderungen
vorgenommen. [Prüfskript und Startanleitung](../design/prototypes/README.md).

## 11. Bekannte Grenzen

Die Bewertung ist eine gestalterische Einschätzung anhand echter Renderings,
keine Nutzerstudie. Die Betreiberbegutachtung steht aus. Geprüft wurde Chromium,
nicht Safari, Firefox oder ein physisches Smartphone. Die Kontraststichproben
ersetzen weder einen vollständigen Zustandsaudit noch einen Screenreadertest.
200-%-Textzoom und 400-%-Browserzoom wurden nicht umfassend geprüft.

Die Prototypen bilden keine produktive Query-/Fehlerarchitektur nach. Fehlende
und veraltete Zustände werden gezielt am Mempool demonstriert; Access-Login,
Laden und Fehler aller Ressourcen sind nicht vollständig simuliert. Die getrennten
Zeitpunkte zeigen Zuordnung, keine Synchronität zwischen Ressourcen.
Fünf Blöcke sind ein begrenzter Fixture-Ausschnitt, keine Aussage über das
produktive Zeilenlimit. Auf kleinsten Breiten bleiben einige Tabellen über ihren
eigenen Container scrollbar.

Die deutlichen Dark-/Light-Flächen und die Metadatengröße sollten am tatsächlichen
Monitor geprüft werden. B verschiebt Gebühren bewusst nach unten; wer diese
bei jedem Aufruf sofort braucht, könnte A bevorzugen. Weder Mergen noch grüne
Tests erteilen eine Freigabe zur Übernahme in die React-Anwendung.

## 12. Empfehlung und offene Betreiberentscheidungen

**B — Refined Observatory zur weiteren visuellen Begutachtung bevorzugen.**
Die große Analysefläche und ihr direkt zugeordneter Netzwerkkontext machen die
Idee des Digital Asset Observatory am deutlichsten sichtbar. Die asymmetrische
Folge und die Plex-Typografie bilden eine eigenständigere Identität als das
gleichmäßigere Raster von A. Die sachlichen Datenformen halten B dabei als
Analyseprodukt erkennbar. A bleibt der stärkere Kandidat für häufigen, schnellen
Vergleich und möglichst unmittelbaren Gebührenzugriff.

| Vor weiterer Implementierung zu entscheiden | Konkreter Vorschlag                                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Art Direction und Informationsdichte        | B oder A nach tatsächlicher Desktop-/Mobilbegutachtung ausdrücklich auswählen; gewünschte Änderungen konkret benennen.      |
| Position der Gebühren                       | B beibehalten, wenn Mempool-Analyse führt; sonst prüfen, ob Gebühren wieder neben das Diagramm gehören sollen.              |
| Schrift                                     | Plex Sans + sparsame Plex Mono bestätigen oder die vorhandene Inter-Alternative anhand derselben Ansicht bevorzugen.        |
| Themegewichtung                             | Beide erhalten; Starttheme Dark versus Systempräferenz erst für die produktive Phase festlegen.                             |
| Mobile Priorität                            | Mempool zuerst wie B oder Netzwerkkennzahlen zuerst wie A; vollständige Routennamen und native Inspektionsauswahl erhalten. |
| Feindetails                                 | Metadatengröße, Salbeifläche, Gewichtsindikator und Abstandsrhythmus am eigenen Gerät beurteilen.                           |
| Nächster Umsetzungsschritt                  | Nur die ausdrücklich abgenommenen Prinzipien in eine separat beauftragte produktive Phase übertragen.                       |

## 13. Lokal ausführen und begutachten

```sh
node design/prototypes/serve.mjs
```

Im Browser <http://127.0.0.1:4175/> öffnen und beide Varianten in Dark/Light
bei 1440 × 900 und 390 × 844 ansehen. Die Auswahl der Datenzustände und der
Schrift liegt unter „Prototyp prüfen“. Ein Reload setzt auf den festen Fixture-
Stand zurück. Zum Beenden `Ctrl+C`. Vollständige Anweisungen und reproduzierbare
Browserprüfung: [Prototyp-README](../design/prototypes/README.md).

**Die gestalterische Freigabe erfolgt erst nach tatsächlicher visueller
Begutachtung durch den Betreiber.**
