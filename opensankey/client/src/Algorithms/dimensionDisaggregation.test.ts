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

// os#1511 lot 2B — un noeud d AXE se remplace par les membres CHOISIS, et les flux se
// repartissent sur eux.
//
// Le panneau nomme ainsi toujours ce que le dessin montre. Une version precedente montrait les
// ENFANTS du membre choisi : le panneau disait « Monde » et le dessin « Europe, Afrique », ce
// que Julien a lu comme un bug (28/09). Un NIVEAU entier se choisit dans la meme liste que les
// membres — « Regions continentales » coche toutes les regions.
//
// Les noeuds engendres sont TRANSITOIRES : c est pourquoi on verifie surtout les GARDES, celles
// qui ont coute cher aux noeuds d echange en aout.

/** Coche ces membres, et eux seuls. */
function choisir(pays: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  pays.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(membre => membre.setSelected())
}

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
    choisir(pays, membre)
    ;(flux.value as Class_LinkValue).valueData = nombre
  }
  poser(france_m, 30)
  poser(espagne, 12)
  poser(maroc, 7)
  choisir(pays, monde)

  return { app, sankey, pays, monde, europe, afrique, france_m, espagne, maroc, source, axe, flux }
}

const nomsEngendres = (sankey: ReturnType<typeof monter>['sankey']) =>
  sankey.nodes_list.filter(isGeneratedMemberNode).map(n => n.name).sort()

/** Valeur portee par chaque flux ENGENDRE, indexee par le nom de sa cible. */
const parCible = (sankey: ReturnType<typeof monter>['sankey']) =>
  new Map(sankey.links_list
    .filter(isGeneratedMemberLink)
    .map(l => [l.target.name, l.value?.valueData ?? 0]))

describe('os#1511 lot 2B — un noeud d axe se remplace par les membres choisis', () => {
  test('choisir un NIVEAU montre tous ses membres, et l axe quitte le dessin', () => {
    const { sankey, pays } = monter()
    pays.selectAllAtLevel(1)
    expect(disaggregateDimensionNodes(sankey)).toBe(2)
    expect(nomsEngendres(sankey)).toEqual(['Afrique', 'Europe'])
    // Le noeud d axe quitte le DESSIN, pas le modele : il reste ce d ou l on repart au
    // prochain changement de membre, et ce que le fichier ecrit.
    const axe_apres = sankey.nodes_list.find(n => n.name === 'Monde')
    expect(axe_apres).toBeDefined()
    expect(axe_apres!.is_own_visible).toBe(false)
  })

  test('les flux se repartissent, et les totaux se conservent', () => {
    const { sankey, pays } = monter()
    pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(sankey)
    const par_cible = parCible(sankey)
    expect(par_cible.get('Europe')).toBe(42)
    expect(par_cible.get('Afrique')).toBe(7)
    // 30 + 12 + 7 : rien ne se perd en chemin.
    expect([...par_cible.values()].reduce((t, v) => t + v, 0)).toBe(49)
  })

  test('DESCENDRE : le niveau des pays montre les trois pays', () => {
    const { sankey, pays } = monter()
    pays.selectAllAtLevel(2)
    expect(disaggregateDimensionNodes(sankey)).toBe(3)
    expect(nomsEngendres(sankey)).toEqual(['Espagne', 'France', 'Maroc'])
    const par_cible = parCible(sankey)
    expect(par_cible.get('France')).toBe(30)
    expect(par_cible.get('Espagne')).toBe(12)
  })

  test('UN membre choisi montre CE membre, et lui seul', () => {
    const { sankey, pays, europe } = monter()
    choisir(pays, europe)
    // Le panneau dit « Europe », le dessin montre l Europe : c est tout le point.
    expect(disaggregateDimensionNodes(sankey)).toBe(1)
    expect(nomsEngendres(sankey)).toEqual(['Europe'])
    expect(parCible(sankey).get('Europe')).toBe(42)
  })

  test('DEUX membres choisis montrent les deux', () => {
    const { sankey, pays, europe, maroc } = monter()
    choisir(pays, europe, maroc)
    expect(disaggregateDimensionNodes(sankey)).toBe(2)
    expect(nomsEngendres(sankey)).toEqual(['Europe', 'Maroc'])
    expect(parCible(sankey).get('Maroc')).toBe(7)
  })

  test('un membre SANS contribution ne recoit AUCUN flux, pas un flux a zero', () => {
    const { sankey, pays, espagne } = monter()
    // On retire la valeur de l Espagne : elle ne doit plus apparaitre du tout.
    choisir(pays, espagne)
    const flux = sankey.links_list[0]
    ;(flux.value as Class_LinkValue).valueData = null
    pays.selectAllAtLevel(2)
    disaggregateDimensionNodes(sankey)
    const cibles = sankey.links_list.filter(isGeneratedMemberLink).map(l => l.target.name).sort()
    // Un flux fantome a zero se dessinerait : il ne doit pas exister.
    expect(cibles).toEqual(['France', 'Maroc'])
  })

  test('la position vient du MEMBRE, ce qui la fait survivre a la regeneration', () => {
    const { sankey, pays, europe } = monter()
    europe.position = { x: 500, y: 250 }
    pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(sankey)
    const noeud_europe = sankey.nodes_list.find(n => n.name === 'Europe')
    expect(noeud_europe?.position_x).toBe(500)
    expect(noeud_europe?.position_y).toBe(250)
    // Et elle tient a travers un second tour, qui detruit puis refabrique les noeuds.
    disaggregateDimensionNodes(sankey)
    expect(sankey.nodes_list.find(n => n.name === 'Europe')?.position_x).toBe(500)
  })
})

describe('os#1511 — un noeud engendre deplace reste ou on l a pose', () => {
  test('en mode remplir le slot, la position manuelle survit au rebati', () => {
    const { app, sankey, pays, europe, axe } = monter()
    app.drawing_area.disaggregation_gap_mode = 'fill'
    pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(sankey)
    const auto = sankey.nodes_dict[memberNodeId(axe.id, 'europe')]
    const auto_xy = [auto.position_x, auto.position_y]
    const afrique_auto = sankey.nodes_dict[memberNodeId(axe.id, 'afrique')].position_y
    // Ce que le glisser ecrit (NodeEventsHandler) : la position du noeud, pour SON axe.
    europe.setPositionOn(axe.id, { x: 321, y: 123 })
    disaggregateDimensionNodes(sankey)
    const apres = sankey.nodes_dict[memberNodeId(axe.id, 'europe')]
    expect([apres.position_x, apres.position_y]).toEqual([321, 123])
    // Les autres suivent la mise en page.
    expect(sankey.nodes_dict[memberNodeId(axe.id, 'afrique')].position_y).toBe(afrique_auto)
    // Retour au placement automatique.
    europe.clearManualPositions()
    disaggregateDimensionNodes(sankey)
    const remis = sankey.nodes_dict[memberNodeId(axe.id, 'europe')]
    expect([remis.position_x, remis.position_y]).toEqual(auto_xy)
  })

  test('deux axes de la meme dimension gardent chacun leur position', () => {
    const { app, sankey, pays, monde, europe, france_m, espagne, maroc, source, axe } = monter()
    app.drawing_area.disaggregation_gap_mode = 'fill'
    const axe_bis = sankey.addNewNodeWithName('Monde bis')
    const flux_bis = sankey.addNewLink(source, axe_bis)
    const poser = (membre: Class_DataTag, nombre: number) => {
      choisir(pays, membre)
      ;(flux_bis.value as Class_LinkValue).valueData = nombre
    }
    poser(france_m, 30)
    poser(espagne, 12)
    poser(maroc, 7)
    choisir(pays, monde)
    axe_bis.driving_dimension = pays
    pays.selectAllAtLevel(1)
    europe.setPositionOn(axe.id, { x: 100, y: 50 })
    europe.setPositionOn(axe_bis.id, { x: 400, y: 300 })
    disaggregateDimensionNodes(sankey)
    const sur_axe = sankey.nodes_dict[memberNodeId(axe.id, 'europe')]
    const sur_bis = sankey.nodes_dict[memberNodeId(axe_bis.id, 'europe')]
    expect([sur_axe.position_x, sur_axe.position_y]).toEqual([100, 50])
    expect([sur_bis.position_x, sur_bis.position_y]).toEqual([400, 300])
    // L ancienne position unique vaut pour tout axe qui n a pas la sienne.
    europe.setPositionOn(axe_bis.id, undefined)
    europe.position = { x: 7, y: 8 }
    disaggregateDimensionNodes(sankey)
    const repli = sankey.nodes_dict[memberNodeId(axe_bis.id, 'europe')]
    expect([repli.position_x, repli.position_y]).toEqual([7, 8])
    expect(sankey.nodes_dict[memberNodeId(axe.id, 'europe')].position_x).toBe(100)
  })
})

describe('os#1511 lot 2B — les GARDES heritees des noeuds d echange', () => {
  test('la forme engendree se reconnait SUR LE GRAPHE, sans etat en memoire', () => {
    const { sankey, pays } = monter()
    pays.selectAllAtLevel(1)
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
    pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(sankey)
    const apres_un = sankey.nodes_list.length
    disaggregateDimensionNodes(sankey)
    // C est exactement ce qui a produit 928 noeuds au lieu de 506 sur Bois Savoie.
    expect(sankey.nodes_list.length).toBe(apres_un)
    expect(nomsEngendres(sankey)).toEqual(['Afrique', 'Europe'])
  })

  test('changer de membre ne LAISSE PAS les noeuds du precedent', () => {
    const { sankey, pays } = monter()
    pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(sankey)
    pays.selectAllAtLevel(2)
    disaggregateDimensionNodes(sankey)
    // Les regions doivent avoir disparu, pas s ajouter aux pays.
    expect(nomsEngendres(sankey)).toEqual(['Espagne', 'France', 'Maroc'])
  })

  test('AUCUN membre choisi ne desagrege rien', () => {
    const { sankey, pays } = monter()
    choisir(pays)
    // Il n y aurait rien a montrer : vider le diagramme serait pire que laisser l axe.
    expect(disaggregateDimensionNodes(sankey)).toBe(0)
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
    pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(sankey)
    expect(removeGeneratedMemberNodes(sankey)).toBe(2)
    expect(sankey.nodes_list.filter(isGeneratedMemberNode)).toHaveLength(0)
  })

  test('ENREGISTRER un diagramme desagrege n ecrit AUCUN engendre', () => {
    const { app, sankey, pays } = monter()
    pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(sankey)
    expect(sankey.nodes_list.filter(isGeneratedMemberNode).length).toBe(2)

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

  test('recharger un fichier enregistre desagrege rend le MEME dessin, sans rien doubler', () => {
    const { app, sankey, pays } = monter()
    pays.selectAllAtLevel(2)
    disaggregateDimensionNodes(sankey)
    const json = app.toJSON()

    const relu = new Class_ApplicationData(false)
    relu.fromJSON(json)
    const sankey_relu = relu.drawing_area.sankey
    // Le fichier ne porte que l axe ; c est `afterFromJSON` qui refabrique les engendres, sur
    // le membre enregistre. Deux, pas quatre : la garde du portillon tient au chargement aussi.
    expect(nomsEngendres(sankey_relu)).toEqual(['Espagne', 'France', 'Maroc'])
    expect(disaggregateDimensionNodes(sankey_relu)).toBe(3)
    expect(sankey_relu.nodes_list.filter(isGeneratedMemberNode)).toHaveLength(3)
  })

  test('lire une contribution ne laisse pas le diagramme sur un autre membre', () => {
    const { sankey, pays } = monter()
    pays.selectAllAtLevel(1)
    disaggregateDimensionNodes(sankey)
    // Lire une valeur vise les membres un a un : la selection de l utilisateur doit se
    // retrouver intacte, sinon le dessin part sur le dernier membre vise.
    expect(pays.selected_tags_list.map((t: Class_DataTag) => t.id).sort())
      .toEqual(['afrique', 'europe'])
  })
})
