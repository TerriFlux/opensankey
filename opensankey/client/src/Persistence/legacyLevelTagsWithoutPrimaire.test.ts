import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

/**
 * Fichier 0.8 a plusieurs niveaux mais SANS tag 'Primaire' — le cas de l'etude
 * « Filiere Bois Grand Est ».
 *
 * Le tag d'agregation historique s'appelait 'Primaire' ; les etudes multi-niveaux, elles, ont
 * nomme leurs niveaux librement ('Especes', 'Produits'...) et n'ont jamais porte de 'Primaire' —
 * ni dans les nodeTags, ni sur les noeuds. La conversion des dimensions lisait pourtant
 * `n.tags['Primaire'].includes('1')` sans garde : tout le chargement plantait
 * (`can't access property "includes"`).
 */
function legacyStudyWithoutPrimaire(): Type_JSON {
  const node = (id: string, tags: { [k: string]: string[] }) => ({
    idNode: id,
    name: id,
    display: true,
    tags,
    // Les dimensions existent mais sont vides : c'est l'etat legacy qui declenche la branche.
    dimensions: { Especes: {} },
    inputLinksId: [],
    outputLinksId: [],
    x: 0,
    y: 0
  })

  return {
    version: '0.8',
    nodes: {
      // Tagge sur le niveau 2 (indice >= 1 dans les tags du niveau) : la branche fautive.
      node0: node('node0', { Especes: ['2'] }),
      node1: node('node1', { Especes: ['1'] })
    },
    links: {
      link0: {
        idLink: 'link0',
        idSource: 'node0',
        idTarget: 'node1',
        value: { value: 1, tags: {}, extension: {} }
      }
    },
    nodeTags: {
      Especes: {
        group_name: 'Especes',
        banner: 'level',
        activated: true,
        show_legend: false,
        siblings: [],
        tags: {
          1: { name: '1', selected: true, color: '#000000' },
          2: { name: '2', selected: false, color: '#ffffff' }
        }
      }
    },
    dataTags: {},
    fluxTags: {},
    levelTags: {}
  } as unknown as Type_JSON
}

it('charge un fichier legacy multi-niveaux sans tag Primaire', () => {
  const app = new Class_ApplicationData(false)
  expect(() => app.fromJSON(legacyStudyWithoutPrimaire() as never, {}, false)).not.toThrow()
  expect(Object.keys(app.drawing_area.sankey.nodes_dict)).toEqual(['node0', 'node1'])
})
