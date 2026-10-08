import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { isGeneratedMemberLink } from './DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 08/10 : Matiere transformee -> Emplois, tous deux decoupes par type de matiere,
// avec les filieres en bandes sur les flux : chaque bande valait le double (26 381 pour 13 191).

function choisir(groupe: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  groupe.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(m => m.setSelected())
}

test('une chaine sur une meme dimension ne double pas les bandes d une autre', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const matiere = sankey.addDataTagGroup('matiere', 'Matiere', false) as unknown as Class_DataTagGroup
  const pt = matiere.addTag('Produits', 'pt') as Class_DataTag
  const cp = matiere.addTag('Coproduits', 'cp') as Class_DataTag
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as unknown as Class_DataTagGroup
  const ce = filiere.addTag('Cereales', 'ce') as Class_DataTag
  const la = filiere.addTag('Lait', 'la') as Class_DataTag
  const mt = sankey.addNewNodeWithName('MT')
  const emplois = sankey.addNewNodeWithName('Emplois')
  const flux = sankey.addNewLink(mt, emplois)
  ;[[pt, ce, 13], [pt, la, 7], [cp, ce, 5], [cp, la, 2]].forEach(([m, f, v]) => {
    choisir(matiere, m as Class_DataTag)
    choisir(filiere, f as Class_DataTag)
    ;(flux.value as Class_LinkValue).valueData = v as number
  })
  choisir(matiere, pt, cp)
  choisir(filiere, ce, la)
  mt.driving_dimension = matiere
  emplois.driving_dimension = matiere
  matiere.member_bands = false
  app.drawing_area.rebuildDimensionNodes()
  const produits = sankey.links_list.filter(isGeneratedMemberLink).find(l => l.id.endsWith('--par--pt'))
  expect(produits?.value?.valueData).toBe(20)
  const bandes = produits?.dimensionBandsRaw(filiere) ?? []
  expect(bandes.map(b => b.value).sort((a, b) => a - b)).toEqual([7, 13])
})
