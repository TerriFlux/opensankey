// sa#618 — UN VOLET GARDE SON TYPE : on ne le change plus, on le DUPLIQUE, et on le NOMME.
//
// Changer un volet de type marchait mal (peu de réglages sont communs d'un type à l'autre) : la
// bascule est retirée, et « Dupliquer le volet » donne un volet du même type, avec les mêmes
// réglages, posé à côté de l'original, sous un nom numéroté. Les noms des vues et des volets sont
// uniques : une page publiée désigne une vue par son nom.
//
// Ce fichier remplace `mainZoneRepresentationKeepsFigures.test.ts`, qui gardait les réglages d'une
// figure à travers la bascule de type retirée.

import { Class_ApplicationData } from './ApplicationData'
import { representation_registry } from '../Representations/RepresentationRegistry'
import { gridPaneIds } from './MainZoneGrid'
import type { Type_JSON } from './Utils'

const COURONNE = 'test.repr.couronne_dup'
const PANE = 'p1'

beforeEach(() => {
  representation_registry.register({ id: COURONNE, scale: 'element', order: 40, label: () => 'Couronne', draw: () => undefined })
})
afterEach(() => {
  representation_registry.unregister(COURONNE)
})

const reglage = { coordinates_linked: false, dimension_opening: { produit: ['cereales'] } }

const appWithCouronne = () => {
  const app = new Class_ApplicationData(false)
  // Le document principal reçoit les gestes dans son historique (cf. `paneSync.test.ts`).
  app.sankey_panes.sync()
  const mc = app.menu_configuration
  const id = mc.openMainZoneWindow({ kind: 'link', id: 'l1' }, COURONNE, 'right')
  mc.setMainZonePaneOptions(id, PANE, reglage)
  return { app, mc, id }
}

describe('dupliquer un volet', () => {
  it('la copie a le même type, le même sujet, les mêmes réglages, et son nom', () => {
    const { mc, id } = appWithCouronne()
    const copy = mc.duplicateMainZoneWindow(id, 'Couronne 2')!
    expect(copy).not.toBeNull()
    expect(copy).not.toBe(id)
    const o = mc.mainZoneOccupantById(copy)!
    expect(o.representation).toBe(COURONNE)
    expect(o.subject).toEqual(mc.mainZoneOccupantById(id)!.subject)
    expect(o.name).toBe('Couronne 2')
    expect(o.saved_view).toBeUndefined()
    expect(mc.figureOf(copy, PANE).own).toEqual(reglage)
    // La copie devient le volet actif.
    expect(mc.main_zone_active_id).toBe(copy)
  })

  it('régler la copie ne règle pas l original', () => {
    const { mc, id } = appWithCouronne()
    const copy = mc.duplicateMainZoneWindow(id, 'Couronne 2')!
    mc.setMainZonePaneOptions(copy, PANE, { ...reglage, coordinates_linked: true })
    expect(mc.figureOf(id, PANE).own).toEqual(reglage)
  })

  it('la copie est posée juste à droite de l original dans la grille', () => {
    const { mc, id } = appWithCouronne()
    const other = mc.openMainZoneWindow({ kind: 'link', id: 'l2' }, COURONNE, 'right')
    const copy = mc.duplicateMainZoneWindow(id, 'Couronne 2')!
    const order = gridPaneIds(mc.main_zone_visible_grid)
    expect(order.indexOf(copy)).toBe(order.indexOf(id) + 1)
    expect(order).toContain(other)
  })

  it('la copie d un volet flottant flotte, décalée d un cran', () => {
    const app = new Class_ApplicationData(false)
    const mc = app.menu_configuration
    const id = mc.openMainZoneWindow({ kind: 'link', id: 'l1' }, COURONNE, 'floating')
    mc.setMainZoneOccupantGeometry(id, { x: 200, y: 150, w: 420, h: 300 })
    const copy = mc.duplicateMainZoneWindow(id, 'Couronne 2')!
    const o = mc.mainZoneOccupantById(copy)!
    expect(o.place).toBe('floating')
    expect(o.geometry).toMatchObject({ x: 224, y: 174, w: 420, h: 300 })
  })

  it('dupliquer s annule d un geste', () => {
    const { app, mc, id } = appWithCouronne()
    const before = mc.main_zone_occupants.map(o => o.id)
    mc.undoableMainZone(() => { mc.duplicateMainZoneWindow(id, 'Couronne 2') })
    expect(mc.main_zone_occupants.length).toBe(before.length + 1)
    app.history.applyUndo()
    expect(mc.main_zone_occupants.map(o => o.id)).toEqual(before)
  })
})

describe('le nom d un volet', () => {
  it('s écrit dans le fichier et se relit ; absent, la clé ne s écrit pas', () => {
    const { mc, id } = appWithCouronne()
    const occupants = () => (mc.mainZoneStateToJSON()['occupants'] as Type_JSON)
    expect((occupants()[id] as Type_JSON)['name']).toBeUndefined()
    mc.setMainZoneOccupantName(id, 'Fruits')
    const json = mc.mainZoneStateToJSON()
    expect(((json['occupants'] as Type_JSON)[id] as Type_JSON)['name']).toBe('Fruits')

    const other = new Class_ApplicationData(false).menu_configuration
    other.mainZoneStateFromJSON(JSON.parse(JSON.stringify(json)) as Type_JSON)
    expect(other.mainZoneOccupantById(id)?.name).toBe('Fruits')
  })

  it('un volet qui devient une vue prend le nom de la vue, pas le sien', () => {
    const { mc, id } = appWithCouronne()
    mc.setMainZoneOccupantName(id, 'Fruits')
    mc.setMainZoneOccupantSavedView(id, 'v1')
    expect(mc.mainZoneOccupantById(id)?.name).toBeUndefined()
    // Et une vue ne se renomme pas par là : c'est sa vue qui la nomme.
    mc.setMainZoneOccupantName(id, 'Autre')
    expect(mc.mainZoneOccupantById(id)?.name).toBeUndefined()
  })
})

describe('les noms sont uniques', () => {
  const appWithViews = () => {
    const { app, mc, id } = appWithCouronne()
    app.views_dict['v1'] = { name: 'Vue A', json: new Uint8Array() } as never
    app.views_dict['v2'] = { name: 'Vue B', json: new Uint8Array() } as never
    return { app, mc, id }
  }

  it('renommer une vue vers le nom d une autre est refusé', () => {
    const { app } = appWithViews()
    expect(app.renameView('v2', 'Vue A')).toBe(false)
    expect(app.views_dict['v2'].name).toBe('Vue B')
    expect(app.renameView('v2', 'Vue C')).toBe(true)
    expect(app.views_dict['v2'].name).toBe('Vue C')
    // Garder son propre nom n'est pas un doublon.
    expect(app.renameView('v2', 'Vue C')).toBe(true)
  })

  it('le nom d un volet compte comme celui d une vue, dans les deux sens', () => {
    const { app, mc, id } = appWithViews()
    expect(app.isPaneNameTaken('Vue A')).toBe(true)
    expect(app.isPaneNameTaken('Vue A', { view: 'v1' })).toBe(false)
    mc.setMainZoneOccupantName(id, 'Fruits')
    expect(app.isPaneNameTaken('Fruits')).toBe(true)
    expect(app.isPaneNameTaken('Fruits', { occupant: id })).toBe(false)
    expect(app.renameView('v1', 'Fruits')).toBe(false)
  })

  it('un fichier qui a deux vues de même nom les garde telles quelles', () => {
    const { app } = appWithViews()
    app.views_dict['v2'].name = 'Vue A'
    // Rien ne les renomme ; seul un NOUVEAU doublon est refusé.
    expect(app.views_dict['v1'].name).toBe('Vue A')
    expect(app.views_dict['v2'].name).toBe('Vue A')
    expect(app.renameView('v2', 'Vue A')).toBe(true)
  })
})
