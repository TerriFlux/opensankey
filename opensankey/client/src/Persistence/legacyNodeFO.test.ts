import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'
import { legacyFOImageSrc } from './persistenceLegacyKeyMaps'

/**
 * FO de nœud d'un fichier legacy 0.8 : `has_FO` + `FO_content` à la racine du nœud.
 *
 * L'ancien format dessinait ce rich-text DANS la boîte du nœud, l'étiquette de nom restant à part.
 * La démo « Collecte-Transport-Traitement-Déchets » y range l'icône de chaque nœud
 * (`<p><img src="data:…"></p>`) : elle doit devenir l'icône-image du nœud, sans toucher au nom.
 */
const FO_IMAGE = '<p><img width="85" src="data:image/png;base64,AAAA"></p>'

function legacyStudyWithFO(): Type_JSON {
  const node = (id: string, has_FO: boolean, FO_content: string) => ({
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
    FO_content
  })

  return {
    version: '0.8',
    nodes: {
      allume: node('allume', true, FO_IMAGE),
      eteint: node('eteint', false, FO_IMAGE),
      texte: node('texte', true, '<p><strong>Titre</strong></p>')
    },
    links: {
      link0: {
        idLink: 'link0',
        idSource: 'allume',
        idTarget: 'eteint',
        value: { value: 1, tags: {}, extension: {} }
      }
    },
    nodeTags: {},
    dataTags: {},
    fluxTags: {},
    levelTags: {}
  } as unknown as Type_JSON
}

it('un FO legacy reduit a une image devient l icone image du noeud, le nom reste', () => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(legacyStudyWithFO() as never, {}, false)

  const nodes = app.drawing_area.sankey.nodes_dict

  expect(nodes['allume'].icon_is_image).toBe(true)
  expect(nodes['allume'].icon_image_src).toBe('data:image/png;base64,AAAA')
  expect(nodes['allume'].icon_inside_horiz).toBe(true)
  expect(nodes['allume'].icon_inside_vert).toBe(true)
  expect(nodes['allume'].name_label_has_fo).toBe(false)

  // FO éteint : rien à dessiner.
  expect(nodes['eteint'].icon_is_image).toBe(false)

  // FO texte : pas d'équivalent, l'étiquette de nom n'est pas écrasée.
  expect(nodes['texte'].icon_is_image).toBe(false)
  expect(nodes['texte'].name_label_has_fo).toBe(false)
})

it('legacyFOImageSrc ne retient qu une image seule', () => {
  expect(legacyFOImageSrc(FO_IMAGE)).toBe('data:image/png;base64,AAAA')
  expect(legacyFOImageSrc('<p><img src=\'x.png\'></p><p><br></p>')).toBe('x.png')
  expect(legacyFOImageSrc('<p><img src="a"></p><p>Papiers</p>')).toBeUndefined()
  expect(legacyFOImageSrc('<p><img src="a"><img src="b"></p>')).toBeUndefined()
  expect(legacyFOImageSrc('')).toBeUndefined()
  expect(legacyFOImageSrc(undefined)).toBeUndefined()
})
