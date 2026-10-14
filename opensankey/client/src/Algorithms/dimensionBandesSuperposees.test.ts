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

test('chaque flux prend ses bandes de la dimension qui le ventile, la suite tranche', () => {
  // Panorama : flux vegetaux par culture, flux animaux par filiere animale, et Matiere vegetale ->
  // Elevage (ventile par les deux) par filiere animale, comme l elevage qui suit (Julien, 14/10).
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const veg = sankey.addDataTagGroup('veg', 'Filiere vegetale', false) as unknown as Class_DataTagGroup
  const toutes_v = veg.addTag('Toutes', 'toutes') as Class_DataTag
  const ce = veg.addTag('Cereales', 'ce') as Class_DataTag
  const ol = veg.addTag('Oleo', 'ol') as Class_DataTag
  const ani = sankey.addDataTagGroup('ani', 'Filiere animale', false) as unknown as Class_DataTagGroup
  const toutes_a = ani.addTag('Toutes', 'toutes') as Class_DataTag
  const lait = ani.addTag('Lait', 'lait') as Class_DataTag
  const porc = ani.addTag('Porc', 'porc') as Class_DataTag
  // Comme le panorama : chaque filiere descend de « Toutes ».
  ce.parent = toutes_v
  ol.parent = toutes_v
  lait.parent = toutes_a
  porc.parent = toutes_a
  veg.levels = ['Toutes', 'Filiere']
  ani.levels = ['Toutes', 'Filiere']
  veg.banner = 'multi'
  ani.banner = 'multi'
  const res = sankey.addNewNodeWithName('Ressources')
  const mv = sankey.addNewNodeWithName('MV')
  const elev = sankey.addNewNodeWithName('Elevage')
  const ma = sankey.addNewNodeWithName('MA')
  const res_mv = sankey.addNewLink(res, mv)
  const mv_elev = sankey.addNewLink(mv, elev)
  const elev_ma = sankey.addNewLink(elev, ma)
  const poser = (flux: typeof res_mv, v: Class_DataTag, a: Class_DataTag, x: number) => {
    veg.tags_list.forEach(t => t.setUnSelected()); v.setSelected()
    ani.tags_list.forEach(t => t.setUnSelected()); a.setSelected()
    ;(flux.value as unknown as { valueData: number }).valueData = x
  }
  poser(res_mv, ce, toutes_a, 100); poser(res_mv, ol, toutes_a, 50)
  poser(mv_elev, ce, lait, 30); poser(mv_elev, ol, porc, 20)
  poser(elev_ma, toutes_v, lait, 12); poser(elev_ma, toutes_v, porc, 8)
  veg.tags_list.forEach(t => t.setUnSelected()); ce.setSelected(); ol.setSelected()
  ani.tags_list.forEach(t => t.setUnSelected()); lait.setSelected(); porc.setSelected()
  expect(veg.draws_bands).toBe(true)
  expect(ani.draws_bands).toBe(true)
  expect(res_mv.bandDimension()?.id).toBe('veg')
  expect(elev_ma.bandDimension()?.id).toBe('ani')
  expect(mv_elev.bandDimension()?.id).toBe('ani')
  // Les flux non ventiles par une dimension se lisent a sa racine : rien ne disparait.
  expect(elev_ma.valueCurrent).toBeCloseTo(20, 5)
  expect(res_mv.valueCurrent).toBeCloseTo(150, 5)
  expect(Object.fromEntries(elev_ma.dimensionBandsRaw(ani).map(b => [b.id, b.value]))).toEqual({ lait: 12, porc: 8 })
  expect(Object.fromEntries(res_mv.dimensionBandsRaw(veg).map(b => [b.id, b.value]))).toEqual({ ce: 100, ol: 50 })
  // Et pas de bande « animale » sur un flux vegetal (pas de repli pour la dimension des bandes).
  expect(res_mv.dimensionBandsRaw(ani)).toEqual([])
})
