import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'
import { isLegendElementId } from '../Elements/legendIds'

/**
 * La LEGENDE passe devant les CADRES DE GROUPE (18/09).
 *
 * Un cadre de groupe est un fond ; la legende une surcouche de lecture. Rien ne les departageait :
 * l ordre Z suit l ordre de creation, et la legende — generee au dessin, donc poussee en fin de
 * `list_g_element`, c est-a-dire au FOND — passait sous le fond d un groupe cree avant elle. Vu en
 * production sur la filiere bois BACCFIRE, ou les entrees de legende s effacaient sous le groupe
 * « FIN DE VIE ».
 *
 * Le montage reproduit exactement cette chronologie : le cadre de groupe existe AVANT le premier
 * dessin, la legende naît apres. Retirer `_sendLegendAboveGroupFrames` de `draw()` fait tomber le
 * premier cas.
 */

installJsdomRenderStubs()

function makeDiagramWithGroupAndLegend() {
  resetHost()
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  sankey.addNewLink(a, b).valueCurrent = 100
  // De quoi peupler la legende : un groupe d etiquettes qui colore le diagramme.
  const couleur = sankey.addNodeTagGroup('couleur', 'Couleur', false)
  couleur.use_colors = true
  a.addTag(couleur.addTag('Rouge', 'rouge') as Class_Tag)
  // Le cadre de groupe, cree AVANT que la legende n existe.
  const frame = sankey.addNewContainer('groupe_fin_de_vie', 'FIN DE VIE')
  frame.tied_to_nodes = true
  frame.attachNodeToCont(b)
  app.drawing_area.legend.masked = false
  app.drawing_area.draw()
  return { app, frame }
}

const zIndexOf = (app: Class_ApplicationData, id: string) => app.drawing_area.list_g_element.indexOf(id)

describe('ordre Z de la legende face aux cadres de groupe', () => {
  it('toutes les zones de legende sont devant le cadre de groupe', () => {
    const { app, frame } = makeDiagramWithGroupAndLegend()
    const order = app.drawing_area.list_g_element
    const legend_ids = order.filter(id => isLegendElementId(id))
    expect(legend_ids.length).toBeGreaterThan(0)
    const frame_idx = zIndexOf(app, frame.id)
    expect(frame_idx).toBeGreaterThanOrEqual(0)
    // Convention de la liste : indice PLUS BAS = plus en AVANT.
    legend_ids.forEach(id => expect(zIndexOf(app, id)).toBeLessThan(frame_idx))
  })

  it('l ordre interne de la legende est preserve, cadre derriere ses entrees', () => {
    const { app } = makeDiagramWithGroupAndLegend()
    const order = app.drawing_area.list_g_element
    const legend_ids = order.filter(id => isLegendElementId(id))
    // Le bloc reste d un seul tenant : aucun element etranger intercale.
    const first = order.indexOf(legend_ids[0])
    const last = order.indexOf(legend_ids[legend_ids.length - 1])
    expect(last - first).toBe(legend_ids.length - 1)
    // Et le cadre racine reste au fond de son propre bloc (invariant OS#1259).
    const frame_id = app.drawing_area.legend.frame?.id
    expect(frame_id).toBeDefined()
    legend_ids.filter(id => id !== frame_id)
      .forEach(id => expect(zIndexOf(app, id)).toBeLessThan(zIndexOf(app, frame_id as string)))
  })

  it('un second dessin ne deplace plus rien', () => {
    const { app } = makeDiagramWithGroupAndLegend()
    const before = [...app.drawing_area.list_g_element]
    app.drawing_area.draw()
    expect(app.drawing_area.list_g_element).toEqual(before)
  })
})
