import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

/**
 * Fichier 0.91 dont le groupe de niveaux porte la banniere « level » (valeur d'avant 0.9,
 * hors catalogue moderne) — le cas du modele power_grid_with_disagregation.
 *
 * Cette banniere traversait fromJSON sans validation : le tiroir de filtres, qui ne rend
 * que les bannieres du type (`'one'`/`'multi'`...), affichait alors une carte VIDE pour le
 * groupe (ni selecteur de niveau, ni action) — la hierarchie devenait invisible et
 * impilotable, seule la section « Ecart vertical des enfants » restait.
 */
function legacyWithLevelBanner(): Type_JSON {
  const node = (id: string, dimensions: object) => ({
    idNode: id,
    name: id,
    display: true,
    tags: {},
    dimensions,
    inputLinksId: [],
    outputLinksId: [],
    x: 0,
    y: 0
  })

  return {
    version: '0.91',
    nodes: {
      Parent: node('Parent', { Primaire: {} }),
      Enfant: node('Enfant', {
        Primaire: { parent_name: 'Parent', parent_tag: '1', children_tags: ['2'], antitag: false }
      })
    },
    links: {
      link0: {
        idLink: 'link0',
        idSource: 'Parent',
        idTarget: 'Enfant',
        value: { value: 1, tags: {}, extension: {} }
      }
    },
    nodeTags: {},
    dataTags: {},
    fluxTags: {},
    levelTags: {
      Primaire: {
        name: 'Primaire',
        banner: 'level',
        activated: true,
        siblings: [],
        tags: {
          1: { name: '1', selected: true, color: '' },
          2: { name: '2', selected: false, color: '' }
        }
      }
    }
  } as unknown as Type_JSON
}

it('normalise la banniere « level » d un groupe de niveaux legacy', () => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(legacyWithLevelBanner() as never, {}, false)
  const level_taggs = app.drawing_area.sankey.level_taggs_dict

  // Le groupe survit avec ses deux niveaux...
  expect(Object.keys(level_taggs)).toEqual(['Primaire'])
  const primaire = level_taggs['Primaire']
  expect(primaire.tags_list.map(t => t.id)).toEqual(['1', '2'])

  // ...et sa banniere est ramenee dans le catalogue moderne (le defaut 'one'),
  // condition pour que le tiroir de filtres rende son selecteur de niveau.
  expect(primaire.banner).toBe('one')
})
