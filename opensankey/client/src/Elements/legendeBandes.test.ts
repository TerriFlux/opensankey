import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { computeLegendItems, legendTagGroupsOrder } from './legendItems'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — CONTROLE : une dimension EN BANDES garde sa legende, une dimension EN NOEUDS non.
function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const europe = pays.addTag('Europe', 'europe') as Class_DataTag
  const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
  europe.parent = monde
  afrique.parent = monde
  pays.levels = ['monde', 'regions']
  pays.use_colors = true
  const source = sankey.addNewNodeWithName('A')
  const cible = sankey.addNewNodeWithName('B')
  sankey.addNewLink(source, cible)
  pays.tags_list.forEach(t => t.setUnSelected())
  europe.setSelected(); afrique.setSelected()
  return { app, sankey, pays, cible }
}

describe('os#1511 — la legende suit le mode d affichage', () => {
  test('EN BANDES : la dimension est dans la legende', () => {
    const m = monter()
    m.pays.banner = 'multi'
    const groupes = legendTagGroupsOrder(m.sankey as never).map(g => g.id)
    expect(groupes).toContain('pays')
  })

  test('EN NOEUDS : elle en sort', () => {
    const m = monter()
    m.cible.driving_dimension = m.pays
    const groupes = legendTagGroupsOrder(m.sankey as never).map(g => g.id)
    expect(groupes).not.toContain('pays')
  })

  test('EN BANDES, les entrees de ses membres sont bien emises', () => {
    const m = monter()
    m.pays.banner = 'multi'
    const items = computeLegendItems(
      m.sankey as never, m.app.drawing_area.legend as never, {} as never)
    const textes = items.map(i => i.text)
    expect(textes).toContain('Pays')
    expect(textes.join(' | ')).toContain('Europe')
  })
})
