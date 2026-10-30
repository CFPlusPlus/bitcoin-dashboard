# Lokale Schriftassets

Alle Dateien sind unveränderte Latin-WOFF2-Subsets. Es gibt keine externen
Stylesheets oder Laufzeitaufrufe an Schriftendienste. Die Subsets enthalten
die für die deutsche Oberfläche verwendeten Umlaute und ß.

| Familie       | Quelle / Version                      | Eingesetzte Gewichte | Lizenzdatei                 |
| ------------- | ------------------------------------- | -------------------- | --------------------------- |
| IBM Plex Sans | `@fontsource/ibm-plex-sans` 5.3.0     | 400, 500, 600 normal | `ibm-plex-sans-LICENSE.txt` |
| IBM Plex Mono | `@fontsource/ibm-plex-mono` 5.3.0     | 400, 500 normal      | `ibm-plex-mono-LICENSE.txt` |
| Inter         | bestehendes `@fontsource/inter` 5.3.0 | 400, 500, 600 normal | `inter-LICENSE.txt`         |

Plex-Dateien am 30.10.2026 aus den versionierten npm-Archiven bezogen:

- <https://registry.npmjs.org/@fontsource/ibm-plex-sans/-/ibm-plex-sans-5.3.0.tgz>
- <https://registry.npmjs.org/@fontsource/ibm-plex-mono/-/ibm-plex-mono-5.3.0.tgz>

Inter stammt aus der bereits installierten Projektabhängigkeit; es wurde keine
Abhängigkeit hinzugefügt. Die acht WOFF2-Dateien belegen zusammen rund 173 kB
(dezimal). Browser laden nur tatsächlich verwendete Gewichte/Familien.

Die jeweiligen beigefügten SIL Open Font License 1.1-Texte erlauben die lokale
Einbettung und Weitergabe unter ihren Bedingungen. Copyright- und Lizenzangaben
bleiben erhalten; die Schriften wurden weder verändert noch umbenannt.

Herstellerquellen:
[IBM Plex](https://github.com/IBM/plex),
[IBM Design Language](https://www.ibm.com/design/language/typography/typeface/),
[Inter](https://github.com/rsms/inter).
Das Bitcoin-Zeichen ist Text; alle Diagramme sind eigens erzeugtes SVG/CSS.
Es wurden keine Bild-, Icon- oder Template-Assets übernommen.

## Ergänzung Phase 2.1.1

Für Expressive Observatory kommt **Manrope** aus `@fontsource/manrope` **5.2.8**
hinzu: Latin, normal, 400 / 500 / 600 / 700. Vier unveränderte WOFF2-Dateien,
zusammen **56.536 Byte**, ausschließlich im Prototypordner. Das Paket wurde am
30.10.2026 aus dem festen npm-Archiv bezogen; keine neue Projektabhängigkeit.

- Archiv: <https://registry.npmjs.org/@fontsource/manrope/-/manrope-5.2.8.tgz>
- Beigefügter Originaltext: [manrope-LICENSE.txt](manrope-LICENSE.txt), SIL OFL 1.1.
- Paketmetadaten: Google-Fonts-Version v20, Gewichte 200–800, normal,
  Copyright 2019 The Manrope Project Authors.
- Quellen: [Google Fonts / Manrope](https://github.com/googlefonts/manrope),
  [Fontsource](https://fontsource.org/fonts/manrope/about).

Diese Version ist gezielt festgehalten. Sie ist nicht mit einer späteren,
gegebenenfalls anders lizenzierten Herstelleredition gleichzusetzen.
Inter 400 / 500 / 600 wird für Contemporary Precision sowie technische
Beschriftungen beider neuen Varianten aus dem vorhandenen Bestand wiederverwendet.
Die neuen Varianten laden Plex nur bei Wahl der Vergleichsschrift oder Öffnen
der Schriftprobe; die ursprünglichen Designs verwenden ihre bisherigen Fonts.
