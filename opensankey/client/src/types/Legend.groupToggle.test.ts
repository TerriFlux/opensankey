import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import type { Class_ElementStyle } from '../Elements/Element'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'

/**
 * SA#551 — cliquer le nom d'un groupe dans la légende l'OUVRE (interrupteur allumé, styles
 * prioritaires, en tête de légende) ; recliquer le FERME. Sur de vraies classes dessinées (jsdom),
 * par le vrai chemin du clic : écouteur `click` de la zone, discriminateur simple/double clic, puis
 * NodeEventsHandler.
 */

installJsdomRenderStubs()

type Type_GestureProgress = { indicator: unknown }
const gestureProgress = (app: Class_ApplicationData) =>
  (app as unknown as { _views_reader: { gesture_progress: Type_GestureProgress } })._views_reader.gesture_progress

function makeLegend(published_mode: boolean = false) {
  const host = resetHost()
  const app = new Class_ApplicationData(published_mode)
  gestureProgress(app).indicator = undefined
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  sankey.addNewLink(a, b).valueCurrent = 100
  const c = sankey.addNewNodeWithName('C')
  sankey.addNewLink(b, c).valueCurrent = 50
  const makeStyle = (name: string, attrs: { [k: string]: string | number | boolean }): Class_ElementStyle => {
    const style = sankey.addNewDefaultElementStyle()
    style.name = name
    Object.entries(attrs).forEach(([k, v]) => { (style as unknown as { [k: string]: unknown })[k] = v })
    return style
  }
  // « Fiabilité » ouverte : opacité
  const fiab = sankey.addNodeTagGroup('fiab', 'Fiabilite', false)
  const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
  robuste.style_id = makeStyle('Robuste', { shape_opacity: 0.4 }).id
  a.addTag(robuste)
  fiab.use_colors = true
  // « Type » ouvert : couleur
  const type = sankey.addNodeTagGroup('type', 'Type', false)
  const lait = type.addTag('Lait', 'lait') as Class_Tag
  lait.style_id = makeStyle('Lait', { shape_color: '#0000ff' }).id
  a.addTag(lait)
  type.use_colors = true
  // « Source » épinglée, fermée : couleur aussi
  const source = sankey.addNodeTagGroup('source', 'Source', false)
  const agreste = source.addTag('Agreste', 'agreste') as Class_Tag
  agreste.style_id = makeStyle('Agreste', { shape_color: '#ff0000' }).id
  a.addTag(agreste)
  source.pinned_in_legend = true
  app.drawing_area.legend.masked = false
  app.drawing_area.draw()
  return { host, app, sankey, a, b, c, fiab, type, source }
}

function zoneG(host: HTMLElement, app: Class_ApplicationData, id: string): Element {
  const container = app.drawing_area.sankey.containers_dict[id]
  expect(container).toBeDefined()
  const g = host.querySelector('#' + container.svg_group)
  expect(g).not.toBeNull()
  return g as Element
}

function click(host: HTMLElement, app: Class_ApplicationData, id: string) {
  zoneG(host, app, id).dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
  jest.advanceTimersByTime(400)
}

/** Ids des titres de groupe, de haut en bas de la légende. */
const titlesTopDown = (app: Class_ApplicationData) =>
  app.drawing_area.sankey.containers_list
    .filter(c => c.id.startsWith('legend-group-'))
    .sort((p, q) => p.position_y - q.position_y)
    .map(c => c.id)

const order = (app: Class_ApplicationData) => app.drawing_area.sankey.getTagGroupsOrder('node_taggs')

beforeEach(() => { jest.useFakeTimers() })
afterEach(() => { jest.useRealTimers() })

describe('SA#551 — ordre de priorité unique', () => {
  it('la légende montre les groupes ouverts du plus prioritaire (le plus bas de la liste) au moins prioritaire', () => {
    const { app, a } = makeLegend()
    expect(order(app)).toEqual(['fiab', 'type', 'source'])
    // « Type », plus bas que « Fiabilité », est en tête ; la ligne épinglée fermée ferme la marche
    expect(titlesTopDown(app)).toEqual(['legend-group-type', 'legend-group-fiab', 'legend-group-source'])
    // Paramètres différents : les deux s'appliquent
    expect(a.shape_color).toBe('#0000ff')
    expect(a.shape_opacity).toBe(0.4)
  })
})

describe('SA#551 — clic sur le nom d\'un groupe', () => {
  it('ouvrir un groupe épinglé : en tête de légende, prioritaire sur la même couleur, opacité gardée', () => {
    const { host, app, a, source, type } = makeLegend()
    click(host, app, 'legend-group-source')
    expect(source.use_colors).toBe(true)
    expect(order(app)).toEqual(['fiab', 'type', 'source'].filter(id => id !== 'source').concat('source'))
    expect(titlesTopDown(app)).toEqual(['legend-group-source', 'legend-group-type', 'legend-group-fiab'])
    // Même paramètre : seul le groupe prioritaire s'affiche ; aucun autre groupe n'est fermé
    expect(a.shape_color).toBe('#ff0000')
    expect(a.shape_opacity).toBe(0.4)
    expect(type.use_colors).toBe(true)
    // Ses entrées sont déroulées
    expect(app.drawing_area.sankey.containers_dict['legend-tag-source-agreste']).toBeDefined()
  })

  it('recliquer ferme : retour à l\'état d\'avant, la ligne épinglée revient en bas', () => {
    const { host, app, a, source } = makeLegend()
    click(host, app, 'legend-group-source')
    click(host, app, 'legend-group-source')
    expect(source.use_colors).toBe(false)
    expect(a.shape_color).toBe('#0000ff')
    expect(a.shape_opacity).toBe(0.4)
    expect(titlesTopDown(app)).toEqual(['legend-group-type', 'legend-group-fiab', 'legend-group-source'])
    expect(app.drawing_area.sankey.containers_dict['legend-tag-source-agreste']).toBeUndefined()
  })

  it('ouvrir un groupe placé plus haut le rend prioritaire : il passe en dernière position de la liste', () => {
    const { host, app, a, fiab, type } = makeLegend()
    // Fermer « Fiabilité » (non épinglée) : elle sort de la légende, sa place est gardée
    click(host, app, 'legend-group-fiab')
    expect(fiab.use_colors).toBe(false)
    expect(order(app)).toEqual(['fiab', 'type', 'source'])
    expect(app.drawing_area.sankey.containers_dict['legend-group-fiab']).toBeUndefined()
    expect(a.shape_opacity).not.toBe(0.4)
    // « Type » épinglé puis fermé : sa ligne reste en bas, d'où on le rouvre après « Source »
    type.pinned_in_legend = true
    click(host, app, 'legend-group-type')
    expect(type.use_colors).toBe(false)
    click(host, app, 'legend-group-source')
    click(host, app, 'legend-group-type')
    expect(order(app)).toEqual(['fiab', 'source', 'type'])
    expect(a.shape_color).toBe('#0000ff')
    expect(titlesTopDown(app)).toEqual(['legend-group-type', 'legend-group-source'])
  })

  it('annuler rétablit interrupteur, ordre et place en légende ; rétablir rouvre', () => {
    const { host, app, a, source } = makeLegend()
    click(host, app, 'legend-group-source')
    app.history.applyUndo()
    expect(source.use_colors).toBe(false)
    expect(order(app)).toEqual(['fiab', 'type', 'source'])
    expect(a.shape_color).toBe('#0000ff')
    expect(titlesTopDown(app)).toEqual(['legend-group-type', 'legend-group-fiab', 'legend-group-source'])
    app.history.applyRedo()
    expect(source.use_colors).toBe(true)
    expect(a.shape_color).toBe('#ff0000')
    expect(titlesTopDown(app)).toEqual(['legend-group-source', 'legend-group-type', 'legend-group-fiab'])
  })

  it('lecture : même geste', () => {
    const { host, app, source } = makeLegend(true)
    expect(app.is_editable).toBe(false)
    click(host, app, 'legend-group-source')
    expect(source.use_colors).toBe(true)
  })

  it('double-clic : n\'ouvre rien (il renomme)', () => {
    const { host, app, source } = makeLegend(true)
    const clickNow = () => zoneG(host, app, 'legend-group-source')
      .dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    clickNow()
    jest.advanceTimersByTime(100)
    clickNow()
    jest.advanceTimersByTime(400)
    expect(source.use_colors).toBe(false)
  })

  it('curseur main sur les titres de groupe, ligne épinglée comprise', () => {
    const { host, app } = makeLegend()
    ;['legend-group-type', 'legend-group-fiab', 'legend-group-source']
      .forEach(id => expect(zoneG(host, app, id).classList.contains('legend_toggle_entry')).toBe(true))
  })
})

describe('SA#551 — survol d\'un groupe fermé', () => {
  it('la ligne épinglée projette ses éléments en surbrillance, sans rien recalculer', () => {
    const { host, app, a, c } = makeLegend()
    const epoch = app.drawing_area.sankey.tag_styles_epoch
    zoneG(host, app, 'legend-group-source').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    // A porte « Agreste » ; C n'est l'extrémité d'aucun flux désigné
    expect(a.d3_selection?.attr('opacity')).not.toBe('0.1')
    expect(c.d3_selection?.attr('opacity')).toBe('0.1')
    expect(app.drawing_area.sankey.tag_styles_epoch).toBe(epoch)
    zoneG(host, app, 'legend-group-source').dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    expect(c.d3_selection?.attr('opacity')).toBe('')
  })
})
