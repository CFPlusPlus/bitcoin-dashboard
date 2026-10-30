/* global document, window, URLSearchParams */
import { fixture as f } from './fixture.js'
import { connectRefinement } from './refinement-interactions.js'

const expressive = document.body.dataset.variant === 'expressive'
const title = expressive ? 'Expressive Observatory' : 'Contemporary Precision'
const code = expressive ? 'B2-B' : 'B2-A'
const params = new URLSearchParams(window.location.search)
const n = (v, digits = 0) =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(v)
const stamp = (resource) =>
  `<p class="resource-stamp">Beispielabruf <time>${f.times[resource]} ${f.timezone}</time> <span aria-hidden="true">/</span> <a href="#sources">Quelle & Stand</a></p>`
document.documentElement.dataset.theme = params.get('theme') === 'light' ? 'light' : 'dark'
document.body.dataset.font = ['inter', 'manrope', 'plex'].includes(params.get('font'))
  ? params.get('font')
  : expressive
    ? 'manrope'
    : 'inter'

const chart = `<section class="chart-panel" aria-labelledby="chart-title">
  <div class="section-head"><div><p class="eyebrow">01 <span>/</span> Nachfrage nach Blockspace</p><h2 id="chart-title">Unbestätigter Blockspace</h2></div><span class="snapshot-chip">Snapshot</span></div>
  <div class="mempool-lead"><div><p class="metric-value" data-mempool="size">${n(f.mempool.virtualSizeBytes / 1e6, 2)} <small>MvB</small></p><p class="metric-label">Virtuelle Größe im Mempool</p></div><dl class="side-facts"><div><dt>Transaktionen</dt><dd data-mempool="count">${n(f.mempool.transactionCount)}</dd></div><div><dt>Gesamtgebühren · sat</dt><dd data-mempool="fees">${n(f.mempool.totalFeeSats)}</dd></div></dl></div>
  <div id="mempool-warning"></div>
  <figure><div class="chart-caption"><span>Volumen · MvB</span><span>Ein Snapshot, keine Zeitreihe</span></div><div id="histogram" class="histogram"></div><figcaption class="chart-help">Gebührenbereiche · sat/vB. Untergrenze inkl., Obergrenze exkl. Gleich breite Kategorien; Höhe = Volumen, keine Dichte.</figcaption></figure>
  <div id="inspection" class="inspection" aria-live="polite" aria-atomic="true"></div>
  <label class="bucket-control">Gebührenbereich prüfen<select id="bucket-choice"><option value="all">Gesamter Mempool</option>${f.buckets.map((b, i) => `<option value="${i}">${b.label} sat/vB · ${n(b.virtualSizeBytes / 1e6, 2)} MvB</option>`).join('')}</select></label>
  <div class="chart-footer"><p class="chart-help">Tippen / ← → prüfen · Enter fixiert · Esc löst</p>${stamp('mempool')}</div>
</section>`

const network = `<aside class="context-rail" aria-labelledby="network-title">
  <div class="network-top"><p class="eyebrow">02 <span>/</span> Netzwerkstand</p><h2 id="network-title" class="sr-only">Bestätigter Blockspace</h2><p class="height">${n(f.height)}</p><p class="metric-label">Aktuelle Blockhöhe</p>${stamp('height')}</div>
  <div class="network-block"><div class="rail-heading"><h3>Letzter Block</h3><span class="mono">${n(f.blocks[0].height)}</span></div><dl class="metric-pair"><div><dt>Blockgröße</dt><dd>${n(f.blocks[0].size / 1e6, 2)} <small>MB</small></dd></div><div><dt>Blockgewicht</dt><dd>${n(f.blocks[0].weight / 1e6, 2)} <small>MWU</small></dd></div></dl><div class="weight-heading"><span>Gewichtslimit</span><strong>${n((f.blocks[0].weight / 4e6) * 100, 2)} %</strong></div><div class="weight-track" role="img" aria-label="Blockgewicht 3,993216 von maximal 4 MWU, 99,83 Prozent"><span style="width:${(f.blocks[0].weight / 4e6) * 100}%"></span></div><p class="meta">Maximal 4 MWU pro Block</p>${stamp('blocks')}</div>
  <dl class="unconnected"><div><dt>Ø Blockzeit</dt><dd>— <span>nicht angebunden</span></dd></div><div><dt>Transaktionsdurchsatz</dt><dd>— <span>nicht angebunden</span></dd></div></dl>
</aside>`

const fees = `<section class="fee-panel" aria-labelledby="fees-title"><div class="section-head"><div><p class="eyebrow">03 <span>/</span> Bestätigungspriorität</p><h2 id="fees-title">Gebührenempfehlungen</h2></div><span class="meta">sat/vB</span></div><dl class="fee-list">${f.fees.map((fee, i) => `<div class="fee-row"><dt><span class="fee-index" aria-hidden="true">0${i + 1}</span>${fee.label}</dt><dd>${n(fee.value)} <small>sat/vB</small></dd><span class="fee-visual" style="width:${(fee.value / 6) * 100}%" aria-hidden="true"></span></div>`).join('')}</dl><p class="fee-note">Schätzungen, keine garantierten Bestätigungszeiten. Empfehlungen und Histogramm sind unabhängig erfasste Ressourcen.</p>${stamp('fees')}</section>`

const blocks = `<section class="blocks-panel" aria-labelledby="blocks-title"><div class="section-head"><div><p class="eyebrow">04 <span>/</span> Bestätigter Blockspace</p><h2 id="blocks-title">Jüngste Blöcke</h2></div><span class="snapshot-chip">${f.blocks.length} Blöcke</span></div><div class="table-wrap" role="region" aria-label="Jüngste Blöcke, bei Bedarf horizontal scrollbar" tabindex="0"><table><caption>${f.date} · ${f.timezone} · Blockhöhe wählen für Details</caption><thead><tr><th scope="col">Blockhöhe</th><th scope="col">Zeitpunkt</th><th scope="col">TX</th><th scope="col">MB</th><th scope="col" class="table-extra">MWU</th></tr></thead><tbody>${f.blocks.map((b, i) => `<tr data-block-row="${i}"><td><button type="button" data-block="${i}" aria-pressed="${i === 0}" aria-label="Block ${n(b.height)} auswählen">${n(b.height)} <span aria-hidden="true">→</span></button></td><td>${b.time}</td><td>${n(b.tx)}</td><td>${n(b.size / 1e6, 2)}</td><td class="table-extra">${n(b.weight / 1e6, 3)}</td></tr>`).join('')}</tbody></table></div><div id="block-detail" class="block-detail" aria-live="polite" aria-atomic="true"></div>${stamp('blocks')}</section>`

const sources = `<section id="sources" class="sources" aria-labelledby="sources-title"><div class="section-head"><h2 id="sources-title">Datenherkunft & Stand</h2><span class="snapshot-chip">${f.id}</span></div><p class="meta">Synthetische Beispieldaten und Hashes. Die Quellenzuordnung entspricht produktiven Ressourcen; dieser Prototyp stellt keine API-Anfragen.</p><dl class="source-grid">${[
  ['height', 'Blockhöhe'],
  ['blocks', 'Blöcke, Größe & Gewicht'],
  ['fees', 'Gebührenempfehlungen'],
  ['mempool', 'Mempool & Histogramm'],
]
  .map(
    ([key, label]) =>
      `<div><dt>${label}</dt><dd>${f.source}<br><span>${f.date} · </span><time datetime="2026-10-22T${f.times[key]}+02:00">${f.times[key]} ${f.timezone}</time><br><span id="source-${key}">Beispielabruf vorhanden</span></dd></div>`,
  )
  .join('')}</dl></section>`

const tools = `<details id="prototype-scope" class="prototype-tools"><summary>Prototyp prüfen · Datenzustände & Schriftvergleich</summary><p class="meta">Nur Blockchain ist ausgearbeitet. Die anderen Navigationspunkte erläutern hier den Umfang. Alle Funktionen bleiben lokal.</p><div class="tool-row"><label>Mempool-Datenzustand<select id="data-state"><option value="snapshot">Beispielabruf vorhanden</option><option value="stale">Veraltet · Refresh fehlgeschlagen</option><option value="missing">Fehlend · Initialabruf fehlgeschlagen</option></select></label><label>Oberflächenschrift<select id="font-choice"><option value="inter">Inter · Precision</option><option value="manrope">Manrope · Expressive</option><option value="plex">IBM Plex Sans · Vergleich B</option></select></label><button id="reload-fixture" type="button">Fixture erneut laden</button></div><p id="refresh-status" role="status" class="meta">Fester Beispielstand ${f.date}. Keine automatische Aktualisierung.</p><div class="font-sample"><h3>Schriftvergleich · 400 / 500 / 600</h3><div class="font-trio">${[
  ['Inter', 'Inter'],
  ['Manrope', 'Manrope'],
  ['IBM Plex Sans', 'Plex'],
]
  .map(
    ([label, family]) =>
      `<div style="font-family:'${family}',sans-serif"><p class="eyebrow">${label}</p><p class="digits">968.421 · 13,84</p><p style="font-weight:500">Gebühren & Blockgröße</p><p style="font-weight:600">Übersicht · ä ö ü ß</p><p class="meta">0 O · 1 I l · 1,125 sat/vB</p></div>`,
  )
  .join(
    '',
  )}</div><p class="meta">Tabellarische Ziffern für Messwerte; Inter für technische Beschriftungen und Hashes. Die Wahl verändert keine Daten.</p></div></details>`

document.querySelector('#app').innerHTML = `<div class="shell">
<header class="site-header"><a class="brand" href="../"><span class="brand-mark" aria-hidden="true">₿</span><span>bitcoin<span class="brand-suffix"> / dashboard</span></span></a><nav class="navigation" aria-label="Hauptnavigation"><a href="#prototype-scope" data-scope>Übersicht</a><a href="#prototype-scope" data-scope>Markt</a><a href="#content" aria-current="page">Blockchain</a><a href="#prototype-scope" data-scope>Netzwerk & Mining</a></nav><button id="theme" class="theme" type="button" aria-label="Helles Theme aktivieren"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="4" stroke="currentColor"/><path d="M10 0v3m0 14v3M0 10h3m14 0h3M3 3l2 2m10 10 2 2M3 17l2-2M15 5l2-2" stroke="currentColor"/></svg><span>Light</span></button></header>
<div class="experiment"><span><strong>${code}</strong> <span aria-hidden="true">/</span> ${title}</span><span>Beispieldaten · keine Live-Verbindung <a id="compare-variant" href="../${expressive ? 'contemporary-precision' : 'expressive-observatory'}/?theme=${document.documentElement.dataset.theme}">Zu ${expressive ? 'B2-A' : 'B2-B'} ↗</a></span></div>
<main id="content" tabindex="-1"><div class="page-heading"><div><p class="eyebrow">Digital Asset Observatory</p><h1>Blockchain<span class="heading-dot" aria-hidden="true">.</span></h1><p>Blöcke, Transaktionen und die Nachfrage nach Blockspace.</p></div><div class="snapshot-label"><span class="snapshot-dot" aria-hidden="true"></span><div><strong>Beispielstand ${f.id}</strong><br>${f.date} · 14:32 ${f.timezone}</div></div></div>
<div class="observatory-stage">${chart}${network}</div><div class="lower-stage">${fees}${blocks}</div>${sources}${tools}</main>
<footer><span>Bitcoin Dashboard <span aria-hidden="true">/</span> ${title}</span><span>Phase 2.1.1 · Designprototyp · Betreiberfreigabe offen</span></footer></div>`

connectRefinement({ fixture: f, params, n })
