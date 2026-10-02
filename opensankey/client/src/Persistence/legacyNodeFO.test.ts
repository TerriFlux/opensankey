import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

/**
 * Étiquette riche (FO) de nœud d'un fichier legacy 0.8 : `has_FO` + `FO_content` à la racine du nœud.
 *
 * La démo « Collecte-Transport-Traitement-Déchets » range l'icône de chaque nœud dans ce rich-text
 * (`<p><img src="data:…"></p>`). La table de renommage legacy ne reprenait ni l'une ni l'autre clé
 * depuis la refonte de la persistance : les nœuds se chargeaient sans icône.
 */
const FO = '<p><img width="85" src="data:image/png;base64,AAAA"></p><p>Papiers</p>'

function legacyStudyWithFO(): Type_JSON {
  const node = (id: string, has_FO: boolean) => ({
    idNode: id,
    name: id,
    display: true,
    tags: {},
    dimensions: {},
    inputLinksId: [],
    outputLinksId: [],
    x: 0,
    y: 0,
    has_FO,
    is_FO_raw: false,
    FO_content: FO
  })

  return {
    version: '0.8',
    nodes: {
      node0: node('node0', true),
      node1: node('node1', false)
    },
    links: {
      link0: {
        idLink: 'link0',
        idSource: 'node0',
        idTarget: 'node1',
        value: { value: 1, tags: {}, extension: {} }
      }
    },
    nodeTags: {},
    dataTags: {},
    fluxTags: {},
    levelTags: {}
  } as unknown as Type_JSON
}

it('reprend le FO legacy d un noeud dans son etiquette de nom', () => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(legacyStudyWithFO() as never, {}, false)

  const nodes = app.drawing_area.sankey.nodes_dict

  expect(nodes['node0'].name_label_has_fo).toBe(true)
  expect(nodes['node0'].name_label_fo_content).toContain('data:image/png;base64,AAAA')

  // FO présent mais éteint : le contenu est gardé (une vue peut l'allumer), l'affichage non.
  expect(nodes['node1'].name_label_has_fo).toBe(false)
  expect(nodes['node1'].name_label_fo_content).toContain('data:image/png;base64,AAAA')
})
