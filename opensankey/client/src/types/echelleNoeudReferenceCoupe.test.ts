import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag } from './Tag'
import type { Class_DataTagGroup } from './TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { applyDimensionCut } from '../components/ui/dimensionDrawingHost'
import { isGeneratedMemberNode } from '../Algorithms/DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 09/10 : en passant de Cereales a Oleoproteagineux, les noeuds engendres se
// placaient mal tant qu on ne retouchait pas l ecart. L echelle calee sur le noeud de reference se
// lisait sur les flux engendres de l ANCIENNE coupe.

function choisir(g: Class_DataTagGroup, ...m: Class_DataTag[]) {
  g.tags_list.forEach(t => t.setUnSelected())
  m.forEach(x => x.setSelected())
}

test('changer de filiere place les noeuds comme un second rebati', () => {
  const app = new Class_ApplicationData(false)
  const da = app.drawing_area
  const sankey = da.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as unknown as Class_DataTagGroup
  const ce = filiere.addTag('Cereales', 'ce') as Class_DataTag
  const ol = filiere.addTag('Oleo', 'ol') as Class_DataTag
  const poste = sankey.addDataTagGroup('poste', 'Poste', false) as unknown as Class_DataTagGroup
  const prod = poste.addTag('Production', 'prod') as Class_DataTag
  const imp = poste.addTag('Importations', 'imp') as Class_DataTag
  const res = sankey.addNewNodeWithName('Ressources')
  const mat = sankey.addNewNodeWithName('Matiere')
  res.setPosXY(0, 100)
  mat.setPosXY(300, 100)
  const flux = sankey.addNewLink(res, mat)
  ;[[ce, prod, 600], [ce, imp, 30], [ol, prod, 50], [ol, imp, 80]].forEach(([f, p, v]) => {
    choisir(filiere, f as Class_DataTag)
    choisir(poste, p as Class_DataTag)
    ;(flux.value as Class_LinkValue).valueData = v as number
  })
  choisir(filiere, ce)
  choisir(poste, prod, imp)
  ;(filiere as unknown as { banner: string }).banner = 'one'
  res.driving_dimension = poste
  da.scale_reference_node = { id: mat.id, px: 100 }
  da.rebuildDimensionNodes()
  const ys = () => sankey.nodes_list.filter(isGeneratedMemberNode).map(n => [n.id, Math.round(n.position_y * 10) / 10])
  applyDimensionCut(app, filiere, ['ol'])
  const apres_geste = ys()
  da.rebuildDimensionNodes()
  expect(ys()).toEqual(apres_geste)
})
