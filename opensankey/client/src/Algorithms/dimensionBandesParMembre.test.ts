import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import {
  bandesParMembre, disaggregateDimensionNodes, isGeneratedMemberLink, isGeneratedMemberNode, MEMBER_NODE_MARK
} from './DimensionDisaggregation'

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

  /** Accroche cible moins accroche source : 0 = flux droit. */
  const pente = (l: Class_LinkElement) =>
    ((l.target as Class_NodeElement).position_y + ((l.target as Class_NodeElement).linkAttachOffsetY(l) ?? NaN)) -
    ((l.source as Class_NodeElement).position_y + ((l.source as Class_NodeElement).linkAttachOffsetY(l) ?? NaN))

  test('un flux droit reste droit dans chaque bande, meme quand les noeuds n ont plus la meme hauteur', () => {
    // Cas du SOCLE : trois noeuds alignes, flux droits (50 entrent, 50 sortent). Par pays, les
    // valeurs different (Maroc : 10 entrent, 20 sortent), donc les noeuds engendres n ont pas la
    // meme hauteur : caler leur HAUT courbait les flux.
    const { sankey, app } = monter()
    app.drawing_area.disaggregation_gap_value = 25
    const origine = sankey.links_list.filter(l => !isGeneratedMemberLink(l)).map(pente)
    expect(origine.every(p => Math.abs(p) < 1e-6)).toBe(true)
    disaggregateDimensionNodes(sankey)
    const engendres = sankey.links_list.filter(isGeneratedMemberLink)
    expect(engendres).toHaveLength(4)
    engendres.forEach(l => expect(pente(l)).toBeCloseTo(0, 6))
  })

  test('la bande est le diagramme a l echelle : ecarts a la mediane au prorata de la hauteur', () => {
    // Julien, 08/10 : « une ligne mediane horizontale et des ecarts relatifs a la hauteur la plus
    // grande, comme en mode proportionnel ». « Produits agricoles » 50 plus bas que les deux autres.
    const { sankey, app } = monter()
    const produits = sankey.nodes_list.find(n => n.name === 'Produits agricoles')
    produits?.setPosXY(300, 150)
    produits?.captureCenterFromCorner()
    app.drawing_area.disaggregation_gap_value = 25
    const axes = sankey.nodes_list.filter(n => !isGeneratedMemberNode(n))
    const centre = (n: Class_NodeElement) => n.position_y + n.getShapeHeightToUse() / 2
    const ecart_maitre = centre(produits as Class_NodeElement) - centre(axes.find(n => n.name === 'Monde - Import') as Class_NodeElement)
    disaggregateDimensionNodes(sankey)
    // La plus grande bande garde la mise en page telle quelle ; les autres a leur echelle.
    const haute = (m: string) => Math.max(...sankey.nodes_list.filter(isGeneratedMemberNode)
      .filter(n => n.id.endsWith(m)).map(n => n.getShapeHeightToUse()))
    const hauteur_max = Math.max(haute('espagne'), haute('maroc'))
    ;['espagne', 'maroc'].forEach(m => {
      const bande = sankey.nodes_list.filter(isGeneratedMemberNode).filter(n => n.id.endsWith(m))
      const k = haute(m) / hauteur_max
      const de = (nom: string) => centre(bande.find(n => n.id.startsWith(axes.find(a => a.name === nom)?.id + MEMBER_NODE_MARK)) as Class_NodeElement)
      expect(de('Produits agricoles') - de('Monde - Import')).toBeCloseTo(ecart_maitre * k, 6)
    })
    const bande = (suffixe: string) => sankey.nodes_list.filter(isGeneratedMemberNode)
      .filter(n => n.id.endsWith(suffixe)).map(n => ({ y: n.position_y, h: n.getShapeHeightToUse() }))
    const bas_espagne = Math.max(...bande('espagne').map(e => e.y + e.h))
    const haut_maroc = Math.min(...bande('maroc').map(m => m.y))
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
