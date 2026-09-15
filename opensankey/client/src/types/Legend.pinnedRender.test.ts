import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'

/**
 * SA#550 — groupe épinglé en bas de la légende, sur de vraies classes dessinées (jsdom) : une ligne
 * « Nom : description » en texte riche (nom en italique souligné), enveloppée, son ordre vertical et
 * l'aller-retour du drapeau.
 */

installJsdomRenderStubs()

const LONG_DESCRIPTION = 'Organisme producteur, publication & millésime de la donnée collectée. '.repeat(10).trim()

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
  // Deux groupes épinglés fermés, dont un sans description
  const source = sankey.addNodeTagGroup('source', 'Source', false)
  source.description = LONG_DESCRIPTION
  source.pinned_in_legend = true
  b.addTag(source.addTag('Agreste', 'agreste') as Class_Tag)
  const methode = sankey.addNodeTagGroup('methode', 'Methode', false)
  methode.pinned_in_legend = true
  app.drawing_area.legend.masked = false
  app.drawing_area.legend.legend_horizontal = horizontal
  app.drawing_area.draw()
  return { app, source, methode }
}

const zoneOf = (app: Class_ApplicationData, id: string) => app.drawing_area.sankey.containers_dict[id]

describe('SA#550 — légende réelle d\'un groupe épinglé', () => {
  it.each([false, true])('« Nom : description » sur une ligne, en bas, sous le groupe qui colore (horizontale : %s)', horizontal => {
    const { app } = makeLegend(horizontal)
    const ids = ['legend-group-couleur', 'legend-tag-couleur-rouge', 'legend-group-source', 'legend-group-methode']
    ids.forEach(id => expect(zoneOf(app, id)).toBeDefined())
    const ys = ids.map(id => zoneOf(app, id).position_y)
    expect([...ys].sort((p, q) => p - q)).toEqual(ys)

    const source = zoneOf(app, 'legend-group-source')
    const legend = app.drawing_area.legend
    expect(source.name_label_text).toBe('Source : ' + LONG_DESCRIPTION)
    expect(source.name_label_has_fo).toBe(true)
    // Toute la ligne en italique, le nom souligné, puis « : » et la description, échappée
    expect(source.name_label_fo_content).toMatch(/^<p style="[^"]*font-style:italic[^"]*">/)
    expect(source.name_label_fo_content).toContain(
      '<span style="text-decoration:underline">Source</span> : Organisme producteur, publication &amp; millésime')
    expect(zoneOf(app, 'legend-group-methode').name_label_fo_content)
      .toContain('<span style="text-decoration:underline">Methode</span></p>')
    // Rendu par le texte riche
    const g = document.getElementById(source.svg_group)
    expect(g?.querySelector('foreignObject span')?.textContent).toBe('Source')
    // Enveloppée à la largeur de la légende, y compris en disposition horizontale
    expect(source.name_label_box_width).toBe(Math.max(legend.width, 4 * legend.legend_police))
    // La rangée suivante commence sous la forme qui porte les lignes de la description
    const next = zoneOf(app, 'legend-group-methode')
    expect(next.position_y - source.position_y).toBeGreaterThanOrEqual(source.shape_min_height)
    expect(source.shape_min_height).toBeGreaterThan(legend.legend_police)
  })

  it('désépingler retire la ligne ; réépingler la rend', () => {
    const { app, source, methode } = makeLegend()
    source.pinned_in_legend = false
    methode.pinned_in_legend = false
    app.drawing_area.legend.draw()
    ;['legend-group-source', 'legend-group-methode', 'legend-block-source']
      .forEach(id => expect(zoneOf(app, id)).toBeUndefined())
    source.pinned_in_legend = true
    app.drawing_area.legend.draw()
    expect(zoneOf(app, 'legend-group-source')?.name_label_has_fo).toBe(true)
  })

  it('un groupe épinglé qu\'on ouvre retrouve un titre ordinaire, sans texte riche', () => {
    const { app, source } = makeLegend()
    source.use_colors = true
    app.drawing_area.legend.draw()
    const title = zoneOf(app, 'legend-group-source')
    expect(title.name_label_text).toBe('Source')
    expect(title.name_label_has_fo).toBe(false)
    expect(title.attributes['name_label_fo_content']).toBeUndefined()
    expect(zoneOf(app, 'legend-tag-source-agreste')).toBeDefined()
  })

  it('le bloc et le cadre restent derrière la ligne épinglée (ordre Z)', () => {
    const { app } = makeLegend()
    app.drawing_area.orderElementOnDA()
    const order = app.drawing_area.list_g_element // index 0 = devant
    const idx = (id: string) => order.indexOf(id)
    expect(idx('legend-group-source')).toBeLessThan(idx('legend-block-source'))
    expect(idx('legend-group-source')).toBeLessThan(idx('legend'))
  })
})
