import { ViewsQuery, ViewsQueryHost, Type_ViewEntry, MASTER_VIEW_ID } from './ViewsQuery'

// #244 — ViewsQuery porte la logique PURE de vues (résolution / navigation / ordre) extraite
// d'ApplicationDataOSP. Testée via un hôte mocké (aucune Class_ApplicationDataOSP réelle, aucun
// import runtime OS/chakra).

type MockTag = { id: string, name: string }
type MockGroup = { id: string, name: string, tags_list: MockTag[] }

/** Construit un hôte minimal satisfaisant ViewsQueryHost (sankey réduit à view_taggs_list). */
const makeHost = (opts: {
  views?: { [id: string]: Type_ViewEntry }
  views_order?: string[]
  current_view_id?: string
  master_view_name?: string
  show_master_in_views?: boolean
  view_taggs_list?: MockGroup[]
  no_master?: boolean
  publish_view_label_filter?: string | null
}): ViewsQueryHost => {
  const views = opts.views ?? {}
  const sankey = { view_taggs_list: opts.view_taggs_list ?? [] }
  const da = { sankey } as unknown as ViewsQueryHost['drawing_area']
  return {
    views_dict: views,
    // has_views se dérive de views_order ; par défaut = clés des vues fournies.
    views_order: opts.views_order ?? Object.keys(views),
    current_view_id: opts.current_view_id ?? MASTER_VIEW_ID,
    master_view_name: opts.master_view_name ?? '',
    show_master_in_views: opts.show_master_in_views ?? false,
    master_drawing_area: opts.no_master ? undefined : da,
    drawing_area: da,
    publish_view_label_filter: opts.publish_view_label_filter ?? null,
  }
}

const view = (name: string, extra: Partial<Type_ViewEntry> = {}): Type_ViewEntry => ({
  name, json: new Uint8Array(), ...extra,
})

describe('#244 ViewsQuery.resolveViewIdFromSelection', () => {
  it('id réservé du maître → maître', () => {
    const vm = new ViewsQuery(makeHost({}))
    expect(vm.resolveViewIdFromSelection(MASTER_VIEW_ID)).toBe(MASTER_VIEW_ID)
  })

  it('id exact d\'une vue → cet id', () => {
    const vm = new ViewsQuery(makeHost({ views: { v1: view('Vue 1') } }))
    expect(vm.resolveViewIdFromSelection('v1')).toBe('v1')
  })

  it('nom de vue → id correspondant', () => {
    const vm = new ViewsQuery(makeHost({ views: { v1: view('Ma Vue') } }))
    expect(vm.resolveViewIdFromSelection('Ma Vue')).toBe('v1')
  })

  it('libellé du maître (master_view_name) → maître', () => {
    const vm = new ViewsQuery(makeHost({ master_view_name: 'Principale' }))
    expect(vm.resolveViewIdFromSelection('Principale')).toBe(MASTER_VIEW_ID)
  })

  it('valeur inconnue → null', () => {
    const vm = new ViewsQuery(makeHost({ views: { v1: view('Vue 1') } }))
    expect(vm.resolveViewIdFromSelection('inexistant')).toBeNull()
  })
})

describe('#244 ViewsQuery.resolveHeavyViewIdFromViewTagSelection', () => {
  const groups: MockGroup[] = [
    { id: 'g1', name: 'Groupe 1', tags_list: [{ id: 't1', name: 'Tag 1' }] },
  ]

  it('sans vues → null', () => {
    const vm = new ViewsQuery(makeHost({ views_order: [] }))
    expect(vm.resolveHeavyViewIdFromViewTagSelection({ g1: 't1' })).toBeNull()
  })

  it('id déterministe vt__<g>__<t> d\'une vue heavy → cet id', () => {
    const vm = new ViewsQuery(makeHost({
      view_taggs_list: groups,
      views: { 'vt__g1__t1': view('Générée') },
    }))
    expect(vm.resolveHeavyViewIdFromViewTagSelection({ g1: 't1' })).toBe('vt__g1__t1')
  })

  it('ignore une vue light au profit du fallback tag_selection heavy', () => {
    const vm = new ViewsQuery(makeHost({
      view_taggs_list: groups,
      views: {
        'vt__g1__t1': view('Light', { is_light: true }),
        'heavy': view('Heavy', { tag_selection: { g1: 't1' } }),
      },
    }))
    expect(vm.resolveHeavyViewIdFromViewTagSelection({ g1: 't1' })).toBe('heavy')
  })

  it('résout par nom de groupe/tag (pas seulement par id)', () => {
    const vm = new ViewsQuery(makeHost({
      view_taggs_list: groups,
      views: { 'vt__g1__t1': view('Générée') },
    }))
    expect(vm.resolveHeavyViewIdFromViewTagSelection({ 'Groupe 1': 'Tag 1' })).toBe('vt__g1__t1')
  })

  it('aucune vue heavy correspondante → null', () => {
    const vm = new ViewsQuery(makeHost({
      view_taggs_list: groups,
      views: { 'vt__g1__t1': view('Light', { is_light: true }) },
    }))
    expect(vm.resolveHeavyViewIdFromViewTagSelection({ g1: 't1' })).toBeNull()
  })
})

describe('#244 ViewsQuery.parseViewExtraFields', () => {
  it('pose tag_selection / is_light / generated_from_group_id sur l\'entrée', () => {
    const views = { v1: view('Vue 1') }
    const vm = new ViewsQuery(makeHost({ views }))
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
    const vm = new ViewsQuery(makeHost({ views: {} }))
    expect(() => vm.parseViewExtraFields('absent', { is_light: true })).not.toThrow()
  })
})

// sa#396 — LABELS DE VUES : étiquettes libres de SÉLECTION posées sur les vues. Distinctes des
// view tags (tag_selection ci-dessus), qui GÉNÈRENT des vues et ne bougent pas.
describe('sa#396 ViewsQuery — labels de vues', () => {
  it('parseViewExtraFields : lit labels (tableau de chaînes, nettoyé, dédoublonné)', () => {
    const views = { v1: view('Vue 1') }
    const vm = new ViewsQuery(makeHost({ views }))
    vm.parseViewExtraFields('v1', { labels: ['Résultats', 'Méthode', 'Résultats', '', 42, null] as never })
    expect(views.v1.labels).toEqual(['Résultats', 'Méthode'])
  })

  it('parseViewExtraFields : fichier ancien SANS labels → entrée sans labels, sans bruit', () => {
    const views = { v1: view('Vue 1') }
    const vm = new ViewsQuery(makeHost({ views }))
    expect(() => vm.parseViewExtraFields('v1', { tag_selection: { g1: 't1' } })).not.toThrow()
    expect(views.v1.labels).toBeUndefined()
  })

  it('parseViewExtraFields : labels non-tableau ou vide → ignoré', () => {
    const views = { v1: view('Vue 1') }
    const vm = new ViewsQuery(makeHost({ views }))
    vm.parseViewExtraFields('v1', { labels: 'Résultats' as never })
    expect(views.v1.labels).toBeUndefined()
    vm.parseViewExtraFields('v1', { labels: [] })
    expect(views.v1.labels).toBeUndefined()
  })

  it('all_view_labels : union dédoublonnée dans l\'ordre des vues', () => {
    const vm = new ViewsQuery(makeHost({
      views: {
        v1: view('Vue 1', { labels: ['Résultats', 'Interne'] }),
        v2: view('Vue 2', { labels: ['Méthode', 'Résultats'] }),
        v3: view('Vue 3'),
      },
    }))
    expect(vm.all_view_labels).toEqual(['Résultats', 'Interne', 'Méthode'])
  })

  it('viewIdsWithLabel : vues du label dans l\'ordre ; label inconnu → []', () => {
    const vm = new ViewsQuery(makeHost({
      views: {
        v1: view('Vue 1', { labels: ['Résultats'] }),
        v2: view('Vue 2'),
        v3: view('Vue 3', { labels: ['Résultats', 'Méthode'] }),
      },
    }))
    expect(vm.viewIdsWithLabel('Résultats')).toEqual(['v1', 'v3'])
    expect(vm.viewIdsWithLabel('Inconnu')).toEqual([])
  })
})

// sa#397 — le viewer publié restreint la navigation aux vues d'un label (publish_view_label_filter).
describe('sa#397 ViewsQuery — views_navigation_order sous filtre de label', () => {
  const labeled_views = () => ({
    v1: view('Vue 1', { labels: ['Résultats'] }),
    v2: view('Vue 2'),
    v3: view('Vue 3', { labels: ['Résultats'] }),
  })

  it('filtre actif : seules les vues du label, maître exclu', () => {
    const vm = new ViewsQuery(makeHost({
      views: labeled_views(),
      show_master_in_views: true,
      publish_view_label_filter: 'Résultats',
    }))
    expect(vm.views_navigation_order).toEqual(['v1', 'v3'])
  })

  it('sans filtre : comportement historique inchangé', () => {
    const vm = new ViewsQuery(makeHost({ views: labeled_views(), show_master_in_views: true }))
    expect(vm.views_navigation_order).toEqual([MASTER_VIEW_ID, 'v1', 'v2', 'v3'])
  })

  it('garde-fou : label sans aucune vue → filtre ignoré (jamais de sélecteur vide)', () => {
    const vm = new ViewsQuery(makeHost({
      views: labeled_views(),
      publish_view_label_filter: 'Inconnu',
    }))
    expect(vm.views_navigation_order).toEqual(['v1', 'v2', 'v3'])
  })

  it('les flèches Préc./Suiv. suivent l\'ordre filtré', () => {
    const mk = (current: string) => new ViewsQuery(makeHost({
      views: labeled_views(),
      current_view_id: current,
      publish_view_label_filter: 'Résultats',
    }))
    expect(mk('v1').has_view_before).toBe(false)
    expect(mk('v1').has_view_after).toBe(true)
    expect(mk('v3').has_view_before).toBe(true)
    expect(mk('v3').has_view_after).toBe(false)
  })
})

describe('#244 ViewsQuery — requêtes / navigation', () => {
  it('has_views / is_view_master selon l\'état', () => {
    expect(new ViewsQuery(makeHost({ views_order: [] })).has_views).toBe(false)
    expect(new ViewsQuery(makeHost({ views_order: ['a'] })).has_views).toBe(true)
    expect(new ViewsQuery(makeHost({ current_view_id: MASTER_VIEW_ID })).is_view_master).toBe(true)
    expect(new ViewsQuery(makeHost({ current_view_id: 'v1' })).is_view_master).toBe(false)
  })

  it('views_navigation_order : maître en tête seulement si show_master_in_views', () => {
    const base = { views_order: ['a', 'b'] }
    expect(new ViewsQuery(makeHost(base)).views_navigation_order).toEqual(['a', 'b'])
    expect(new ViewsQuery(makeHost({ ...base, show_master_in_views: true })).views_navigation_order)
      .toEqual([MASTER_VIEW_ID, 'a', 'b'])
  })

  it('has_view_before / has_view_after sur l\'ordre de navigation', () => {
    const mk = (current: string) => new ViewsQuery(makeHost({ views_order: ['a', 'b', 'c'], current_view_id: current }))
    expect(mk('a').has_view_before).toBe(false)
    expect(mk('a').has_view_after).toBe(true)
    expect(mk('c').has_view_before).toBe(true)
    expect(mk('c').has_view_after).toBe(false)
  })

  it('has_master_sankey : vues présentes + master_drawing_area défini', () => {
    expect(new ViewsQuery(makeHost({ views_order: ['a'] })).has_master_sankey).toBe(true)
    expect(new ViewsQuery(makeHost({ views_order: ['a'], no_master: true })).has_master_sankey).toBe(false)
    expect(new ViewsQuery(makeHost({ views_order: [] })).has_master_sankey).toBe(false)
  })

  it('layout_view_sources : maître + vues nommées', () => {
    const vm = new ViewsQuery(makeHost({
      views: { v1: view('Vue 1'), v2: view('Vue 2') },
      views_order: ['v1', 'v2'],
    }))
    expect(vm.layout_view_sources).toEqual([
      { id: MASTER_VIEW_ID, name: 'Vue principale' },
      { id: 'v1', name: 'Vue 1' },
      { id: 'v2', name: 'Vue 2' },
    ])
  })
})

describe('#244 ViewsQuery — ordre des vues (mutation en place)', () => {
  it('pushViewIdInViewOrder : ajoute en fin, dédoublonne', () => {
    const order = ['a', 'b']
    const vm = new ViewsQuery(makeHost({ views_order: order }))
    vm.pushViewIdInViewOrder('c')
    expect(order).toEqual(['a', 'b', 'c'])
    vm.pushViewIdInViewOrder('a') // déjà présent → repoussé en fin
    expect(order).toEqual(['b', 'c', 'a'])
  })

  it('moveViewUpInOrder : remonte d\'un cran, jamais avant le maître (idx 0)', () => {
    const order = [MASTER_VIEW_ID, 'a', 'b', 'c']
    const vm = new ViewsQuery(makeHost({ views_order: order }))
    vm.moveViewUpInOrder('c')
    expect(order).toEqual([MASTER_VIEW_ID, 'a', 'c', 'b'])
    vm.moveViewUpInOrder('a') // idx 1 → ne peut pas passer avant le maître
    expect(order).toEqual([MASTER_VIEW_ID, 'a', 'c', 'b'])
    vm.moveViewUpInOrder(MASTER_VIEW_ID) // le maître ne bouge pas
    expect(order).toEqual([MASTER_VIEW_ID, 'a', 'c', 'b'])
  })

  it('moveViewDownInOrder : descend d\'un cran, no-op en fin de liste', () => {
    const order = [MASTER_VIEW_ID, 'a', 'b']
    const vm = new ViewsQuery(makeHost({ views_order: order }))
    vm.moveViewDownInOrder('a')
    expect(order).toEqual([MASTER_VIEW_ID, 'b', 'a'])
    vm.moveViewDownInOrder('a') // déjà en fin
    expect(order).toEqual([MASTER_VIEW_ID, 'b', 'a'])
  })
})
