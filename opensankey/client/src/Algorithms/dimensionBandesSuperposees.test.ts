import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 14/10, panorama de l agriculture : « matieres animales en bande ne colorie pas ».
// La filiere vegetale, en bandes mais sur un seul membre (Toutes filieres), prenait la main sur la
// filiere animale et ses membres choisis : chaque flux n avait qu une bande grise.

test('la dimension qui superpose vraiment plusieurs membres fait les bandes', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const veg = sankey.addDataTagGroup('veg', 'Filiere vegetale', false) as unknown as Class_DataTagGroup
  veg.addTag('Toutes', 'toutes')
  veg.addTag('Cereales', 'ce')
  const ani = sankey.addDataTagGroup('ani', 'Filiere animale', false) as unknown as Class_DataTagGroup
  const lait = ani.addTag('Lait', 'lait') as Class_DataTag
  const porc = ani.addTag('Porc', 'porc') as Class_DataTag
  lait.color = '#158a8e'
  porc.color = '#ca9b2b'
  veg.banner = 'multi'
  ani.banner = 'multi'
  veg.tags_list.forEach(t => t.setUnSelected())
  ;(veg.tags_dict.toutes as Class_DataTag).setSelected()
  lait.setSelected()
  porc.setSelected()
  expect(veg.draws_bands).toBe(false)
  expect(ani.draws_bands).toBe(true)
  // Aucune ne superpose plusieurs membres : la premiere de la liste, comme avant.
  porc.setUnSelected()
  expect(veg.draws_bands).toBe(true)
  expect(ani.draws_bands).toBe(false)
})
