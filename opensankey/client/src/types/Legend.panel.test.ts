import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'
import { contentBoundsFromModel } from './DrawingAreaCamera'

/**
 * os#1527 — la légende lue dans sa COLONNE : le panneau reçoit toutes les entrées (étiquettes
 * masquées comprises, pour les recocher), ses gestes passent par ceux de la légende dessinée, et les
 * zones dessinées restent dans le modèle mais ne sont ni montrées à l'écran ni comptées au cadrage.
 */

installJsdomRenderStubs()

type Type_GestureProgress = { indicator: unknown }
const gestureProgress = (app: Class_ApplicationData) =>
  (app as unknown as { _views_reader: { gesture_progress: Type_GestureProgress } })._views_reader.gesture_progress

function makeLegend() {
  const host = resetHost()
  const app = new Class_ApplicationData(false)
  gestureProgress(app).indicator = undefined
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  const c = sankey.addNewNodeWithName('C')
  sankey.addNewLink(a, b).valueCurrent = 100
  sankey.addNewLink(b, c).valueCurrent = 50
  const fiab = sankey.addNodeTagGroup('fiab', 'Fiabilite', false)
  fiab.use_colors = true
  const full = fiab.addTag('Full', 'full') as Class_Tag
  const indic = fiab.addTag('Indicative', 'indic') as Class_Tag
  a.addTag(full)
  b.addTag(full)
  c.addTag(indic)
  app.drawing_area.legend.masked = false
  app.drawing_area.draw()
  return { host, app, indic }
}

const ids = (app: Class_ApplicationData) => app.drawing_area.legend.panel_items.map(i => i.id)

describe('os#1527 — panneau de légende', () => {
  it('reçoit les entrées, et les garde décochées quand l étiquette est masquée', () => {
    const { app, indic } = makeLegend()
    const legend = app.drawing_area.legend
    expect(ids(app)).toEqual(expect.arrayContaining(['legend-group-fiab', 'legend-tag-fiab-full', 'legend-tag-fiab-indic']))
    expect(legend.isToggleEntry('legend-tag-fiab-indic')).toBe(true)
    expect(legend.isToggleEntry('legend-group-fiab')).toBe(false)

    let heard = 0
    const off = legend.subscribePanel(() => { heard++ })
    expect(legend.toggleEntryTag('legend-tag-fiab-indic')).toBe(true)
    off()
    expect(heard).toBeGreaterThan(0)
    expect(indic.is_selected).toBe(false)
    const entry = legend.panel_items.find(i => i.id === 'legend-tag-fiab-indic')
    expect(entry?.dimmed).toBe(true)
    // Recocher depuis le panneau : même geste
    expect(legend.toggleEntryTag('legend-tag-fiab-indic')).toBe(true)
    expect(indic.is_selected).toBe(true)
  })

  it('légende masquée : panneau vide', () => {
    const { app } = makeLegend()
    app.drawing_area.legend.masked = true
    expect(app.drawing_area.legend.panel_items).toEqual([])
  })

  it('in_panel : zones cachées à l écran et hors du cadrage, rendues à la sortie', () => {
    const { app } = makeLegend()
    const legend = app.drawing_area.legend
    const frame = app.drawing_area.sankey.containers_dict['legend']
    expect(frame).toBeDefined()
    // Légende posée loin à droite : elle seule fait la borne droite du contenu
    legend.position_x = 5000
    const right = () => {
      const b = contentBoundsFromModel(app.drawing_area)
      return b === null ? 0 : b.x + b.width
    }
    expect(right()).toBeGreaterThan(5000)
    legend.in_panel = true
    expect(frame.d3_selection?.style('display')).toBe('none')
    expect(right()).toBeLessThan(5000)
    // Régénérée (changement d'étiquette), la légende reste cachée
    legend.toggleEntryTag('legend-tag-fiab-indic')
    expect(app.drawing_area.sankey.containers_dict['legend-tag-fiab-indic'].d3_selection?.style('display')).toBe('none')
    legend.in_panel = false
    expect(frame.d3_selection?.style('display')).not.toBe('none')
  })

  it('légende figée à la main : passer en panneau la régénère', () => {
    const { app } = makeLegend()
    const legend = app.drawing_area.legend
    legend.markBroken()
    expect(legend.managed).toBe(false)
    legend.in_panel = true
    expect(legend.managed).toBe(true)
    expect(legend.isToggleEntry('legend-tag-fiab-indic')).toBe(true)
  })
})
