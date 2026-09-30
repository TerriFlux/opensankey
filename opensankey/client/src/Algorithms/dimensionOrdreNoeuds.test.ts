import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { disaggregateDimensionNodes, isGeneratedMemberNode } from './DimensionDisaggregation'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — L'ORDRE DES NOEUDS ENGENDRES (Julien, 30/09) : par valeur decroissante par defaut,
// comme les bandes, mais ENTRE FRERES : le sous-arbre d un membre reste groupe a sa place.

function choisir(pays: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  pays.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(membre => membre.setSelected())
}

/**
 *   monde
 *     europe  -> france = 30, espagne = 12   (42)
 *     afrique -> maroc  = 50                 (50)
 * Ordre du groupe : europe, afrique, france, espagne, maroc.
 */
function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const europe = pays.addTag('Europe', 'europe') as Class_DataTag
  const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
  const france = pays.addTag('France', 'france') as Class_DataTag
  const espagne = pays.addTag('Espagne', 'espagne') as Class_DataTag
  const maroc = pays.addTag('Maroc', 'maroc') as Class_DataTag
  europe.parent = monde
  afrique.parent = monde
  france.parent = europe
  espagne.parent = europe
  maroc.parent = afrique
  pays.levels = ['monde', 'regions', 'pays']

  const source = sankey.addNewNodeWithName('Source')
  const axe = sankey.addNewNodeWithName('Monde')
  const flux = sankey.addNewLink(source, axe)
  axe.driving_dimension = pays
  const poser = (membre: Class_DataTag, nombre: number) => {
    choisir(pays, membre)
    ;(flux.value as Class_LinkValue).valueData = nombre
  }
  poser(france, 30)
  poser(espagne, 12)
  poser(maroc, 50)
  return { app, sankey, pays, europe, afrique, france, espagne, maroc }
}

/** Noms des noeuds engendres, de haut en bas. */
const pile = (sankey: ReturnType<typeof monter>['sankey']) =>
  sankey.nodes_list.filter(isGeneratedMemberNode)
    .sort((a, b) => a.position_y - b.position_y)
    .map(n => n.name)

describe('os#1511 — ordre des noeuds engendres', () => {
  test('par defaut, du plus grand au plus petit entre freres, le sous-arbre groupe', () => {
    const { sankey, pays, france, espagne, maroc } = monter()
    expect(pays.nodes_by_value).toBe(true)
    choisir(pays, espagne, france, maroc)
    disaggregateDimensionNodes(sankey)
    // Afrique (50) avant Europe (42) ; dans l Europe, France (30) avant Espagne (12).
    expect(pile(sankey)).toEqual(['Maroc', 'France', 'Espagne'])
  })

  test('option coupee : l ordre de l arbre, freres dans l ordre du groupe', () => {
    const { sankey, pays, france, espagne, maroc } = monter()
    pays.nodes_by_value = false
    choisir(pays, maroc, espagne, france)
    disaggregateDimensionNodes(sankey)
    expect(pile(sankey)).toEqual(['France', 'Espagne', 'Maroc'])
  })

  test('le reglage fait l aller retour du fichier, muet tant qu il est au defaut', () => {
    const { pays } = monter()
    expect((pays.toJSON() as { nodes_by_value?: boolean }).nodes_by_value).toBeUndefined()
    pays.nodes_by_value = false
    expect((pays.toJSON() as { nodes_by_value?: boolean }).nodes_by_value).toBe(false)
  })
})
