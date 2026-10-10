import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'
import { contentBoundsFromModel } from './DrawingAreaCamera'
import { refreshLegendModel } from '../Elements/LegendGenerator'

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

  it('lot 0 : le modèle de la colonne ne dépend pas des zones', () => {
    const { app } = makeLegend()
    const da = app.drawing_area
    const legend = da.legend
    // Zones retirées du modèle (sans casser la légende : c est le générateur qui les retire)
    legend._generating = true
    da.sankey.containers_list.filter(c => c.id.startsWith('legend')).forEach(c => da.sankey.deleteContainer(c))
    legend._generating = false
    expect(da.sankey.containers_dict['legend']).toBeUndefined()
    expect(da.sankey.containers_dict['legend-tag-fiab-indic']).toBeUndefined()
    let heard = 0
    const off = legend.subscribePanel(() => { heard++ })
    refreshLegendModel(da)
    off()
    expect(heard).toBe(1)
    expect(ids(app)).toEqual(expect.arrayContaining(['legend-group-fiab', 'legend-tag-fiab-full', 'legend-tag-fiab-indic']))
    expect(legend.isToggleEntry('legend-tag-fiab-indic')).toBe(true)
    expect(legend.tagGroupIdOfTitle('legend-group-fiab')).toBe('fiab')
    expect(legend.canRenameEntry('legend-tag-fiab-indic')).toBe(true)
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

  it('export : la légende de la colonne à gauche du dessin, les zones hors du cadrage et de l image', () => {
    const { app } = makeLegend()
    const legend = app.drawing_area.legend
    // Légende posée loin à droite : visible à l écran (pas de colonne), elle ferait la borne droite
    legend.position_x = 5000
    const right = () => {
      const b = contentBoundsFromModel(app.drawing_area)
      return b === null ? 0 : b.x + b.width
    }
    expect(right()).toBeGreaterThan(5000)
    // Pendant une capture, les zones sortent du cadrage
    expect(legend.withZonesOutOfBounds(() => right())).toBeLessThan(5000)
    expect(right()).toBeGreaterThan(5000)
    const svg = app.pre_process_export_svg(false)
    // Plus aucune zone de l ancienne légende dans l image ; la légende de la colonne, elle, y est
    expect(svg).not.toContain('gg_legend')
    expect(svg).toContain('sankey_legend_export')
    expect(svg).toContain('Indicative')
    const legend_w = app.exportLegendWidth()
    expect(legend_w).toBeGreaterThan(0)
    expect(svg).toMatch(/<g transform="translate\([\d.]+,0\)">/)
    // Légende masquée : ni légende ni décalage
    legend.masked = true
    const bare = app.pre_process_export_svg(false)
    expect(bare).not.toContain('sankey_legend_export')
    expect(app.exportLegendWidth()).toBe(0)
  })

  it('export depuis la colonne : mêmes entrées que la colonne', () => {
    const { app } = makeLegend()
    const legend = app.drawing_area.legend
    legend.in_panel = true
    const out = legend.exportSvg(1)
    expect(out.svg).toContain('Fiabilite')
    expect(out.svg).toContain('Full')
    // La vue écran n est pas touchée : les zones restent cachées
    app.pre_process_export_svg(false)
    expect(legend.hidden_on_screen).toBe(true)
    expect(app.drawing_area.sankey.containers_dict['legend'].d3_selection?.style('display')).toBe('none')
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
