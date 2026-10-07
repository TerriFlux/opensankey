import { appendLegendCapsule, appendLegendContextRows } from './legendChecks'

describe('os#1527 capsule de la legende d une figure', () => {
  test('affichee : une fleche qui la replie ; masquee : le nom et la fleche qui la rouvre', () => {
    const root = document.createElement('div')
    const asked: boolean[] = []
    const shown = appendLegendCapsule(root, { label: 'Légende', toggle: s => asked.push(s) }, true, 'left')
    expect(shown.textContent).toBe('‹')
    expect(shown.style.left).toBe('0px')
    shown.click()
    const hidden = appendLegendCapsule(root, { label: 'Légende', toggle: s => asked.push(s) }, false, 'right')
    expect(hidden.textContent).toBe('‹ Légende')
    expect(hidden.style.right).toBe('0px')
    hidden.click()
    expect(asked).toEqual([false, true])
    expect(root.style.position).toBe('relative')
  })
})

// os#1527 — les lignes de rappel des coordonnees (« Annee : 2015 ») sous la legende d une couronne,
// comme dans la legende du diagramme : une ligne par dimension, cliquable quand elle se choisit d ici.

describe('os#1527 lignes de rappel de la legende d une couronne', () => {
  test('une ligne par dimension ; seule celle qui se choisit ouvre sa liste', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const opened: { x: number, y: number }[] = []
    appendLegendContextRows(host, [
      { label: 'Année : 2015', hint: 'Cliquer pour modifier', open: anchor => opened.push(anchor) },
      { label: 'Unité : kt' }
    ], false)
    const rows = Array.from(host.querySelectorAll('.node_stats_legend_context')) as HTMLElement[]
    expect(rows.map(r => r.textContent)).toEqual(['Année : 2015', 'Unité : kt'])
    expect(rows[0].style.cursor).toBe('pointer')
    expect(rows[0].title).toBe('Cliquer pour modifier')
    expect(rows[1].style.cursor).toBe('default')
    rows[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(opened).toHaveLength(0)
    rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(opened).toHaveLength(1)
    host.remove()
  })

  test('sans lignes : rien', () => {
    const host = document.createElement('div')
    appendLegendContextRows(host, undefined, true)
    expect(host.children).toHaveLength(0)
  })
})
