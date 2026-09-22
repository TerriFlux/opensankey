// os#1482 — LES SCENES, la vue de l espace de travail (cf. NOTE-SCENES.md).
//
// Ces tests figent le magasin pur : son format (clé racine `scenes`, additive), la regle du
// repli automatique (une vue sans scene est une scene implicite, A SA PLACE), la migration
// d une disposition figee par vue (`view_main_zone`) en scene, et le sujet de fenetre etendu
// `{ kind: 'diagram', sheet?, view? }` qui traverse `mainZoneStateToJSON` / `FromJSON`.

import {
  Class_ScenesStore, implicitSceneId, viewIdOfImplicitScene, migratedSceneId,
  mainZoneWithViewOnCurrentSheet, sceneViewRefs
} from './Scenes'
import { Class_ApplicationData } from './ApplicationData'
import { MAIN_ZONE_CANVAS_ID, mainZoneSubjectView } from './MenuConfig'
import type { Type_JSON } from './Utils'

const layout = (occupants: Type_JSON): Type_JSON => ({ occupants, split_ratio: 0.6, bottom_px: 200 })
const canvasOn = (view: string, sheet?: string): Type_JSON => {
  const subject: Type_JSON = { kind: 'diagram', view }
  if (sheet) subject['sheet'] = sheet
  return { place: 'main', size: 1, order: 0, representation: MAIN_ZONE_CANVAS_ID, subject }
}

describe('identifiants de scene', () => {
  it('une scene implicite se reconnait et rend sa vue', () => {
    expect(viewIdOfImplicitScene(implicitSceneId('v1'))).toBe('v1')
    expect(viewIdOfImplicitScene('s_1')).toBeNull()
    expect(migratedSceneId('v1')).toBe('scene_v1')
  })
})

describe('le magasin : format et aller-retour', () => {
  it('sans scene, rien n est ecrit (cle additive)', () => {
    expect(new Class_ScenesStore().toJSON()).toBeUndefined()
  })

  it('l aller-retour rend les scenes, leur ordre, la courante explicite', () => {
    const store = new Class_ScenesStore()
    store.add({ id: store.newId(), name: 'Bilan', description: 'd', main_zone: layout({ [MAIN_ZONE_CANVAS_ID]: canvasOn('v1') }) })
    store.add({ id: store.newId(), name: 'Riz', main_zone: layout({ w_2: canvasOn('riz', 'S2') }) })
    store.current = 's_2'
    const json = store.toJSON()!
    expect(json['order']).toEqual(['s_1', 's_2'])
    expect(json['current']).toBe('s_2')

    const relu = new Class_ScenesStore()
    relu.fromJSON(json)
    expect(relu.order).toEqual(['s_1', 's_2'])
    expect(relu.byId('s_1')?.description).toBe('d')
    expect(relu.byId('s_2')?.name).toBe('Riz')
    expect(relu.current).toBe('s_2')
    // Le compteur repart apres le plus grand N lu : jamais un identifiant deja pris.
    expect(relu.newId()).toBe('s_3')
  })

  it('une courante implicite n est pas ecrite : la vue courante la dit deja', () => {
    const store = new Class_ScenesStore()
    store.add({ id: 's_1', name: 'A', main_zone: layout({}) })
    store.current = implicitSceneId('v1')
    expect('current' in store.toJSON()!).toBe(false)
  })

  it('la cle absente VIDE le magasin : c est un autre fichier', () => {
    const store = new Class_ScenesStore()
    store.add({ id: 's_1', name: 'A', main_zone: layout({}) })
    store.fromJSON(undefined)
    expect(store.has_scenes).toBe(false)
  })
})

describe('l ordre de navigation : le repli automatique', () => {
  it('une vue sans scene est une scene implicite, une vue citee est remplacee A SA PLACE', () => {
    const store = new Class_ScenesStore()
    store.add({ id: 'scene_b', name: 'B', main_zone: layout({ [MAIN_ZONE_CANVAS_ID]: canvasOn('b') }) })
    expect(store.navigationOrder(['a', 'b', 'c'], '')).toEqual([implicitSceneId('a'), 'scene_b', implicitSceneId('c')])
  })

  it('une scene qui ne cite que d autres feuilles vient en queue', () => {
    const store = new Class_ScenesStore()
    store.add({ id: 's_1', name: 'Autre feuille', main_zone: layout({ w_1: canvasOn('riz', 'S2') }) })
    expect(store.navigationOrder(['a'], 'S1')).toEqual([implicitSceneId('a'), 's_1'])
    // Sur la feuille S2, elle cite une vue : elle prend la place de cette vue.
    expect(store.navigationOrder(['riz'], 'S2')).toEqual(['s_1'])
  })

  it('une scene qui ne cite que des vues HORS de l ordre reste listee, en queue', () => {
    // os#1492 — REGLE INVERSEE, et c est la correction d un bug : cette scene DISPARAISSAIT.
    // Une scene appartient au CLASSEUR, pas a une feuille ni a un filtre de vues : la liste ne
    // doit pas se vider quand on change d onglet. C etait mesure sur le classeur d exemple —
    // deux des trois scenes s evaporaient sur la seconde feuille.
    const store = new Class_ScenesStore()
    store.add({ id: 's_1', name: 'Ailleurs', main_zone: layout({ [MAIN_ZONE_CANVAS_ID]: canvasOn('z') }) })
    expect(store.navigationOrder(['a'], '')).toEqual([implicitSceneId('a'), 's_1'])
  })

  it('une scene citant une vue de la feuille courante prend SA place, pas la queue', () => {
    const store = new Class_ScenesStore()
    store.add({ id: 's_1', name: 'Sur b', main_zone: layout({ [MAIN_ZONE_CANVAS_ID]: canvasOn('b') }) })
    store.add({ id: 's_2', name: 'Ailleurs', main_zone: layout({ [MAIN_ZONE_CANVAS_ID]: canvasOn('z') }) })
    expect(store.navigationOrder(['a', 'b', 'c'], ''))
      .toEqual([implicitSceneId('a'), 's_1', implicitSceneId('c'), 's_2'])
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
    const refs = sceneViewRefs(after)
    expect(refs.map(r => [r.occupant_id, r.sheet, r.view])).toEqual([
      [MAIN_ZONE_CANVAS_ID, '', 'v1'], ['os.repr.sheet', '', 'v1']
    ])
    // L original n est pas touche.
    expect(sceneViewRefs(before)).toEqual([])
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
