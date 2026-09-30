import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import type { Type_JSON } from '../types/Utils'
import { disaggregateDimensionNodes, isGeneratedMemberNode } from './DimensionDisaggregation'

// jest 27 / jsdom n'expose pas structuredClone (utilise par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — L'ORDRE DES MEMBRES DESSINES (Julien, 30/09) : par valeur au premier niveau par
// defaut ; plus bas, l ordre de l arbre sous le parent. Deux autres ordres au choix. Le meme
// reglage vaut pour les bandes et les noeuds (cf. DimensionMemberOrder).

function choisir(pays: Class_DataTagGroup, ...membres: Class_DataTag[]) {
  pays.tags_list.forEach(t => t.setUnSelected())
  membres.forEach(membre => membre.setSelected())
}

/**
 *   monde
 *     europe  -> france = 12, espagne = 30   (42)
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
  poser(france, 12)
  poser(espagne, 30)
  poser(maroc, 50)
  choisir(pays, maroc, espagne, france)
  return { app, sankey, pays }
}

/** Noms des noeuds engendres, de haut en bas. */
const pile = (sankey: ReturnType<typeof monter>['sankey']) =>
  sankey.nodes_list.filter(isGeneratedMemberNode)
    .sort((a, b) => a.position_y - b.position_y)
    .map(n => n.name)

describe('os#1511 — ordre des membres dessines', () => {
  test('par defaut, par valeur au premier niveau, l ordre de l arbre plus bas', () => {
    const { sankey, pays } = monter()
    expect(pays.members_order).toBe('value_first_level')
    disaggregateDimensionNodes(sankey)
    // Afrique (50) avant Europe (42) ; dans l Europe, l ordre du groupe (France puis Espagne).
    expect(pile(sankey)).toEqual(['Maroc', 'France', 'Espagne'])
  })

  test('par valeur a tous les niveaux, entre freres', () => {
    const { sankey, pays } = monter()
    pays.members_order = 'value_all_levels'
    disaggregateDimensionNodes(sankey)
    expect(pile(sankey)).toEqual(['Maroc', 'Espagne', 'France'])
  })

  test('ordre de l arbre', () => {
    const { sankey, pays } = monter()
    pays.members_order = 'tree'
    disaggregateDimensionNodes(sankey)
    expect(pile(sankey)).toEqual(['France', 'Espagne', 'Maroc'])
  })

  test('chaque axe se range d apres SES flux (imports et exports different)', () => {
    // Julien, 30/09 : « ca a marche pour les exports mais pas les imports ».
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey
    const pays = sankey.addDataTagGroup('pays', 'Pays', false) as unknown as Class_DataTagGroup
    const monde = pays.addTag('Monde', 'monde') as Class_DataTag
    const europe = pays.addTag('Europe', 'europe') as Class_DataTag
    const afrique = pays.addTag('Afrique', 'afrique') as Class_DataTag
    europe.parent = monde
    afrique.parent = monde
    pays.levels = ['monde', 'regions']
    pays.member_bands = false
    const imports = sankey.addNewNodeWithName('Import')
    const produits = sankey.addNewNodeWithName('Produits')
    const exports = sankey.addNewNodeWithName('Export')
    const entree = sankey.addNewLink(imports, produits)
    const sortie = sankey.addNewLink(produits, exports)
    imports.driving_dimension = pays
    exports.driving_dimension = pays
    const poser = (flux: typeof entree, membre: Class_DataTag, nombre: number) => {
      choisir(pays, membre)
      ;(flux.value as Class_LinkValue).valueData = nombre
    }
    poser(entree, europe, 5)
    poser(entree, afrique, 40)
    poser(sortie, europe, 30)
    poser(sortie, afrique, 10)
    choisir(pays, europe, afrique)
    disaggregateDimensionNodes(sankey)
    const colonne = (axe: string) => sankey.nodes_list.filter(isGeneratedMemberNode)
      .filter(n => n.id.startsWith(sankey.nodes_list.find(a => a.name === axe)?.id + '--'))
      .sort((a, b) => a.position_y - b.position_y)
      .map(n => n.id.split('--').pop())
    expect(colonne('Import')).toEqual(['afrique', 'europe'])
    expect(colonne('Export')).toEqual(['europe', 'afrique'])
  })

  test('le reglage fait l aller retour du fichier, muet au defaut, et relit l ancien format', () => {
    const { pays } = monter()
    type J = { members_order?: string, bands_by_value?: boolean }
    expect((pays.toJSON() as J).members_order).toBeUndefined()
    pays.members_order = 'tree'
    expect((pays.toJSON() as J).members_order).toBe('tree')
    // Ancien format : une case decochee voulait dire l ordre de l arbre.
    const ancien: Type_JSON = { ...pays.toJSON(), bands_by_value: false }
    delete ancien['members_order']
    pays.fromJSON(ancien)
    expect(pays.members_order).toBe('tree')
    // Remis au defaut, rien ne ressort du fichier, ni l ancienne cle.
    pays.members_order = 'value_first_level'
    const relu = pays.toJSON() as J
    expect(relu.members_order).toBeUndefined()
    expect(relu.bands_by_value).toBeUndefined()
  })
})
