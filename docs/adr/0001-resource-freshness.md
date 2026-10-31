# ADR 0001 – Ressourcenfrische für Bitcoin-Abfragen

Datum: 31. Oktober 2026. Status: angenommen für Phase 2.5 / AP1.

## Kontext

Die neue Difficulty-Prognose benötigt keine Minutenabfrage. Query-Cache-Frische
und fachliche Alterswarnung haben unterschiedliche Zwecke. Eine globale
60-Sekunden-Warnung wäre für eine 10-Minuten-Ressource irreführend.

## Entscheidung

`src/lib/bitcoin-policy.ts` enthält zwei kleine Policies, ausgewählt über den
bestehenden Ressourcenkey. Bestehende Ressourcen behalten 60 Sekunden für
`staleTime`, Polling und UI-Altersprüfung sowie 10 Minuten Cacheaufbewahrung.
Difficulty verwendet 10 Minuten für `staleTime`/Polling, 20 Minuten für die
Abrufalterswarnung und 30 Minuten Cacheaufbewahrung ohne aktive Verbraucher.

Query-Stale bedeutet bei Difficulty nur „bei geeigneter Gelegenheit neu laden“.
Die UI warnt separat anhand des unveränderten `updatedAt` des letzten Erfolgs.
Ein jüngerer letzter Erfolg mit Refreshfehler heißt „Abruffehler“. Ab 20 Minuten
heißt er „Veraltet“ und die Fehlermeldung bleibt zusätzlich sichtbar.

TanStack Query pausiert Intervallabrufe im verborgenen Tab und offline. Ein
sichtbar gewordener Tab bzw. Reconnect aktualisiert stale Daten einmal. Eine
lokale Anzeigeuhr aktualisiert Alter/Warnung alle 30 Sekunden und bei Rückkehr;
sie pausiert verborgen und führt keine Requests aus. Inaktive Routen pollen nicht.

Provider-429 wird nur für die neue Ressource als sicheres HTTP 429 ausgegeben.
Ein festes `Retry-After: 600` signalisiert unsere lokale Mindestpause; es ist keine
Providerzusage. Fremde Header werden nicht übernommen. Der Browser unterdrückt
sofortigen Retry, Fokus-/Reconnect-/Mountabrufe und manuelles Retry während dieser
Pause; auch TanStacks gesonderter Erstfehler-Mountpfad ist berücksichtigt. Danach
gelten normales sichtbares Polling, stale Fokus/Reconnect und manuelles Retry.
Andere Fehler behalten den bisherigen begrenzten Retryvertrag.

## Begründung und Folgen

Die Providerberechnung berücksichtigt aktuelle Zeit und Blockstand; die 10 Minuten
sind eine bewusste Produktentscheidung für Analysekontext, keine zugesicherte
Publikationsfrequenz. 20 Minuten erlauben einen ausgelassenen Regelabruf, ohne
Fehler zu verbergen. Reine Regelabrufe verursachen höchstens sechs Requests pro
sichtbarer Stunde und Browserinstanz, zusätzlich zu Öffnen, Fokus, Recovery und
manuellen Abrufen.

Eine kleine Policyfunktion genügt. Keine globale Cache-/Quotenarchitektur,
Persistenz, neue Produktionsabhängigkeit, Access-Ausnahme oder Providerkonfiguration.
Der Cooldown lebt nur im jeweiligen QueryClient. Neue Tabs oder vollständiges
Neuladen teilen ihn nicht. Wiederholte Limits erfordern eine spätere betriebliche
Budgetentscheidung; dieses ADR verspricht keinen Schutz einer globalen Quote.

Nachweise: `difficulty-ui.test.tsx`, `difficulty-contract.test.ts`,
`functions.test.ts`, `e2e/mining.spec.ts`, `e2e/pages-difficulty.spec.ts`.
