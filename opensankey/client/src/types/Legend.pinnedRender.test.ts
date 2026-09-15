import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'

/**
 * SA#550 — groupe épinglé en bas de la légende, sur de vraies classes dessinées (jsdom) : les zones
 * générées, leur ordre vertical, l'enveloppement de la définition et l'aller-retour du drapeau.
 */

installJsdomRenderStubs()

const LONG_DEFINITION = 'Organisme producteur, publication et millésime de la donnée collectée. '.repeat(10)

function makeLegend(horizontal = false) {
  resetHost()
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  sankey.addNewLink(a, b).valueCurrent = 100
  // Le groupe qui colore le diagramme
  const couleur = sankey.addNodeTagGroup('couleur', 'Couleur', false)
  couleur.use_colors = true
  a.addTag(couleur.addTag('Rouge', 'rouge') as Class_Tag)
  // Deux groupes épinglés fermés, dont un sans définition
  const source = sankey.addNodeTagGroup('source', 'Source', false)
  source.description = LONG_DEFINITION
  source.pinned_in_legend = true
  const methode = sankey.addNodeTagGroup('methode', 'Methode', false)
  methode.pinned_in_legend = true
  app.drawing_area.legend.masked = false
  app.drawing_area.legend.legend_horizontal = horizontal
  app.drawing_area.draw()
  return { app, source, methode }
}

const zoneOf = (app: Class_ApplicationData, id: string) => app.drawing_area.sankey.containers_dict[id]

describe('SA#550 — légende réelle d\'un groupe épinglé', () => {
  it.each([false, true])('nom et définition en bas, sous le groupe qui colore (horizontale : %s)', horizontal => {
    const { app } = makeLegend(horizontal)
    const ids = ['legend-group-couleur', 'legend-tag-couleur-rouge', 'legend-group-source', 'legend-definition-source', 'legend-group-methode']
    ids.forEach(id => expect(zoneOf(app, id)).toBeDefined())
    expect(zoneOf(app, 'legend-definition-methode')).toBeUndefined()
    const ys = ids.map(id => zoneOf(app, id).position_y)
    expect([...ys].sort((p, q) => p - q)).toEqual(ys)

    const definition = zoneOf(app, 'legend-definition-source')
    const legend = app.drawing_area.legend
    expect(definition.name_label_text).toBe(LONG_DEFINITION)
    expect(definition.name_label_bold).toBe(false)
    // Enveloppée à la largeur de la légende, y compris en disposition horizontale
    expect(definition.name_label_box_width).toBe(Math.max(legend.width, 4 * legend.legend_police))
    // La rangée suivante commence sous la forme qui porte les lignes de la définition
    const next = zoneOf(app, 'legend-group-methode')
    expect(next.position_y - definition.position_y).toBeGreaterThanOrEqual(definition.shape_min_height)
    expect(definition.shape_min_height).toBeGreaterThan(legend.legend_police)
  })

  it('désépingler retire le bloc ; réépingler le rend', () => {
    const { app, source, methode } = makeLegend()
    source.pinned_in_legend = false
    methode.pinned_in_legend = false
    app.drawing_area.legend.draw()
    ;['legend-group-source', 'legend-definition-source', 'legend-group-methode', 'legend-block-source']
      .forEach(id => expect(zoneOf(app, id)).toBeUndefined())
    source.pinned_in_legend = true
    app.drawing_area.legend.draw()
    expect(zoneOf(app, 'legend-definition-source')).toBeDefined()
  })

  it('le bloc et le cadre restent derrière les zones épinglées (ordre Z)', () => {
    const { app } = makeLegend()
    app.drawing_area.orderElementOnDA()
    const order = app.drawing_area.list_g_element // index 0 = devant
    const idx = (id: string) => order.indexOf(id)
    ;['legend-group-source', 'legend-definition-source'].forEach(id => {
      expect(idx(id)).toBeLessThan(idx('legend-block-source'))
      expect(idx(id)).toBeLessThan(idx('legend'))
    })
  })
})
