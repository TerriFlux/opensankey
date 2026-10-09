import { Class_ApplicationData } from './ApplicationData'
import type { Class_LinkValue } from '../Elements/LinkValues'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 09/10 : « une taille de noeud donnee pour Matiere et une echelle qui s adapte ».

test('l echelle se cale pour que le noeud de reference garde sa hauteur, quelles que soient les valeurs', () => {
  const app = new Class_ApplicationData(false)
  const da = app.drawing_area
  const sankey = da.sankey
  const a = sankey.addNewNodeWithName('A')
  const m = sankey.addNewNodeWithName('Matiere')
  const b = sankey.addNewNodeWithName('B')
  const entree = sankey.addNewLink(a, m)
  const sortie = sankey.addNewLink(m, b)
  ;(entree.value as Class_LinkValue).valueData = 100
  ;(sortie.value as Class_LinkValue).valueData = 80
  da.scale_reference_node = { id: m.id, px: 50 }
  da.beginScaleFrame()
  da.applyReferenceNodeScale()
  expect(entree.thickness).toBeCloseTo(50, 6)
  ;(entree.value as Class_LinkValue).valueData = 1000
  ;(sortie.value as Class_LinkValue).valueData = 900
  da.beginScaleFrame()
  da.applyReferenceNodeScale()
  expect(entree.thickness).toBeCloseTo(50, 6)
  expect(sortie.thickness).toBeCloseTo(45, 6)
})
