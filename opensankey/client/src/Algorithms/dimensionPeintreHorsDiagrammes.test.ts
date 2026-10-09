import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { isGeneratedMemberLink } from './DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 09/10 : sans diagramme par membre, on doit pouvoir choisir la dimension en
// noeuds qui colore les flux.

test('une dimension en noeuds choisie peint les flux, decoupes ou non', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const poste = sankey.addDataTagGroup('poste', 'Poste', false) as unknown as Class_DataTagGroup
  const prod = poste.addTag('Production', 'prod') as Class_DataTag
  const imp = poste.addTag('Importations', 'imp') as Class_DataTag
  prod.color = '#00aa00'
  imp.color = '#aa0000'
  const res = sankey.addNewNodeWithName('Ressources')
  const mat = sankey.addNewNodeWithName('Matiere')
  const fin = sankey.addNewNodeWithName('Fin')
  const entree = sankey.addNewLink(res, mat)
  const suite = sankey.addNewLink(mat, fin)
  ;[[entree, prod, 10], [entree, imp, 4], [suite, prod, 14]].forEach(([l, m, v]) => {
    poste.tags_list.forEach(t => t.setUnSelected())
    ;(m as Class_DataTag).setSelected()
    ;((l as typeof entree).value as Class_LinkValue).valueData = v as number
  })
  poste.tags_list.forEach(t => t.setSelected())
  res.driving_dimension = poste
  app.drawing_area.rebuildDimensionNodes()
  expect(poste.may_paint_member_bands_flows).toBe(true)
  poste.paints_flows = true
  const vers_prod = sankey.links_list.filter(isGeneratedMemberLink).find(l => l.source.name === 'Production')
  expect(vers_prod?.getShapeColorToUse()).toBe('#00aa00')
  // Matiere -> Fin n est pas decoupe : sa seule donnee est la production.
  expect(suite.getShapeColorToUse()).toBe('#00aa00')
})
