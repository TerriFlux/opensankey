import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID } from './MenuConfig'
import type { Class_Tag } from './Tag'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'
import { buildTagGroupViewDocument } from '../Representations/TagGroupViewRepresentation'

/**
 * sa#563 — SEULE LA ZONE DU DOCUMENT PRINCIPAL DÉSIGNE LE CANEVAS PRINCIPAL.
 *
 * LE DÉFAUT. `DrawingAreaInteractions.setEventsListeners` pose un `mousedown.mainzone` sur TOUTE
 * zone de dessin, qui appelle `activateMainZoneCanvas()`. Or les zones secondaires — la feuille
 * voisine, l'étoile unitaire, la vue d'un groupe d'étiquettes — partagent la configuration de
 * menus de l'HÔTE, celle qui porte la liste des fenêtres : cliquer dans l'une d'elles rendait le
 * canevas principal actif, donc déplaçait le liséré vert et la cible de la colonne d'outils.
 *
 * L'ORDRE L'AVAIT RENDU INÉVITABLE. Le commentaire d'origine comptait sur le `onMouseDown` de
 * React pour repasser derrière et reposer le bon identifiant ; os#1431 a déplacé ce geste en
 * phase de CAPTURE, donc il passe AVANT et c'est celui-ci qui a le dernier mot. Constaté au test
 * local de sa#563 : cliquer dans la vue d'un groupe rendait le liséré au diagramme.
 *
 * Ce fichier fige la règle sur de VRAIES zones dessinées (jsdom), par un vrai `mousedown`.
 */

installJsdomRenderStubs()

const mainDocument = (): Class_ApplicationData => {
  resetHost()
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  sankey.addNewLink(a, b).valueCurrent = 100
  app.drawing_area.draw()
  return app
}

/** Le `mousedown` que pose `setEventsListeners`, sur la zone de zoom d'un document. */
const pressOnCanvas = (app: Class_ApplicationData): void => {
  const node = app.drawing_area.d3_selection_zoom_area?.node()
  expect(node).toBeTruthy()
  // `view` n est pas une politesse : d3-drag lit `event.view.document` en s armant, et un
  // MouseEvent construit sans lui le fait lever avant meme d atteindre nos ecouteurs.
  node!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, view: window }))
}

describe('sa#563 une zone secondaire ne parle pas pour le canevas principal', () => {

  it('la zone du document PRINCIPAL, elle, le désigne toujours', () => {
    // Le cas de non-régression d'os#1397 : c'est ce geste-là qui permet de revenir au diagramme
    // après avoir touché une figure, et il ne doit rien perdre.
    const app = mainDocument()
    const mc = app.menu_configuration
    const autre = mc.openMainZoneWindow({ kind: 'node', id: 'A' }, 'osp.repr.unit', 'right')
    expect(mc.main_zone_active_id).toBe(autre)

    pressOnCanvas(app)
    expect(mc.main_zone_active_id).toBe(MAIN_ZONE_CANVAS_ID)
  })

  it('la zone d\'une COPIE (la vue d\'un groupe) ne vole pas la fenêtre active', () => {
    const app = mainDocument()
    const mc = app.menu_configuration
    // Un groupe d'étiquettes, pour que la vue ait quelque chose à montrer.
    const sankey = app.drawing_area.sankey
    const groupe = sankey.addNodeTagGroup('origine', 'Origine', false)
    const local = groupe.addTag('Local', 'local') as Class_Tag
    sankey.nodes_list[0].addTag(local)
    groupe.use_colors = true

    const flottant = mc.openMainZoneWindow(
      { kind: 'diagram' }, 'os.repr.tag_group_view', 'floating')
    expect(mc.main_zone_active_id).toBe(flottant)

    const vue = buildTagGroupViewDocument(app, 'origine')
    expect(vue).not.toBeNull()
    try {
      // La copie nait HORS ECRAN : c est son hote qui lui prete un conteneur (`showIn`). On lui
      // en prete un ici, comme le fait la grande zone, sans quoi elle n aurait pas de SVG a
      // cliquer — et ce test ne mesurerait rien.
      const case_de_la_vue = document.createElement('div')
      case_de_la_vue.id = 'case_de_la_vue'
      document.body.appendChild(case_de_la_vue)
      vue!.showIn('#case_de_la_vue', null)
      vue!.drawing_area.draw()
      // Le geste de l'auteur : il clique DANS la vue. Sa fenêtre doit rester l'active.
      pressOnCanvas(vue!)
      expect(mc.main_zone_active_id).toBe(flottant)
      // Et la configuration de menus de la copie est bien celle de l'hôte : c'est ce qui rendait
      // le vol possible, et ce qui rend ce test utile plutôt que tautologique.
      expect(vue!.menu_configuration.main_zone_active_id).toBe(flottant)
    } finally {
      vue!.dispose()
    }
  })
})
