import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

/**
 * Image de nœud d'un fichier legacy : le src peut être en quotes SIMPLES ou DOUBLES.
 *
 * L'ancien format rangeait l'image dans un fragment SVG « <image src=… /> » recopié à
 * l'identique dans `FO_content`. La conversion extrayait le src en découpant sur la quote
 * simple, si bien qu'un nœud écrit `src="…"` — il y en a dans la démo Déchets — perdait son
 * image ET son FO d'origine : il se chargeait nu, sans rien afficher.
 */
function legacyStudyWithImages(): Type_JSON {
  const SIMPLE = '<image src=\'data:image/png;base64,AAAA\' /> '
  const DOUBLE = '<image src="data:image/png;base64,BBBB" />'

  const node = (id: string, image: string) => ({
    idNode: id,
    name: id,
    display: true,
    tags: {},
    dimensions: {},
    inputLinksId: [],
    outputLinksId: [],
    x: 0,
    y: 0,
    // Le marqueur du cas « image » est justement FO_content == image.
    image,
    has_FO: true,
    is_FO_raw: false,
    FO_content: image
  })

  return {
    version: '0.8',
    nodes: {
      node0: node('node0', SIMPLE),
      node1: node('node1', DOUBLE)
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

it('extrait le src d\'une image de nœud quelles que soient les quotes', () => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(legacyStudyWithImages() as never, {}, false)

  const nodes = app.drawing_area.sankey.nodes_dict

  expect(nodes['node0'].icon_is_image).toBe(true)
  expect(nodes['node0'].icon_image_src).toBe('data:image/png;base64,AAAA')

  // Le cas historiquement perdu.
  expect(nodes['node1'].icon_is_image).toBe(true)
  expect(nodes['node1'].icon_image_src).toBe('data:image/png;base64,BBBB')
})
