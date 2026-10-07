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

  it('capture (export, vignette) : la légende revient à sa place, à gauche du dessin, puis repart', () => {
    const { app } = makeLegend()
    const legend = app.drawing_area.legend
    legend.position_x = 5000
    legend.in_panel = true
    const frame = app.drawing_area.sankey.containers_dict['legend']
    const diagram = app.drawing_area.contentBounds()
    expect(diagram).not.toBeNull()
    const hide = legend.showForCapture()
    expect(legend.hidden_on_screen).toBe(false)
    expect(frame.d3_selection?.style('display')).not.toBe('none')
    // À gauche du dessin (rendu, noms compris), sans le chevaucher
    expect(frame.position_x + frame.getShapeWidthToUse()).toBeLessThan(diagram!.x)
    // Comptée dans le cadrage pendant la capture
    expect(contentBoundsFromModel(app.drawing_area)!.x).toBeLessThan(diagram!.x)
    hide()
    expect(legend.hidden_on_screen).toBe(true)
    expect(frame.d3_selection?.style('display')).toBe('none')
  })

  it('redessin complet : la légende du panneau est déjà cachée quand le cadrage mesure', () => {
    const { app } = makeLegend()
    const da = app.drawing_area
    da.legend.in_panel = true
    da.auto_fit_mode = 'full'
    const seen: (string | undefined)[] = []
    const fit = da.areaAutoFit.bind(da)
    da.areaAutoFit = ((...args: Parameters<typeof da.areaAutoFit>) => {
      seen.push(da.sankey.containers_dict['legend']?.d3_selection?.style('display'))
      return fit(...args)
    }) as typeof da.areaAutoFit
    da.draw()
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every(d => d === 'none' || d === undefined)).toBe(true)
  })

  it('une zone redessinee seule (geste, survol, selection) reste cachee', () => {
    // Julien, 07/10 : « en manipulant, j ai vu apparaitre l ancienne legende ».
    const { app } = makeLegend()
    app.drawing_area.legend.in_panel = true
    const zone = app.drawing_area.sankey.containers_dict['legend-tag-fiab-indic']
    zone.draw()
    expect(zone.d3_selection?.style('display')).toBe('none')
    app.drawing_area.sankey.containers_dict['legend'].draw()
    expect(app.drawing_area.sankey.containers_dict['legend'].d3_selection?.style('display')).toBe('none')
  })

  it('capture sans panneau : rien ne bouge', () => {
    const { app } = makeLegend()
    const legend = app.drawing_area.legend
    const x = legend.position_x
    legend.showForCapture()()
    expect(legend.position_x).toBe(x)
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
