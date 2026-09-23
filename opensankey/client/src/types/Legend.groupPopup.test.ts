import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import type { Class_ElementStyle } from '../Elements/Element'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'
import {
  findLegendTagGroup, isLegendGroupZoneId, renderLegendTagGroupView,
  canOpenTagGroupPane, openTagGroupPane
} from '../components/panels/presentation/legendGroupPresentation'
import { presentationPanelId } from '../components/panels/presentation/openPresentation'
import { representation_registry } from '../Representations/RepresentationRegistry'
// os#1498 (agent A) — la nature « Vue par groupe » de la grande zone.
import { MAIN_ZONE_GROUP_VIEW_ID } from './MenuConfig'

/**
 * SA#551 — la légende range les groupes du plus prioritaire au moins prioritaire ; cliquer le nom
 * d'un groupe ouvre sa POP-UP (définition, étiquettes, et une VUE du diagramme mis en forme par ce
 * groupe), sans rien ouvrir ni mettre en forme. Seule une étiquette met des éléments en
 * surbrillance au survol (arbitrages d'Alexandre, 2026-09-18).
 *
 * Sur de vraies classes dessinées (jsdom), par le vrai chemin du clic : écouteur `click` de la
 * zone, discriminateur simple/double clic, puis NodeEventsHandler.
 */

installJsdomRenderStubs()

type Type_GestureProgress = { indicator: unknown }
const gestureProgress = (app: Class_ApplicationData) =>
  (app as unknown as { _views_reader: { gesture_progress: Type_GestureProgress } })._views_reader.gesture_progress

function makeLegend(published_mode: boolean = true) {
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
  // « Fiabilité » : opacité
  const fiab = sankey.addNodeTagGroup('fiab', 'Fiabilite', false)
  fiab.description = 'Fiabilite de la donnee'
  const robuste = fiab.addTag('Robuste', 'robuste') as Class_Tag
  robuste.style_id = makeStyle('Robuste', { shape_opacity: 0.4 }).id
  a.addTag(robuste)
  fiab.use_colors = true
  // « Type » : couleur
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

/** Clic simple confirmé : l'événement, puis le délai du discriminateur simple/double clic. */
function click(host: HTMLElement, app: Class_ApplicationData, id: string) {
  zoneG(host, app, id).dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
  jest.advanceTimersByTime(400)
}

const titlesTopDown = (app: Class_ApplicationData) =>
  app.drawing_area.sankey.containers_list
    .filter(c => c.id.startsWith('legend-group-'))
    .sort((p, q) => p.position_y - q.position_y)
    .map(c => c.id)

const popupMode = (app: Class_ApplicationData, zone_id: string) =>
  app.menu_configuration.panels.getMode(presentationPanelId(zone_id))

beforeEach(() => { jest.useFakeTimers() })
afterEach(() => { jest.useRealTimers() })

describe('SA#551 — ordre de priorité unique', () => {
  it('la légende montre les groupes du plus prioritaire (le plus bas de la liste) au moins prioritaire', () => {
    const { app, a } = makeLegend()
    expect(app.drawing_area.sankey.getTagGroupsOrder('node_taggs')).toEqual(['fiab', 'type', 'source'])
    // « Type », plus bas que « Fiabilité », est en tête ; la ligne épinglée fermée ferme la marche
    expect(titlesTopDown(app)).toEqual(['legend-group-type', 'legend-group-fiab', 'legend-group-source'])
    // Paramètres différents : les deux s'appliquent
    expect(a.shape_color).toBe('#0000ff')
    expect(a.shape_opacity).toBe(0.4)
  })

  it('une étiquette supplantée sur tous ses éléments visibles sort de la légende', () => {
    const { app, sankey, a, source } = makeLegend()
    source.use_colors = true
    app.drawing_area.draw()
    // « Source », plus bas que « Type », impose sa couleur au seul élément qui porte « Lait »
    expect(a.shape_color).toBe('#ff0000')
    expect(sankey.containers_dict['legend-tag-source-agreste']).toBeDefined()
    expect(sankey.containers_dict['legend-tag-type-lait']).toBeUndefined()
    // « Fiabilité » règle l'opacité : elle reste
    expect(sankey.containers_dict['legend-tag-fiab-robuste']).toBeDefined()
  })

  it('une entrée « Sans [groupe] » sort elle aussi quand un groupe plus prioritaire règle la même chose partout', () => {
    const { app, sankey, b, source } = makeLegend()
    source.use_colors = true
    app.drawing_area.draw()
    // SA#553 — B et C ne portent aucune étiquette de « Type » ni de « Source » : les deux groupes
    // leur imposent la valeur par défaut de la couleur, et « Source », plus bas, l'emporte partout.
    expect(b.tagStyleLayerImposing('shape_color')).toMatchObject({ from_group: true })
    expect(sankey.containers_dict['legend-tag-source-source__untagged']).toBeDefined()
    expect(sankey.containers_dict['legend-tag-type-type__untagged']).toBeUndefined()
    // Plus une seule entrée stylée dans « Type » : son bloc entier quitte la légende
    expect(sankey.containers_dict['legend-group-type']).toBeUndefined()
  })
})

describe('SA#551 — clic sur le nom d\'un groupe', () => {
  it('ouvre la pop-up du groupe, sans rien mettre en forme', () => {
    const { host, app, a, source, type } = makeLegend()
    expect(popupMode(app, 'legend-group-source')).not.toBe('popup')
    click(host, app, 'legend-group-source')
    expect(popupMode(app, 'legend-group-source')).toBe('popup')
    // Rien n'a bougé : ni interrupteur, ni ordre, ni mise en forme
    expect(source.use_colors).toBe(false)
    expect(type.use_colors).toBe(true)
    expect(app.drawing_area.sankey.getTagGroupsOrder('node_taggs')).toEqual(['fiab', 'type', 'source'])
    expect(a.shape_color).toBe('#0000ff')
    expect(titlesTopDown(app)).toEqual(['legend-group-type', 'legend-group-fiab', 'legend-group-source'])
  })

  it('EN ÉDITION aussi : une zone de légende ne se règle pas, le clic ouvre donc la pop-up', () => {
    const { host, app, source } = makeLegend(false)
    expect(app.is_editable).toBe(true)
    click(host, app, 'legend-group-source')
    expect(popupMode(app, 'legend-group-source')).toBe('popup')
    expect(source.use_colors).toBe(false)
  })

  it('le titre d\'un groupe DÉVELOPPÉ ouvre la même pop-up', () => {
    const { host, app, type } = makeLegend()
    click(host, app, 'legend-group-type')
    expect(popupMode(app, 'legend-group-type')).toBe('popup')
    expect(type.use_colors).toBe(true)
  })

  it('la zone désigne bien son groupe', () => {
    const { app, source } = makeLegend()
    expect(isLegendGroupZoneId('legend-group-source')).toBe(true)
    expect(isLegendGroupZoneId('legend-tag-source-agreste')).toBe(false)
    expect(findLegendTagGroup(app, 'legend-group-source')).toBe(source)
    expect(findLegendTagGroup(app, 'legend-tag-source-agreste')).toBeUndefined()
  })

  it('curseur main sur les titres de groupe, ligne épinglée comprise', () => {
    const { host, app } = makeLegend()
    ;['legend-group-type', 'legend-group-fiab', 'legend-group-source']
      .forEach(id => expect(zoneG(host, app, id).classList.contains('legend_toggle_entry')).toBe(true))
  })
})

describe('SA#551 — vue du groupe dans sa pop-up', () => {
  it('dessine le diagramme mis en forme par ce groupe, et laisse le diagramme intact', () => {
    const { app, a, source } = makeLegend()
    const before = { color: a.shape_color, opacity: a.shape_opacity }
    const container = document.createElement('div')
    const cleanup = renderLegendTagGroupView(app, source, container)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    // Copie : les ids y sont renommés, aucune référence ne retombe sur le dessin vivant
    expect(container.innerHTML).not.toContain('id="g_drawing"')
    // Le diagramme vivant a retrouvé son état
    expect(app.drawing_area.sankey.tag_style_preview_group_id).toBeUndefined()
    expect(a.shape_color).toBe(before.color)
    expect(a.shape_opacity).toBe(before.opacity)
    cleanup()
    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('SA#551 — la vue ne montre que son groupe', () => {
  it('la légende de la copie ne garde que le groupe montré, développé, sans ligne épinglée', () => {
    const { app, sankey, source } = makeLegend()
    // « Source » est fermée : la vue la présente développée, puis rend son interrupteur
    expect(source.use_colors).toBe(false)
    const container = document.createElement('div')
    const zones_during: string[] = []
    const original_draw = sankey.containers_list
    expect(original_draw.length).toBeGreaterThan(0)
    // On relève la légende PENDANT la copie, par le hook de dessin de la zone de travail
    const da = app.drawing_area as unknown as { contentBounds: () => unknown }
    const real_bounds = da.contentBounds.bind(app.drawing_area)
    da.contentBounds = () => {
      zones_during.push(...sankey.containers_list.map(c => c.id).filter(id => id.startsWith('legend-')))
      return real_bounds()
    }
    renderLegendTagGroupView(app, source, container)
    da.contentBounds = real_bounds

    const groups_during = zones_during.filter(id => id.startsWith('legend-group-'))
    expect(groups_during).toEqual(['legend-group-source'])
    expect(zones_during).toContain('legend-tag-source-agreste')
    expect(zones_during.some(id => id.startsWith('legend-tag-fiab'))).toBe(false)
    // Après la copie : interrupteur rendu, légende d'origine rétablie
    expect(source.use_colors).toBe(false)
    expect(titlesTopDown(app)).toEqual(['legend-group-type', 'legend-group-fiab', 'legend-group-source'])
  })
})

describe('SA#551 — la vue n\'affiche QUE la mise en forme de son groupe', () => {
  it('un groupe de NŒUDS qui colore à l\'ancienne ne s\'applique pas dans la vue d\'un groupe de FLUX', () => {
    const { app, sankey, b, type, fiab } = makeLegend()
    // Groupe de FLUX montré (le pilote Lait montre « Fiabilité des données », un groupe de flux) :
    // les NŒUDS doivent perdre eux aussi la mise en forme des autres groupes.
    const flux_group = sankey.addFluxTagGroup('flux_fiab', 'Fiabilite du flux', false)
    const sur = flux_group.addTag('Sure', 'sure') as Class_Tag
    const flux_style = sankey.addNewDefaultElementStyle()
    ;(flux_style as unknown as { shape_opacity: number }).shape_opacity = 0.5
    sur.style_id = flux_style.id
    flux_group.use_colors = true
    // Les autres groupes à styles sont fermés : depuis SA#553, leur étiquette générée
    // « Sans [groupe] » imposerait ses valeurs par défaut à B, qui ne porte aucune de leurs
    // étiquettes — ce n'est pas ce qu'on mesure ici.
    type.use_colors = false
    fiab.use_colors = false
    // Groupe à l'ancienne : pas de style, la couleur vient de l'étiquette (cf. « Forme de produit
    // laitier » du pilote Lait). Il colore B tant qu'il est allumé.
    const forme = sankey.addNodeTagGroup('forme', 'Forme', false)
    const cru = forme.addTag('Cru', 'cru') as Class_Tag
    cru.color = '#00ff00'
    b.addTag(cru)
    forme.use_colors = true
    app.drawing_area.draw()
    // C'est bien la COULEUR DESSINÉE qu'on mesure : le modèle se recalcule à la demande, il dirait
    // la bonne couleur même si le nœud n'avait pas été redessiné pour la copie.
    const drawnColorOfB = () => b.d3_selection?.select('.node_shape').attr('fill')
    expect(drawnColorOfB()).toBe('#00ff00')

    const container = document.createElement('div')
    renderLegendTagGroupView(app, flux_group as never, container)

    // La copie ne porte plus la couleur de « Forme » nulle part
    expect(container.innerHTML).not.toContain('#00ff00')
    expect(container.querySelector('svg')).not.toBeNull()
    // Après : tout est rétabli, dessin compris
    expect(forme.use_colors).toBe(true)
    expect(drawnColorOfB()).toBe('#00ff00')
  })
})

describe('SA#551 — survol', () => {
  const hover = (host: HTMLElement, app: Class_ApplicationData, id: string, type: 'mouseover' | 'mouseout') =>
    zoneG(host, app, id).dispatchEvent(new MouseEvent(type, { bubbles: true }))

  it('un nom de groupe ne met plus rien en surbrillance ; une étiquette, si', () => {
    const { host, app, c } = makeLegend()
    hover(host, app, 'legend-group-source', 'mouseover')
    expect(c.d3_selection?.attr('opacity')).not.toBe('0.1')
    hover(host, app, 'legend-group-source', 'mouseout')

    hover(host, app, 'legend-tag-fiab-robuste', 'mouseover')
    expect(c.d3_selection?.attr('opacity')).toBe('0.1')
    hover(host, app, 'legend-tag-fiab-robuste', 'mouseout')
    expect(c.d3_selection?.attr('opacity')).toBe('')
  })
})

/**
 * os#1498 — la photo de la pop-up se LIT ; le volet, lui, montre le diagramme VIVANT mis en forme
 * par ce seul groupe. Le bouton n'apparaît que si la nature est enregistrée (OS+) et offerte à ce
 * document-ci ; sinon la photo reste le seul chemin, exactement comme avant.
 */
describe('os#1498 — ouvrir la vue du groupe dans un volet', () => {
  // `as never` : `allow_many` arrive avec l agent A de os#1498, ce test doit compiler quel que
  // soit l ordre des merges (même précaution que figureStyles.test.ts pour `attributes`).
  const registerGroupView = (extra: { [k: string]: unknown } = {}) =>
    representation_registry.register({
      id: MAIN_ZONE_GROUP_VIEW_ID,
      scale: 'diagram',
      order: 40,
      allow_many: true,
      label: () => 'Vue par groupe',
      draw: () => undefined,
      ...extra
    } as never)

  afterEach(() => { representation_registry.unregister(MAIN_ZONE_GROUP_VIEW_ID) })

  it('sans nature enregistree, pas de bouton : la photo reste le seul chemin', () => {
    const { app, source } = makeLegend(false)
    expect(representation_registry.get(MAIN_ZONE_GROUP_VIEW_ID)).toBeUndefined()
    expect(canOpenTagGroupPane(app)).toBe(false)
    const before = app.menu_configuration.main_zone_occupants.length
    expect(openTagGroupPane(app, source as never, 'legend-group-source')).toBeNull()
    expect(app.menu_configuration.main_zone_occupants.length).toBe(before)
  })

  it('avec la nature enregistree, le volet naît sur le diagramme et porte CE groupe', () => {
    registerGroupView()
    const { host, app, source } = makeLegend(false)
    expect(canOpenTagGroupPane(app)).toBe(true)
    // La pop-up est ouverte par le vrai chemin du clic : c'est elle qui doit céder la place.
    click(host, app, 'legend-group-source')
    expect(popupMode(app, 'legend-group-source')).toBe('popup')

    const mc = app.menu_configuration
    const window_id = openTagGroupPane(app, source as never, 'legend-group-source')
    expect(window_id).not.toBeNull()
    const occupant = mc.mainZoneOccupantById(window_id as string)
    expect(occupant).toBeDefined()
    expect(occupant?.subject.kind).toBe('diagram')
    expect(occupant?.representation).toBe(MAIN_ZONE_GROUP_VIEW_ID)
    // Le groupe est posé sur la figure de diagramme de CETTE fenêtre (clé '')
    expect(mc.figureOf(window_id as string, '').attributes.tag_group_id).toBe(source.id)
    // ... et la pop-up s'est refermée derrière elle
    expect(popupMode(app, 'legend-group-source')).not.toBe('popup')
  })

  it('page publiee qui n offre pas la nature : pas de bouton, et il revient si elle l offre', () => {
    registerGroupView({ publish_option: 'unitary' })
    const { app, source } = makeLegend(true)
    expect(app.is_static).toBe(true)
    expect(app.publish_options.unitary).toBe(false)
    expect(canOpenTagGroupPane(app)).toBe(false)
    expect(openTagGroupPane(app, source as never, 'legend-group-source')).toBeNull()
    // La garde est celle du registre : la page qui offre la nature retrouve le bouton.
    app.publish_options.unitary = true
    expect(canOpenTagGroupPane(app)).toBe(true)
  })
})

describe('SA#551 — carré d\'un style d\'opacité', () => {
  it('damier sous le carré d\'un style sans couleur, pas sous celui d\'un style de couleur', () => {
    const { host, app } = makeLegend()
    expect(zoneG(host, app, 'legend-tag-fiab-robuste').querySelector('.legend_swatch_checker')).not.toBeNull()
    expect(zoneG(host, app, 'legend-tag-type-lait').querySelector('.legend_swatch_checker')).toBeNull()
  })
})
