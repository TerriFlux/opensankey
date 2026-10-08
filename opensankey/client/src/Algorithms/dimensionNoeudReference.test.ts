import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import { disaggregateDimensionNodes, isGeneratedMemberLink, isGeneratedMemberNode } from './DimensionDisaggregation'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — LE NOEUD DE REFERENCE. Julien, 01/10, sur « [SOCLE] Pays partenaires - dimensions » :
// « est-ce que c est possible de la faire a partir d un noeud de reference et de tout placer autour
// de lui ? » Dans ce fichier, seuls Monde - Import et Monde - Export portent les pays ; Produits
// agricoles est un seul noeud entre eux. Il ne bouge pas, et chaque pays se pose en face de sa part
// de sa pile : tous les flux droits, et aucun chevauchement.

function choisir(groupe: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  groupe.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(m => m.setSelected())
}

function monter(produits_porte: boolean, petit_pays = false) {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const membres = ['espagne', 'maroc', 'italie'].map(id => {
    const tag = pays.addTag(id, id) as Class_DataTag
    tag.parent = monde
    return tag
  })
  pays.levels = ['monde', 'pays']

  const imports = sankey.addNewNodeWithName('Monde - Import')
  const produits = sankey.addNewNodeWithName('Produits agricoles')
  const exports = sankey.addNewNodeWithName('Monde - Export')
  imports.setPosXY(0, 100)
  produits.setPosXY(300, 100)
  exports.setPosXY(600, 100)
  const entree = sankey.addNewLink(imports, produits)
  const sortie = sankey.addNewLink(produits, exports)
  imports.driving_dimension = pays
  exports.driving_dimension = pays
  if (produits_porte) {
    produits.driving_dimension = pays
    // Les bandes se demandent (plus de passage d office, 08/10).
    pays.member_bands = true
  }

  // Un noeud ne descend pas sous 40 px : un « petit pays » (moins de 20 ici, a 2 px par unite) a un
  // noeud plus haut que sa part de pile. Sans lui, toutes les parts depassent ce plancher.
  const valeurs: [Class_LinkElement, number[]][] = petit_pays
    ? [[entree, [40, 10, 25]], [sortie, [30, 20, 5]]]
    : [[entree, [40, 25, 30]], [sortie, [30, 20, 25]]]
  valeurs.forEach(([flux, nombres]) => nombres.forEach((n, i) => {
    choisir(pays, membres[i])
    ;(flux.value as Class_LinkValue).valueData = n
  }))
  choisir(pays, ...membres)
  return { app, sankey, pays, produits }
}

/** Accroche cible moins accroche source : 0 = flux droit. */
const pente = (l: Class_LinkElement) =>
  ((l.target as Class_NodeElement).position_y + ((l.target as Class_NodeElement).linkAttachOffsetY(l) ?? NaN)) -
  ((l.source as Class_NodeElement).position_y + ((l.source as Class_NodeElement).linkAttachOffsetY(l) ?? NaN))

const colonne = (sankey: ReturnType<typeof monter>['sankey'], prefixe: string) =>
  sankey.nodes_list.filter(isGeneratedMemberNode).filter(n => n.name.startsWith(prefixe))
    .map(n => ({ haut: n.position_y, bas: n.position_y + n.getShapeHeightToUse() }))
    .sort((a, b) => a.haut - b.haut)

describe('os#1511 — tout placer autour d un noeud de reference', () => {
  test('sans choix, pas de reference : la mise en page habituelle et son ecart sont intacts', () => {
    // Regression du 01/10 : une reference automatique collait les membres et sautait l ecart constant.
    const temoin = monter(false)
    disaggregateDimensionNodes(temoin.sankey)
    const { sankey, pays } = monter(false)
    pays.reference_node_id = undefined
    disaggregateDimensionNodes(sankey)
    const ys = (s: typeof sankey) => s.nodes_list.filter(isGeneratedMemberNode).map(n => [n.name, n.position_y])
    expect(ys(sankey)).toEqual(ys(temoin.sankey))
    const c = colonne(sankey, 'Monde - Import')
    for (let i = 1; i < c.length; i++) expect(c[i].haut).toBeGreaterThan(c[i - 1].bas)
  })

  test('non porteur choisi : il reste en place, tous les flux sont droits', () => {
    const { sankey, pays, produits } = monter(false)
    const y_produits = produits.position_y
    pays.reference_node_id = produits.id
    disaggregateDimensionNodes(sankey)
    expect(produits.position_y).toBe(y_produits)
    const engendres = sankey.links_list.filter(isGeneratedMemberLink)
    expect(engendres).toHaveLength(6)
    engendres.forEach(l => expect(pente(l)).toBeCloseTo(0, 6))
  })

  test('meme avec un petit pays, les pays d un meme cote ne se chevauchent pas', () => {
    const { sankey, pays, produits } = monter(false, true)
    pays.reference_node_id = produits.id
    disaggregateDimensionNodes(sankey)
    ;['Monde - Import', 'Monde - Export'].forEach(prefixe => {
      const c = colonne(sankey, prefixe)
      expect(c).toHaveLength(3)
      for (let i = 1; i < c.length; i++) expect(c[i].haut).toBeGreaterThanOrEqual(c[i - 1].bas - 1e-6)
    })
  })

  test('choisi parmi les porteurs : les bandes se centrent sur lui', () => {
    const { sankey, pays, produits } = monter(true)
    const centre = produits.position_y + produits.getShapeHeightToUse() / 2
    pays.reference_node_id = produits.id
    disaggregateDimensionNodes(sankey)
    const tous = sankey.nodes_list.filter(isGeneratedMemberNode)
    const haut = Math.min(...tous.map(n => n.position_y))
    const bas = Math.max(...tous.map(n => n.position_y + n.getShapeHeightToUse()))
    expect((haut + bas) / 2).toBeCloseTo(centre, 6)
  })

  test('le reglage fait l aller retour du fichier, et reste muet tant qu il n est pas pose', () => {
    const { pays, produits } = monter(false)
    expect((pays.toJSON() as { reference_node?: string }).reference_node).toBeUndefined()
    pays.reference_node_id = produits.id
    expect((pays.toJSON() as { reference_node?: string }).reference_node).toBe(produits.id)
  })
})
