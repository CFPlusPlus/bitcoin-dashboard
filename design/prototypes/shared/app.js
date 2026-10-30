/* global document, window, URLSearchParams, ResizeObserver */
import { fixture as f } from './fixture.js'

const variant = document.body.dataset.variant
const analytical = variant === 'analytical'
const params = new URLSearchParams(window.location.search)
const n = (value, digits = 0) =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value)
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
let pinned = 1
let selectedBlock = 0
let state = ['snapshot', 'stale', 'missing'].includes(params.get('state'))
  ? params.get('state')
  : 'snapshot'
document.documentElement.dataset.theme = params.get('theme') === 'light' ? 'light' : 'dark'
document.body.dataset.font = params.get('font') === 'inter' ? 'inter' : 'plex'

const stamp = (resource) =>
  `<p class="resource-stamp">Beispielabruf ${f.times[resource]} ${f.timezone} · <a href="#sources">Quelle & Stand</a></p>`
const unavailable = () =>
  `<div class="unconnected"><span>Ø Blockzeit <strong>—</strong> · nicht angebunden</span><span>Transaktionsdurchsatz <strong>—</strong> · nicht angebunden</span></div>`
const latestMetrics = () =>
  `<div class="metric-pair"><div><p class="metric-label">Blockgröße</p><p class="metric-value">${n(f.blocks[0].size / 1e6, 2)} <small>MB</small></p></div><div><p class="metric-label">Blockgewicht</p><p class="metric-value">${n(f.blocks[0].weight / 1e6, 2)} <small>MWU</small></p></div></div>`
const fees = () =>
  `<section class="fee-panel" aria-labelledby="fees-title"><div class="section-head"><div><p class="eyebrow">${analytical ? 'Bestätigungspriorität' : '02 / Transaktionskosten'}</p><h2 id="fees-title">Gebührenempfehlungen</h2></div>${analytical ? '<span class="section-number">02</span>' : ''}</div><dl class="fee-list">${f.fees.map((fee) => `<div class="fee-row"><dt>${fee.label}</dt><dd>${n(fee.value, 3)} <small>sat/vB</small></dd><span class="fee-visual" style="width:${(fee.value / 6) * 100}%" aria-hidden="true"></span></div>`).join('')}</dl><p class="fee-note">Schätzungen, keine garantierten Bestätigungszeiten. Empfehlungen und Histogramm sind unabhängig erfasste Ressourcen.</p>${stamp('fees')}</section>`
const chart = () =>
  `<section class="chart-panel" aria-labelledby="chart-title"><div class="section-head"><div><p class="eyebrow">${analytical ? 'Blockspace / Verteilung' : '01 / Blockspace'}</p><h2 id="chart-title">${analytical ? 'Mempool-Gebührenhistogramm' : 'Unbestätigter Blockspace'}</h2></div><span class="chart-key">Virtuelle Größe</span></div>${analytical ? '' : `<div class="mempool-lead"><div><p class="metric-value" data-mempool="size">${n(f.mempool.virtualSizeBytes / 1e6, 2)} <small>MvB</small></p><p class="metric-label">im Mempool · Beispieldaten</p></div><div class="side-facts"><p><strong data-mempool="count">${n(f.mempool.transactionCount)}</strong> Transaktionen</p><p><strong data-mempool="fees">${n(f.mempool.totalFeeSats)}</strong> sat Gesamtgebühren</p></div></div>`}<div id="mempool-warning"></div><figure><div class="chart-caption"><span>Virtuelle Größe · MvB</span><span>Ein Snapshot · keine Zeitreihe</span></div><div class="histogram" id="histogram"></div><figcaption class="chart-help">Gebührenbereiche in sat/vB · Untergrenze inkl., Obergrenze exkl. Unterschiedliche Bereichsbreiten; Balkenhöhe = Volumen, keine Dichte.</figcaption></figure><div class="inspection" id="inspection" aria-live="polite" aria-atomic="true"></div><p class="chart-help">Balken antippen oder mit ← → prüfen · Enter fixiert · Esc löst die Auswahl.</p>${stamp('mempool')}</section>`
const blocks = () =>
  `<section class="blocks-panel" aria-labelledby="blocks-title"><div class="section-head"><div><p class="eyebrow">${analytical ? 'Bestätigter Blockspace' : '03 / Bestätigter Blockspace'}</p><h2 id="blocks-title">Jüngste Blöcke</h2></div><span class="meta">${f.blocks.length} Beispieldatensätze</span></div><div class="table-wrap" role="region" aria-label="Jüngste Blöcke, bei Bedarf horizontal scrollbar" tabindex="0"><table><caption>${f.date} · ${f.timezone} · Blockhöhe wählen für vollständige Details</caption><thead><tr><th scope="col">Blockhöhe</th><th scope="col">Zeitpunkt</th><th scope="col">TX</th><th scope="col">MB</th><th scope="col" class="table-extra">MWU</th><th scope="col" class="table-extra">Hash · synthetisch</th></tr></thead><tbody>${f.blocks.map((block, i) => `<tr data-block-row="${i}" class="${i === 0 ? 'selected' : ''}"><td><button type="button" data-block="${i}" aria-pressed="${i === 0}" aria-label="Block ${n(block.height)} auswählen">${n(block.height)}</button></td><td>${block.time}</td><td>${n(block.tx)}</td><td>${n(block.size / 1e6, 2)}</td><td class="table-extra">${n(block.weight / 1e6, 3)}</td><td class="table-extra mono">${block.hash.slice(0, 6)}…${block.hash.slice(-6)}</td></tr>`).join('')}</tbody></table></div><div id="block-detail" class="block-detail" aria-live="polite" aria-atomic="true"></div>${stamp('blocks')}</section>`
const sources = () =>
  `<section class="sources" id="sources" aria-labelledby="sources-title"><div class="section-head"><h2 id="sources-title">Datenherkunft & Stand</h2><span class="meta">Fixture ${f.id}</span></div><p class="meta">Alle Zahlen und Hashes sind synthetische Beispieldaten. Quellenangaben zeigen die Zuordnung der produktiven Ressourcen; dieser Prototyp stellt keine API-Anfragen.</p><dl class="source-grid">${[
    ['height', 'Blockhöhe'],
    ['blocks', 'Blöcke, Größe & Gewicht'],
    ['fees', 'Gebührenempfehlungen'],
    ['mempool', 'Mempool & Histogramm'],
  ]
    .map(
      ([key, label]) =>
        `<div><dt>${label}</dt><dd>${f.source} · ${f.date}<br><time datetime="2026-10-22T${f.times[key]}+02:00">${f.times[key]} ${f.timezone}</time><br><span id="source-${key}">${key === 'mempool' ? 'Beispielabruf vorhanden' : 'Beispielabruf vorhanden'}</span></dd></div>`,
    )
    .join('')}</dl>${analytical ? unavailable() : ''}</section>`
const tools = () =>
  `<details class="prototype-tools" id="prototype-scope"><summary>Prototyp prüfen · Datenzustände & Schriftvergleich</summary><p class="meta">Nur die Blockchain-Ansicht ist ausgearbeitet. Die übrigen Routen sind als Orientierung sichtbar. Alle Tests bleiben lokal.</p><div class="tool-row"><label>Mempool-Datenzustand<select id="data-state"><option value="snapshot">Beispielabruf vorhanden</option><option value="stale">Veraltet · Refresh fehlgeschlagen</option><option value="missing">Fehlend · Initialabruf fehlgeschlagen</option></select></label><label>Oberflächenschrift<select id="font-choice"><option value="plex">IBM Plex Sans + Mono</option><option value="inter">Inter + IBM Plex Mono</option></select></label><button type="button" id="reload-fixture">Fixture erneut laden</button></div><p id="refresh-status" class="meta" role="status">Fester Beispielstand vom ${f.date}. Keine automatische Aktualisierung.</p><div class="font-sample"><h3>Schriftprobe · identischer Inhalt, 400 / 500 / 600</h3><div class="font-pair"><div style="font-family: Plex, sans-serif"><span class="eyebrow">IBM Plex Sans</span><p class="digits">968.421 · 13,84 MvB</p><p style="font-weight:500">Gebührenempfehlungen & Blockgröße</p><p style="font-weight:600">Netzwerk & Mining · Übersicht</p><p class="meta">0 O · 1 I l · ä ö ü ß · 1,125 sat/vB</p></div><div style="font-family:Inter, sans-serif"><span class="eyebrow">Inter</span><p class="digits">968.421 · 13,84 MvB</p><p style="font-weight:500">Gebührenempfehlungen & Blockgröße</p><p style="font-weight:600">Netzwerk & Mining · Übersicht</p><p class="meta">0 O · 1 I l · ä ö ü ß · 1,125 sat/vB</p></div></div><p class="hash" style="margin-top:16px">IBM Plex Mono · ${f.blocks[0].hash}</p></div></details>`

document.querySelector('#app').innerHTML =
  `<div class="shell"><header class="site-header"><a class="brand" href="../"><span class="brand-mark" aria-hidden="true">₿</span>Bitcoin Dashboard</a><nav class="navigation" aria-label="Hauptnavigation"><a href="#prototype-scope" data-scope>Übersicht</a><a href="#prototype-scope" data-scope>Markt</a><a href="#content" aria-current="page">Blockchain</a><a href="#prototype-scope" data-scope>Netzwerk & Mining</a></nav><button type="button" id="theme" class="theme" aria-label="Helles Theme aktivieren"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="4" stroke="currentColor"/><path d="M10 0v3m0 14v3M0 10h3m14 0h3M3 3l2 2m10 10 2 2M3 17l2-2M15 5l2-2" stroke="currentColor"/></svg><span>Light</span></button></header><div class="experiment"><span><strong>Designexperiment ${analytical ? 'A' : 'B'}</strong> · ${analytical ? 'Analytical' : 'Refined'} Observatory</span><span><strong>Beispieldaten</strong> · keine Live-Verbindung · <a href="../${analytical ? 'refined' : 'analytical'}-observatory/">Variante ${analytical ? 'B' : 'A'} ansehen ↗</a></span></div><main id="content" tabindex="-1"><div class="page-heading"><div>${analytical ? '' : '<p class="eyebrow">Digital Asset Observatory</p>'}<h1>Blockchain</h1><p>Blöcke, Transaktionen und die Nachfrage nach Blockspace.</p></div><div class="snapshot-label"><strong>Snapshot ${f.id}</strong> · ${f.date}<br>Beispielstand · 14:32 ${f.timezone}</div></div>${analytical ? `<section class="metrics-band" aria-label="Netzwerk und Mempool im Überblick"><div class="metric-group"><p class="metric-label">Blockhöhe</p><p class="height accent">${n(f.height)}</p><p class="metric-secondary">Blöcke · Beispielstand ${f.times.height}</p></div><div class="metric-group"><p class="metric-label">Letzter Block · ${n(f.blocks[0].height)}</p>${latestMetrics()}<p class="metric-secondary">Gemeinsamer Blocks-Snapshot</p></div><div class="metric-group"><p class="metric-label">Mempool · unbestätigt</p><p class="metric-value" data-mempool="size">${n(f.mempool.virtualSizeBytes / 1e6, 2)} <small>MvB</small></p><p class="metric-secondary"><span data-mempool="count">${n(f.mempool.transactionCount)}</span> Transaktionen</p></div><div class="metric-group"><p class="metric-label">Mempool · Gesamtgebühren</p><p class="metric-value" data-mempool="fees">${n(f.mempool.totalFeeSats)}</p><p class="metric-secondary">sat · Beispielstand ${f.times.mempool}</p></div></section><div class="analysis-grid">${chart()}${fees()}</div>${blocks()}` : `<div class="observatory-stage">${chart()}<aside class="context-rail" aria-label="Kontext zum bestätigten Blockspace"><div><p class="eyebrow">Netzwerkstand</p><p class="height accent">${n(f.height)}</p><p class="metric-label">Blockhöhe · Blöcke</p>${stamp('height')}</div><div class="rail-divider"></div><div><h3>Letzter Block · ${n(f.blocks[0].height)}</h3>${latestMetrics()}<div class="weight-track" role="img" aria-label="Blockgewicht 3,993216 von maximal 4 MWU, 99,83 Prozent">${'<span></span>'.repeat(20)}</div><p class="meta weight-caption">${n((f.blocks[0].weight / 4e6) * 100, 2)} % des Gewichtslimits · 4 MWU</p>${stamp('blocks')}</div>${unavailable()}</aside></div><div class="lower-stage">${fees()}${blocks()}</div>`}${sources()}${tools()}</main><footer><span>Bitcoin Dashboard · Digital Asset Observatory</span><span>Phase 2.1 · Visueller Prototyp · keine Designfreigabe</span></footer></div>`

function themeLabel() {
  const dark = document.documentElement.dataset.theme === 'dark'
  const button = document.querySelector('#theme')
  button.setAttribute('aria-label', `${dark ? 'Helles' : 'Dunkles'} Theme aktivieren`)
  button.querySelector('span').textContent = dark ? 'Light' : 'Dark'
}
document.querySelector('#theme').addEventListener('click', () => {
  document.documentElement.dataset.theme =
    document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  themeLabel()
})
themeLabel()
document.querySelectorAll('.weight-track span').forEach((segment, index) => {
  const fill = Math.max(0, Math.min(1, (f.blocks[0].weight / 4e6) * 20 - index))
  segment.innerHTML = `<i style="width:${fill * 100}%"></i>`
})
document.querySelectorAll('.font-pair > div').forEach((sample) => {
  const hash = document.createElement('p')
  hash.className = 'meta'
  hash.style.marginTop = '12px'
  hash.style.overflowWrap = 'anywhere'
  hash.textContent = f.blocks[0].hash
  sample.append(hash)
})
document.querySelectorAll('[data-scope]').forEach((link) =>
  link.addEventListener('click', () => {
    document.querySelector('#prototype-scope').open = true
  }),
)

function inspect(index) {
  const box = document.querySelector('#inspection')
  const selection = document.querySelector('#bucket-choice')
  if (selection) selection.value = index === null ? 'all' : String(index)
  if (state === 'missing') {
    box.innerHTML = '<span class="meta">Inspektion nicht verfügbar · kein Mempool-Snapshot</span>'
    return
  }
  const bucket = index === null ? null : f.buckets[index]
  box.innerHTML = bucket
    ? `<div><span class="eyebrow">Gewählter Gebührenbereich</span><span class="meta"><strong>${escape(bucket.label)} sat/vB</strong> · ${n((bucket.virtualSizeBytes / f.mempool.virtualSizeBytes) * 100, 1)} % des Mempools</span></div><div style="text-align:right"><strong>${n(bucket.virtualSizeBytes / 1e6, 2)} MvB</strong><span class="meta">${n(bucket.virtualSizeBytes)} vB</span></div>`
    : `<div><span class="eyebrow">Gesamter Mempool</span><span class="meta">Balken für Details auswählen</span></div><strong>${n(f.mempool.virtualSizeBytes / 1e6, 2)} MvB</strong>`
  document
    .querySelectorAll('[data-bucket]')
    .forEach((el) => el.setAttribute('aria-pressed', String(Number(el.dataset.bucket) === index)))
}

function drawChart() {
  const host = document.querySelector('#histogram')
  if (state === 'missing') {
    host.innerHTML =
      '<div class="chart-empty"><h3>Keine Mempool-Daten verfügbar</h3><p>Beispiel: Initialabruf fehlgeschlagen.<br>Es werden keine Ersatzwerte angezeigt.</p><button type="button" id="retry">Fixture erneut laden</button></div>'
    document.querySelector('#retry').addEventListener('click', reload)
    inspect(null)
    return
  }
  const width = Math.max(260, Math.round(host.clientWidth))
  const height = width < 500 ? 248 : 242
  const left = 35,
    right = 6,
    top = 16,
    bottom = height - 36
  const plotWidth = width - left - right
  const step = plotWidth / f.buckets.length
  host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="group" aria-label="Mempool-Gebührenhistogramm, sieben Gebührenbereiche, gesamte virtuelle Größe 13,84 MvB"><title>Beispielsnapshot: virtuelle Größe pro Gebührenbereich</title>${[
    0, 1, 2, 3, 4, 5,
  ]
    .map((tick) => {
      const y = bottom - (tick / 5) * (bottom - top)
      return `<line class="chart-grid" x1="${left}" x2="${width - right}" y1="${y}" y2="${y}"/><text class="chart-axis" x="${left - 9}" y="${y + 4}" text-anchor="end">${tick}</text>`
    })
    .join('')}${f.buckets
    .map((bucket, i) => {
      const x = left + i * step
      const barHeight = (bucket.virtualSizeBytes / 5e6) * (bottom - top)
      return `<g class="chart-target" data-bucket="${i}" role="button" tabindex="${i === (pinned ?? 0) ? 0 : -1}" aria-pressed="${i === pinned}" aria-label="${escape(bucket.label)} sat/vB: ${n(bucket.virtualSizeBytes / 1e6, 2)} MvB"><rect class="hit" x="${x + 1}" y="${top - 4}" width="${step - 2}" height="${bottom - top + 29}" rx="1"/><rect class="chart-bar" x="${x + step * 0.17}" y="${bottom - barHeight}" width="${step * 0.66}" height="${barHeight}"/><line class="baseline" x1="${x + step * 0.17}" x2="${x + step * 0.83}" y1="${bottom + 1}" y2="${bottom + 1}"/><text class="chart-axis" x="${x + step / 2}" y="${bottom + 24}" text-anchor="middle" style="font-size:${width < 500 ? 10 : 11}px">${escape(bucket.label.replace('–<', '–'))}</text></g>`
    })
    .join('')}</svg>`
  inspect(pinned)
}
const chartHost = document.querySelector('#histogram')
const bucketControl = document.createElement('label')
bucketControl.className = 'bucket-control'
bucketControl.innerHTML = `Gebührenbereich prüfen<select id="bucket-choice"><option value="all">Gesamter Mempool</option>${f.buckets.map((bucket, i) => `<option value="${i}">${escape(bucket.label)} sat/vB · ${n(bucket.virtualSizeBytes / 1e6, 2)} MvB</option>`).join('')}</select>`
document.querySelector('#inspection').after(bucketControl)
document.querySelector('#bucket-choice').addEventListener('change', (event) => {
  pinned = event.target.value === 'all' ? null : Number(event.target.value)
  inspect(pinned)
})
chartHost.addEventListener('click', (event) => {
  const target = event.target.closest('[data-bucket]')
  if (target) {
    pinned = Number(target.dataset.bucket)
    inspect(pinned)
  }
})
chartHost.addEventListener('pointerover', (event) => {
  if (event.pointerType === 'touch') return
  const target = event.target.closest('[data-bucket]')
  if (target) inspect(Number(target.dataset.bucket))
})
chartHost.addEventListener('pointerleave', () => inspect(pinned))
chartHost.addEventListener('focusin', (event) => {
  const target = event.target.closest('[data-bucket]')
  if (target) inspect(Number(target.dataset.bucket))
})
chartHost.addEventListener('focusout', () => inspect(pinned))
chartHost.addEventListener('keydown', (event) => {
  const target = event.target.closest('[data-bucket]')
  if (!target) return
  let index = Number(target.dataset.bucket)
  if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
    index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? f.buckets.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + f.buckets.length) % f.buckets.length
    chartHost.querySelectorAll('[data-bucket]').forEach((el) => {
      el.tabIndex = Number(el.dataset.bucket) === index ? 0 : -1
    })
    chartHost.querySelector(`[data-bucket="${index}"]`).focus()
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    pinned = index
    inspect(pinned)
  } else if (event.key === 'Escape') {
    pinned = null
    inspect(null)
  }
})
let chartWidth = 0
new ResizeObserver((entries) => {
  const width = Math.round(entries[0].contentRect.width)
  if (width !== chartWidth) {
    chartWidth = width
    drawChart()
  }
}).observe(chartHost)

function blockDetails() {
  const block = f.blocks[selectedBlock]
  document.querySelector('#block-detail').innerHTML =
    `<p><span class="eyebrow">Ausgewählter Block</span> <strong class="mono">${n(block.height)}</strong></p><dl><div><dt>Transaktionen</dt><dd>${n(block.tx)}</dd></div><div><dt>Größe · exakt</dt><dd>${n(block.size)} Byte</dd></div><div><dt>Gewicht · exakt</dt><dd>${n(block.weight)} WU</dd></div><div><dt>Zeitpunkt · ${f.timezone}</dt><dd>${block.time}</dd></div></dl><p class="hash">Synthetischer Hash · ${block.hash}</p>`
  document
    .querySelectorAll('[data-block-row]')
    .forEach((row) =>
      row.classList.toggle('selected', Number(row.dataset.blockRow) === selectedBlock),
    )
  document
    .querySelectorAll('[data-block]')
    .forEach((button) =>
      button.setAttribute('aria-pressed', String(Number(button.dataset.block) === selectedBlock)),
    )
}
document.querySelectorAll('[data-block]').forEach((button) =>
  button.addEventListener('click', () => {
    selectedBlock = Number(button.dataset.block)
    blockDetails()
  }),
)
blockDetails()

function updateState() {
  document.querySelector('#bucket-choice').disabled = state === 'missing'
  document.querySelector('#data-state').value = state
  document.querySelector('#mempool-warning').innerHTML =
    state === 'stale'
      ? `<p class="state-warning" role="status">Veraltete Beispieldaten · Aktualisierung fehlgeschlagen. Letzter erfolgreicher Beispielabruf: ${f.date}, ${f.times.mempool} ${f.timezone}. Werte bleiben erhalten.</p>`
      : state === 'missing'
        ? '<p class="state-warning" role="status">Beispiel: Mempool-Abruf fehlgeschlagen · kein erfolgreicher Abruf vorhanden. Andere Ressourcen bleiben verfügbar.</p>'
        : ''
  document.querySelector('#source-mempool').textContent =
    state === 'stale'
      ? 'Veraltet · Beispiel-Refresh fehlgeschlagen'
      : state === 'missing'
        ? 'Kein erfolgreicher Beispielabruf'
        : 'Beispielabruf vorhanden'
  const sourceTime = document.querySelector('#source-mempool').parentElement.querySelector('time')
  sourceTime.hidden = state === 'missing'
  if (analytical) {
    document.querySelector('[data-mempool="fees"]').nextElementSibling.textContent =
      state === 'missing'
        ? 'sat · kein Beispielabruf vorhanden'
        : `sat · Beispielstand ${f.times.mempool}`
  }
  const values = {
    size: `${n(f.mempool.virtualSizeBytes / 1e6, 2)} <small>MvB</small>`,
    count: n(f.mempool.transactionCount),
    fees: n(f.mempool.totalFeeSats),
  }
  document.querySelectorAll('[data-mempool]').forEach((el) => {
    el.innerHTML = state === 'missing' ? '—' : values[el.dataset.mempool]
  })
  const stampEl = document.querySelector('.chart-panel .resource-stamp')
  stampEl.innerHTML =
    state === 'missing'
      ? 'Kein erfolgreicher Beispielabruf · <a href="#sources">Quelle & Stand</a>'
      : `Beispielabruf ${f.times.mempool} ${f.timezone} · <a href="#sources">Quelle & Stand</a>`
  drawChart()
}
function reload() {
  const fromRetry = document.activeElement?.id === 'retry'
  state = 'snapshot'
  pinned = 1
  updateState()
  document.querySelector('#refresh-status').textContent =
    `Fixture ${f.id} lokal erneut geladen. Identischer Beispielstand ${f.date}, ${f.times.mempool} ${f.timezone}; keine Netzwerkabfrage.`
  if (fromRetry) chartHost.querySelector('[tabindex="0"]').focus()
}
document.querySelector('#data-state').addEventListener('change', (event) => {
  state = event.target.value
  updateState()
})
document.querySelector('#font-choice').value = document.body.dataset.font
document.querySelector('#font-choice').addEventListener('change', (event) => {
  document.body.dataset.font = event.target.value
})
document.querySelector('#reload-fixture').addEventListener('click', reload)
updateState()
