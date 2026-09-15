import {
  chooseLegendDimensionTag, dimensionOfLegendZone, isLegendDimensionPanelId, isLegendDimensionZoneId,
  legendDimensionListGeometry, legendDimensionPanelId, openLegendDimensionChoice
} from './legendDimensionChoice'
import { LEGEND_DIMENSION_CARET, LEGEND_DIMENSION_CARET_CLASS } from '../../../Elements/legendDimensionCaret'
import { isPresentationPanelId } from './openPresentation'
import { Class_PanelManager } from '../../../types/PanelManager'
import { Class_EventBus } from '../../../types/EventBus'
import { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Class_DataTagGroup } from '../../../types/TagGroup'
import { legendDataTagZoneId } from '../../../Elements/legendIds'
import { installJsdomRenderStubs, resetHost } from '../../../Persistence/renderFingerprint'

// ==================================================================================================
// SA#552 — choisir l'année ou l'unité affichée depuis la ligne de rappel de la légende.
//
// Deux étages : la logique du choix sur un modèle factice (quelle méthode de sélection, quel
// historique), puis le geste réel — clic confirmé sur la zone générée d'une vraie application —
// en lecture et en édition.
// ==================================================================================================

// MODÈLE FACTICE ===================================================================================

type Type_FakeTag = { id: string, display_name: string, is_selected: boolean }

const fakeGroup = (banner: string, selected: string[]) => {
  const tags: Type_FakeTag[] = ['pb', 'mg', 'mat'].map(id => ({ id, display_name: id, is_selected: selected.includes(id) }))
  const group = {
    id: 'unite',
    banner,
    tags_list: tags,
    get selected_tags_list() { return tags.filter(t => t.is_selected) },
    selectTagsFromId: jest.fn((id: string) => tags.forEach(t => { t.is_selected = t.id === id })),
    selectTagsFromIds: jest.fn((ids: string[]) => tags.forEach(t => { t.is_selected = ids.includes(t.id) }))
  }
  return group
}

const fakeApp = (group: ReturnType<typeof fakeGroup>) => {
  const undo: (() => void)[] = []
  const redo: (() => void)[] = []
  const panels = new Class_PanelManager(new Class_EventBus())
  const app = {
    drawing_area: { sankey: { data_taggs_list: [group] } },
    menu_configuration: { panels, updateAllComponentsRelatedToDataTags: jest.fn() },
    history: { saveUndo: (f: () => void) => undo.push(f), saveRedo: (f: () => void) => redo.push(f) }
  } as unknown as Class_ApplicationData
  return { app, panels, undo, redo }
}

const selectedIds = (group: ReturnType<typeof fakeGroup>) => group.selected_tags_list.map(t => t.id)
const asGroup = (group: ReturnType<typeof fakeGroup>) => group as unknown as Class_DataTagGroup

describe('SA#552 — identité de la zone et du panneau', () => {
  it('reconnaît la ligne de rappel d\'une dimension, et elle seule', () => {
    expect(isLegendDimensionZoneId(legendDataTagZoneId('unite'))).toBe(true)
    expect(isLegendDimensionZoneId('legend-tag-unite-pb')).toBe(false)
    expect(isLegendDimensionPanelId(legendDimensionPanelId('unite'))).toBe(true)
    expect(isPresentationPanelId(legendDimensionPanelId('unite'))).toBe(false)
  })

  it('retrouve le groupe par l\'id de sa zone, même quand l\'id du groupe est « slugifié »', () => {
    const group = fakeGroup('one', ['pb'])
    group.id = 'Unité (kt)'
    const { app } = fakeApp(group)
    expect(dimensionOfLegendZone(app, legendDataTagZoneId('Unité (kt)'))).toBe(group)
    expect(dimensionOfLegendZone(app, legendDataTagZoneId('autre'))).toBeUndefined()
  })
})

describe('SA#552 — ouverture de la liste', () => {
  it('ouvre une pop-up non épinglée pour la zone d\'une dimension', () => {
    const group = fakeGroup('one', ['pb'])
    const { app, panels } = fakeApp(group)
    expect(openLegendDimensionChoice(app, legendDataTagZoneId('unite'), { x: 10, y: 10 })).toBe(true)
    expect(panels.getMode(legendDimensionPanelId('unite'))).toBe('popup')
    expect(panels.isPinned(legendDimensionPanelId('unite'))).toBe(false)
  })

  it('n\'ouvre rien pour une zone qui ne désigne aucune dimension', () => {
    const { app, panels } = fakeApp(fakeGroup('one', ['pb']))
    expect(openLegendDimensionChoice(app, legendDataTagZoneId('inconnue'))).toBe(false)
    expect(panels.open_ids).toEqual([])
  })

  it('recliquer la zone referme la liste que ce clic vient de congédier (bascule)', () => {
    const { app, panels } = fakeApp(fakeGroup('one', ['pb']))
    openLegendDimensionChoice(app, legendDataTagZoneId('unite'))
    panels.dismissTransientPopups()
    expect(openLegendDimensionChoice(app, legendDataTagZoneId('unite'))).toBe(false)
    expect(panels.open_ids).toEqual([])
  })
})

describe('SA#552 — choix d\'une étiquette', () => {
  it('bannière à valeur unique : passe par selectTagsFromId (historique, mode #370, redessin)', () => {
    const group = fakeGroup('one', ['pb'])
    const { app, undo } = fakeApp(group)
    chooseLegendDimensionTag(app, asGroup(group), 'mg')
    expect(group.selectTagsFromId).toHaveBeenCalledWith('mg')
    expect(group.selectTagsFromIds).not.toHaveBeenCalled()
    // L'historique est celui de selectTagsFromId : rien d'enregistré en double ici.
    expect(undo).toHaveLength(0)
    expect(selectedIds(group)).toEqual(['mg'])
  })

  it('bannière à valeur unique : rechoisir la tranche affichée ne fait rien', () => {
    const group = fakeGroup('one', ['pb'])
    const { app } = fakeApp(group)
    chooseLegendDimensionTag(app, asGroup(group), 'pb')
    expect(group.selectTagsFromId).not.toHaveBeenCalled()
  })

  it('« Plusieurs » : coche et décoche dans l\'ordre du groupe, avec annuler/rétablir', () => {
    const group = fakeGroup('multi', ['mat'])
    const { app, undo, redo } = fakeApp(group)
    chooseLegendDimensionTag(app, asGroup(group), 'pb')
    expect(selectedIds(group)).toEqual(['pb', 'mat'])
    expect(app.menu_configuration.updateAllComponentsRelatedToDataTags).toHaveBeenCalled()
    undo[0]()
    expect(selectedIds(group)).toEqual(['mat'])
    redo[0]()
    expect(selectedIds(group)).toEqual(['pb', 'mat'])
    chooseLegendDimensionTag(app, asGroup(group), 'mat')
    expect(selectedIds(group)).toEqual(['pb'])
  })

  it('« Plusieurs » : la dernière tranche affichée ne se décoche pas', () => {
    const group = fakeGroup('multi', ['pb'])
    const { app, undo } = fakeApp(group)
    chooseLegendDimensionTag(app, asGroup(group), 'pb')
    expect(group.selectTagsFromIds).not.toHaveBeenCalled()
    expect(undo).toHaveLength(0)
    expect(selectedIds(group)).toEqual(['pb'])
  })
})

describe('SA#552 — placement de la liste déroulante', () => {
  const rect = { left: 100, top: 200, bottom: 220, width: 150 }

  it('juste sous la ligne, alignée à gauche, au moins aussi large qu\'elle', () => {
    const g = legendDimensionListGeometry(4, rect, { x: 999, y: 999 })
    expect(g.x).toBe(100)
    expect(g.y).toBe(222)
    expect(g.w).toBe(150)
    expect(g.h).toBeGreaterThan(0)
  })

  it('au-dessus de la ligne quand elle déborderait du bas de la fenêtre', () => {
    const low = { left: 100, top: window.innerHeight - 30, bottom: window.innerHeight - 10, width: 150 }
    const g = legendDimensionListGeometry(4, low, undefined)
    expect(g.y + g.h).toBeLessThanOrEqual(low.top)
  })

  it('sans rectangle mesurable (zone absente, jsdom) : au point du clic', () => {
    const g = legendDimensionListGeometry(2, { left: 0, top: 0, bottom: 0, width: 0 }, { x: 40, y: 60 })
    expect(g.x).toBe(40)
    expect(g.y).toBe(60)
  })
})

// GESTE RÉEL =======================================================================================

// Le SVG est réellement construit, zones de texte comprises : mêmes prothèses jsdom que les
// autres tests de légende dessinée (Legend.tagStyleRender.test.ts).
installJsdomRenderStubs()

/** Diagramme dessiné dont la légende rappelle la dimension « Unité ». */
function buildDrawnApp(published: boolean) {
  resetHost()
  const app = new Class_ApplicationData(published)
  // Sans i18n initialisé, la traduction par défaut rend `null` : on lui fait rendre la clé, pour
  // voir passer les libellés que la légende pose (info-bulle de la ligne de rappel).
  app.t = ((key: string) => key) as unknown as typeof app.t
  const drawing_area = app.drawing_area
  const { sankey } = drawing_area
  const source = sankey.addNewNode('source', 'Source')
  const cible = sankey.addNewNode('cible', 'Cible')
  sankey.addNewLink(source, cible)
  const group = sankey.addDataTagGroup('unite', 'Unité', false) as Class_DataTagGroup
  const pb = group.addTag('kt PB', 'pb')
  group.addTag('kt MG', 'mg')
  pb.setSelected()
  drawing_area.legend.masked = false
  drawing_area.legend.legend_show_dataTags = true
  drawing_area.draw()
  if (!published) drawing_area.setSelectionMode()
  return { app, drawing_area, group }
}

/** Clic simple CONFIRMÉ sur une zone (après la désambiguïsation simple/double clic). */
function clickZone(app: Class_ApplicationData, zone_id: string) {
  const zone = app.drawing_area.sankey.containers_dict[zone_id]
  expect(zone).toBeDefined()
  const event = {
    button: 0, clientX: 40, clientY: 40, ctrlKey: false, metaKey: false,
    target: zone.d3_selection?.node() ?? document.body
  }
  ;(zone as unknown as { onSingleLMBClick: (e: unknown) => void }).onSingleLMBClick(event)
}

const zoneText = (app: Class_ApplicationData) =>
  app.drawing_area.sankey.containers_dict[legendDataTagZoneId('unite')]?.name_label_text

describe.each([
  ['lecture', true],
  ['édition', false]
])('SA#552 — clic sur la ligne de rappel en %s', (_mode, published) => {
  it('ouvre la liste, sans présentation de la zone ; le choix régénère la légende et s\'annule', () => {
    const { app, group } = buildDrawnApp(published)
    expect(app.is_editable).toBe(!published)
    expect(zoneText(app)).toBe('Unité : kt PB')

    // Indices : main, flèche VOISINE du libellé (son texte, figé par l'empreinte #530, est
    // inchangé), info-bulle « cliquer pour modifier » lue au survol.
    const zone = app.drawing_area.sankey.containers_dict[legendDataTagZoneId('unite')]
    const group_node = zone.d3_selection?.node() as SVGGElement
    // Main : la classe des zones cliquables de la légende (règle CSS du SA#549)
    expect(group_node.classList.contains('legend_toggle_entry')).toBe(true)
    const caret = group_node.querySelector('.' + LEGEND_DIMENSION_CARET_CLASS)
    expect(caret?.textContent).toBe(LEGEND_DIMENSION_CARET)
    // (espace de tête laissé par le découpage en tspans du libellé : sans rapport avec la flèche)
    expect(group_node.querySelector('.name_label_text')?.textContent?.trim()).toBe('Unité : kt PB')
    expect(zone.tooltip_text).not.toBe('')

    // Cliquer la FLÈCHE, c'est cliquer la ligne.
    const text_clicks = jest.fn()
    group_node.querySelector('.name_label_text')?.addEventListener('click', text_clicks)
    caret?.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 40, clientY: 40 }))
    expect(text_clicks).toHaveBeenCalledTimes(1)

    clickZone(app, legendDataTagZoneId('unite'))
    const panels = app.menu_configuration.panels
    expect(panels.getMode(legendDimensionPanelId('unite'))).toBe('popup')
    expect(panels.open_ids.filter(isPresentationPanelId)).toEqual([])

    chooseLegendDimensionTag(app, group, 'mg')
    expect(group.selected_tags_list.map(t => t.id)).toEqual(['mg'])
    expect(zoneText(app)).toBe('Unité : kt MG')

    app.history.applyUndo()
    expect(group.selected_tags_list.map(t => t.id)).toEqual(['pb'])
    expect(zoneText(app)).toBe('Unité : kt PB')
  })
})
