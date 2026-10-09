// os#1482 — LES TABLEAUX DE BORD, la vue de l espace de travail (cf. NOTE-TABLEAUX DE BORD.md).
//
// Ces tests figent le magasin pur : son format (clé racine `dashboards`, additive), la regle du
// repli automatique (une vue sans tableau de bord est un tableau de bord implicite, A SA PLACE), la migration
// d une disposition figee par vue (`view_main_zone`) en dashboard, et le sujet de fenetre etendu
// `{ kind: 'diagram', sheet?, view? }` qui traverse `mainZoneStateToJSON` / `FromJSON`.

import {
  Class_DashboardsStore, implicitDashboardId, viewIdOfImplicitDashboard, migratedDashboardId,
  mainZoneWithViewOnCurrentSheet, dashboardViewRefs, mainZoneWithWalkedView, singleSankeyPaneMainZone, dashboardMosaic,
  dashboardShownViews
} from './Dashboards'
import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID, mainZoneSubjectView } from './MenuConfig'
import type { Type_JSON } from './Utils'

const layout = (occupants: Type_JSON): Type_JSON => ({ occupants, split_ratio: 0.6, bottom_px: 200 })
const canvasOn = (view: string, sheet?: string): Type_JSON => {
  const subject: Type_JSON = { kind: 'diagram', view }
  if (sheet) subject['sheet'] = sheet
  return { place: 'main', size: 1, order: 0, representation: MAIN_ZONE_CANVAS_ID, subject }
}

describe('identifiants de tableau de bord', () => {
  it('un tableau de bord implicite se reconnait et rend sa vue', () => {
    expect(viewIdOfImplicitDashboard(implicitDashboardId('v1'))).toBe('v1')
    expect(viewIdOfImplicitDashboard('s_1')).toBeNull()
    expect(migratedDashboardId('v1')).toBe('dashboard_v1')
  })
})

describe('le magasin : format et aller-retour', () => {
  it('sans tableau de bord, rien n est ecrit (cle additive)', () => {
    expect(new Class_DashboardsStore().toJSON()).toBeUndefined()
  })

  it('l aller-retour rend les tableaux de bord, leur ordre, la courante explicite', () => {
    const store = new Class_DashboardsStore()
    store.add({ id: store.newId(), name: 'Bilan', description: 'd', main_zone: layout({ [MAIN_ZONE_CANVAS_ID]: canvasOn('v1') }) })
    store.add({ id: store.newId(), name: 'Riz', main_zone: layout({ w_2: canvasOn('riz', 'S2') }) })
    store.current = 's_2'
    const json = store.toJSON()!
    expect(json['order']).toEqual(['s_1', 's_2'])
    expect(json['current']).toBe('s_2')

    const relu = new Class_DashboardsStore()
    relu.fromJSON(json)
    expect(relu.order).toEqual(['s_1', 's_2'])
    expect(relu.byId('s_1')?.description).toBe('d')
    expect(relu.byId('s_2')?.name).toBe('Riz')
    expect(relu.current).toBe('s_2')
    // Le compteur repart apres le plus grand N lu : jamais un identifiant deja pris.
    expect(relu.newId()).toBe('s_3')
  })

  it('une courante implicite n est pas ecrite : la vue courante la dit deja', () => {
    const store = new Class_DashboardsStore()
    store.add({ id: 's_1', name: 'A', main_zone: layout({}) })
    store.current = implicitDashboardId('v1')
    expect('current' in store.toJSON()!).toBe(false)
  })

  it('la cle absente VIDE le magasin : c est un autre fichier', () => {
    const store = new Class_DashboardsStore()
    store.add({ id: 's_1', name: 'A', main_zone: layout({}) })
    store.fromJSON(undefined)
    expect(store.has_dashboards).toBe(false)
  })
})

describe('l ordre de navigation : le repli automatique', () => {
  it('une vue sans tableau de bord est un tableau de bord implicite, une vue citee est remplacee A SA PLACE', () => {
    const store = new Class_DashboardsStore()
    store.add({ id: 'dashboard_b', name: 'B', main_zone: layout({ [MAIN_ZONE_CANVAS_ID]: canvasOn('b') }) })
    expect(store.navigationOrder(['a', 'b', 'c'], '')).toEqual([implicitDashboardId('a'), 'dashboard_b', implicitDashboardId('c')])
  })

  it('un tableau de bord qui ne cite que d autres feuilles vient en queue', () => {
    const store = new Class_DashboardsStore()
    store.add({ id: 's_1', name: 'Autre feuille', main_zone: layout({ w_1: canvasOn('riz', 'S2') }) })
    expect(store.navigationOrder(['a'], 'S1')).toEqual([implicitDashboardId('a'), 's_1'])
    // Sur la feuille S2, elle cite une vue : elle prend la place de cette vue.
    expect(store.navigationOrder(['riz'], 'S2')).toEqual(['s_1'])
  })

  it('un tableau de bord qui ne cite que des vues HORS de l ordre reste listee, en queue', () => {
    // os#1492 — REGLE INVERSEE, et c est la correction d un bug : ce tableau de bord DISPARAISSAIT.
    // Un tableau de bord appartient au CLASSEUR, pas a une feuille ni a un filtre de vues : la liste ne
    // doit pas se vider quand on change d onglet. C etait mesure sur le classeur d exemple —
    // deux des trois tableaux de bord s evaporaient sur la seconde feuille.
    const store = new Class_DashboardsStore()
    store.add({ id: 's_1', name: 'Ailleurs', main_zone: layout({ [MAIN_ZONE_CANVAS_ID]: canvasOn('z') }) })
    expect(store.navigationOrder(['a'], '')).toEqual([implicitDashboardId('a'), 's_1'])
  })

  it('un tableau de bord citant une vue de la feuille courante prend SA place, pas la queue', () => {
    const store = new Class_DashboardsStore()
    store.add({ id: 's_1', name: 'Sur b', main_zone: layout({ [MAIN_ZONE_CANVAS_ID]: canvasOn('b') }) })
    store.add({ id: 's_2', name: 'Ailleurs', main_zone: layout({ [MAIN_ZONE_CANVAS_ID]: canvasOn('z') }) })
    expect(store.navigationOrder(['a', 'b', 'c'], ''))
      .toEqual([implicitDashboardId('a'), 's_1', implicitDashboardId('c'), 's_2'])
  })
})

describe('la migration d une disposition figee par vue', () => {
  it('les fenetres diagramme de la feuille courante recoivent la vue, les autres non', () => {
    const before = layout({
      [MAIN_ZONE_CANVAS_ID]: { place: 'main', size: 1, order: 0, representation: MAIN_ZONE_CANVAS_ID, subject: { kind: 'diagram' } },
      w_1: { place: 'right', size: 1, order: 1, representation: 'osp.repr.unit', subject: { kind: 'selection' } },
      w_2: { place: 'right', size: 1, order: 2, representation: MAIN_ZONE_CANVAS_ID, subject: { kind: 'diagram', sheet: 'S2' } },
      // Fenetre d avant os#1387, sans sujet : c est un diagramme de la feuille courante.
      'os.repr.sheet': { place: 'bottom', size: 1, order: 3, representation: 'os.repr.sheet' }
    })
    const after = mainZoneWithViewOnCurrentSheet(before, 'v1')
    const refs = dashboardViewRefs(after)
    expect(refs.map(r => [r.occupant_id, r.sheet, r.view])).toEqual([
      [MAIN_ZONE_CANVAS_ID, '', 'v1'], ['os.repr.sheet', '', 'v1']
    ])
    // L original n est pas touche.
    expect(dashboardViewRefs(before)).toEqual([])
  })
})

describe('le sujet de fenetre porte la vue demandee', () => {
  const freshMenuConfig = () => new Class_ApplicationData(false).menu_configuration

  it('l aller-retour rend feuille et vue d un sujet diagramme', () => {
    const mc = freshMenuConfig()
    const id = mc.openMainZoneWindow({ kind: 'diagram', sheet: 'S2', view: 'riz' }, MAIN_ZONE_CANVAS_ID)
    const relu = freshMenuConfig()
    relu.mainZoneStateFromJSON(mc.mainZoneStateToJSON())
    const o = relu.main_zone_occupants.find(x => x.id === id)
    expect(o?.subject).toEqual({ kind: 'diagram', sheet: 'S2', view: 'riz' })
    expect(mainZoneSubjectView(o!.subject)).toBe('riz')
  })

  it('une fenetre ouverte a la main n ecrit pas de vue : le fichier ne change pas', () => {
    const mc = freshMenuConfig()
    const occupants = mc.mainZoneStateToJSON()['occupants'] as Type_JSON
    const subject = (occupants[MAIN_ZONE_CANVAS_ID] as Type_JSON)['subject'] as Type_JSON
    expect('view' in subject).toBe(false)
  })

  it('la vue ne vaut que pour un sujet diagramme', () => {
    const relu = freshMenuConfig()
    relu.mainZoneStateFromJSON({
      occupants: {
        w_1: { place: 'right', size: 1, order: 0, representation: 'osp.repr.unit', subject: { kind: 'node', id: 'n1', view: 'v1' } }
      }
    } as unknown as Type_JSON)
    expect(relu.main_zone_occupants.find(x => x.id === 'w_1')?.subject).toEqual({ kind: 'node', id: 'n1' })
  })
})

// sa#624 — L'ECRAN EST TOUJOURS UN TABLEAU DE BORD : les briques pures du magasin et de la reprise.
describe('sa#624 : ordre, noms, reprise d une vue parcourue, mosaique', () => {
  const store = (): Class_DashboardsStore => {
    const s = new Class_DashboardsStore()
    ;['A', 'B', 'C'].forEach(name => s.add({ id: s.newId(), name, main_zone: layout({}) }))
    return s
  }

  it('insert pose un tableau de bord a un rang, setOrder garde ceux qu il oublie', () => {
    const s = store()
    s.insert({ id: 'x', name: 'X', main_zone: layout({}) }, 1)
    expect(s.order).toEqual(['s_1', 'x', 's_2', 's_3'])
    s.insert({ id: 'x', name: 'X', main_zone: layout({}) }, 99)
    expect(s.order).toEqual(['s_1', 's_2', 's_3', 'x'])
    s.setOrder(['s_3', 'inconnu', 's_1', 's_3'])
    expect(s.order).toEqual(['s_3', 's_1', 's_2', 'x'])
    expect(s.indexOf('s_2')).toBe(2)
  })

  it('un nom libre reste tel quel, un nom pris recoit un numero', () => {
    const s = store()
    expect(s.uniqueName('D')).toBe('D')
    expect(s.uniqueName('A')).toBe('A 2')
    s.add({ id: 'y', name: 'A 2', main_zone: layout({}) })
    expect(s.uniqueName('A')).toBe('A 3')
    expect(s.nameTaken('A', 's_1')).toBe(false)
    expect(s.nameTaken('A', 's_2')).toBe(true)
  })

  it('le volet qui parcourt les vues montre la vue demandee ; un volet qui est une vue ne bouge pas', () => {
    const screen = layout({
      [MAIN_ZONE_CANVAS_ID]: canvasOn('v2'),
      w_1: { ...canvasOn('v2'), place: 'right', saved_view: 'v2' },
      w_2: { place: 'right', size: 1, order: 2, representation: 'osp.repr.doc', subject: { kind: 'diagram' }, saved_view: 'doc' }
    })
    const walked = mainZoneWithWalkedView(screen, 'v2', 'v3') as Type_JSON
    const occupants = walked['occupants'] as Type_JSON
    expect(((occupants[MAIN_ZONE_CANVAS_ID] as Type_JSON)['subject'] as Type_JSON)['view']).toBe('v3')
    expect(((occupants['w_1'] as Type_JSON)['subject'] as Type_JSON)['view']).toBe('v2')
    // L'original n'est pas touche ; sans volet sur la vue, pas de disposition.
    expect(((screen['occupants'] as Type_JSON)[MAIN_ZONE_CANVAS_ID] as Type_JSON)['subject']).toEqual({ kind: 'diagram', view: 'v2' })
    expect(mainZoneWithWalkedView(screen, 'v9', 'v3')).toBeNull()
    expect(dashboardViewRefs(singleSankeyPaneMainZone('v1', MAIN_ZONE_CANVAS_ID)))
      .toEqual([{ occupant_id: MAIN_ZONE_CANVAS_ID, representation: MAIN_ZONE_CANVAS_ID, sheet: '', view: 'v1' }])
  })

  it('la mosaique : la grille du fichier, les places d avant, le plein ecran', () => {
    const one = dashboardMosaic(singleSankeyPaneMainZone('v1', MAIN_ZONE_CANVAS_ID))
    expect(one.map(t => [t.id, t.frame])).toEqual([[MAIN_ZONE_CANVAS_ID, { top: 0, left: 0, width: 1, height: 1 }]])
    const legacy = layout({
      [MAIN_ZONE_CANVAS_ID]: canvasOn('v1'),
      w_1: { place: 'right', size: 1, order: 1, representation: 'osp.repr.doc', subject: { kind: 'diagram' } },
      w_2: { place: 'floating', size: 1, order: 2, representation: 'osp.repr.doc', subject: { kind: 'diagram' } }
    })
    const tiles = dashboardMosaic(legacy)
    expect(tiles.map(t => t.id).sort()).toEqual([MAIN_ZONE_CANVAS_ID, 'w_1'])
    const main = tiles.find(t => t.id === MAIN_ZONE_CANVAS_ID)!.frame
    const right = tiles.find(t => t.id === 'w_1')!.frame
    expect(main.left).toBe(0)
    expect(right.left).toBeGreaterThan(main.left + main.width - 0.0001)
    expect(dashboardMosaic({ ...legacy, maximized: 'w_1' }).map(t => t.id)).toEqual(['w_1'])
    expect(dashboardMosaic({ occupants: {} })).toEqual([])
  })
})

describe('sa#625 — les vues qu un tableau de bord montre', () => {
  it('celles de ses volets diagramme sur la feuille, et celles que ses volets sont', () => {
    const main_zone = layout({
      canvas: canvasOn('v1'),
      other: canvasOn('v9', 'sheet_b'),
      here: canvasOn('v2', 'sheet_a'),
      pane: { place: 'right', size: 1, order: 1, representation: 'os.repr.donut', saved_view: 'v3' }
    })
    expect(dashboardShownViews(main_zone, 'sheet_a')).toEqual(['v1', 'v2', 'v3'])
    expect(dashboardShownViews(main_zone, 'sheet_b')).toEqual(['v1', 'v9', 'v3'])
    expect(dashboardShownViews(layout({}), '')).toEqual([])
  })
})
