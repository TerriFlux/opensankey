import { Class_ApplicationData } from '../types/ApplicationData'
import { CURRENT_FORMAT_VERSION } from './persistenceMigrations'
import type { Type_JSON } from '../types/Utils'

/**
 * Un niveau d'agregation peut n'etre exprime QUE par les tags.
 *
 * `checkIfRelatedDimensionsAreSelected` commence par un raccourci : un nœud qui
 * n'est ni parent ni enfant d'une dimension est « hors du systeme de niveaux »
 * et donc toujours dessine. Mais la parente declaree n'est pas le seul moyen
 * d'entrer dans ce systeme : un fichier peut ne decrire un axe d'agregation que
 * par les TAGS, sans jamais ecrire de `parent_name`.
 *
 * C'est le cas des nœuds d'echange de Bois Savoie : la variante « Ensemble »
 * porte une dimension, les variantes « Separes » n'en portent aucune — juste le
 * tag. Le raccourci les faisait donc sortir du filtre, et elles etaient
 * dessinees a TOUS les niveaux, a cote de la variante « Ensemble ». Trois fois
 * le meme flux d'echange par produit.
 */

const LEVEL_GROUP = 'Echanges geo'

function file(): Type_JSON {
  return {
    version: '1.3.0',
    format_version: CURRENT_FORMAT_VERSION,
    nodes: {
      Produit: {
        idNode: 'Produit', name: 'Produit', tags: { 'type de noeud': ['produit'] }
      },
      // Les deux variantes ne declarent AUCUNE dimension : elles ne sont ni
      // parent ni enfant. Seul leur tag dit a quel niveau elles appartiennent.
      VarianteEnsemble: {
        idNode: 'VarianteEnsemble', name: 'VarianteEnsemble',
        tags: { 'type de noeud': ['produit'], [LEVEL_GROUP]: ['Ensemble'] }
      },
      VarianteSepares: {
        idNode: 'VarianteSepares', name: 'VarianteSepares',
        tags: { 'type de noeud': ['produit'], [LEVEL_GROUP]: ['Separes'] }
      }
    },
    links: {
      vers_ensemble: {
        idLink: 'vers_ensemble', idSource: 'Produit', idTarget: 'VarianteEnsemble',
        value: { value: 10 }
      },
      vers_separes: {
        idLink: 'vers_separes', idSource: 'Produit', idTarget: 'VarianteSepares',
        value: { value: 4 }
      }
    },
    nodeTags: {
      'type de noeud': {
        group_name: 'Type de noeud', banner: 'none', activated: true,
        tags: { produit: { name: 'produit', selected: true } }
      }
    },
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

function loadVisibleNodes(json: Type_JSON): string[] {
  const app = new Class_ApplicationData(false)
  app.fromJSON(JSON.parse(JSON.stringify(json)) as never, {}, false)
  return (app.drawing_area.sankey.nodes_list as unknown as
    { id: string, is_visible: boolean }[])
    .filter(n => n.is_visible).map(n => n.id).sort()
}

it('un niveau exprime par le seul TAG gouverne quand meme la visibilite', () => {
  // Sans la reserve posee au raccourci, `VarianteSepares` etait dessinee elle
  // aussi : elle n a ni parent ni enfant, donc elle sortait du filtre.
  expect(loadVisibleNodes(file())).toEqual(['Produit', 'VarianteEnsemble'])
})

it('changer le niveau selectionne echange les deux variantes', () => {
  const separes = JSON.parse(JSON.stringify(file())) as unknown as {
    levelTags: { [g: string]: { tags: { [t: string]: { selected: boolean } } } }
  }
  separes.levelTags[LEVEL_GROUP].tags.Ensemble.selected = false
  separes.levelTags[LEVEL_GROUP].tags.Separes.selected = true
  expect(loadVisibleNodes(separes as unknown as Type_JSON))
    .toEqual(['Produit', 'VarianteSepares'])
})

it('un groupe de niveaux DESACTIVE ne filtre rien', () => {
  // Le raccourci doit rester en place pour tout ce qui n est pas gouverne : un
  // groupe desactive laisse les deux variantes visibles, comme avant.
  const inactif = JSON.parse(JSON.stringify(file())) as unknown as {
    levelTags: { [g: string]: { activated: boolean } }
  }
  inactif.levelTags[LEVEL_GROUP].activated = false
  expect(loadVisibleNodes(inactif as unknown as Type_JSON))
    .toEqual(['Produit', 'VarianteEnsemble', 'VarianteSepares'])
})

it('un noeud sans aucun tag de niveau reste dessine', () => {
  const nu = JSON.parse(JSON.stringify(file())) as unknown as {
    nodes: { [id: string]: { tags: { [g: string]: string[] } } }
  }
  delete nu.nodes.VarianteSepares.tags[LEVEL_GROUP]
  expect(loadVisibleNodes(nu as unknown as Type_JSON))
    .toEqual(['Produit', 'VarianteEnsemble', 'VarianteSepares'])
})
