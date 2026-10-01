import { domSafeId } from './domSafeId'
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_Tag } from '../types/Tag'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'

/**
 * sa#586 — l'identifiant de groupe SVG d'un élément doit être INJECTIF. L'ancien dérivé supprimait
 * tout caractère hors `[a-zA-Z0-9]` : les entrées de légende « 25 » et « -25 » partageaient un même
 * <g>, et l'une disparaissait.
 */

installJsdomRenderStubs()

describe('sa#586 — domSafeId', () => {
  it('rend inchangé un identifiant déjà fait de [A-Za-z0-9_]', () => {
    expect(domSafeId('Node_12abc')).toBe('Node_12abc')
    expect(domSafeId('')).toBe('')
  })

  it('distingue les identifiants qui ne diffèrent que par la ponctuation, les espaces ou les accents', () => {
    const groups = [
      ['25', '-25', '--25', '_25', '2-5', '2_5'],
      ['1.5', '15', '1_5', '1-2e-5'],
      ['Co-produits', 'Coproduits', 'Co produits', 'Co--produits'],
      ['Céréales', 'Cèreales', 'Crales', 'C-e9-r-e9-ales'],
      ['a😀', 'a-1f600-', 'a\u{f600}'],
      ['legend-tag-Evolution____-50', 'legend-tag-Evolution____--50', 'legend-tag-Evolution____50']
    ]
    groups.forEach(ids => {
      const encoded = ids.map(domSafeId)
      expect(new Set(encoded).size).toBe(ids.length)
    })
  })

  it('produit un fragment d\'id utilisable tel quel dans un sélecteur CSS', () => {
    const host = resetHost()
    const ids = ['25', '-25', 'Céréales', 'a b.c#d', 'x:y[z]', 'a😀', 'q"u\'o\\te']
    ids.forEach(id => {
      const encoded = domSafeId(id)
      expect(encoded).toMatch(/^[A-Za-z0-9_-]*$/)
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      g.setAttribute('id', 'gg_' + encoded)
      host.appendChild(g)
      expect(host.querySelector('#gg_' + encoded)).toBe(g)
    })
  })
})

describe('sa#586 — légende : « 25 » et « -25 » ont chacune leur groupe', () => {
  it('chaque entrée de légende est dessinée dans son propre <g>', () => {
    const host = resetHost()
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    const evo = sankey.addNodeTagGroup('Evolution', 'Evolution (%)', false)
    evo.use_colors = true
    const labels = ['25', '50', '100', '-25', '-50', '-75']
    let previous = sankey.addNewNodeWithName('Origine')
    labels.forEach(label => {
      const tag = evo.addTag(label, label) as Class_Tag
      const node = sankey.addNewNodeWithName('N' + label)
      node.addTag(tag)
      sankey.addNewLink(previous, node).valueCurrent = 10
      previous = node
    })
    app.drawing_area.legend.masked = false
    app.drawing_area.draw()

    const entries = Object.values(sankey.containers_dict)
      .filter(c => c.id.startsWith('legend-tag-Evolution'))
    expect(entries).toHaveLength(labels.length)
    const svg_groups = entries.map(c => c.svg_group)
    expect(new Set(svg_groups).size).toBe(labels.length)
    // Dans le DOM : un <g> par entrée, chacun distinct
    const drawn = svg_groups.map(id => host.querySelector('#' + id))
    drawn.forEach(g => expect(g).not.toBeNull())
    expect(new Set(drawn).size).toBe(labels.length)
  })
})
