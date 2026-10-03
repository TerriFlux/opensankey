import { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'
import { representation_registry } from '../Representations/RepresentationRegistry'
import { Class_FigureNature } from '../Representations/Figure'
import {
  figureSettingOfKey, hasLayoutChanges, layoutChangesOf, layoutPrintOf, leaveGroup, mergeInto, modesForChanges,
  partnersOf, readSyncMap, type Type_SyncPane
} from '../Representations/paneSync'

/**
 * sa#568 - LES REGLAGES PARTAGES ENTRE VOLETS, PAR GROUPES.
 *
 * Retour d Alexandre du 02/10 sur la premiere passe : les reglages sont ceux du menu
 * Transformations (et, pour une figure, les familles de sa mise en forme) ; pour chacun on choisit
 * avec quels volets il est partage ; la mise en page ne se partage qu entre volets de meme type ;
 * un volet CREE partage tout ; un fichier d avant se rouvre sans rien de partage.
 */

const NATURE = 'test.figure.sync.donut'
const OTHER = 'test.figure.sync.star'

const labels = (en: string) => ({ en, fr: en, es: en, de: en, it: en, 'zh-CN': en, ja: en })
const attr = (sort: string, def: unknown = undefined) => ({
  default: def, type: () => def, category: 'figure', labels: labels(sort), tooltips: labels(sort), sort
})

// Une nature declaree comme une vraie couronne : une cle de legende (famille Legende), un mode de
// valeur (Graphe), un axe (Graphe), l annee epinglee (une DONNEE, pas de la mise en forme) et un
// reglage d identite qui ne voyage jamais.
const DONUT_ENTRY = {
  id: NATURE,
  scale: 'element',
  order: 98,
  label: () => 'Donut',
  attributes: {
    value_mode: attr('style', 'percent'),
    legend_visible: attr('style', true),
    normalize_link_id: attr('identity'),
    data_tags: attr('navigation'),
    descriptor: attr('navigation')
  },
  draw: () => undefined
}
const STAR_ENTRY = {
  id: OTHER,
  scale: 'element',
  order: 99,
  label: () => 'Star',
  attributes: { value_mode: attr('style', 'percent') },
  draw: () => undefined
}

/** Deux couronnes CREEES par l auteur, chacune sur son noeud, et leurs vignettes montrees. */
const twoPanes = (natureB = NATURE) => {
  const mc = new Class_ApplicationData(false).menu_configuration
  const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE, undefined, undefined, true)
  mc.mainZonePaneOptionsOf(a, 'n1')
  const b = mc.openMainZoneWindow({ kind: 'node', id: 'n2' }, natureB, undefined, undefined, true)
  mc.mainZonePaneOptionsOf(b, 'n2')
  return { mc, a, b }
}

describe('sa#568 les regles pures', () => {
  it('une cle va a sa famille ; l identite et l annee epinglee ne sont pas de la mise en forme', () => {
    const nature = new Class_FigureNature('n', DONUT_ENTRY.attributes as never)
    expect(figureSettingOfKey(nature, 'legend_visible')).toBe('format:legend')
    expect(figureSettingOfKey(nature, 'value_mode')).toBe('format:graph')
    expect(figureSettingOfKey(nature, 'descriptor')).toBe('format:graph')
    expect(figureSettingOfKey(nature, 'normalize_link_id')).toBeNull()
    expect(figureSettingOfKey(nature, 'data_tags')).toBeNull()
    expect(figureSettingOfKey(nature, 'undeclared')).toBeNull()
  })

  it('des groupes : se synchroniser relie a tout le groupe, un groupe d un seul volet se dissout', () => {
    const panes: Type_SyncPane[] = ['a', 'b', 'c'].map(id => ({ id, representation: 'x' }))
    const [a, b, c] = panes
    // b se synchronise sur a, puis c sur b : les trois sont relies (c suit a).
    expect(mergeInto(panes, b, a, 'layout:posNode')!.map(p => p.id)).toEqual(['b'])
    expect(mergeInto(panes, c, b, 'layout:posNode')!.map(p => p.id)).toEqual(['c'])
    expect(partnersOf(panes, a, 'layout:posNode').map(p => p.id)).toEqual(['b', 'c'])
    leaveGroup(panes, b, 'layout:posNode')
    expect(partnersOf(panes, a, 'layout:posNode').map(p => p.id)).toEqual(['c'])
    leaveGroup(panes, c, 'layout:posNode')
    expect(a.sync).toBeUndefined()
  })

  it('se synchroniser sur un volet FUSIONNE les groupes : ce qui suivait le volet le suit toujours', () => {
    const panes: Type_SyncPane[] = ['a', 'b', 'c', 'd'].map(id => ({ id, representation: 'x' }))
    const [a, b, c, d] = panes
    mergeInto(panes, b, a, 'layout:posNode')
    mergeInto(panes, d, c, 'layout:posNode')
    // Dans le menu de a, cocher la colonne de c : a — et b, qui le suivait — prennent la valeur de c.
    expect(mergeInto(panes, a, c, 'layout:posNode')!.map(p => p.id).sort()).toEqual(['a', 'b'])
    expect(partnersOf(panes, b, 'layout:posNode').map(p => p.id)).toEqual(['a', 'c', 'd'])
    // Deja synchronises : rien ne bouge.
    expect(mergeInto(panes, a, d, 'layout:posNode')).toEqual([])
  })

  it('la mise en page ne se partage qu entre volets de meme type ; les donnees entre tous', () => {
    const panes: Type_SyncPane[] = [{ id: 'a', representation: 'x' }, { id: 'b', representation: 'y' }]
    expect(mergeInto(panes, panes[0], panes[1], 'layout:posNode')).toBeNull()
    expect(mergeInto(panes, panes[0], panes[1], 'format:legend')).toBeNull()
    expect(mergeInto(panes, panes[0], panes[1], 'data:annee')).not.toBeNull()
  })

  it('l empreinte d un dessin dit quels elements ont change, et les modes a rejouer', () => {
    const before = layoutPrintOf({
      width: 100, nodes: { a: { x: 1 }, b: { x: 2 } }, links: { l: { style: ['s'] } }
    })
    const moved = layoutPrintOf({
      width: 100, nodes: { a: { x: 5 }, b: { x: 2 } }, links: { l: { style: ['s'] } }
    })
    const changes = layoutChangesOf(before, moved)
    expect(changes).toEqual({ nodes: ['a'], links: [], labels: [], area: false })
    expect(hasLayoutChanges(changes)).toBe(true)
    // Un noeud a bouge : les modes des noeuds, et l ordre des flux (porte par les noeuds).
    expect(modesForChanges(changes, ['posNode', 'attrNode', 'attrFlux', 'posFlux', 'scale']))
      .toEqual(['posNode', 'attrNode', 'posFlux'])
    const resized = layoutPrintOf({
      width: 200, nodes: { a: { x: 1 }, b: { x: 2 } }, links: { l: { style: ['s'] } }
    })
    expect(layoutChangesOf(before, resized).area).toBe(true)
    expect(hasLayoutChanges(layoutChangesOf(before, before))).toBe(false)
  })

  it('la table relue d un fichier ne garde que des chaines non vides', () => {
    expect(readSyncMap({ 'layout:posNode': 'g1', '': 'g2', x: 3, y: '' })).toEqual({ 'layout:posNode': 'g1' })
    expect(readSyncMap(undefined)).toBeUndefined()
    expect(readSyncMap({})).toBeUndefined()
  })
})

describe('sa#568 les figures partagent leur mise en forme', () => {
  beforeAll(() => {
    representation_registry.register(DONUT_ENTRY as never)
    representation_registry.register(STAR_ENTRY as never)
  })
  afterAll(() => {
    representation_registry.unregister(NATURE)
    representation_registry.unregister(OTHER)
  })

  it('un volet CREE partage tout avec le volet de meme type dont il part', () => {
    const { mc, a, b } = twoPanes()
    expect(mc.mainZoneSyncSettings(b)).toEqual(['format:graph', 'format:legend'])
    expect(mc.mainZoneSyncPartners(b, 'format:graph')).toEqual([a])
    expect(mc.mainZoneSyncPartners(a, 'format:legend')).toEqual([b])
  })

  it('le volet cree prend la mise en forme de celui qu il rejoint', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const a = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE, undefined, undefined, true)
    mc.setMainZoneWindowOptions(a, { value_mode: 'value', legend_visible: false })
    const b = mc.openMainZoneWindow({ kind: 'diagram' }, NATURE, undefined, undefined, true)
    expect(mc.mainZonePaneOptionsOf(b, '').value_mode).toBe('value')
    expect(mc.mainZonePaneOptionsOf(b, '').legend_visible).toBe(false)
  })

  it('un changement voyage dans tout le groupe, dans les deux sens', () => {
    const { mc, a, b } = twoPanes()
    mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'value' })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').value_mode).toBe('value')
    mc.setMainZonePaneOptions(b, 'n2', { value_mode: 'normalized' })
    expect(mc.mainZonePaneOptionsOf(a, 'n1').value_mode).toBe('normalized')
    // Revenir a la valeur du style voyage aussi.
    mc.setMainZonePaneOptions(a, 'n1', {})
    expect(mc.mainZonePaneOptionsOf(b, 'n2').value_mode).toBe('percent')
  })

  it('un reglage delie reste propre a son volet ; les autres continuent de voyager', () => {
    const { mc, a, b } = twoPanes()
    mc.unlinkMainZoneSync(b, 'format:graph')
    mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'value', legend_visible: false })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').value_mode).toBe('percent')
    expect(mc.mainZonePaneOptionsOf(b, 'n2').legend_visible).toBe(false)
  })

  it('cocher, dans le menu de b, la colonne de a : b prend ce que montre a', () => {
    const { mc, a, b } = twoPanes()
    mc.unlinkMainZoneSync(b, 'format:graph')
    mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'value' })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').value_mode).toBe('percent')
    expect(mc.linkMainZoneSync(b, a, 'format:graph')).toEqual([b])
    expect(mc.mainZonePaneOptionsOf(b, 'n2').value_mode).toBe('value')
    // Et dans l autre sens : a prend ce que montre b.
    mc.unlinkMainZoneSync(b, 'format:graph')
    mc.setMainZonePaneOptions(b, 'n2', { value_mode: 'normalized' })
    mc.linkMainZoneSync(a, b, 'format:graph')
    expect(mc.mainZonePaneOptionsOf(a, 'n1').value_mode).toBe('normalized')
  })

  it('ni l identite ni l annee epinglee ne voyagent', () => {
    const { mc, a, b } = twoPanes()
    mc.setMainZonePaneOptions(a, 'n1', { normalize_link_id: 'l1', data_tags: { year: '2019' } })
    expect(mc.mainZonePaneOptionsOf(b, 'n2').normalize_link_id).toBeUndefined()
    expect(mc.mainZonePaneOptionsOf(b, 'n2').data_tags).toBeUndefined()
  })

  it('deux natures differentes ne partagent pas leur mise en forme', () => {
    const { mc, a, b } = twoPanes(OTHER)
    expect(mc.mainZoneSyncPartners(b, 'format:graph')).toEqual([])
    expect(mc.canShareMainZoneSync(a, b, 'format:graph')).toBe(false)
  })

  it('une vignette montree plus tard nait synchronisee', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE, undefined, undefined, true)
    mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'value' })
    const b = mc.openMainZoneWindow({ kind: 'elements', ids: ['n2', 'n3'], keys: ['n2', 'n3'] }, NATURE, undefined, undefined, true)
    // Aucune vignette de b n existait a la creation : elles prennent la mise en forme en naissant.
    expect(mc.mainZonePaneOptionsOf(b, 'n2').value_mode).toBe('value')
    expect(mc.mainZonePaneOptionsOf(b, 'n3').value_mode).toBe('value')
  })

  it('ce qui est partage se retrouve a la relecture, et un fichier sans partage se rouvre sans', () => {
    const { mc, a, b } = twoPanes()
    const json = JSON.parse(JSON.stringify(mc.mainZoneStateToJSON())) as Type_JSON
    const entry = (json['occupants'] as Type_JSON)[b] as Type_JSON
    expect(entry['sync']).toEqual({ 'format:graph': 'g1', 'format:legend': 'g2' })

    const reread = new Class_ApplicationData(false).menu_configuration
    reread.mainZoneStateFromJSON(json)
    expect(reread.mainZoneSyncPartners(a, 'format:graph')).toEqual([b])

    // Le meme fichier sans la cle : rien de partage, comme avant.
    Object.values(json['occupants'] as Type_JSON).forEach(e => { delete (e as Type_JSON)['sync'] })
    const old = new Class_ApplicationData(false).menu_configuration
    old.mainZoneStateFromJSON(json)
    expect(old.mainZoneSyncPartners(a, 'format:graph')).toEqual([])
    old.mainZonePaneOptionsOf(b, 'n2')
    old.setMainZonePaneOptions(a, 'n1', { value_mode: 'value' })
    expect(old.mainZonePaneOptionsOf(b, 'n2').value_mode).toBe('percent')
  })

  it('un volet seul n ecrit pas la cle', () => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE, undefined, undefined, true)
    expect('sync' in (mc.mainZoneWindowToJSON(a) as Type_JSON)).toBe(false)
  })

  it('la forme d une vue garde ses partages, et les rend en se rouvrant', () => {
    const { mc, b } = twoPanes()
    const form = mc.mainZoneWindowToJSON(b) as Type_JSON
    expect(form['sync']).toBeDefined()
    const id = mc.openMainZoneWindowFromJSON(form, 'v_test')
    expect(id).not.toBeNull()
    expect(mc.mainZoneOccupantById(id as string)?.sync).toEqual(form['sync'])
  })
})

describe('sa#568 toute action sur une figure ou un volet s\'annule, une par une', () => {
  const VIEW = 'test.figure.sync.view'
  // Une nature SANS réglage de style (un onglet, un mode) : un état d'affichage, pas une figure.
  const VIEW_ENTRY = {
    id: VIEW, scale: 'diagram', order: 97, label: () => 'View',
    attributes: { tab: attr('navigation', 'a') }, draw: () => undefined
  }
  beforeAll(() => {
    representation_registry.register(DONUT_ENTRY as never)
    representation_registry.register(VIEW_ENTRY as never)
  })
  afterAll(() => {
    representation_registry.unregister(NATURE)
    representation_registry.unregister(VIEW)
  })

  /** Un document principal dont l'historique reçoit les gestes (cf. `Class_SankeyPanes.undo_recorder`). */
  const makeApp = () => {
    const app = new Class_ApplicationData(false)
    app.sankey_panes.sync()
    return { app, mc: app.menu_configuration }
  }

  it('un réglage de figure s\'annule et se rétablit', () => {
    const { app, mc } = makeApp()
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE, undefined, undefined, true)
    mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'value' })
    expect(app.history.can_undo).toBe(true)
    app.history.applyUndo()
    expect(mc.mainZonePaneOptionsOf(a, 'n1').value_mode).toBe('percent')
    app.history.applyRedo()
    expect(mc.mainZonePaneOptionsOf(a, 'n1').value_mode).toBe('value')
  })

  it('un geste continu sur un même réglage ne fait qu\'une action ; deux réglages, deux actions', () => {
    const { app, mc } = makeApp()
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE, undefined, undefined, true)
    mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'value' })
    mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'normalized' })
    mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'normalized', legend_visible: false })
    app.history.applyUndo()
    expect(mc.mainZonePaneOptionsOf(a, 'n1').legend_visible).toBe(true)
    expect(mc.mainZonePaneOptionsOf(a, 'n1').value_mode).toBe('normalized')
    app.history.applyUndo()
    expect(mc.mainZonePaneOptionsOf(a, 'n1').value_mode).toBe('percent')
  })

  it('un réglage posé sur plusieurs figures d\'un geste s\'annule d\'un coup', () => {
    const { app, mc } = makeApp()
    const a = mc.openMainZoneWindow({ kind: 'elements', ids: ['n1', 'n2'], keys: ['n1', 'n2'] }, NATURE, undefined, undefined, true)
    mc.undoableGroup(() => {
      mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'value' })
      mc.setMainZonePaneOptions(a, 'n2', { value_mode: 'value' })
    })
    app.history.applyUndo()
    expect(mc.mainZonePaneOptionsOf(a, 'n1').value_mode).toBe('percent')
    expect(mc.mainZonePaneOptionsOf(a, 'n2').value_mode).toBe('percent')
  })

  it('un état d\'affichage (onglet, mode) n\'entre pas à l\'historique', () => {
    const { app, mc } = makeApp()
    const v = mc.openMainZoneWindow({ kind: 'diagram' }, VIEW, undefined, undefined, true)
    mc.setMainZoneWindowOptions(v, { tab: 'b' })
    expect(app.history.can_undo).toBe(false)
  })

  it('le style d\'une nature s\'annule', () => {
    const { app, mc } = makeApp()
    mc.setRepresentationStyleOptions(NATURE, { value_mode: 'value', legend_visible: true })
    expect(mc.representationStyleOptions(NATURE).value_mode).toBe('value')
    app.history.applyUndo()
    expect(mc.representationStyleOptions(NATURE).value_mode).toBe('percent')
  })

  it('fermer un volet s\'annule : il revient avec ses réglages', () => {
    const { app, mc } = makeApp()
    const a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE, undefined, undefined, true)
    mc.setMainZonePaneOptions(a, 'n1', { value_mode: 'value' })
    mc.undoableMainZone(() => mc.hideMainZoneOccupant(a))
    expect(mc.isMainZoneOccupant(a)).toBe(false)
    app.history.applyUndo()
    expect(mc.isMainZoneOccupant(a)).toBe(true)
    expect(mc.mainZonePaneOptionsOf(a, 'n1').value_mode).toBe('value')
    app.history.applyRedo()
    expect(mc.isMainZoneOccupant(a)).toBe(false)
  })

  it('ouvrir ou déplacer un volet s\'annule ; un geste qui ne change rien n\'entre pas', () => {
    const { app, mc } = makeApp()
    let a = ''
    mc.undoableMainZone(() => { a = mc.openMainZoneWindow({ kind: 'node', id: 'n1' }, NATURE, 'right', undefined, true) })
    mc.undoableMainZone(() => mc.setMainZoneOccupantPlace(a, 'bottom'))
    expect(mc.mainZoneOccupantById(a)?.place).toBe('bottom')
    app.history.applyUndo()
    expect(mc.mainZoneOccupantById(a)?.place).toBe('right')
    app.history.applyUndo()
    expect(mc.isMainZoneOccupant(a)).toBe(false)
    expect(app.history.can_undo).toBe(false)
    mc.undoableMainZone(() => undefined)
    expect(app.history.can_undo).toBe(false)
  })
})
