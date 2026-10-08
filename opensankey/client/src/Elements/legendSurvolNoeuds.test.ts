import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag, Class_Tag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from './LinkValues'
import { engendreParmi } from './LegendGenerator'
import { isGeneratedMemberNode } from '../Algorithms/DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 08/10 : en mode noeuds, survoler un membre dans la legende ne designait rien.

test('un noeud engendre est designe par son membre, et par un ancetre de son membre', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const fr = pays.addTag('France', 'fr') as Class_DataTag
  const es = pays.addTag('Espagne', 'es') as Class_DataTag
  fr.parent = monde
  es.parent = monde
  pays.levels = ['monde', 'pays']
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  const flux = sankey.addNewLink(a, b)
  ;[[fr, 3], [es, 4]].forEach(([m, v]) => {
    pays.tags_list.forEach(t => t.setUnSelected())
    ;(m as Class_DataTag).setSelected()
    ;(flux.value as Class_LinkValue).valueData = v as number
  })
  pays.tags_list.forEach(t => t.setUnSelected())
  fr.setSelected()
  es.setSelected()
  a.driving_dimension = pays
  app.drawing_area.rebuildDimensionNodes()
  const noeud_fr = sankey.nodes_list.filter(isGeneratedMemberNode).find(n => n.id.endsWith('fr'))
  expect(engendreParmi(noeud_fr, [fr as unknown as Class_Tag])).toBe(true)
  expect(engendreParmi(noeud_fr, [es as unknown as Class_Tag])).toBe(false)
  expect(engendreParmi(noeud_fr, [monde as unknown as Class_Tag])).toBe(true)
  expect(engendreParmi(b, [fr as unknown as Class_Tag])).toBe(false)
})
