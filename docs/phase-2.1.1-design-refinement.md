# Phase 2.1.1 – Contemporary Design Refinement

30. Oktober 2026 · `CFPlusPlus/bitcoin-dashboard` · Basis `origin/main`,
    Commit `ddd21fa` · Branch `feature/phase-2.1.1-design-refinement`.

**Zwei lokale Blockchain-Prototypen zur visuellen Entscheidung. Keine Freigabe
für eine produktive Art Direction.**

## 1. Auswertung des Betreiberfeedbacks

Der Betreiber bevorzugt B – Refined Observatory gegenüber A, empfindet aber
beide noch als „Android 2013“. Das ist eine gestalterische Wahrnehmung, keine
technische Datierung. Die sinnvolle Informationsarchitektur von B bleibt der
Ausgangspunkt: dominante Analyse, zugehöriger Netzwerkstand, danach Gebühren
und bestätigte Blöcke. Ihre konkrete Oberfläche wird neu entworfen.

Das Ziel ist mehr gestalterische Souveränität bei gleicher fachlicher Substanz.
Eine neue Schrift oder ein neuer Farbton allein würde dieses Ziel nicht erfüllen.
Die neuen Interpretationen verändern deshalb Flächenverteilung, Zahlenrollen,
Navigation, Diagrammdetails und die Beziehung zwischen Analyse und Kontext.

## 2. Mögliche Ursachen der altmodischen Wirkung

Die Ursachen sind eine Designinterpretation anhand der gerenderten Vergleichsbilder;
sie beweisen weder ein bestimmtes Designsystem noch die Absicht früherer Entwürfe.

| Beobachtung an B                                                              | Mögliche Wirkung                                                           | Konsequenz für B2                                                                                                                           |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Große salbeigrüne Analysefläche, grünlicher Hintergrund und grüne Datenbalken | Wenig Lichtwertdifferenzierung; die Fläche dominiert stärker als die Daten | Neutrale Arbeitsflächen, gezieltere Flächenbindung beziehungsweise bewusster Hell-Dunkel-Gegensatz                                          |
| Harte Rechteckfläche mit kräftiger oberer Linie                               | Das Diagramm wirkt wie ein abgegrenztes Modul                              | B2-A öffnet Überschrift und Messwerte; nur das Diagramm erhält einen Hintergrund. B2-B verbindet Diagramm und Netzwerk zu einer Komposition |
| Zahlreiche gleichartige technische Kleinbeschriftungen                        | Viel Raster, wenig Rhythmus zwischen Lesen und Messen                      | Weniger Monospace, klare Rollen für Hauptzahl, Begleitwerte, Einheiten und Metadaten                                                        |
| Kupfer, Salbei und Plex gemeinsam                                             | Starke Instrumenten-/Industrieassoziation                                  | Blau auf Graphit beziehungsweise Koralle auf warmen Neutralen; Inter und Manrope                                                            |
| Monospaced Blockhöhe und segmentierter Gewichtsbalken                         | Schematismus und visuelles Zusatzgewicht                                   | Proportionale, tabellarisch gesetzte Zahl; kontinuierliche, tatsächlich datenproportionale Gewichtsskala                                    |
| Nur über Inspektion sichtbare Histogrammwerte                                 | Sachlich, aber optisch wenig ausgearbeitete Dateninszenierung              | Direktwerte über jedem Balken, leichtere Rasterlinien, sichtbare Kategorieauswahl                                                           |

Die Asymmetrie und die korrekten Datenzustände waren Stärken. Ihre Entfernung
hätte die berechtigte Kritik am Erscheinungsbild nicht gelöst.

## 3. Änderungen gegenüber Refined Observatory B

| Bereich            | B                                                        | B2-A                                                          | B2-B                                                                                         |
| ------------------ | -------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Hauptkomposition   | Große gefärbte Fläche links, offene Kontextspalte rechts | Offene Messwertzone, begrenzte Diagrammfläche, Kontext rechts | Kontrastierende Netzwerkspalte links, verbundene Analyse rechts                              |
| Leserichtung       | Analyse → Kontext → Gebühren/Blöcke                      | Messung → Verteilung → Auswahl; Netzwerk als ruhiger Bezug    | Netzwerk und Nachfrage als Gegensatz; darunter Gebühren links und breite Blocktabelle rechts |
| Hauptzahl, Desktop | Plex Sans, 62 px                                         | Inter, 76 px                                                  | Manrope, 100 px                                                                              |
| Blockhöhe          | Plex Mono, kupferfarben                                  | Inter, neutral, 47 px                                         | Manrope, 46 px, auf entgegengesetztem Lichtwert                                              |
| Navigation         | Lange Links mit Unterstrich                              | Kompakte Auswahlfläche, eigener Fokuszustand                  | Ruhige Textnavigation mit kurzer, präziser Auswahllinie                                      |
| Diagramm           | Flächige Balken ohne Direktwerte                         | Blaues Dateninstrument, blaue Kategorieauswahl                | Korallfarbene Verteilung, eigener Auswahlstreifen unter dem Plot                             |
| Untere Bereiche    | Gegenläufiges 1:2,4-Raster                               | Offene Gebührenliste und breitere Blocktabelle                | Fortsetzung der oberen Spaltenachse                                                          |

Keine Änderung an `src/`, `functions/`, `shared/` des Produktes, `public/`,
Paketmanifest, Lockfile, Vite oder Cloudflare. `design/prototypes/shared/fixture.js`
ist unverändert. Die HTML-/CSS-Dateien der ursprünglichen Varianten und ihr
Controller bleiben ebenfalls unverändert.

## 4. B2-A – Contemporary Precision

Eine neutrale Arbeitsfläche mit einer klaren Abfolge aus Messwert, Verteilung
und Detailauswahl. Hauptzahl und Begleitdaten stehen frei auf dem Hintergrund.
Nur der eigentliche Plot erhält eine etwas hellere beziehungsweise weiße Fläche.
Die Netzwerkspalte ist offen gesetzt und konkurriert nicht mit einer zweiten Karte.

Graphit, Weiß und präzises Blau bilden die Farbwelt. Die Blockhöhe bleibt neutral;
Blau führt durch Daten, Auswahl und Fokus. Das kleine Bitcoin-Zeichen ersetzt
die bisherige umrandete Markenplakette. Die Navigation erhält kompakte Zielbereiche,
ohne den Header als große Steuerleiste zu inszenieren.

Die Richtung ist gut für wiederholtes, konzentriertes Lesen. Ihre Eigenständigkeit
ist geringer als die von B2-B. Blau und Inter sind weit verbreitet; erst die offene
Messwertzone und die zurückgenommene Kontextarchitektur machen daraus mehr als
einen Austausch der Farbpalette. Auch damit bleibt ein Rest von vertrauter
Analyseprodukt-Ästhetik bestehen.

## 5. B2-B – Expressive Observatory

Netzwerk und Nachfrage werden als verbundenes Paar mit gegensätzlichen Lichtwerten
inszeniert. Im Dark Theme ist die Netzwerkspalte hell, im Light Theme dunkel.
Sie erhält damit eine bewusste, dauerhafte Rolle als Bezugspunkt. Die rechte
Analysefläche bleibt wesentlich breiter und führt mit der großen Mempool-Zahl.

Manrope verändert die Silhouette von Überschrift und Ziffern. Warme Neutralfarben
und ein korallfarbener Datenakzent ersetzen Salbei und das beige Kupfer. Der
Auswahlstreifen unter dem Diagramm macht die aktive Inspektion räumlich greifbar.
Gebühren und Blocktabelle übernehmen darunter dieselbe Spaltenachse.

Das ist die stärkere eigenständige Interpretation. Der Nachteil ist ebenso sichtbar:
Die helle Netzwerkfläche zieht im dunklen Theme viel Aufmerksamkeit auf sich.
Die 100-px-Zahl erhöht den räumlichen Anspruch, ohne zusätzliche Information
zu liefern. Sie braucht die Zustimmung des Betreibers und ist kein funktionaler
Fortschritt an sich.

## 6. Farb- und Typografiekonzepte

### Farben

| Token                  | B2-A Dark / Light     | B2-B Dark / Light     |
| ---------------------- | --------------------- | --------------------- |
| Hintergrund            | `#101114` / `#F3F4F6` | `#161514` / `#F0EDE6` |
| Plot-/Analysefläche    | `#191B20` / `#FFFFFF` | `#1D1C1A` / `#FAF8F3` |
| Text                   | `#F1F3F6` / `#171C26` | `#F3EFE7` / `#26221E` |
| Sekundärtext           | `#A0A6B2` / `#596476` | `#B0A99F` / `#655D53` |
| Daten/Auswahl          | `#8CBBFF` / `#205CAA` | `#FF9A82` / `#A23824` |
| Nicht gewählter Balken | `#5381B6` / `#527DB2` | `#B97462` / `#B05E49` |
| Netzwerkfläche         | Offen auf Hintergrund | `#E9E4D9` / `#25231F` |

Farben tragen keine alleinige Zustandsbedeutung. „Veraltet“ und „Fehlend“ sind
ausgeschrieben. Die Auswahl hat Hintergrund, Unterlinie, Detailtext und
`aria-pressed`; Fokus besitzt eine zusätzliche Kontur. Es gibt keine Verläufe,
keine Glasflächen und keine Dauereffekte. B2-A verwendet nur eine sehr schwache
innere Lichtkante am Plot. B2-B erzeugt Tiefe vollständig über Lichtwerte.

### Konkrete Schriftprüfung

| Familie              | Zahlen / Technik                                                              | Deutsch, Schnitte, Lizenz                                                                         | Entscheidung                                                          |
| -------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| IBM Plex Sans + Mono | Sehr gute technische Unterscheidbarkeit; Mono wirkt bei großen Zahlen schwer  | Deutsche Labels im vorhandenen Latin-Subset; lokal Sans 400/500/600 und Mono 400/500; SIL OFL 1.1 | Als Original und Vergleich erhalten; für B2 keine primäre Kombination |
| Inter                | Tabellarische Ziffern und alternative Null; kompakte, klare technische Labels | Familie 100–900 und echte Kursive; hier unverändert lokal 400/500/600; SIL OFL 1.1                | B2-A primär; Tabellen, SVG und technische Labels beider Richtungen    |
| Manrope              | Markantere Proportionen der großen Ziffern; tabellarischer Satz für Messwerte | Paket 5.2.8: 200–800, normal; lokal 400/500/600/700, Latin mit ä/ö/ü/ß; SIL OFL 1.1               | B2-B primär, technische Kleinschrift bleibt Inter                     |

Inter-Funktionen und Familienspektrum sind durch die
[Herstellerdokumentation](https://rsms.me/inter/) belegt. Manrope-Provenienz und
Lizenz beziehen sich ausdrücklich auf das bezogene Paket und seinen Originaltext,
siehe [lokale Assets](../design/prototypes/shared/fonts/README.md),
[Fontsource](https://fontsource.org/fonts/manrope/about) und das
[Google-Fonts-Repository](https://github.com/googlefonts/manrope).
Eine anders lizenzierte spätere Herstelleredition wird nicht vorausgesetzt.

Die aufklappbare Schriftprobe enthält dieselben Ziffern, deutschen Labels und
Zeichenfolgen bei 400/500/600. Der Wechsel verändert die komplette Oberflächenschrift,
jedoch weder Daten noch die bewusst einheitliche technische Beschriftung.
Die gewählte Familie wurde im Browser geladen und funktional kontrolliert.
Hashes brechen innerhalb ihres Containers um; Monospace ist für ihre synthetische
Prüfrolle hier nicht notwendig. Das ist eine Abwägung, kein Nachweis, dass Inter
bei jeder Zeichenprüfung Plex Mono überlegen wäre.

## 7. Flächen-, Layout- und Diagrammprinzipien

Beide Richtungen besitzen dieselbe semantische und funktionale Struktur:
Histogramm mit drei Mempool-Werten, Netzwerkstand mit letztem Block,
fünf Gebührenempfehlungen, fünf auswählbare Blöcke, exakte Details,
Datenherkunft und Prüfwerkzeuge. B2-B verschiebt die Kontextspalte ausschließlich
visuell. DOM-, Fokus- und mobile Reihenfolge beginnen weiterhin mit der Analyse.

Unter 700 px folgt das Netzwerk unter dem Diagramm. Beide mobilen Richtungen
zeigen zuerst dieselben Daten. Unter 900 px werden Gebühren und Blocktabelle
untereinander angeordnet; dazwischen kann die Gebührenliste als kompakte Reihe
erscheinen. Bei sehr schmaler Breite darf allein die Tabelle intern scrollen.

Das fachliche Diagrammmodell bleibt unverändert:

- Sieben **Kategorien** mit teilweise unterschiedlich breiten Gebührenintervallen,
  keine numerische X-Skala und keine Zeitreihe. Die Intervallgrenzen bleiben in
  Inspektion und zugänglichen Labels exakt.
- Balkenhöhe bezeichnet absolutes Volumen in MvB, **keine Dichte**. Nullbasis,
  Skala 0–5 MvB, Summe **13,84 MvB**. Direktwerte zeigen zusätzlich das Volumen.
- Gleich breite Kategorien behaupten keine gleichen numerischen Intervallbreiten.
  Der erklärende Text steht direkt am Diagramm.
- Gebührenempfehlungen bleiben eine unabhängig erfasste Ressource. Ihre Linien
  zeigen nur den Empfehlungswert relativ zu 6 sat/vB.
- Die Gewichtsleiste zeigt 3.993.216 / 4.000.000 WU, also **99,83 %**.
  Sie wird aus dem Blockgewicht berechnet, nicht dekorativ gefüllt.

Wichtige Zahlen nutzen tabellarische Ziffern. Einheiten sind kleiner und farblich
zurückgenommen, bleiben aber unmittelbar am Wert. Sekundärtexte liegen in der
Regel bei 11 px; kleine mobile Diagramm- und Abschnittslabels bei 10 px.
Das ist für kurze technische Beschriftungen brauchbar, bleibt aber ein Punkt für
die persönliche Lesbarkeitsentscheidung am tatsächlichen Gerät.

## 8. Interaktionsgestaltung

Ein gemeinsamer neuer Controller bedient beide neuen Varianten. Der alte
Controller bleibt unverändert; der Datenkern und die lokale Serverinfrastruktur
werden wiederverwendet. Es gibt keine Timer, Live-Ereignisse oder Netzabfragen.

| Bedienung            | Rückmeldung                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Themebutton          | Sofortiger Wechsel sämtlicher Flächen; Vergleichslink übernimmt das aktuelle Theme                                        |
| Maus über Balken     | Direktwert und Detailbereich reagieren; Verlassen stellt die fixierte Auswahl wieder her                                  |
| ← / →, Home / End    | Roving-Fokus durch die Kategorien; sichtbare Fokuskontur und Detailwerte                                                  |
| Enter / Leertaste    | Fixierte Auswahl, inklusive Unterlinie und `aria-pressed`                                                                 |
| Esc                  | Gesamter Mempool; keine Kategorie fixiert                                                                                 |
| Touch                | Balken antippen; ergänzend ein natives Select mit mindestens 44 px Höhe                                                   |
| Blockhöhe wählen     | Sichtbare Tabellenzeile und exakte Byte-/WU-/Zeit-/Hashdetails aktualisieren sich                                         |
| Veraltet             | Warntext, aktive Zustandskennung, bisherige Daten und Abrufzeit bleiben erhalten                                          |
| Fehlend              | Striche statt Mempool-Werten, eigene Leerfläche, Inspektion deaktiviert; kein erfolgreicher Ressourcenzeitpunkt behauptet |
| Fixture erneut laden | Identischer Snapshot und Ausgangsauswahl; Meldung ohne künstlich fortgeschriebene Zeit                                    |

Nach Retry erhält der gewählte Balken wieder den Tastaturfokus. Ein SVG-Neuaufbau
bei Größenänderung bewahrt einen vorhandenen Balkenfokus. Blockauswahl und andere
Ressourcen bleiben beim Mempool-Retry erhalten. Fehlende Mempool-Daten beeinflussen
weder Gebühren noch Blöcke. Theme- und Fontwahl sind nur lokale Sitzungszustände.

Es gibt ausschließlich kurze Farbwechsel von 120 ms. `prefers-reduced-motion`
entfernt alle Übergänge; dieser Zustand wurde im Browser geprüft. Keine neue
Animation soll Datenaktualität oder einen tatsächlichen Bitcoin-Netzwerkzustand
vortäuschen.

## 9. Screenshots und tatsächliche Browserprüfung

Die Prototypen wurden am 30.10.2026 über den Loopbackserver in Playwright-Chromium
gerendert und bedient. Die gerenderten PNGs wurden anschließend bildlich
inspiziert. Das ist eine tatsächliche Browserprüfung mit Screenshotinspektion,
keine manuelle Prüfung in einem sichtbaren Browserfenster. Die eingebettete
Browservorschau meldete „The browser access host is unavailable“.

Die verbindlichen Viewportbilder sind echte Screenshots bei Geräteskalierung 1.
Die vollständigen Desktopbilder enthalten auch Gebühren, die gesamte Blocktabelle,
Blockdetails, Quellen und die geschlossenen Prüfwerkzeuge. Die Vergleichstafeln
verwenden die identischen 1440-×-900-PNGs in 50-%-Darstellung; B wird dafür unter
denselben Bedingungen neu gerendert. Seine ursprünglichen Bilder bleiben bytegleich.

| Variante / Viewport        | Dark                                                                              | Light                                                                              |
| -------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| B2-A · 1440 × 900          | [Viewport](../design/prototypes/screenshots/precision-1440x900-dark.png)          | [Viewport](../design/prototypes/screenshots/precision-1440x900-light.png)          |
| B2-A · 390 × 844           | [Viewport](../design/prototypes/screenshots/precision-390x844-dark.png)           | [Viewport](../design/prototypes/screenshots/precision-390x844-light.png)           |
| B2-A · Desktop vollständig | [Gesamtseite](../design/prototypes/screenshots/precision-1440x900-dark-full.png)  | [Gesamtseite](../design/prototypes/screenshots/precision-1440x900-light-full.png)  |
| B2-B · 1440 × 900          | [Viewport](../design/prototypes/screenshots/expressive-1440x900-dark.png)         | [Viewport](../design/prototypes/screenshots/expressive-1440x900-light.png)         |
| B2-B · 390 × 844           | [Viewport](../design/prototypes/screenshots/expressive-390x844-dark.png)          | [Viewport](../design/prototypes/screenshots/expressive-390x844-light.png)          |
| B2-B · Desktop vollständig | [Gesamtseite](../design/prototypes/screenshots/expressive-1440x900-dark-full.png) | [Gesamtseite](../design/prototypes/screenshots/expressive-1440x900-light-full.png) |
| B / B2-A / B2-B            | [Vergleich Dark](../design/prototypes/screenshots/comparison-dark.png)            | [Vergleich Light](../design/prototypes/screenshots/comparison-light.png)           |

Sichtbare Überarbeitung nach der ersten Inspektion: B2-A erhielt eine offene
Messwertzone statt eines großen umrahmten Containers. Seine helle Plotfläche
wurde klar von der Arbeitsfläche getrennt. Kleine Beschriftungen wurden vergrößert,
und B2-Bs Datenakzent wurde stärker in Richtung Koralle verschoben. Die zusätzliche
Flächentrennung und die bessere Beschriftung sind für die Qualität relevanter
als die reine Farbänderung.

Grenzen: Chromium und emulierter Touch, keine physischen Mobilgeräte, kein Safari-
oder Firefox-Audit, kein vollständiger Screenreader-/Zoomtest und keine Nutzerstudie.
Die Fehlerbeispiele gelten gezielt für den Mempool. Die übrigen Routen erläutern
den Prototypumfang; sie sind keine ausgearbeiteten Seiten. Die Screenshots zeigen
keine Live-Bitcoin-Daten.

## 10. Qualitätssicherung und Produktionsisolation

| Prüfung                        | Ergebnis                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| ESLint / Prettier              | Bestanden                                                                                            |
| Typecheck                      | Alle vier Projektkonfigurationen bestanden, über `npm run build`                                     |
| Vitest                         | 203 Tests in 11 Dateien bestanden                                                                    |
| Produktionsbuild               | Erfolgreich, unveränderte Produkteinstiege                                                           |
| Pages Functions Build          | Erfolgreich; kein Deployment                                                                         |
| Bestehende Pages-/Chromium-E2E | Alle 23 Tests bestanden                                                                              |
| Bisherige Prototypprüfung      | Alle acht ursprünglichen Ansichten und zusätzlichen Breiten bestanden                                |
| Neue Prototypprüfung           | Acht Zielansichten plus 84 Breiten-/Theme-/Zustandskombinationen bestanden                           |
| Runtime / externe Requests     | Keine JavaScript-/Consolefehler und keine externen Requests in den acht Zielansichten                |
| SVG / Layout                   | Alle Textbeschriftungen innerhalb des SVG; kein horizontaler Seitenüberlauf an den geprüften Breiten |
| Kontraste                      | 32 berechnete Paare über beide Varianten und Themes geprüft                                          |
| Buildisolation                 | Alle zwölf tatsächlichen `dist/`-Dateien geprüft; keine Prototypkennungen oder neuen Schriftassets   |

Die Projektprüfungen liefen mit **Node 22.22.2 / npm 10.9.7**. Wrangler benötigte
nach einem Sandbox-Dateirechtefehler die lokalen Prozess-/Dateirechte für Logs
und Verzeichnistraversierung. Mit diesen Rechten bestanden dieselben Prüfungen.
Keine Tests oder Schwellenwerte wurden abgeschwächt.

Berechnung nach relativer sRGB-Luminanz: normale Textpaare mindestens 4,5:1,
Balken mindestens 3:1. Beispiele der geprüften Farbpaare:

| Kontrast                              | Dark   | Light  |
| ------------------------------------- | ------ | ------ |
| B2-A Sekundärtext auf Plotfläche      | 7,05:1 | 5,98:1 |
| B2-A Balken auf Plotfläche            | 4,25:1 | 4,26:1 |
| B2-B Sekundärtext auf Netzwerkfläche  | 5,28:1 | 7,57:1 |
| B2-B Sekundärtext auf Auswahlstreifen | 6,66:1 | 4,93:1 |
| B2-B Balken auf Analysefläche         | 4,65:1 | 4,35:1 |

Das ist eine gezielte technische Prüfung, keine vollständige WCAG-Konformitätsaussage.
Der ausführbare Check schreibt Messwerte und Funktionsbefunde nach
`test-results/prototypes/refinement-report.json`. Dort entstehen auch mobile
Gesamtseiten und Aufnahmen der Fehlerzustände. Die committed Normalansichten,
Gesamtseiten und Tafeln liegen ausschließlich unter `design/prototypes/screenshots/`.

Der Produktionsbuild enthält keine Imports aus `design/`. Zusätzlich zum Inhalts-
und Pfadscan werden die Bytes der vier neuen Manrope-Dateien mit den Builddateien
verglichen. Die neuen Dateien liegen außerhalb von `public/`; keine Abhängigkeit
oder Buildkonfiguration wurde angepasst. Die früheren A/B-Dateien und Bilder
bleiben als Vergleich erhalten.

## 11. Visueller Vergleich, Vor- und Nachteile

| Kriterium                   | B                                            | B2-A                                           | B2-B                                                                      |
| --------------------------- | -------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Ersteindruck                | Ruhig, aber stark flächig und technisch      | Präzise, offener und leichter                  | Deutlichste eigenständige Identität und räumliche Spannung                |
| Datenhierarchie             | Gut, Hauptfläche relativ gleichmäßig         | Messwert, Plot und Auswahl klar getrennt       | Sehr klarer Hauptwert, Kontext als Gegenpol                               |
| Langfristige Ruhe           | Gut                                          | Stärkste Variante                              | Stärker vom persönlichen Umgang mit dem hellen Kontext abhängig           |
| Diagrammqualität            | Fachlich korrekt, wenig Direktinformation    | Direktwerte, klare Auswahl, ruhigere Rasterung | Gleiche Präzision, stärker inszenierte Auswahl                            |
| Eigenständigkeit            | Salbei/Plex prägen eine Instrumentenästhetik | Verbessert, aber Inter/Blau bleiben vertraut   | Am stärksten, auch ohne Markenfarbe an der Lichtwertkomposition erkennbar |
| Mobile Länge                | Bereits erheblich                            | Lange Analysefolge bleibt                      | Etwas mehr Raum für Hauptzahl und kontrastierenden Kontext                |
| Gebühren im ersten Viewport | Nicht zuverlässig sichtbar                   | Weiterhin unter der Hauptanalyse               | Weiterhin unter der Hauptanalyse                                          |

**Kritische Bewertung:** B2-B zeigt den deutlicheren Qualitätssprung durch eine
neue Beziehung zwischen Analyse und Netzwerk, fortgeführte Spaltenachsen und
eine wesentlich klarere typografische Staffelung. B2-A verbessert Leseführung
und Diagrammruhe, bleibt bewusst näher an vertrauten Analyseoberflächen. Der
Fortschritt von B2-A ist deshalb weniger eindeutig und stärker von der Präferenz
für eine zurückhaltende Arbeitsoberfläche abhängig.

Beide lösen das ursprüngliche Problem nicht allein durch Farben oder Radien:
B2-A zerlegt die große Fläche in offene Messung und fokussierten Plot, B2-B
führt bestätigten und unbestätigten Blockspace als räumliches Paar zusammen.
Direktwerte, Auswahlzustände und technisch sauber zugeordnete Zeitpunkte
verbessern die tatsächliche Nutzbarkeit. Die Datenmenge und die Zahl der
Produktfunktionen sind dagegen unverändert. Keine der Richtungen beseitigt die
lange mobile Scrollstrecke oder ersetzt eine Bedienprüfung mit echten Nutzern.

## 12. Empfehlung für die Art Direction

**B2-B – Expressive Observatory zur abschließenden visuellen Begutachtung
bevorzugen.** Diese Richtung reagiert am deutlichsten auf den Wunsch nach
Eigenständigkeit. Die kontrollierte Lichtwertkomposition ist auch ohne Koralle
erkennbar und lässt sich deshalb langfristiger tragen als ein reiner Farbtrend.

B2-A bleibt die sachlichere Alternative für regelmäßige, längere Analyse. Ihre
offene Messwertzone ist ein tragfähiges Prinzip, wenn dem Betreiber B2-Bs helle
Netzwerkfläche im Dark Theme zu präsent erscheint. Die Entwürfe sollten vor der
Entscheidung nicht zu einer beliebigen Mischform zusammengeführt werden.

Die Empfehlung ist ein gestalterisches Urteil anhand echter Renderings, keine
behauptete Betreiberzustimmung. Ein Merge dieses PRs führt weder das Design in
das Produkt ein noch gibt er die spätere Übernahme frei.

## 13. Offene Betreiberentscheidungen und Ausführung

1. B2-A oder B2-B nach Betrachtung beider Themes und der vollständigen Ansichten.
2. Bei B2-B: Zustimmung zur hellen Netzwerkfläche im Dark Theme und zum 100-px-Hauptwert.
3. Akzeptanz der langen Analysefolge auf Mobile; gegebenenfalls Gebühren später priorisieren.
4. Persönliche Lesbarkeit der 10–11-px-Metadaten und Diagrammlabels am Zielgerät.
5. Bevorzugtes Theme und gewünschte Schrift nach Nutzung der identischen Schriftprobe.

Starten mit:

```sh
node design/prototypes/serve.mjs
```

Öffnen: <http://127.0.0.1:4175/>. Ausführliche Links, Parameter und reproduzierbare
Browserprüfungen stehen in der [Prototypanleitung](../design/prototypes/README.md).
Die vier neuen Fontdateien sind lokal samt Lizenz enthalten; die Vorschau benötigt
keine externen Dienste. Nach abgeschlossener Betrachtung den Server mit `Ctrl+C`
beenden.

**Die endgültige Art Direction bleibt ausdrücklich von der visuellen Zustimmung
des Betreibers abhängig.**
