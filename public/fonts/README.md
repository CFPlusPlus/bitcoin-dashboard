# Produktive Schriftassets · Bitcoin Analytical

Unveränderte Latin-WOFF2-Dateien aus dem freigegebenen Prototyp. Manrope
`@fontsource/manrope` 5.2.8 (Google Fonts v20): 400, 500, 600 und 700 normal.
Inter `@fontsource/inter` 5.3.0: 400 und 500 normal. Deutsche Umlaute und ß
sind enthalten. Keine externen Schriftanfragen, keine neue Abhängigkeit.

Quellen und Herkunft sind unter
[Prototyp-Schriftassets](../../design/prototypes/shared/fonts/README.md)
dokumentiert. Die Original-Lizenzen liegen hier als
[Manrope SIL OFL 1.1](manrope-LICENSE.txt) und
[Inter SIL OFL 1.1](inter-LICENSE.txt), einschließlich Copyright-Angaben.
Die Lizenzen werden zusammen mit den sechs WOFF2-Dateien ausgeliefert.

Manrope trägt Oberfläche, Wortmarke und Zahlen; Inter technische Labels,
Tabellen und Metadaten. `src/styles/fonts.css` definiert ausschließlich diese
Schnitte mit `font-display: swap`. Fallbacks: Segoe UI, Arial und sans-serif;
für technische Identifikatoren Inter, Consolas, monospace. Die ersten beiden
Manrope-Schnitte werden lokal vorgeladen.
