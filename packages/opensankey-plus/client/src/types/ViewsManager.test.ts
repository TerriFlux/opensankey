import { ViewsManager, ViewsManagerHost, Type_ViewEntry, MASTER_VIEW_ID } from './ViewsManager'

// #244 — ViewsManager extrait la logique de vues d'ApplicationDataOSP. La résolution de
// vues est pure : testée via un hôte mocké (pas de Class_ApplicationDataOSP réelle).

type MockTag = { id: string, name: string }
type MockGroup = { id: string, name: string, tags_list: MockTag[] }

/** Construit un hôte minimal satisfaisant ViewsManagerHost (sankey réduit à view_taggs_list). */
const makeHost = (opts: {
  views?: { [id: string]: Type_ViewEntry }
  master_view_name?: string
  has_views?: boolean
  view_taggs_list?: MockGroup[]
}): ViewsManagerHost => {
  const sankey = { view_taggs_list: opts.view_taggs_list ?? [] }
  const da = { sankey } as unknown as ViewsManagerHost['drawing_area']
  return {
    views_dict: opts.views ?? {},
    master_view_name: opts.master_view_name ?? '',
    has_views: opts.has_views ?? true,
    master_drawing_area: da,
    drawing_area: da,
  }
}

const view = (name: string, extra: Partial<Type_ViewEntry> = {}): Type_ViewEntry => ({
  name, json: new Uint8Array(), ...extra,
})

describe('#244 ViewsManager.resolveViewIdFromSelection', () => {
  it('id réservé du maître → maître', () => {
    const vm = new ViewsManager(makeHost({}))
    expect(vm.resolveViewIdFromSelection(MASTER_VIEW_ID)).toBe(MASTER_VIEW_ID)
  })

  it('id exact d\'une vue → cet id', () => {
    const vm = new ViewsManager(makeHost({ views: { v1: view('Vue 1') } }))
    expect(vm.resolveViewIdFromSelection('v1')).toBe('v1')
  })

  it('nom de vue → id correspondant', () => {
    const vm = new ViewsManager(makeHost({ views: { v1: view('Ma Vue') } }))
    expect(vm.resolveViewIdFromSelection('Ma Vue')).toBe('v1')
  })

  it('libellé du maître (master_view_name) → maître', () => {
    const vm = new ViewsManager(makeHost({ master_view_name: 'Principale' }))
    expect(vm.resolveViewIdFromSelection('Principale')).toBe(MASTER_VIEW_ID)
  })

  it('valeur inconnue → null', () => {
    const vm = new ViewsManager(makeHost({ views: { v1: view('Vue 1') } }))
    expect(vm.resolveViewIdFromSelection('inexistant')).toBeNull()
  })
})

describe('#244 ViewsManager.resolveHeavyViewIdFromViewTagSelection', () => {
  const groups: MockGroup[] = [
    { id: 'g1', name: 'Groupe 1', tags_list: [{ id: 't1', name: 'Tag 1' }] },
  ]

  it('sans vues → null', () => {
    const vm = new ViewsManager(makeHost({ has_views: false }))
    expect(vm.resolveHeavyViewIdFromViewTagSelection({ g1: 't1' })).toBeNull()
  })

  it('id déterministe vt__<g>__<t> d\'une vue heavy → cet id', () => {
    const vm = new ViewsManager(makeHost({
      view_taggs_list: groups,
      views: { 'vt__g1__t1': view('Générée') },
    }))
    expect(vm.resolveHeavyViewIdFromViewTagSelection({ g1: 't1' })).toBe('vt__g1__t1')
  })

  it('ignore une vue light au profit du fallback tag_selection heavy', () => {
    const vm = new ViewsManager(makeHost({
      view_taggs_list: groups,
      views: {
        'vt__g1__t1': view('Light', { is_light: true }),
        'heavy': view('Heavy', { tag_selection: { g1: 't1' } }),
      },
    }))
    expect(vm.resolveHeavyViewIdFromViewTagSelection({ g1: 't1' })).toBe('heavy')
  })

  it('résout par nom de groupe/tag (pas seulement par id)', () => {
    const vm = new ViewsManager(makeHost({
      view_taggs_list: groups,
      views: { 'vt__g1__t1': view('Générée') },
    }))
    expect(vm.resolveHeavyViewIdFromViewTagSelection({ 'Groupe 1': 'Tag 1' })).toBe('vt__g1__t1')
  })

  it('aucune vue heavy correspondante → null', () => {
    const vm = new ViewsManager(makeHost({
      view_taggs_list: groups,
      views: { 'vt__g1__t1': view('Light', { is_light: true }) },
    }))
    expect(vm.resolveHeavyViewIdFromViewTagSelection({ g1: 't1' })).toBeNull()
  })
})

describe('#244 ViewsManager.parseViewExtraFields', () => {
  it('pose tag_selection / is_light / generated_from_group_id sur l\'entrée', () => {
    const views = { v1: view('Vue 1') }
    const vm = new ViewsManager(makeHost({ views }))
    vm.parseViewExtraFields('v1', {
      tag_selection: { g1: 't1' },
      is_light: true,
      generated_from_group_id: 'g1',
    })
    expect(views.v1.tag_selection).toEqual({ g1: 't1' })
    expect(views.v1.is_light).toBe(true)
    expect(views.v1.generated_from_group_id).toBe('g1')
  })

  it('entrée absente → no-op (pas de crash)', () => {
    const vm = new ViewsManager(makeHost({ views: {} }))
    expect(() => vm.parseViewExtraFields('absent', { is_light: true })).not.toThrow()
  })
})
