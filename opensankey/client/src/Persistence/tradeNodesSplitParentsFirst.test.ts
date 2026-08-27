import { Class_ApplicationData } from '../types/ApplicationData'
import { CURRENT_FORMAT_VERSION } from './persistenceMigrations'
import type { Type_JSON } from '../types/Utils'

/**
 * L'eclatement des noeuds d'echange doit se faire ANCETRES D'ABORD.
 *
 * `SplitIOrE` recable la hierarchie d'un enfant en allant chercher le produit
 * DEJA ECLATE de son parent (`<extremite>-<parent><suffixe>`). Si le parent n'a
 * pas encore ete eclate, la recherche ne trouve rien, la dimension n'est pas
 * creee, et l'enfant n'a plus aucune dimension gouvernante — il devient donc
 * visible a TOUS les niveaux (`checkIfRelatedDimensionsAreSelected` rend `true`
 * quand le noeud ne porte aucun groupe de niveaux).
 *
 * `splitTrade` parcourant `nodes_list`, c'est-a-dire l'ordre du FICHIER, le
 * rendu dependait de l'ordre de declaration. Bois Savoie declare son agregat
 * `HorsPaysDeSavoie` APRES ses enfants `AutresRegionsFrancaises` et
 * `International` : les trois etaient dessines en meme temps, soit trois fois
 * le meme flux d'echange par produit.
 */

const LEVEL_GROUP = 'Echanges geo'
const AGGREGATE = 'HorsPaysDeSavoie'
const CHILDREN = ['AutresRegionsFrancaises', 'International']
const PRODUCTS = ['PapierARecycler', 'PapiersCartons']

function tradeNode(id: string): Type_JSON {
  const is_aggregate = (id === AGGREGATE)
  const out: { [k: string]: unknown } = {
    idNode: id,
    name: id,
    tags: {
      'type de noeud': ['echange'],
      [LEVEL_GROUP]: [is_aggregate ? 'Ensemble' : 'Separes']
    }
  }
  if (!is_aggregate) {
    out.dimensions = { [LEVEL_GROUP]: { parent_name: AGGREGATE } }
  }
  return out as unknown as Type_JSON
}

/** Le meme diagramme, avec les noeuds d'echange declares dans l'ordre donne. */
function file(trade_order: string[]): Type_JSON {
  const nodes: { [id: string]: Type_JSON } = {}
  for (const produit of PRODUCTS) {
    nodes[produit] = {
      idNode: produit, name: produit, tags: { 'type de noeud': ['produit'] }
    } as unknown as Type_JSON
  }
  for (const id of trade_order) {
    nodes[id] = tradeNode(id)
  }
  const links: { [id: string]: Type_JSON } = {}
  let n = 0
  for (const produit of PRODUCTS) {
    for (const trade of trade_order) {
      n++
      links['l' + n] = {
        idLink: 'l' + n, idSource: produit, idTarget: trade, value: { value: 10 + n }
      } as unknown as Type_JSON
    }
  }
  return {
    version: '1.3.0',
    format_version: CURRENT_FORMAT_VERSION,
    nodes,
    links,
    nodeTags: {
      'type de noeud': {
        group_name: 'Type de noeud', banner: 'none', activated: true,
        tags: {
          produit: { name: 'produit', selected: true },
          echange: { name: 'echange', selected: true }
        }
      }
    },
    // Niveau « Ensemble » : seul l agregat doit etre dessine.
    levelTags: {
      [LEVEL_GROUP]: {
        group_name: LEVEL_GROUP, banner: 'one', activated: true, siblings: [],
        tags: {
          Ensemble: { name: 'Ensemble', selected: true },
          Separes: { name: 'Separes', selected: false }
        }
      }
    }
  } as unknown as Type_JSON
}

/** Les flux dessines, decrits par leurs extremites. */
function visibleLinks(trade_order: string[]): string[] {
  const app = new Class_ApplicationData(false)
  app.fromJSON(JSON.parse(JSON.stringify(file(trade_order))) as never, {}, false)
  const links = app.drawing_area.sankey.links_list as unknown as
    { is_visible: boolean, source: { id: string }, target: { id: string } }[]
  return links.filter(l => l.is_visible)
    .map(l => l.source.id + '->' + l.target.id).sort()
}

// Au niveau « Ensemble », un seul flux d echange par produit : celui qui va a
// l agregat. Ses deux enfants sont couverts par lui.
const EXPECTED = [
  'PapierARecycler->PapierARecycler-HorsPaysDeSavoieExportations',
  'PapiersCartons->PapiersCartons-HorsPaysDeSavoieExportations'
]

it('l agregat declare AVANT ses enfants : seuls ses flux sont dessines', () => {
  expect(visibleLinks([AGGREGATE, ...CHILDREN])).toEqual(EXPECTED)
})

it('l agregat declare APRES ses enfants donne le MEME rendu', () => {
  // Sans le tri par ancetres, ce cas dessinait les 6 flux : l agregat ET ses
  // deux enfants, pour chacun des deux produits.
  expect(visibleLinks([...CHILDREN, AGGREGATE])).toEqual(EXPECTED)
})

it('l agregat intercale entre ses enfants donne le MEME rendu', () => {
  expect(visibleLinks([CHILDREN[0], AGGREGATE, CHILDREN[1]])).toEqual(EXPECTED)
})
