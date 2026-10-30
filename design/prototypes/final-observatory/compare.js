/* global document, window, URLSearchParams */
const palettes = [
  ['signature', 'A · Bitcoin Signature', 'Graphit / Bitcoin-Orange / Grau'],
  ['analytical', 'B · Bitcoin Analytical', 'Graphit / Bitcoin-Orange / gedämpftes Blau'],
  ['warm', 'C · Warm Bitcoin', 'Warmer Graphit / Kupfer / warme Neutrale'],
]
document.querySelector('#comparisons').innerHTML = ['desktop', 'mobile']
  .map((device) =>
    ['dark', 'light']
      .map((theme) => {
        const size = device === 'desktop' ? '1440x900' : '390x844'
        return `<section class="board ${device}" id="${device}-${theme}" aria-label="${device} ${theme}"><h2>${device === 'desktop' ? 'Desktop · 1440 × 900' : 'Mobil · 390 × 844'} / ${theme === 'dark' ? 'Dark' : 'Light'}</h2><div class="palette-grid">${palettes.map(([id, title, description]) => `<figure><figcaption>${title}<small>${description}</small></figcaption><a href="./?palette=${id}&theme=${theme}"><img src="../screenshots/final/${id}-${size}-${theme}.png" width="${device === 'desktop' ? 720 : 390}" height="${device === 'desktop' ? 450 : 844}" alt="${title}, ${theme}, ${size}; zum interaktiven Prototyp" /></a></figure>`).join('')}</div><p class="board-note">OBS-01 · 1–&lt;2 sat/vB fixiert · Block 968.421 · ${device === 'desktop' ? 'alle drei Screenshots einheitlich auf 50 % verkleinert' : 'alle drei Screenshots in Originalgröße'} · keine Layoutvariante</p></section>`
      })
      .join(''),
  )
  .join('')

const theme = new URLSearchParams(window.location.search).get('theme')
if (['dark', 'light'].includes(theme)) {
  const device = window.matchMedia('(max-width: 600px)').matches ? 'mobile' : 'desktop'
  document.querySelector(`#${device}-${theme}`).scrollIntoView()
}
