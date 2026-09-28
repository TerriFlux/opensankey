import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import {
  disaggregateDimensionNodes,
  isGeneratedMemberLink,
  isGeneratedMemberNode,
  memberNodeId,
  removeGeneratedMemberNodes,
} from './DimensionDisaggregation'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 lot 2B — un noeud d AXE se remplace par un noeud par membre visible, et les flux se
// repartissent. Les noeuds engendres sont TRANSITOIRES : c est pourquoi on verifie surtout les
// GARDES, celles qui ont coute cher aux noeuds d echange en aout.

/**
 *   monde            (racine)
 *     europe  -> france = 30, espagne = 12
 *     afrique -> maroc  = 7
 *
 * Un seul flux : France -> Monde, ou « Monde » est le noeud d AXE.
 */
function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const europe = pays.addTag('Europe', 'europe') as Class_DataTag
  const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
  const france_m = pays.addTag('France', 'france') as Class_DataTag
  const espagne = pays.addTag('Espagne', 'espagne') as Class_DataTag
  const maroc = pays.addTag('Maroc', 'maroc') as Class_DataTag
  europe.parent = monde
  afrique.parent = monde
  france_m.parent = europe
  espagne.parent = europe
  maroc.parent = afrique
  pays.levels = ['monde', 'regions', 'pays']

  const source = sankey.addNewNodeWithName('France')
  const axe = sankey.addNewNodeWithName('Monde')
  const flux = sankey.addNewLink(source, axe)
  axe.driving_dimension = pays

  const poser = (membre: Class_DataTag, nombre: number) => {
    pays.tags_list.forEach(t => t.setUnSelected())
    membre.setSelected()
    ;(flux.value as Class_LinkValue).valueData = nombre
  }
  poser(france_m, 30)
  poser(espagne, 12)
  poser(maroc, 7)
  pays.tags_list.forEach(t => t.setUnSelected())
  monde.setSelected()

  return { app, sankey, pays, monde, europe, afrique, france_m, espagne, maroc, source, axe, flux }
}

const nomsEngendres = (sankey: ReturnType<typeof monter>['sankey']) =>
  sankey.nodes_list.filter(isGeneratedMemberNode).map(n => n.name).sort()

/** Valeur portee par chaque flux ENGENDRE, indexee par le nom de sa cible. */
const parCible = (sankey: ReturnType<typeof monter>['sankey']) =>
  new Map(sankey.links_list
    .filter(isGeneratedMemberLink)
    .map(l => [l.target.name, l.value?.valueData ?? 0]))

describe('os#1511 lot 2B — un noeud d axe se remplace par ses membres', () => {
  test('au niveau des regions, deux noeuds engendres et l axe disparait', () => {
    const { sankey, pays } = monter()
    pays.selectLevel(1)
    const engendres = disaggregateDimensionNodes(sankey)
    expect(engendres).toBe(2)
    expect(nomsEngendres(sankey)).toEqual(['Afrique', 'Europe'])
    // Le noeud d axe quitte le DESSIN, pas le modele : il reste ce d ou l on repart au
    // prochain changement de niveau, et ce que le fichier ecrit.
    const axe_apres = sankey.nodes_list.find(n => n.name === 'Monde')
    expect(axe_apres).toBeDefined()
    expect(axe_apres!.is_own_visible).toBe(false)
  })

  test('les flux se repartissent, et les totaux se conservent', () => {
    const { sankey, pays } = monter()
    pays.selectLevel(1)
    disaggregateDimensionNodes(sankey)
    const par_cible = parCible(sankey)
    expect(par_cible.get('Europe')).toBe(42)
    expect(par_cible.get('Afrique')).toBe(7)
    // 30 + 12 + 7 : rien ne se perd en chemin.
    const total = [...par_cible.values()].reduce((t, v) => t + v, 0)
    expect(total).toBe(49)
  })

  test('descendre d un niveau donne les pays, et les totaux tiennent encore', () => {
    const { sankey, pays } = monter()
    pays.selectLevel(2)
    disaggregateDimensionNodes(sankey)
    expect(nomsEngendres(sankey)).toEqual(['Espagne', 'France', 'Maroc'])
    const par_cible = parCible(sankey)
    expect(par_cible.get('France')).toBe(30)
    expect(par_cible.get('Espagne')).toBe(12)
    expect(par_cible.get('Maroc')).toBe(7)
  })

  test('un membre SANS contribution ne recoit AUCUN flux, pas un flux a zero', () => {
    const { sankey, pays, espagne } = monter()
    // On retire la valeur de l Espagne : elle ne doit plus apparaitre du tout.
    pays.tags_list.forEach(t => t.setUnSelected())
    espagne.setSelected()
    const flux = sankey.links_list[0]
    ;(flux.value as Class_LinkValue).valueData = null
    pays.selectLevel(2)
    disaggregateDimensionNodes(sankey)
    const cibles = sankey.links_list.filter(isGeneratedMemberLink).map(l => l.target.name).sort()
    // Un flux fantome a zero se dessinerait : il ne doit pas exister.
    expect(cibles).toEqual(['France', 'Maroc'])
  })

  test('la position vient du MEMBRE, ce qui la fait survivre a la regeneration', () => {
    const { sankey, pays, europe } = monter()
    europe.position = { x: 500, y: 250 }
    pays.selectLevel(1)
    disaggregateDimensionNodes(sankey)
    const noeud_europe = sankey.nodes_list.find(n => n.name === 'Europe')
    expect(noeud_europe?.position_x).toBe(500)
    expect(noeud_europe?.position_y).toBe(250)
    // Et elle tient a travers un second tour, qui detruit puis refabrique les noeuds.
    disaggregateDimensionNodes(sankey)
    expect(sankey.nodes_list.find(n => n.name === 'Europe')?.position_x).toBe(500)
  })
})

describe('os#1511 lot 2B — les GARDES heritees des noeuds d echange', () => {
  test('la forme engendree se reconnait SUR LE GRAPHE, sans etat en memoire', () => {
    const { sankey, pays } = monter()
    pays.selectLevel(1)
    disaggregateDimensionNodes(sankey)
    const engendre = sankey.nodes_list.find(isGeneratedMemberNode)
    expect(engendre).toBeDefined()
    // La reconnaissance ne tient qu a l identifiant : elle vaut donc aussi bien juste apres un
    // chargement qu en pleine session. C est la lecon du drapeau `sibling` des noeuds
    // d echange, jamais serialise, donc toujours absent au chargement.
    expect(isGeneratedMemberNode(engendre!)).toBe(true)
    expect(engendre!.id).toBe(memberNodeId('Monde', 'europe'))
  })

  test('DEUX desagregations de suite ne doublent pas les noeuds', () => {
    const { sankey, pays } = monter()
    pays.selectLevel(1)
    disaggregateDimensionNodes(sankey)
    const apres_un = sankey.nodes_list.length
    disaggregateDimensionNodes(sankey)
    // C est exactement ce qui a produit 928 noeuds au lieu de 506 sur Bois Savoie.
    expect(sankey.nodes_list.length).toBe(apres_un)
    expect(nomsEngendres(sankey)).toEqual(['Afrique', 'Europe'])
  })

  test('changer de niveau ne LAISSE PAS les noeuds de l ancien', () => {
    const { sankey, pays } = monter()
    pays.selectLevel(1)
    disaggregateDimensionNodes(sankey)
    pays.selectLevel(2)
    disaggregateDimensionNodes(sankey)
    // Les regions doivent avoir disparu, pas s ajouter aux pays.
    expect(nomsEngendres(sankey)).toEqual(['Espagne', 'France', 'Maroc'])
  })

  test('un noeud d axe dont le niveau ne montre qu un membre n est PAS desagrege', () => {
    const { sankey, pays } = monter()
    pays.selectLevel(0)
    const engendres = disaggregateDimensionNodes(sankey)
    // Le remplacer par un unique noeud ne dirait rien de plus et lui ferait perdre son
    // identite.
    expect(engendres).toBe(0)
    expect(sankey.nodes_list.some(n => n.name === 'Monde')).toBe(true)
  })

  test('un diagramme SANS noeud d axe est laisse intact', () => {
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    sankey.addNewLink(sankey.addNewNodeWithName('A'), sankey.addNewNodeWithName('B'))
    const avant = sankey.nodes_list.length
    expect(disaggregateDimensionNodes(sankey)).toBe(0)
    expect(sankey.nodes_list.length).toBe(avant)
  })

  test('le retrait des engendres se fait seul, et rend leur nombre', () => {
    const { sankey, pays } = monter()
    pays.selectLevel(1)
    disaggregateDimensionNodes(sankey)
    expect(removeGeneratedMemberNodes(sankey)).toBe(2)
    expect(sankey.nodes_list.filter(isGeneratedMemberNode)).toHaveLength(0)
  })

  test('ENREGISTRER un diagramme desagrege n ecrit AUCUN engendre', () => {
    const { app, sankey, pays } = monter()
    pays.selectLevel(2)
    disaggregateDimensionNodes(sankey)
    expect(sankey.nodes_list.filter(isGeneratedMemberNode).length).toBe(3)

    const json = app.toJSON()
    const noeuds = Object.keys(json['nodes'] as Record<string, unknown>)
    const flux = Object.keys(json['links'] as Record<string, unknown>)
    // C est LA garde qui evite de rejouer Bois Savoie : ecrire les engendres les ferait
    // engendrer une seconde fois au chargement suivant.
    expect(noeuds.filter(id => id.includes('--par--'))).toEqual([])
    expect(flux.filter(id => id.includes('--par--'))).toEqual([])
    // Le fichier garde le noeud d AXE et le flux d origine, d ou tout se refabrique.
    expect(noeuds).toContain('Monde')
    expect(flux.length).toBe(1)
  })

  test('recharger un fichier enregistre desagrege ne double rien', () => {
    const { app, sankey, pays } = monter()
    pays.selectLevel(2)
    disaggregateDimensionNodes(sankey)
    const json = app.toJSON()

    const relu = new Class_ApplicationData(false)
    relu.fromJSON(json)
    const sankey_relu = relu.drawing_area.sankey
    // Au chargement, rien n est encore engendre : le fichier ne porte que l axe.
    expect(sankey_relu.nodes_list.filter(isGeneratedMemberNode)).toHaveLength(0)
    const groupe = sankey_relu.data_taggs_dict['pays'] as unknown as Class_DataTagGroup
    groupe.selectLevel(2)
    expect(disaggregateDimensionNodes(sankey_relu)).toBe(3)
    expect(sankey_relu.nodes_list.filter(isGeneratedMemberNode)).toHaveLength(3)
  })

  test('lire une contribution ne laisse pas le diagramme sur un autre membre', () => {
    const { sankey, pays, monde } = monter()
    pays.selectLevel(1)
    // La selection de l utilisateur, avant desagregation.
    pays.tags_list.forEach(t => t.setUnSelected())
    monde.setSelected()
    disaggregateDimensionNodes(sankey)
    expect(pays.selected_tags_list.map((t: Class_DataTag) => t.id)).toEqual(['monde'])
  })
})
