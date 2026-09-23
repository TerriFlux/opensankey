import { Class_ApplicationData } from './ApplicationData'
import type { Class_Tag } from './Tag'
import type { Class_ElementStyle } from '../Elements/Element'
import { installJsdomRenderStubs, resetHost } from '../Persistence/renderFingerprint'
import {
  findLegendTagGroup, isLegendGroupZoneId
} from '../components/panels/presentation/legendGroupPresentation'
// sa#563 — la vue d'un groupe est une NATURE : ce qu'on éprouve est le document qu'elle bâtit.
import { buildTagGroupViewDocument } from '../Representations/TagGroupViewRepresentation'
import { presentationPanelId } from '../components/panels/presentation/openPresentation'

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

/**
 * sa#563 (lot 4) — LA VUE D'UN GROUPE EST DEVENUE UNE NATURE, et ces trois épreuves sont celles
 * de SA#551, reportées sur elle.
 *
 * Elles portaient sur `renderLegendTagGroupView`, qui mettait le dessin VIVANT en aperçu, en
 * clonait le SVG et rétablissait tout : il fallait donc vérifier que le diagramme de l'auteur
 * était bien rendu à son état. Elles portent désormais sur `buildTagGroupViewDocument`, et la
 * question a changé de nature : le diagramme de l'auteur n'est plus touché du tout, ni lu en
 * écriture ni redessiné — ce qu'on vérifie ici est que la COPIE dit ce qu'elle doit dire.
 *
 * Sur le MODÈLE de la copie et non sur son dessin : le document rendu est hors écran et non
 * dessiné (c'est son hôte qui le dessine, quand sa case mesure quelque chose), ce qui rend ces
 * épreuves indépendantes de ce que jsdom sait mesurer.
 */
describe('sa#563 — la vue d\'un groupe est une copie, et l\'original n\'est pas touché', () => {
  it('la copie porte l\'aperçu du groupe ; la source n\'en garde rien et n\'est pas redessinée', () => {
    const { app, a, source } = makeLegend()
    const before = { color: a.shape_color, opacity: a.shape_opacity, epoch: app.draw_epoch }
    const view = buildTagGroupViewDocument(app, source.id)
    expect(view).not.toBeNull()
    const doc = view as Class_ApplicationData
    try {
      // La COPIE est en aperçu sur ce groupe, et c'est un AUTRE document.
      expect(doc).not.toBe(app)
      expect(doc.drawing_area.sankey.tag_style_preview_group_id).toBe('source')
      // On ne l'édite pas : ses nœuds ne délèguent rien, ce qu'on y déplacerait se perdrait.
      expect(doc.editable).toBe(false)
      // LA SOURCE N'A RIEN VU. Ni aperçu posé puis retiré, ni couleur touchée, ni dessin de plus
      // — c'est le point 5 de la recette, « le diagramme principal n'a pas bougé d'un pixel ».
      expect(app.drawing_area.sankey.tag_style_preview_group_id).toBeUndefined()
      expect(a.shape_color).toBe(before.color)
      expect(a.shape_opacity).toBe(before.opacity)
      // ET PAS UN DESSIN DE PLUS. La copie se lit par `toSheetContentJSON`, dont la sortie
      // REDESSINE le document qu'elle sérialise (`withBypassRedraws`) : sans le garde-fou posé
      // dans `buildTagGroupViewDocument`, ce dessin notifierait `DRAW_TOPIC`, la vue se
      // reconstruirait, resérialiserait — et la page se figerait au premier clic sur « Vue ».
      expect(app.draw_epoch).toBe(before.epoch)
    } finally {
      doc.dispose()
    }
  })

  it('le groupe montré est présenté DÉVELOPPÉ dans la copie, et son interrupteur d\'origine ne bouge pas', () => {
    const { app, source } = makeLegend()
    // « Source » est fermée : sans bloc dans la légende, la vue n'aurait rien à faire lire.
    expect(source.use_colors).toBe(false)
    const doc = buildTagGroupViewDocument(app, source.id) as Class_ApplicationData
    try {
      const copied = doc.drawing_area.sankey.node_taggs_dict['source']
      expect(copied).toBeDefined()
      expect(copied.use_colors).toBe(true)
      // L'interrupteur de l'AUTEUR, lui, est resté fermé.
      expect(source.use_colors).toBe(false)
    } finally {
      doc.dispose()
    }
  })

  it('un groupe de NŒUDS qui colore à l\'ancienne ne met plus rien en forme dans la vue d\'un groupe de FLUX', () => {
    const { app, sankey, b, type, fiab } = makeLegend()
    // Groupe de FLUX montré (le pilote Lait montre « Fiabilité des données », un groupe de flux) :
    // les NŒUDS doivent perdre eux aussi la mise en forme des autres groupes.
    const flux_group = sankey.addFluxTagGroup('flux_fiab', 'Fiabilite du flux', false)
    const sur = flux_group.addTag('Sure', 'sure') as Class_Tag
    const flux_style = sankey.addNewDefaultElementStyle()
    ;(flux_style as unknown as { shape_opacity: number }).shape_opacity = 0.5
    sur.style_id = flux_style.id
    flux_group.use_colors = true
    type.use_colors = false
    fiab.use_colors = false
    // Groupe à l'ancienne : pas de style, la couleur vient de l'étiquette (cf. « Forme de produit
    // laitier » du pilote Lait). Elle ne passe PAS par la cascade des styles — donc pas par
    // `shape_color` — mais par le dessin, qui demande au sankey si le groupe met en forme.
    const forme = sankey.addNodeTagGroup('forme', 'Forme', false)
    const cru = forme.addTag('Cru', 'cru') as Class_Tag
    cru.color = '#00ff00'
    b.addTag(cru)
    forme.use_colors = true
    app.drawing_area.draw()
    expect(b.d3_selection?.select('.node_shape').attr('fill')).toBe('#00ff00')
    // C'est CE prédicat que lit la coloration historique, et c'est lui qu'il faut mesurer : le
    // modèle du nœud, lui, ne dit rien de cette couleur-là (leçon de SA#551).
    expect(sankey.tagGroupAppliesFormatting(forme)).toBe(true)

    const doc = buildTagGroupViewDocument(app, 'flux_fiab') as Class_ApplicationData
    try {
      const copied = doc.drawing_area.sankey
      const copied_forme = copied.node_taggs_dict['forme']
      expect(copied_forme).toBeDefined()
      // Dans la copie, « Forme » est bien toujours allumé — et il ne met pourtant plus rien en
      // forme : l'aperçu n'en laisse qu'un seul, et c'est le groupe de FLUX.
      expect(copied_forme.use_colors).toBe(true)
      expect(copied.tagGroupAppliesFormatting(copied_forme)).toBe(false)
      expect(copied.tagGroupAppliesFormatting(copied.flux_taggs_dict['flux_fiab'])).toBe(true)
      // Et la source garde la sienne, sans qu'on ait eu à la rétablir.
      expect(sankey.tagGroupAppliesFormatting(forme)).toBe(true)
      expect(b.d3_selection?.select('.node_shape').attr('fill')).toBe('#00ff00')
    } finally {
      doc.dispose()
    }
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

describe('SA#551 — carré d\'un style d\'opacité', () => {
  it('damier sous le carré d\'un style sans couleur, pas sous celui d\'un style de couleur', () => {
    const { host, app } = makeLegend()
    expect(zoneG(host, app, 'legend-tag-fiab-robuste').querySelector('.legend_swatch_checker')).not.toBeNull()
    expect(zoneG(host, app, 'legend-tag-type-lait').querySelector('.legend_swatch_checker')).toBeNull()
  })
})
