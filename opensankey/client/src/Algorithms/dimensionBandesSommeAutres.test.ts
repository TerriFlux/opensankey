import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 14/10, SOCLE transfo : Type de matiere en bandes, le flux Ressources -> Matiere
// premiere tombait de 64 492 kt a 560 (les seules importations) : les postes avaient plusieurs
// membres choisis et la bande n en lisait qu un.

function choisir(groupe: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  groupe.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(m => m.setSelected())
}

test('une bande somme les membres choisis d une autre dimension', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const matiere = sankey.addDataTagGroup('matiere', 'Matiere', false) as unknown as Class_DataTagGroup
  const mp = matiere.addTag('Matiere premiere', 'mp') as Class_DataTag
  const mt = matiere.addTag('Matiere transformee', 'mt') as Class_DataTag
  const poste = sankey.addDataTagGroup('poste', 'Poste', false) as unknown as Class_DataTagGroup
  const prod = poste.addTag('Production', 'prod') as Class_DataTag
  const imp = poste.addTag('Importations', 'imp') as Class_DataTag
  const res = sankey.addNewNodeWithName('Ressources')
  const n_mp = sankey.addNewNodeWithName('MP')
  const flux = sankey.addNewLink(res, n_mp)
  const poser = (m: Class_DataTag, p: Class_DataTag, v: number) => {
    choisir(matiere, m); choisir(poste, p)
    ;(flux.value as Class_LinkValue).valueData = v
  }
  poser(mp, prod, 63551); poser(mp, imp, 560); poser(mt, imp, 10)
  choisir(poste, imp, prod)
  choisir(matiere, mp, mt)
  matiere.banner = 'multi'
  expect(matiere.draws_bands).toBe(true)
  const bandes = Object.fromEntries(flux.dimensionBandsRaw(matiere).map(b => [b.id, b.value]))
  expect(bandes.mp).toBeCloseTo(64111, 0)
  expect(bandes.mt).toBeCloseTo(10, 0)
})
