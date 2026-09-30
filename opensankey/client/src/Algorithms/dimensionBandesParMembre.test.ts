import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { bandesParMembre, disaggregateDimensionNodes, isGeneratedMemberNode } from './DimensionDisaggregation'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — UN DIAGRAMME PAR MEMBRE. Julien, 30/09, sur le SOCLE pays partenaires : quand plusieurs
// noeuds portent la dimension, « les diagrammes se mettent les uns sous les autres,
// parallelement ». Chaque membre recoit une BANDE : tous ses noeuds engendres a la meme hauteur,
// d une colonne a l autre ; les bandes s empilent sans se chevaucher.

function choisir(groupe: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  groupe.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(m => m.setSelected())
}

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const espagne = pays.addTag('Espagne', 'espagne') as Class_DataTag
  const maroc = pays.addTag('Maroc', 'maroc') as Class_DataTag
  espagne.parent = monde
  maroc.parent = monde
  pays.levels = ['monde', 'pays']

  const imports = sankey.addNewNodeWithName('Monde - Import')
  const produits = sankey.addNewNodeWithName('Produits agricoles')
  const exports = sankey.addNewNodeWithName('Monde - Export')
  imports.setPosXY(0, 100)
  produits.setPosXY(300, 100)
  exports.setPosXY(600, 100)
  const entree = sankey.addNewLink(imports, produits)
  const sortie = sankey.addNewLink(produits, exports)
  ;[imports, produits, exports].forEach(n => { n.driving_dimension = pays })

  const poser = (flux: typeof entree, membre: Class_DataTag, nombre: number) => {
    choisir(pays, membre)
    ;(flux.value as Class_LinkValue).valueData = nombre
  }
  poser(entree, espagne, 40)
  poser(entree, maroc, 10)
  poser(sortie, espagne, 30)
  poser(sortie, maroc, 20)
  choisir(pays, espagne, maroc)
  return { app, sankey, pays }
}

const yDe = (sankey: ReturnType<typeof monter>['sankey'], suffixe: string) =>
  sankey.nodes_list.filter(isGeneratedMemberNode).filter(n => n.id.endsWith(suffixe))
    .map(n => ({ y: n.position_y, h: n.getShapeHeightToUse() }))

describe('os#1511 — un diagramme par membre', () => {
  test('automatique des que deux noeuds portent la dimension, et reglable', () => {
    const { pays } = monter()
    expect(bandesParMembre(pays, 1)).toBe(false)
    expect(bandesParMembre(pays, 3)).toBe(true)
    pays.member_bands = false
    expect(bandesParMembre(pays, 3)).toBe(false)
  })

  test('chaque bande garde la forme du diagramme et commence sous le noeud le plus bas de la precedente', () => {
    const { sankey, app } = monter()
    // Les axes ne sont pas alignes : « Produits agricoles » est 50 plus bas que les deux autres.
    sankey.nodes_list.find(n => n.name === 'Produits agricoles')?.setPosXY(300, 150)
    app.drawing_area.disaggregation_gap_value = 25
    disaggregateDimensionNodes(sankey)
    const par = (suffixe: string) => new Map(sankey.nodes_list.filter(isGeneratedMemberNode)
      .filter(n => n.id.endsWith(suffixe))
      .map(n => [n.id.split('--')[0], { y: n.position_y, h: n.getShapeHeightToUse() }]))
    const espagne = par('espagne')
    const maroc = par('maroc')
    expect(espagne.size).toBe(3)
    // Passe 1 : la forme est gardee dans chaque bande (meme decalage pour tous les noeuds)
    const idDe = (nom: string) => sankey.nodes_list.find(n => n.name === nom)?.id ?? ''
    const ecartForme = (m: typeof espagne) =>
      (m.get(idDe('Produits agricoles'))?.y ?? 0) - (m.get(idDe('Monde - Import'))?.y ?? 0)
    expect(ecartForme(espagne)).toBeCloseTo(50, 6)
    expect(ecartForme(maroc)).toBeCloseTo(50, 6)
    // Passe 2 : le noeud le plus haut du Maroc commence sous le bas le plus bas de l Espagne + 25
    const bas_espagne = Math.max(...[...espagne.values()].map(e => e.y + e.h))
    const haut_maroc = Math.min(...[...maroc.values()].map(m => m.y))
    expect(haut_maroc).toBeCloseTo(bas_espagne + 25, 6)
  })

  test('decoche, chaque noeud retrouve son empilement propre', () => {
    const { sankey, app, pays } = monter()
    app.drawing_area.disaggregation_gap_mode = 'constant'
    pays.member_bands = false
    disaggregateDimensionNodes(sankey)
    // Sans bandes, chaque colonne empile ses membres depuis le haut de SON axe (100 ici pour tous)
    expect(yDe(sankey, 'espagne').every(e => e.y === 100)).toBe(true)
  })

  test('le reglage fait l aller retour du fichier, et reste muet tant qu il n est pas pose', () => {
    const { pays } = monter()
    expect((pays.toJSON() as { member_bands?: boolean }).member_bands).toBeUndefined()
    pays.member_bands = false
    const json = pays.toJSON()
    expect((json as { member_bands?: boolean }).member_bands).toBe(false)
  })
})
