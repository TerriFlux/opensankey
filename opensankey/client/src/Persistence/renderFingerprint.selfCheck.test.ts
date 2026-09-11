import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeTag } from '../types/Tag'
import type { Class_NodeTagGroup } from '../types/TagGroup'
import { installJsdomRenderStubs, renderFingerprint, resetHost } from './renderFingerprint'

// ==================================================================================================
// #530 — CONTRE-ÉPREUVE de l'instrument de mesure.
//
// Le critère de recette du ticket est en deux temps : le harnais doit être VERT sur `main` sans
// modification de code de rendu (c'est `corpusRenderFingerprint.test.ts`), **et** il doit ÉCHOUER
// quand on change volontairement une valeur d'opacité — « sans quoi il ne mesure rien ».
//
// Le second temps ne peut pas être une manipulation ponctuelle faite une fois à la main : ce qui
// n'est pas rejoué se perd. Cette suite le tient en permanence — elle démontre, sur un diagramme
// minimal dessiné pour de vrai, que l'empreinte BOUGE pour chacune des quatre grandeurs qu'elle
// prétend surveiller, et pour elles seules :
//   - l'opacité d'un flux ;
//   - la couleur d'un nœud ;
//   - la visibilité d'un élément ;
//   - le texte d'une zone de légende.
//
// Un seul de ces quatre cas qui cesserait de rougir signalerait que le golden du corpus est devenu
// aveugle sur cet axe — c'est-à-dire qu'il est redevenu ce qu'il remplace.
// ==================================================================================================

installJsdomRenderStubs()

/**
 * Diagramme minimal DESSINÉ : deux nœuds, un flux, un groupe d'étiquettes de nœuds colorées et
 * la légende démasquée (elle est masquée par défaut, cf. `default_masked`).
 */
function buildDrawn() {
  const host = resetHost()
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const source = sankey.addNewNode('src', 'Source')
  const target = sankey.addNewNode('tgt', 'Cible')
  source.setPosXY(0, 0)
  target.setPosXY(300, 0)
  const link = sankey.addNewLink(source, target) as Class_LinkElement

  const tagg = sankey.addNodeTagGroup('groupe', 'Groupe de nœuds', false) as Class_NodeTagGroup
  const tag = tagg.addTag('Etiquette A') as Class_NodeTag
  tag.color = '#543005'
  tag.addReference(source)
  tagg.use_colors = true
  app.drawing_area.legend.masked = false

  app.drawing_area.draw()
  return { app, host, sankey, source, target, link, tag }
}

const print = (built: ReturnType<typeof buildDrawn>) =>
  JSON.stringify(renderFingerprint(built.app, built.host))

describe('#530 — l\'empreinte de rendu sait rougir', () => {

  it('réagit à un changement d\'OPACITÉ (le critère de recette du ticket)', () => {
    const built = buildDrawn()
    const before = print(built)

    built.link.shape_opacity = 0.3
    built.app.drawing_area.draw()

    expect(print(built)).not.toEqual(before)
  })

  it('réagit à un changement de COULEUR', () => {
    const built = buildDrawn()
    const before = print(built)

    // Sur le nœud SANS étiquette : `source` porte une étiquette d'un groupe à palette active,
    // dont la couleur l'emporte sur `shape_color` — y écrire ne changerait rien à l'écran.
    built.target.shape_color = '#ff0000'
    built.app.drawing_area.draw()

    expect(print(built)).not.toEqual(before)
  })

  it('réagit à un changement de VISIBILITÉ', () => {
    const built = buildDrawn()
    const before = print(built)

    built.target.setInvisible()
    built.app.drawing_area.draw()

    const after = print(built)
    expect(after).not.toEqual(before)
    // Et le nœud reste PRÉSENT dans l'empreinte, marqué non dessiné : une régression de visibilité
    // doit se lire comme un changement, pas comme un golden qui rétrécit.
    expect(JSON.parse(after).nodes.tgt).toEqual({ drawn: false })
  })

  it('réagit à un changement de TEXTE DE LÉGENDE', () => {
    const built = buildDrawn()
    const before = JSON.parse(print(built))
    expect(Object.keys(before.legend).length).toBeGreaterThan(0)

    built.tag.name = 'Etiquette renommée'
    built.app.drawing_area.draw()

    const after = JSON.parse(print(built))
    expect(after.legend).not.toEqual(before.legend)
  })

  it('ne réagit PAS à un redessin sans changement (sinon le golden serait ingouvernable)', () => {
    const built = buildDrawn()
    const before = print(built)

    built.app.drawing_area.draw()

    expect(print(built)).toEqual(before)
  })
})
