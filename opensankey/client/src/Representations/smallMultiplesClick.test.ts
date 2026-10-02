// 02/10/2026 — PETITS MULTIPLES : LE CLIC SUR UNE PART OUVRE, DANS TOUTES LES CASES.
//
// Julien : « le clic ne marche pas sur les parts de couronne en mode multiple ». Les cases etaient
// dessinees sans le geste de la couronne (`on_part_activate`) : le clic selectionnait la part et
// n ouvrait rien. Le geste agit sur la dimension DECOUPEE en parts (la filiere), jamais sur celle
// des cases (les pays), et la coupe est celle de la figure : elle vaut pour chaque case.
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
  COORDINATES_LINKED_KEY, DIMENSION_OPENING_KEY, SMALL_MULTIPLES_KEY
} from './analysisFigureAttributes'

givePlainDrawingEnvironment()

beforeEach(() => registerAnalysisRepresentations())
afterEach(() => { document.body.innerHTML = '' })

const scene = (filiere_ouverts: string[]) => {
  const ws = new Class_Workspace(false)
  const source = ws.createDocument()
  source.drawing_area.bypass_redraws = true
  const sankey = source.drawing_area.sankey
  const filiere = sankey.addDataTagGroup('filiere', 'Filiere', false) as Class_DataTagGroup
  const produits = filiere.addTag('Produits', 'produits') as Class_DataTag
  const cereales = filiere.addTag('Cereales', 'cereales') as Class_DataTag
  const ble = filiere.addTag('Ble', 'ble') as Class_DataTag
  const mais = filiere.addTag('Mais', 'mais') as Class_DataTag
  cereales.parent = produits
  ble.parent = cereales
  mais.parent = cereales
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
  ;[filiere, pays].forEach(g => g.tags_list.forEach(t => t.setUnSelected()))
  produits.setSelected()
  monde.setSelected()

  const window_id = source.menu_configuration.openMainZoneWindow({ kind: 'selection' }, MAIN_ZONE_CANVAS_ID)
  // Une couronne DETACHEE, une case par pays (monde ouvert), la filiere decoupee en parts.
  const options = {
    descriptor: { decompose: { kind: 'data_dimension', data_tagg_id: 'filiere' }, compare: null },
    [SMALL_MULTIPLES_KEY]: 'pays',
    [COORDINATES_LINKED_KEY]: false,
    [DIMENSION_OPENING_KEY]: { pays: ['monde'], filiere: filiere_ouverts }
  }
  const ctx = { ...elementContext(source, lien as unknown as Type_Presentable), window_id, pane_key: 'p1', options }
  const ecrit = jest.spyOn(source.menu_configuration, 'setMainZonePaneOptions').mockImplementation(() => undefined)
  return { ctx, ecrit }
}

const dessiner = (ctx: ReturnType<typeof scene>['ctx']) => {
  const el = sizedContainer(600)
  const entree = representation_registry.get('osp.repr.donut')
  if (!entree) throw new Error('la couronne ne s est pas enregistree')
  const teardown = entree.draw?.(el, ctx)
  return { el, teardown }
}

/** Le secteur `id` dans la case de rang `rang` (1 = premiere). */
const secteur = (el: HTMLElement, rang: number, id: string): Element | null =>
  el.querySelector(
    `.figure_small_multiples > div:nth-child(${rang}) path.node_stats_arc[data-repr-id="${id}"]`
  )

const coupeEcrite = (ecrit: jest.SpyInstance): { [dim: string]: string[] } | undefined => {
  const last = ecrit.mock.calls[ecrit.mock.calls.length - 1]
  return (last?.[2] as { [k: string]: unknown } | undefined)?.[DIMENSION_OPENING_KEY] as
    { [dim: string]: string[] } | undefined
}

describe('petits multiples — le clic sur une part', () => {

  test('LE CAS DE JULIEN : cliquer une part de la deuxieme case ouvre le membre pour la figure', () => {
    const { ctx, ecrit } = scene(['produits'])
    const { el, teardown } = dessiner(ctx)
    expect(el.querySelectorAll('.figure_small_multiples > div').length).toBe(2)

    const part = secteur(el, 2, memberSectorId('filiere', 'cereales'))
    expect(part).not.toBeNull()
    part?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    // La filiere s ouvre d un cran ; la dimension des cases n a pas bouge.
    expect(ecrit).toHaveBeenCalled()
    const coupe = coupeEcrite(ecrit)
    expect(coupe?.filiere).toEqual(['produits', 'cereales'])
    expect(coupe?.pays).toEqual(['monde'])
    if (typeof teardown === 'function') teardown()
  })

  test('shift+clic referme, toujours sur la dimension des parts', () => {
    const { ctx, ecrit } = scene(['produits', 'cereales'])
    const { el, teardown } = dessiner(ctx)

    const part = secteur(el, 1, memberSectorId('filiere', 'ble'))
    expect(part).not.toBeNull()
    part?.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))

    const coupe = coupeEcrite(ecrit)
    expect(coupe?.filiere).toEqual(['produits'])
    expect(coupe?.pays).toEqual(['monde'])
    if (typeof teardown === 'function') teardown()
  })
})
