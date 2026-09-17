import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import type { Class_ElementStyle } from '../Elements/Element'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'

/**
 * SA#551 — cliquer le nom d'un groupe dans la légende l'OUVRE (interrupteur allumé, styles
 * prioritaires, en tête de légende) ; recliquer le FERME. Sur de vraies classes dessinées (jsdom),
 * par le vrai chemin du clic : écouteur `click` de la zone, discriminateur simple/double clic, puis
 * NodeEventsHandler.
 *
 * Retours du test local du 2026-09-17 : un groupe ouvert que le dernier ouvert supplante partout se
 * ferme ; survoler un groupe fermé montre ses éléments avec ses seuls styles ; damier sous le carré
 * d'un style d'opacité sans couleur.
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
  it('ouvrir un groupe épinglé : en tête, prioritaire ; le groupe qu\'il supplante partout se ferme, l\'autre reste', () => {
    const { host, app, a, source, type, fiab } = makeLegend()
    click(host, app, 'legend-group-source')
    expect(source.use_colors).toBe(true)
    expect(order(app)).toEqual(['fiab', 'type', 'source'])
    // « Type » ne règle que la couleur, que « Source » redéfinit sur tous ses éléments : il se ferme.
    // « Fiabilité » règle l'opacité : elle reste ouverte et s'applique.
    expect(type.use_colors).toBe(false)
    expect(fiab.use_colors).toBe(true)
    expect(titlesTopDown(app)).toEqual(['legend-group-source', 'legend-group-fiab'])
    expect(a.shape_color).toBe('#ff0000')
    expect(a.shape_opacity).toBe(0.4)
    // Ses entrées sont déroulées
    expect(app.drawing_area.sankey.containers_dict['legend-tag-source-agreste']).toBeDefined()
  })

  it('un groupe encore en vigueur ailleurs reste ouvert ; seule l\'étiquette supplantée partout se ferme', () => {
    const { host, app, b, sankey, type } = makeLegend()
    const viande = type.addTag('Viande', 'viande') as Class_Tag
    const style = sankey.addNewDefaultElementStyle()
    ;(style as unknown as { shape_color: string }).shape_color = '#00ff00'
    viande.style_id = style.id
    b.addTag(viande)
    app.drawing_area.draw()
    click(host, app, 'legend-group-source')
    expect(type.use_colors).toBe(true)
    expect(b.shape_color).toBe('#00ff00')
    expect(sankey.containers_dict['legend-tag-type-viande']).toBeDefined()
    // « Lait » n'est porté que par A, dont « Agreste » redéfinit la couleur
    expect(sankey.containers_dict['legend-tag-type-lait']).toBeUndefined()
  })

  it('recliquer ferme : les entrées disparaissent, la ligne épinglée revient en bas', () => {
    const { host, app, a, source } = makeLegend()
    click(host, app, 'legend-group-source')
    click(host, app, 'legend-group-source')
    expect(source.use_colors).toBe(false)
    expect(a.shape_color).not.toBe('#ff0000')
    expect(a.shape_opacity).toBe(0.4)
    expect(titlesTopDown(app)).toEqual(['legend-group-fiab', 'legend-group-source'])
    expect(app.drawing_area.sankey.containers_dict['legend-tag-source-agreste']).toBeUndefined()
  })

  it('le dernier ouvert passe en tête et devient prioritaire', () => {
    const { host, app, a, type } = makeLegend()
    type.pinned_in_legend = true
    app.drawing_area.legend.draw()
    click(host, app, 'legend-group-source')
    expect(type.use_colors).toBe(false)
    click(host, app, 'legend-group-type')
    expect(order(app)).toEqual(['fiab', 'source', 'type'])
    expect(a.shape_color).toBe('#0000ff')
    expect(titlesTopDown(app)).toEqual(['legend-group-type', 'legend-group-fiab', 'legend-group-source'])
  })

  it('annuler rétablit interrupteurs (groupe fermé d\'office compris), ordre et légende ; rétablir rouvre', () => {
    const { host, app, a, source, type } = makeLegend()
    click(host, app, 'legend-group-source')
    app.history.applyUndo()
    expect(source.use_colors).toBe(false)
    expect(type.use_colors).toBe(true)
    expect(order(app)).toEqual(['fiab', 'type', 'source'])
    expect(a.shape_color).toBe('#0000ff')
    expect(titlesTopDown(app)).toEqual(['legend-group-type', 'legend-group-fiab', 'legend-group-source'])
    app.history.applyRedo()
    expect(source.use_colors).toBe(true)
    expect(type.use_colors).toBe(false)
    expect(a.shape_color).toBe('#ff0000')
    expect(titlesTopDown(app)).toEqual(['legend-group-source', 'legend-group-fiab'])
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
  const hover = (host: HTMLElement, app: Class_ApplicationData, type: 'mouseover' | 'mouseout') =>
    zoneG(host, app, 'legend-group-source').dispatchEvent(new MouseEvent(type, { bubbles: true }))

  it('met ses éléments en valeur, avec les SEULS styles de ses étiquettes, puis rétablit', () => {
    const { host, app, a, c, source } = makeLegend()
    hover(host, app, 'mouseover')
    // A porte « Agreste » ; C n'est l'extrémité d'aucun flux désigné
    expect(a.d3_selection?.attr('opacity')).not.toBe('0.1')
    expect(c.d3_selection?.attr('opacity')).toBe('0.1')
    // Un passage de souris ne change rien au dessin
    expect(a.shape_color).toBe('#0000ff')
    jest.advanceTimersByTime(300)
    expect(a.shape_color).toBe('#ff0000')
    expect(a.shape_opacity).not.toBe(0.4)
    expect(source.use_colors).toBe(false)
    expect(c.d3_selection?.attr('opacity')).toBe('0.1')
    hover(host, app, 'mouseout')
    expect(a.shape_color).toBe('#0000ff')
    expect(a.shape_opacity).toBe(0.4)
    expect(c.d3_selection?.attr('opacity')).toBe('')
  })

  it('quitter avant le délai : aucun aperçu', () => {
    const { host, app, a } = makeLegend()
    hover(host, app, 'mouseover')
    jest.advanceTimersByTime(100)
    hover(host, app, 'mouseout')
    jest.advanceTimersByTime(400)
    expect(a.shape_color).toBe('#0000ff')
    expect(app.drawing_area.sankey.tag_style_preview_group_id).toBeUndefined()
  })
})

describe('SA#551 — carré d\'un style d\'opacité', () => {
  it('damier sous le carré d\'un style sans couleur, pas sous celui d\'un style de couleur', () => {
    const { host, app } = makeLegend()
    expect(zoneG(host, app, 'legend-tag-fiab-robuste').querySelector('.legend_swatch_checker')).not.toBeNull()
    expect(zoneG(host, app, 'legend-tag-type-lait').querySelector('.legend_swatch_checker')).toBeNull()
  })
})
