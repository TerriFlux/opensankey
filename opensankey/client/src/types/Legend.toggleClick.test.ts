import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import type { Type_JSON } from './Utils'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'
import { LegendPersistence } from '../Persistence/SankeyPersistence'

/**
 * SA#549 — cliquer une entrée de la légende raye l'étiquette et masque ses éléments ; recliquer la
 * rétablit. Sur de vraies classes dessinées (jsdom), par le vrai chemin du clic : écouteur `click`
 * de la zone, discriminateur simple/double clic, puis NodeEventsHandler.
 */

installJsdomRenderStubs()

type Type_GestureProgress = { indicator: unknown }
const gestureProgress = (app: Class_ApplicationData) =>
  (app as unknown as { _views_reader: { gesture_progress: Type_GestureProgress } })._views_reader.gesture_progress

function makeLegend(published_mode: boolean = false, deferred: boolean = false) {
  const host = resetHost()
  const app = new Class_ApplicationData(published_mode)
  // La bascule est un geste lourd (voile + cession d'une frame). Sans indicateur, l'ordonnanceur
  // travaille en synchrone : les tests lisent l'état au retour du clic.
  if (!deferred) gestureProgress(app).indicator = undefined
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

function zoneG(host: HTMLElement, app: Class_ApplicationData, id: string): Element {
  const container = app.drawing_area.sankey.containers_dict[id]
  expect(container).toBeDefined()
  const g = host.querySelector('#' + container.svg_group)
  expect(g).not.toBeNull()
  return g as Element
}

/** Clic simple confirmé : l'événement, puis le délai du discriminateur simple/double clic. */
function click(host: HTMLElement, app: Class_ApplicationData, id: string, init: MouseEventInit = {}) {
  zoneG(host, app, id).dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, ...init }))
  jest.advanceTimersByTime(400)
}

const visibleNodes = (app: Class_ApplicationData) =>
  app.drawing_area.sankey.visible_nodes_list.map(n => n.name).sort()

const isStruck = (host: HTMLElement, app: Class_ApplicationData, id: string) =>
  (zoneG(host, app, id).querySelector('text') as SVGTextElement | null)?.style.textDecoration === 'line-through'

beforeEach(() => { jest.useFakeTimers() })
afterEach(() => { jest.useRealTimers() })

describe('SA#549 — clic sur une entrée de légende', () => {
  it('édition : masque les éléments de l\'étiquette et raye son entrée ; recliquer rétablit', () => {
    const { host, app, indic } = makeLegend()
    expect(isStruck(host, app, 'legend-tag-fiab-indic')).toBe(false)

    click(host, app, 'legend-tag-fiab-indic')
    expect(indic.is_selected).toBe(false)
    expect(visibleNodes(app)).toEqual(['A', 'B'])
    // L'entrée reste, rayée : c'est elle qui permet de rétablir
    expect(app.drawing_area.legend.show_hidden_tags).toBe(true)
    expect(isStruck(host, app, 'legend-tag-fiab-indic')).toBe(true)
    expect(isStruck(host, app, 'legend-tag-fiab-full')).toBe(false)

    click(host, app, 'legend-tag-fiab-indic')
    expect(indic.is_selected).toBe(true)
    expect(visibleNodes(app)).toEqual(['A', 'B', 'C'])
    expect(isStruck(host, app, 'legend-tag-fiab-indic')).toBe(false)
  })

  it('lecture : même bascule', () => {
    const { host, app, indic } = makeLegend(true)
    expect(app.is_editable).toBe(false)
    click(host, app, 'legend-tag-fiab-indic')
    expect(indic.is_selected).toBe(false)
    expect(visibleNodes(app)).toEqual(['A', 'B'])
  })

  it('annuler rétablit l\'étiquette ET le réglage ; rétablir masque de nouveau', () => {
    const { host, app, indic } = makeLegend()
    click(host, app, 'legend-tag-fiab-indic')
    app.history.applyUndo()
    expect(indic.is_selected).toBe(true)
    expect(visibleNodes(app)).toEqual(['A', 'B', 'C'])
    expect(app.drawing_area.legend.show_hidden_tags).toBe(false)
    app.history.applyRedo()
    expect(indic.is_selected).toBe(false)
    expect(visibleNodes(app)).toEqual(['A', 'B'])
    expect(isStruck(host, app, 'legend-tag-fiab-indic')).toBe(true)
  })

  it('double-clic : ne bascule rien (il sert à renommer la zone)', () => {
    // Lecture : le double-clic n'y ouvre pas d'éditeur, le test ne dépend que du discriminateur.
    const { host, app, indic } = makeLegend(true)
    const clickNow = () => zoneG(host, app, 'legend-tag-fiab-indic')
      .dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    clickNow()
    jest.advanceTimersByTime(100)
    clickNow()
    jest.advanceTimersByTime(400)
    expect(indic.is_selected).toBe(true)
  })

  it('curseur main : seules les entrées d\'étiquette portent la classe cliquable', () => {
    const { host, app } = makeLegend()
    expect(zoneG(host, app, 'legend-tag-fiab-indic').classList.contains('legend_toggle_entry')).toBe(true)
    expect(zoneG(host, app, 'legend-group-fiab').classList.contains('legend_toggle_entry')).toBe(false)
  })

  it('geste différé (voile) : le second de deux clics rapides voit le premier', async () => {
    jest.useRealTimers()
    const { host, app, indic } = makeLegend(false, true)
    expect(gestureProgress(app).indicator).toBeDefined()
    const clickNow = () => zoneG(host, app, 'legend-tag-fiab-indic')
      .dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    const settle = () => new Promise(resolve => setTimeout(resolve, 600))
    // Clic simple confirmé (après le délai du double-clic), puis le voile
    clickNow()
    await settle()
    expect(indic.is_selected).toBe(false)
    // Deux bascules mises en file pendant le voile : chacune doit lire l'état laissé par la
    // précédente (rétablir puis masquer). Lues au moment de la demande, les deux rétabliraient.
    app.drawing_area.legend.toggleEntryTag('legend-tag-fiab-indic')
    app.drawing_area.legend.toggleEntryTag('legend-tag-fiab-indic')
    await settle()
    expect(indic.is_selected).toBe(false)
  })

  it('premier clic : l\'entrée cliquée reste sous le curseur quand d\'autres entrées apparaissent', () => {
    const host = resetHost()
    const app = new Class_ApplicationData(false)
    gestureProgress(app).indicator = undefined
    const sankey = app.drawing_area.sankey
    const a = sankey.addNewNodeWithName('A')
    const b = sankey.addNewNodeWithName('B')
    const c = sankey.addNewNodeWithName('C')
    const d = sankey.addNewNodeWithName('D')
    sankey.addNewLink(a, b).valueCurrent = 100
    sankey.addNewLink(b, c).valueCurrent = 50
    sankey.addNewLink(c, d).valueCurrent = 20
    const fiab = sankey.addNodeTagGroup('fiab', 'Fiabilite', false)
    fiab.use_colors = true
    const full = fiab.addTag('Full', 'full') as Class_Tag
    // Étiquette sélectionnée, mais portée par le seul nœud D, masqué par une AUTRE étiquette : absente
    // de la légende réglage éteint, elle apparaît au-dessus d'« Indicative » quand il s'allume.
    const ghost = fiab.addTag('Ghost', 'ghost') as Class_Tag
    const indic = fiab.addTag('Indicative', 'indic') as Class_Tag
    a.addTag(full)
    b.addTag(full)
    c.addTag(indic)
    d.addTag(ghost)
    const masque = sankey.addNodeTagGroup('masque', 'Masque', false)
    const cache = masque.addTag('Cache', 'cache') as Class_Tag
    d.addTag(cache)
    cache.setUnSelected()
    app.drawing_area.legend.masked = false
    app.drawing_area.draw()
    const ids = () => sankey.containers_list.map(z => z.id)
    // Montage : D masqué, « Ghost » absente de la légende
    expect(sankey.visible_nodes_list.map(n => n.name)).not.toContain('D')
    expect(ids()).not.toContain('legend-tag-fiab-ghost')
    const y = () => Math.round(sankey.containers_dict['legend-tag-fiab-indic'].position_y)
    const y_before = y()
    click(host, app, 'legend-tag-fiab-indic')
    expect(indic.is_selected).toBe(false)
    expect(ids()).toContain('legend-tag-fiab-ghost')
    expect(y()).toBe(y_before)
  })

  it('les entrées restent à leur place quand on masque puis rétablit', () => {
    const { app } = makeLegend()
    const ys = () => app.drawing_area.sankey.containers_list
      .filter(c => c.id.startsWith('legend-tag-')).map(c => c.id + '@' + Math.round(c.position_y))
    app.drawing_area.legend.show_hidden_tags = true
    const before = ys()
    app.drawing_area.legend.toggleEntryTag('legend-tag-fiab-full')
    expect(ys()).toEqual(before)
  })

  it('Ctrl+clic garde la sélection de la zone, sans rien basculer', () => {
    const { host, app, indic } = makeLegend()
    click(host, app, 'legend-tag-fiab-indic', { ctrlKey: true })
    expect(indic.is_selected).toBe(true)
  })

  it('le titre de groupe et une légende personnalisée à la main ne basculent rien', () => {
    const { app, indic } = makeLegend()
    expect(app.drawing_area.legend.toggleEntryTag('legend-group-fiab')).toBe(false)
    app.drawing_area.legend.markBroken()
    expect(app.drawing_area.legend.toggleEntryTag('legend-tag-fiab-indic')).toBe(false)
    expect(indic.is_selected).toBe(true)
  })

  it('les étiquettes de données ne sont jamais cliquables', () => {
    const { app } = makeLegend()
    const sankey = app.drawing_area.sankey
    const annee = sankey.addDataTagGroup('annee', 'Annee', false)
    annee.use_colors = true
    annee.addTag('2020', 'y2020')
    annee.addTag('2021', 'y2021')
    annee.tags_list[0].setSelected()
    app.drawing_area.legend.draw()
    expect(sankey.containers_list.map(c => c.id)).toContain('legend-tag-annee-y2020')
    expect(app.drawing_area.legend.toggleEntryTag('legend-tag-annee-y2020')).toBe(false)
  })
})

describe('SA#549 — renommer une entrée de légende au double-clic', () => {
  // La saisie inline (DrawLabel) : `onInputChange` à chaque frappe, `setInputLabelInvisible` en fin.
  type Type_NameLabel = { onInputChange(value: string): void, setInputLabelInvisible(): void }
  const nameLabel = (app: Class_ApplicationData, id: string): Type_NameLabel =>
    (app.drawing_area.sankey.containers_dict[id] as unknown as { _nodeDrawNameLabel: Type_NameLabel })._nodeDrawNameLabel

  it('renomme l\'étiquette, sans figer la légende : le clic bascule encore', () => {
    const { host, app, indic } = makeLegend()
    const label = nameLabel(app, 'legend-tag-fiab-indic')
    label.onInputChange('Indic.')
    // Pendant la frappe : rien d'appliqué, légende toujours gérée
    expect(indic.display_name).toBe('Indicative')
    expect(app.drawing_area.legend.managed).toBe(true)
    label.setInputLabelInvisible()
    expect(indic.display_name).toBe('Indic.')
    expect(app.drawing_area.legend.managed).toBe(true)
    click(host, app, 'legend-tag-fiab-indic')
    expect(indic.is_selected).toBe(false)
  })

  it('titre de groupe : renomme le groupe', () => {
    const { app } = makeLegend()
    const label = nameLabel(app, 'legend-group-fiab')
    label.onInputChange('Fiabilité des données')
    label.setInputLabelInvisible()
    expect(app.drawing_area.sankey.node_taggs_list.find(g => g.id === 'fiab')?.name).toBe('Fiabilité des données')
    expect(app.drawing_area.legend.managed).toBe(true)
  })

  it('légende figée par une autre retouche : la main disparaît des entrées', () => {
    const { host, app } = makeLegend()
    app.drawing_area.legend.markBroken()
    expect(zoneG(host, app, 'legend-tag-fiab-indic').classList.contains('legend_toggle_entry')).toBe(false)
  })
})

describe('SA#549 — réglage « étiquettes masquées » : rétro-compatibilité', () => {
  it('éteint : une étiquette masquée par ailleurs n\'apparaît pas (légende d\'avant)', () => {
    const { app, indic } = makeLegend()
    indic.setUnSelected()
    app.drawing_area.legend.draw()
    expect(app.drawing_area.sankey.containers_dict['legend-tag-fiab-indic']).toBeUndefined()
    app.drawing_area.legend.show_hidden_tags = true
    expect(app.drawing_area.sankey.containers_dict['legend-tag-fiab-indic']).toBeDefined()
  })

  it('persistance : clé écrite seulement allumée, clé absente = éteint', () => {
    const { app } = makeLegend()
    const legend = app.drawing_area.legend
    const off = LegendPersistence.toJSON(legend, {}) as Type_JSON
    expect((off['legend'] as Type_JSON)['legend_show_hidden_tags']).toBeUndefined()
    legend.show_hidden_tags = true
    const on = LegendPersistence.toJSON(legend, {}) as Type_JSON
    expect((on['legend'] as Type_JSON)['legend_show_hidden_tags']).toBe(true)
    LegendPersistence.fromJSON(1, legend, off)
    expect(legend.show_hidden_tags).toBe(false)
    LegendPersistence.fromJSON(1, legend, on)
    expect(legend.show_hidden_tags).toBe(true)
  })
})
