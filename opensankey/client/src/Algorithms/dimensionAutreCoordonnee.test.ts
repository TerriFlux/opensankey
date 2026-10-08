import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { isGeneratedMemberLink } from './DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 08/10 : « changer d unite fout toute la mise en page en l air ». Un flux engendre
// porte un scalaire lu a la coordonnee du moment ; changer d unite ou d annee doit le refaire.

function choisir(groupe: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  groupe.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(m => m.setSelected())
}

test('changer d annee refait les flux engendres a la nouvelle coordonnee', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const fr = pays.addTag('France', 'fr') as Class_DataTag
  const es = pays.addTag('Espagne', 'es') as Class_DataTag
  const annee = sankey.addDataTagGroup('annee', 'Annee', false) as unknown as Class_DataTagGroup
  const a1 = annee.addTag('2015', '2015') as Class_DataTag
  const a2 = annee.addTag('2023', '2023') as Class_DataTag
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  const flux = sankey.addNewLink(a, b)
  ;[[fr, a1, 10], [es, a1, 20], [fr, a2, 30], [es, a2, 40]].forEach(([p, y, v]) => {
    choisir(pays, p as Class_DataTag)
    choisir(annee, y as Class_DataTag)
    ;(flux.value as Class_LinkValue).valueData = v as number
  })
  choisir(pays, fr, es)
  choisir(annee, a1)
  a.driving_dimension = pays
  app.drawing_area.rebuildDimensionNodes()
  const valeurs = () => sankey.links_list.filter(isGeneratedMemberLink).map(l => l.value?.valueData).sort()
  expect(valeurs()).toEqual([10, 20])
  annee.selectTagsFromId('2023')
  expect(valeurs()).toEqual([30, 40])
})
