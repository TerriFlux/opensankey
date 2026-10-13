import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { isGeneratedMemberLink } from './DimensionDisaggregation'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 08/10 : sous un diagramme par filiere, Type de matiere peint les flux, mais
// Matiere premiere -> Transformation restait gris : il ne touche aucun noeud decoupe par type de
// matiere. Sa couleur se lit dans ses donnees.

function choisir(groupe: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  groupe.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(m => m.setSelected())
}

test('un flux qui ne touche aucun noeud du peintre prend la couleur du seul membre de ses donnees', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as unknown as Class_DataTagGroup
  const ce = filiere.addTag('Cereales', 'ce') as Class_DataTag
  const la = filiere.addTag('Lait', 'la') as Class_DataTag
  const matiere = sankey.addDataTagGroup('matiere', 'Matiere', false) as unknown as Class_DataTagGroup
  const mp = matiere.addTag('Matiere premiere', 'mp') as Class_DataTag
  const pt = matiere.addTag('Produits', 'pt') as Class_DataTag
  const cp = matiere.addTag('Coproduits', 'cp') as Class_DataTag
  mp.color = '#808000'
  pt.color = '#0000ff'
  cp.color = '#ff00ff'
  const n_mp = sankey.addNewNodeWithName('MP')
  const transfo = sankey.addNewNodeWithName('Transformation')
  const mt = sankey.addNewNodeWithName('MT')
  const amont = sankey.addNewLink(n_mp, transfo)
  const aval = sankey.addNewLink(transfo, mt)
  const poser = (flux: typeof amont, m: Class_DataTag, f: Class_DataTag, v: number) => {
    choisir(matiere, m)
    choisir(filiere, f)
    ;(flux.value as Class_LinkValue).valueData = v
  }
  poser(amont, mp, ce, 10); poser(amont, mp, la, 6)
  poser(aval, pt, ce, 6); poser(aval, cp, ce, 4); poser(aval, pt, la, 3); poser(aval, cp, la, 3)
  choisir(matiere, mp, pt, cp)
  choisir(filiere, ce, la)
  mt.driving_dimension = matiere
  filiere.member_bands = true
  app.drawing_area.rebuildDimensionNodes()
  const engendres = sankey.links_list.filter(isGeneratedMemberLink)
  const amonts = engendres.filter(l => l.id.startsWith(amont.id))
  expect(amonts.length).toBe(2)
  amonts.forEach(l => expect(l.getShapeColorToUse()).toBe('#808000'))
  const vers_pt = engendres.filter(l => l.id.startsWith(aval.id) && l.id.endsWith('pt'))
  vers_pt.forEach(l => expect(l.getShapeColorToUse()).toBe('#0000ff'))
})

test('une couleur posee sur le flux lui-meme l emporte sur celle du peintre', () => {
  // Julien, 13/10 : sur le flux d equilibrage, la couleur grise posee dans l inspecteur ne
  // prenait pas, la dimension qui peint les flux passait devant.
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const matiere = sankey.addDataTagGroup('matiere', 'Matiere', false) as unknown as Class_DataTagGroup
  const mp = matiere.addTag('Matiere premiere', 'mp') as Class_DataTag
  const pt = matiere.addTag('Produits', 'pt') as Class_DataTag
  mp.color = '#808000'
  pt.color = '#0000ff'
  const eq = sankey.addNewNodeWithName('Equilibrage')
  const transfo = sankey.addNewNodeWithName('Transformation')
  const mt = sankey.addNewNodeWithName('MT')
  const equilibrage = sankey.addNewLink(eq, transfo)
  const aval = sankey.addNewLink(transfo, mt)
  choisir(matiere, mp)
  ;(equilibrage.value as Class_LinkValue).valueData = 2
  ;(aval.value as Class_LinkValue).valueData = 5
  choisir(matiere, pt)
  ;(aval.value as Class_LinkValue).valueData = 3
  choisir(matiere, mp, pt)
  mt.driving_dimension = matiere
  // La dimension en noeuds choisie pour peindre les flux (les postes, sur le SOCLE transfo).
  matiere.paints_flows = true
  app.drawing_area.rebuildDimensionNodes()
  // Le flux d equilibrage (non decoupe) prend la couleur lue dans ses donnees...
  expect(equilibrage.getShapeColorToUse()).toBe('#808000')
  // ...et la couleur posee sur lui l emporte.
  equilibrage.shape_color = '#999999'
  expect(equilibrage.getShapeColorToUse()).toBe('#999999')
  // Sans couleur propre, chaque flux vers un membre prend la couleur de ce membre.
  const vers = () => sankey.links_list.filter(isGeneratedMemberLink).filter(l => l.id.startsWith(aval.id))
  expect(vers().map(l => l.getShapeColorToUse()).sort()).toEqual(['#0000ff', '#808000'])
  // Couleur posee sur le flux : elle l emporte, sur le flux d origine comme sur ses decoupes.
  aval.shape_color = '#999999'
  app.drawing_area.rebuildDimensionNodes()
  expect(vers().map(l => l.getShapeColorToUse())).toEqual(['#999999', '#999999'])
})
