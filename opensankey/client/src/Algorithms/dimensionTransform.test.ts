import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { nodeTransformsDimension } from './DimensionTransform'
import { carrierRefusal, dimensionCarriersOf, toggleDimensionCarrier } from '../components/ui/dimensionDrawingHost'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 08/10 : Transformation recoit de la matiere premiere et rend des produits
// transformes ; decoupee par type de matiere, elle tombait en morceaux sans lien.

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const matiere = sankey.addDataTagGroup('matiere', 'Matiere', false) as unknown as Class_DataTagGroup
  const mp = matiere.addTag('Matiere premiere', 'mp') as Class_DataTag
  const pt = matiere.addTag('Produits transformes', 'pt') as Class_DataTag
  const mp_node = sankey.addNewNodeWithName('MP')
  const transfo = sankey.addNewNodeWithName('Transformation')
  const mt = sankey.addNewNodeWithName('MT')
  const fin = sankey.addNewNodeWithName('Emplois')
  const poser = (a: typeof mp_node, b: typeof mp_node, membre: Class_DataTag, v: number) => {
    const flux = sankey.links_list.find(l => l.source === a && l.target === b) ?? sankey.addNewLink(a, b)
    matiere.tags_list.forEach(t => t.setUnSelected())
    membre.setSelected()
    ;(flux.value as Class_LinkValue).valueData = v
  }
  poser(mp_node, transfo, mp, 100)
  poser(transfo, mt, pt, 80)
  poser(mt, fin, pt, 80)
  matiere.tags_list.forEach(t => t.setSelected())
  return { app, matiere, transfo, mt }
}

test('un noeud qui transforme la dimension ne se coche pas, les autres si', () => {
  const { app, matiere, transfo, mt } = monter()
  expect(nodeTransformsDimension(transfo, matiere)).toBe(true)
  expect(nodeTransformsDimension(mt, matiere)).toBe(false)
  expect(carrierRefusal(app, matiere, transfo.id)).toBe('transforms')
  toggleDimensionCarrier(app, matiere, transfo.id)
  expect(dimensionCarriersOf(app, matiere)).toEqual([])
  toggleDimensionCarrier(app, matiere, mt.id)
  expect(dimensionCarriersOf(app, matiere).map(n => n.id)).toEqual([mt.id])
})

test('deja porteur, il se decoche toujours', () => {
  const { app, matiere, transfo } = monter()
  transfo.driving_dimension = matiere
  toggleDimensionCarrier(app, matiere, transfo.id)
  expect(transfo.own_driving_dimension).toBeUndefined()
})
