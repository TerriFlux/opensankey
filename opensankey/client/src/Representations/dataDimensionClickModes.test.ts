// 02/10/2026 — « CLIC SUR UNE PART » SUR UNE COURONNE DE DIMENSION DE DONNEES : chaque mode, son effet.
//
// Julien : « Zoome dedans ne zoome pas : c est toujours le deplie dans le diagramme. » Le zoom n etait
// pas code pour une dimension de donnees, et une figure liee ecrivait la coupe du diagramme quel que
// soit le reglage. Chaque mode est verifie sur ses DEUX effets : la figure, le diagramme.
//
//   'none'      ouvre l anneau dans la figure (coupe propre), le diagramme ne bouge pas ;
//   'aggregate' ouvre l anneau, et le diagramme suit ;
//   'zoom'      re-enracine (`hierarchy_focus`), sans ouvrir ni toucher au diagramme ;
//   'both'      re-enracine, et le diagramme suit ;
//   sans diagramme affiche, rien n est ecrit au diagramme et ses deux choix se grisent.
//
//   filiere : produits > cereales > (ble, mais)          pays : monde > (fr, de)

import { Class_Workspace } from '../types/Workspace'
import { MAIN_ZONE_CANVAS_ID } from '../types/MenuConfig'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkValue } from '../Elements/LinkValues'
import { memberSectorId } from '../Charts/memberSectorId'
import { givePlainDrawingEnvironment, sizedContainer } from '../Charts/figureDomHarness.test-utils'
import { registerAnalysisRepresentations } from './registerAnalysisRepresentations'
import { representation_registry, elementContext } from './RepresentationRegistry'
import type { Type_Presentable } from '../components/panels/presentation/openPresentation'
import {
  COORDINATES_LINKED_KEY, DIMENSION_OPENING_KEY, HIERARCHY_FOCUS_KEY, LEVELS_DISPLAY_BY_KEY, SMALL_MULTIPLES_KEY
} from './analysisFigureAttributes'
import { INTERACTION_CONFIG } from './figureCatalogue'
import { figureControlsOf } from './figureControls'

givePlainDrawingEnvironment()

beforeEach(() => registerAnalysisRepresentations())
afterEach(() => {
  document.body.innerHTML = ''
  jest.restoreAllMocks()
})

const CEREALES = memberSectorId('filiere', 'cereales')
const BLE = memberSectorId('filiere', 'ble')

type Scene = {
  clic: string
  linked?: boolean
  focus?: string[]
  multiples?: boolean
  sans_diagramme?: boolean
}

const scene = ({ clic, linked = false, focus, multiples = false, sans_diagramme = false }: Scene) => {
  const ws = new Class_Workspace(false)
  const source = ws.createDocument()
  source.drawing_area.bypass_redraws = true
  const sankey = source.drawing_area.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
  const produits = filiere.addTag('Produits', 'produits') as Class_DataTag
  const cereales = filiere.addTag('Cereales', 'cereales') as Class_DataTag
  const ble = filiere.addTag('Ble', 'ble') as Class_DataTag
  const mais = filiere.addTag('Mais', 'mais') as Class_DataTag
  const lait = filiere.addTag('Lait', 'lait') as Class_DataTag
  cereales.parent = produits
  ble.parent = cereales
  mais.parent = cereales
  lait.parent = produits
  filiere.levels = ['produits', 'filieres', 'produit']
  const pays = sankey.addDataTagGroup('pays', 'Pays', false) as Class_DataTagGroup
  const monde = pays.addTag('Monde', 'monde') as Class_DataTag
  const fr = pays.addTag('France', 'fr') as Class_DataTag
  const de = pays.addTag('Allemagne', 'de') as Class_DataTag
  fr.parent = monde
  de.parent = monde
  pays.levels = ['monde', 'pays']
  const lien = sankey.addNewLink(sankey.addNewNodeWithName('A'), sankey.addNewNodeWithName('B'))
  const poser = (a: Class_DataTag, b: Class_DataTag, v: number) => {
    ;[filiere, pays].forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
    a.setSelected()
    b.setSelected()
    ;(lien.value as Class_LinkValue).valueData = v
  }
  poser(ble, fr, 10)
  poser(ble, de, 20)
  poser(mais, fr, 5)
  poser(mais, de, 7)
  poser(lait, fr, 4)
  poser(lait, de, 3)
  ;[filiere, pays].forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
  // Le diagramme montre les filieres a un cran : Cereales et Lait.
  cereales.setSelected()
  lait.setSelected()
  monde.setSelected()

  const window_id = source.menu_configuration.openMainZoneWindow({ kind: 'selection' }, MAIN_ZONE_CANVAS_ID)
  const options: { [k: string]: unknown } = {
    descriptor: { decompose: { kind: 'data_dimension', data_tagg_id: 'filiere' }, compare: null },
    interaction_click: clic,
    // 03/10/2026 — seule, une dimension se dessine en sunburst par defaut : ces gestes sont ceux de
    // la couronne EN PLACE, qu on demande donc explicitement.
    [LEVELS_DISPLAY_BY_KEY]: { filiere: 'in_place' },
    ...(linked ? {} : {
      [COORDINATES_LINKED_KEY]: false,
      [DIMENSION_OPENING_KEY]: { pays: ['monde'], filiere: ['produits'] }
    }),
    ...(multiples ? { [SMALL_MULTIPLES_KEY]: 'pays' } : {}),
    ...(focus ? { [HIERARCHY_FOCUS_KEY]: focus } : {})
  }
  const ctx = { ...elementContext(source, lien as unknown as Type_Presentable), window_id, pane_key: 'p1', options }
  const ecrit = jest.spyOn(source.menu_configuration, 'setMainZonePaneOptions').mockImplementation(() => undefined)
  const diagramme = jest.spyOn(source, 'runHeavyGesture').mockImplementation(() => undefined)
  if (sans_diagramme) {
    jest.spyOn(source.menu_configuration, 'main_zone_sankey_panes', 'get').mockReturnValue([])
  }
  return { ctx, ecrit, diagramme, source }
}

const dessiner = (ctx: ReturnType<typeof scene>['ctx']) => {
  const el = sizedContainer(600)
  const entree = representation_registry.get('osp.repr.donut')
  if (!entree) throw new Error('la couronne ne s est pas enregistree')
  const teardown = entree.draw?.(el, ctx)
  return { el, teardown: () => { if (typeof teardown === 'function') teardown() } }
}

const cliquer = (el: HTMLElement, id: string, shift = false) => {
  const part = el.querySelector(`path.node_stats_arc[data-repr-id="${id}"]`)
  expect(part).not.toBeNull()
  part?.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: shift }))
}

const dernierSac = (ecrit: jest.SpyInstance): { [k: string]: unknown } | undefined => {
  const last = ecrit.mock.calls[ecrit.mock.calls.length - 1]
  return last?.[2] as { [k: string]: unknown } | undefined
}

describe('clic sur une part — couronne de dimension de donnees', () => {

  test('RIEN DE PLUS : la figure ouvre Cereales, le diagramme ne bouge pas', () => {
    const { ctx, ecrit, diagramme } = scene({ clic: 'none' })
    const { el, teardown } = dessiner(ctx)
    cliquer(el, CEREALES)
    expect((dernierSac(ecrit)?.[DIMENSION_OPENING_KEY] as { filiere: string[] }).filiere)
      .toEqual(['produits', 'cereales'])
    expect(dernierSac(ecrit)?.[HIERARCHY_FOCUS_KEY]).toBeUndefined()
    expect(diagramme).not.toHaveBeenCalled()
    teardown()
  })

  test('LE DEPLIE DANS LE DIAGRAMME : la figure ouvre, et le diagramme suit', () => {
    const { ctx, ecrit, diagramme } = scene({ clic: 'aggregate' })
    const { el, teardown } = dessiner(ctx)
    cliquer(el, CEREALES)
    expect((dernierSac(ecrit)?.[DIMENSION_OPENING_KEY] as { filiere: string[] }).filiere)
      .toEqual(['produits', 'cereales'])
    expect(diagramme).toHaveBeenCalledTimes(1)
    teardown()
  })

  test('LE CAS DE JULIEN — ZOOME DEDANS SEULEMENT : le foyer s empile, ni coupe ni diagramme', () => {
    const { ctx, ecrit, diagramme } = scene({ clic: 'zoom' })
    const { el, teardown } = dessiner(ctx)
    cliquer(el, CEREALES)
    const sac = dernierSac(ecrit)
    expect(sac?.[HIERARCHY_FOCUS_KEY]).toEqual([CEREALES])
    // La coupe propre est celle d avant : zoomer n ouvre rien.
    expect((sac?.[DIMENSION_OPENING_KEY] as { filiere: string[] }).filiere).toEqual(['produits'])
    expect(diagramme).not.toHaveBeenCalled()
    teardown()
  })

  test('zoome dedans seulement, figure LIEE : le diagramme ne bouge toujours pas', () => {
    const { ctx, ecrit, diagramme } = scene({ clic: 'zoom', linked: true })
    const { el, teardown } = dessiner(ctx)
    cliquer(el, CEREALES)
    expect(dernierSac(ecrit)?.[HIERARCHY_FOCUS_KEY]).toEqual([CEREALES])
    expect(diagramme).not.toHaveBeenCalled()
    teardown()
  })

  test('ZOOME DEDANS ET LE DEPLIE : le foyer s empile, et le diagramme suit', () => {
    const { ctx, ecrit, diagramme } = scene({ clic: 'both' })
    const { el, teardown } = dessiner(ctx)
    cliquer(el, CEREALES)
    expect(dernierSac(ecrit)?.[HIERARCHY_FOCUS_KEY]).toEqual([CEREALES])
    expect(diagramme).toHaveBeenCalledTimes(1)
    teardown()
  })

  test('on ne zoome pas sur une feuille : Lait n a rien dessous', () => {
    const { ctx, ecrit, diagramme } = scene({ clic: 'zoom' })
    const { el, teardown } = dessiner(ctx)
    cliquer(el, memberSectorId('filiere', 'lait'))
    expect(ecrit).not.toHaveBeenCalled()
    expect(diagramme).not.toHaveBeenCalled()
    teardown()
  })

  test('zoomee sur Cereales : Ble et Mais font l anneau, le centre remonte d un cran', () => {
    const { ctx, ecrit } = scene({ clic: 'zoom', focus: [CEREALES] })
    const { el, teardown } = dessiner(ctx)
    const ids = [...el.querySelectorAll('path.node_stats_arc')].map(p => p.getAttribute('data-repr-id'))
    expect(ids.sort()).toEqual([BLE, memberSectorId('filiere', 'mais')].sort())
    const centre = el.querySelector('.node_stats_centre_back')
    expect(centre).not.toBeNull()
    centre?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(dernierSac(ecrit)?.[HIERARCHY_FOCUS_KEY]).toBeUndefined()
    teardown()
  })

  test('shift+clic sous le zoom remonte d un cran, comme le centre', () => {
    const { ctx, ecrit, diagramme } = scene({ clic: 'zoom', focus: [CEREALES] })
    const { el, teardown } = dessiner(ctx)
    cliquer(el, BLE, true)
    expect(dernierSac(ecrit)?.[HIERARCHY_FOCUS_KEY]).toBeUndefined()
    expect(diagramme).not.toHaveBeenCalled()
    teardown()
  })

  test('PETITS MULTIPLES : zoomer re-enracine toutes les cases sur la meme part', () => {
    const { ctx } = scene({ clic: 'zoom', focus: [CEREALES], multiples: true })
    ;(ctx.options as { [k: string]: unknown })[DIMENSION_OPENING_KEY] = { pays: ['monde'], filiere: ['produits'] }
    const { el, teardown } = dessiner(ctx)
    const cases = [...el.querySelectorAll('.figure_small_multiples > div')]
    expect(cases.length).toBe(2)
    cases.forEach(c => {
      const ids = [...c.querySelectorAll('path.node_stats_arc')].map(p => p.getAttribute('data-repr-id'))
      expect(ids).toContain(BLE)
      expect(ids).not.toContain(CEREALES)
    })
    teardown()
  })

  test('SANS DIAGRAMME AFFICHE : le deplie n ecrit rien au diagramme', () => {
    const { ctx, diagramme } = scene({ clic: 'aggregate', sans_diagramme: true })
    const { el, teardown } = dessiner(ctx)
    cliquer(el, CEREALES)
    expect(diagramme).not.toHaveBeenCalled()
    teardown()
  })

  test('SANS DIAGRAMME AFFICHE : les deux choix qui le nomment se grisent, avec leur raison', () => {
    const { source } = scene({ clic: 'none', sans_diagramme: true })
    const [item] = figureControlsOf(
      { interaction_click: INTERACTION_CONFIG.interaction_click as never }, {}, ['style'], 'fr',
      { app_data: source as never }
    )
    const grises = (item.choices ?? []).filter(c => c.disabled).map(c => c.value)
    expect(grises.sort()).toEqual(['aggregate', 'both'])
    expect((item.choices ?? []).find(c => c.value === 'aggregate')?.reason).toMatch(/diagramme/)
  })

  test('avec le diagramme affiche, aucun choix n est grise', () => {
    const { source } = scene({ clic: 'none' })
    const [item] = figureControlsOf(
      { interaction_click: INTERACTION_CONFIG.interaction_click as never }, {}, ['style'], 'fr',
      { app_data: source as never }
    )
    expect((item.choices ?? []).some(c => c.disabled)).toBe(false)
  })
})
