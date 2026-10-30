/* global document, ResizeObserver */

// Both new directions use this one controller and the unchanged Phase 2.1 fixture.
export function connectRefinement({ fixture: f, params, n }) {
  let state = ['snapshot', 'stale', 'missing'].includes(params.get('state'))
    ? params.get('state')
    : 'snapshot'
  let pinned = 1
  let selectedBlock = 0
  const $ = (selector) => document.querySelector(selector)
  const host = $('#histogram')
  const choose = $('#bucket-choice')

  function themeLabel() {
    const dark = document.documentElement.dataset.theme === 'dark'
    $('#theme').setAttribute('aria-label', `${dark ? 'Helles' : 'Dunkles'} Theme aktivieren`)
    $('#theme span').textContent = dark ? 'Light' : 'Dark'
    const link = $('#compare-variant')
    link.href = link.href.replace(/theme=(dark|light)/, `theme=${dark ? 'dark' : 'light'}`)
  }
  $('#theme').addEventListener('click', () => {
    document.documentElement.dataset.theme =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    themeLabel()
  })
  themeLabel()
  document.querySelectorAll('[data-scope]').forEach((a) =>
    a.addEventListener('click', () => {
      $('#prototype-scope').open = true
    }),
  )

  function inspect(index) {
    choose.value = index === null ? 'all' : String(index)
    const b = index === null ? null : f.buckets[index]
    $('#inspection').innerHTML =
      state === 'missing'
        ? '<p class="meta">Inspektion nicht verfügbar · kein Mempool-Snapshot</p>'
        : b
          ? `<div><span class="eyebrow">Gewählter Bereich</span><p><strong>${b.label} <small>sat/vB</small></strong><span class="inspection-share">${n((b.virtualSizeBytes / f.mempool.virtualSizeBytes) * 100, 1)} % des Mempools</span></p></div><div class="inspection-value"><strong>${n(b.virtualSizeBytes / 1e6, 2)} <small>MvB</small></strong><span class="meta">${n(b.virtualSizeBytes)} vB</span></div>`
          : `<div><span class="eyebrow">Gesamter Mempool</span><p class="meta">Balken für Details auswählen</p></div><strong>${n(f.mempool.virtualSizeBytes / 1e6, 2)} MvB</strong>`
    host
      .querySelectorAll('[data-bucket]')
      .forEach((el) => el.setAttribute('aria-pressed', String(Number(el.dataset.bucket) === index)))
  }

  function drawChart() {
    // Preserve keyboard focus if a font or viewport change redraws the SVG.
    const focused = document.activeElement?.dataset.bucket
    if (state === 'missing') {
      host.innerHTML =
        '<div class="chart-empty"><span class="eyebrow">Mempool / Abruf fehlgeschlagen</span><h3>Keine Daten verfügbar</h3><p>Kein erfolgreicher Beispielabruf.<br>Es werden keine Ersatzwerte angezeigt.</p><button id="retry" type="button">Fixture erneut laden</button></div>'
      $('#retry').addEventListener('click', reload)
      inspect(null)
      return
    }
    const width = Math.round(host.clientWidth)
    const height = width < 500 ? 228 : 224
    const left = 28,
      right = 8,
      top = 28,
      bottom = height - 32
    const step = (width - left - right) / f.buckets.length
    host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="group" aria-label="Mempool-Gebührenhistogramm: sieben Kategorien, Volumen insgesamt 13,84 MvB"><title>Virtuelle Größe pro Gebührenbereich · synthetischer Snapshot</title>${[
      0, 1, 2, 3, 4, 5,
    ]
      .map((t) => {
        const y = bottom - (t / 5) * (bottom - top)
        return `<line class="chart-grid" x1="${left}" x2="${width - right}" y1="${y}" y2="${y}"/><text class="chart-axis" x="${left - 10}" y="${y + 4}" text-anchor="end">${t}</text>`
      })
      .join('')}${f.buckets
      .map((b, i) => {
        const x = left + i * step
        const bh = (b.virtualSizeBytes / 5e6) * (bottom - top)
        const barWidth = step * 0.58
        return `<g class="chart-target" data-bucket="${i}" role="button" tabindex="${i === (pinned ?? 0) ? 0 : -1}" aria-pressed="${i === pinned}" aria-label="${b.label} sat/vB: ${n(b.virtualSizeBytes / 1e6, 2)} MvB"><rect class="hit" x="${x + 1}" y="${top - 24}" width="${step - 2}" height="${bottom - top + 51}" rx="4"/><rect class="chart-bar" x="${x + (step - barWidth) / 2}" y="${bottom - bh}" width="${barWidth}" height="${bh}" rx="3"/><text class="bar-value" x="${x + step / 2}" y="${bottom - bh - 10}" text-anchor="middle">${n(b.virtualSizeBytes / 1e6, 2)}</text><line class="baseline" x1="${x + step * 0.21}" x2="${x + step * 0.79}" y1="${bottom + 1}" y2="${bottom + 1}"/><text class="chart-axis" x="${x + step / 2}" y="${bottom + 24}" text-anchor="middle">${b.label.replace('–<', '–')}</text></g>`
      })
      .join('')}</svg>`
    inspect(pinned)
    if (focused !== undefined) host.querySelector(`[data-bucket="${focused}"]`)?.focus()
  }
  choose.addEventListener('change', () => {
    pinned = choose.value === 'all' ? null : Number(choose.value)
    inspect(pinned)
  })
  host.addEventListener('click', (event) => {
    const target = event.target.closest('[data-bucket]')
    if (target) {
      pinned = Number(target.dataset.bucket)
      inspect(pinned)
      host.querySelectorAll('[data-bucket]').forEach((el) => {
        el.tabIndex = Number(el.dataset.bucket) === pinned ? 0 : -1
      })
    }
  })
  host.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch') return
    const target = event.target.closest('[data-bucket]')
    if (target) inspect(Number(target.dataset.bucket))
  })
  host.addEventListener('pointerleave', () => inspect(pinned))
  host.addEventListener('focusin', (event) => {
    const target = event.target.closest('[data-bucket]')
    if (target) inspect(Number(target.dataset.bucket))
  })
  host.addEventListener('focusout', () => inspect(pinned))
  host.addEventListener('keydown', (event) => {
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
      host.querySelectorAll('[data-bucket]').forEach((el) => {
        el.tabIndex = Number(el.dataset.bucket) === index ? 0 : -1
      })
      host.querySelector(`[data-bucket="${index}"]`).focus()
    } else if (['Enter', ' '].includes(event.key)) {
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
  }).observe(host)

  function blockDetails() {
    const b = f.blocks[selectedBlock]
    $('#block-detail').innerHTML =
      `<p><span class="eyebrow">Ausgewählter Block</span> <strong>${n(b.height)}</strong></p><dl><div><dt>Transaktionen</dt><dd>${n(b.tx)}</dd></div><div><dt>Größe · exakt</dt><dd>${n(b.size)} Byte</dd></div><div><dt>Gewicht · exakt</dt><dd>${n(b.weight)} WU</dd></div><div><dt>Zeitpunkt · ${f.timezone}</dt><dd>${b.time}</dd></div></dl><p class="hash">Synthetischer Hash · ${b.hash}</p>`
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
    choose.disabled = state === 'missing'
    $('#data-state').value = state
    $('#mempool-warning').innerHTML =
      state === 'stale'
        ? `<p class="state-warning" role="status"><strong>Veraltete Beispieldaten</strong> · Aktualisierung fehlgeschlagen. Letzter erfolgreicher Beispielabruf: ${f.date}, ${f.times.mempool} ${f.timezone}. Werte bleiben erhalten.</p>`
        : state === 'missing'
          ? '<p class="state-warning" role="status"><strong>Mempool-Abruf fehlgeschlagen</strong> · kein erfolgreicher Abruf vorhanden. Andere Ressourcen bleiben verfügbar.</p>'
          : ''
    $('#source-mempool').textContent =
      state === 'stale'
        ? 'Veraltet · Beispiel-Refresh fehlgeschlagen'
        : state === 'missing'
          ? 'Kein erfolgreicher Beispielabruf'
          : 'Beispielabruf vorhanden'
    const source = $('#source-mempool').parentElement
    source.querySelector('time').hidden = state === 'missing'
    source.querySelector('dd > span').hidden = state === 'missing'
    const values = {
      size: `${n(f.mempool.virtualSizeBytes / 1e6, 2)} <small>MvB</small>`,
      count: n(f.mempool.transactionCount),
      fees: n(f.mempool.totalFeeSats),
    }
    document.querySelectorAll('[data-mempool]').forEach((el) => {
      el.innerHTML = state === 'missing' ? '—' : values[el.dataset.mempool]
    })
    $('.chart-panel .resource-stamp').innerHTML =
      state === 'missing'
        ? 'Kein erfolgreicher Beispielabruf · <a href="#sources">Quelle & Stand</a>'
        : `Beispielabruf ${f.times.mempool} ${f.timezone} / <a href="#sources">Quelle & Stand</a>`
    $('.snapshot-chip').textContent =
      state === 'snapshot' ? 'Snapshot' : state === 'stale' ? 'Veraltet' : 'Fehlend'
    drawChart()
  }
  function reload() {
    const retry = document.activeElement?.id === 'retry'
    state = 'snapshot'
    pinned = 1
    updateState()
    $('#refresh-status').textContent =
      `Fixture ${f.id} lokal erneut geladen. Identischer Beispielstand ${f.date}, ${f.times.mempool} ${f.timezone}; keine Netzwerkabfrage.`
    if (retry) host.querySelector('[tabindex="0"]').focus()
  }
  $('#data-state').addEventListener('change', (event) => {
    state = event.target.value
    updateState()
  })
  $('#font-choice').value = document.body.dataset.font
  $('#font-choice').addEventListener('change', (event) => {
    document.body.dataset.font = event.target.value
  })
  $('#reload-fixture').addEventListener('click', reload)
  updateState()
}
