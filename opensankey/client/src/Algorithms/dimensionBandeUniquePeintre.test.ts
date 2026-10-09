import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { isGeneratedMemberLink } from './DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 (09/10, vues synthetiques SOCLE) — une dimension en bandes avec UN SEUL membre choisi
// (Matiere, case « Distinguer » decochee) ne doit pas griser les flux que peint une autre dimension.

test('une bande unique prend la couleur de la dimension qui peint les flux', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const poste = sankey.addDataTagGroup('poste', 'Poste', false) as unknown as Class_DataTagGroup
  const prod = poste.addTag('Production', 'prod') as Class_DataTag
  const imp = poste.addTag('Importations', 'imp') as Class_DataTag
  prod.color = '#00aa00'
  imp.color = '#aa0000'
  const matiere = sankey.addDataTagGroup('matiere', 'Matiere', false) as unknown as Class_DataTagGroup
  const tout = matiere.addTag('Matiere', 'tout') as Class_DataTag
  matiere.addTag('Produits', 'produits')
  tout.color = '#808080'
  matiere.tags_list.forEach(t => t.setUnSelected())
  tout.setSelected()
  const res = sankey.addNewNodeWithName('Ressources')
  const mat = sankey.addNewNodeWithName('Matiere')
  const entree = sankey.addNewLink(res, mat)
  ;[[prod, 10], [imp, 4]].forEach(([m, v]) => {
    poste.tags_list.forEach(t => t.setUnSelected())
    ;(m as Class_DataTag).setSelected()
    ;(entree.value as Class_LinkValue).valueData = v as number
  })
  poste.tags_list.forEach(t => t.setSelected())
  res.driving_dimension = poste
  matiere.banner = 'multi'
  app.drawing_area.rebuildDimensionNodes()
  poste.paints_flows = true
  const vers_prod = sankey.links_list.filter(isGeneratedMemberLink).find(l => l.source.name === 'Production')
  expect(vers_prod).toBeDefined()
  const bandes = vers_prod?.tagged_value_bands ?? []
  expect(bandes).toHaveLength(1)
  expect(bandes[0].color).toBe('#00aa00')
})
