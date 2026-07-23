import {
  layoutFor,
  normalizeLayout,
  normalizeAllLayouts,
  placeBlock,
  unplaceBlock,
  clearLayout,
  compositionFromJSON,
  compositionToJSON,
  tabLabelsFromJSON,
  tabLabelsToJSON,
  tabLabelAt,
  setTabLabel,
  blockPlacementFromJSON,
  MAX_TABS,
  MAX_ROWS,
  DEFAULT_BLOCK_VISIBILITY,
  type Type_Composition
} from './PresentationComposition'

// AJUSTEMENT #5 — disposition des blocs par contenant : onglets, rangées, et
// blocs côte à côte sur une même rangée.

const entry = (block: string, layout?: unknown): never =>
  ({ block, show: { ...DEFAULT_BLOCK_VISIBILITY }, ...(layout ? { layout } : {}) }) as never

const ids = (rows: { block: string }[][]) => rows.map(r => r.map(e => e.block))

describe('#5 layoutFor — disposition par défaut', () => {
  it('sans placement : un seul onglet, un bloc par rangée, dans l\'ordre', () => {
    // C'est l'empilement d'avant #5 : un document déjà composé ne bouge pas.
    const composition: Type_Composition = [entry('a'), entry('b'), entry('c')]
    const tabs = layoutFor(composition, 'tooltip')
    expect(tabs).toHaveLength(1)
    expect(ids(tabs[0])).toEqual([['a'], ['b'], ['c']])
  })

  it('ne retient que les blocs visibles DANS CE CONTENANT', () => {
    const composition: Type_Composition = [
      { block: 'a', show: { tooltip: true, popup: true, sidebar: true } },
      { block: 'b', show: { tooltip: false, popup: true, sidebar: true } }
    ]
    expect(ids(layoutFor(composition, 'tooltip')[0])).toEqual([['a']])
    expect(ids(layoutFor(composition, 'popup')[0])).toEqual([['a'], ['b']])
  })

  it('rend une liste vide quand rien n\'est visible ici', () => {
    expect(layoutFor([], 'tooltip')).toEqual([])
  })
})

describe('#5 layoutFor — côte à côte et onglets', () => {
  it('deux blocs sur la MÊME rangée s\'affichent côte à côte, dans l\'ordre de la composition', () => {
    const composition: Type_Composition = [
      entry('a', { tooltip: { tab: 0, row: 0 } }),
      entry('b', { tooltip: { tab: 0, row: 0 } })
    ]
    expect(ids(layoutFor(composition, 'tooltip')[0])).toEqual([['a', 'b']])
  })

  it('des rangées différentes s\'empilent, triées par index', () => {
    const composition: Type_Composition = [
      entry('bas', { tooltip: { tab: 0, row: 5 } }),
      entry('haut', { tooltip: { tab: 0, row: 1 } })
    ]
    expect(ids(layoutFor(composition, 'tooltip')[0])).toEqual([['haut'], ['bas']])
  })

  it('des onglets différents donnent plusieurs onglets, triés par index', () => {
    const composition: Type_Composition = [
      entry('second', { tooltip: { tab: 1, row: 0 } }),
      entry('premier', { tooltip: { tab: 0, row: 0 } })
    ]
    const tabs = layoutFor(composition, 'tooltip')
    expect(tabs).toHaveLength(2)
    expect(ids(tabs[0])).toEqual([['premier']])
    expect(ids(tabs[1])).toEqual([['second']])
  })

  it('COMPACTE les onglets et rangées vides', () => {
    // L'auteur a vidé l'onglet 0 et la rangée 0 : le lecteur ne doit pas voir
    // d'onglet fantôme ni de rangée blanche.
    const composition: Type_Composition = [
      entry('seul', { tooltip: { tab: 3, row: 7 } })
    ]
    const tabs = layoutFor(composition, 'tooltip')
    expect(tabs).toHaveLength(1)
    expect(ids(tabs[0])).toEqual([['seul']])
  })

  it('un bloc NON placé prend une rangée propre, APRÈS les blocs placés', () => {
    const composition: Type_Composition = [
      entry('libre'),
      entry('place', { tooltip: { tab: 0, row: 0 } })
    ]
    expect(ids(layoutFor(composition, 'tooltip')[0])).toEqual([['place'], ['libre']])
  })

  it('la disposition est PROPRE À CHAQUE CONTENANT', () => {
    const composition: Type_Composition = [
      entry('a', { tooltip: { tab: 0, row: 0 }, sidebar: { tab: 0, row: 0 } }),
      entry('b', { tooltip: { tab: 0, row: 0 }, sidebar: { tab: 0, row: 1 } })
    ]
    // Côte à côte en info-bulle, empilés dans le panneau.
    expect(ids(layoutFor(composition, 'tooltip')[0])).toEqual([['a', 'b']])
    expect(ids(layoutFor(composition, 'sidebar')[0])).toEqual([['a'], ['b']])
  })
})

describe('#5 placeBlock / unplaceBlock', () => {
  const base: Type_Composition = [entry('a'), entry('b')]

  it('placer rend le bloc visible dans ce contenant', () => {
    const composition: Type_Composition = [
      { block: 'a', show: { tooltip: false, popup: true, sidebar: true } }
    ]
    const next = placeBlock(composition, 'a', 'tooltip', { tab: 0, row: 0 })
    expect(next[0].show.tooltip).toBe(true)
    expect(next[0].layout?.tooltip).toEqual({ tab: 0, row: 0 })
  })

  it('ne mute pas la composition d\'origine', () => {
    placeBlock(base, 'a', 'popup', { tab: 1, row: 2 })
    expect(base[0].layout).toBeUndefined()
  })

  it('ne touche pas aux autres contenants', () => {
    const next = placeBlock(
      placeBlock(base, 'a', 'popup', { tab: 0, row: 0 }),
      'a', 'sidebar', { tab: 1, row: 3 })
    expect(next[0].layout).toEqual({ popup: { tab: 0, row: 0 }, sidebar: { tab: 1, row: 3 } })
  })

  it('refuse un placement hors bornes plutôt que de le tronquer', () => {
    expect(placeBlock(base, 'a', 'popup', { tab: MAX_TABS, row: 0 })).toBe(base)
    expect(placeBlock(base, 'a', 'popup', { tab: 0, row: MAX_ROWS })).toBe(base)
    expect(placeBlock(base, 'a', 'popup', { tab: -1, row: 0 })).toBe(base)
  })

  it('retirer d\'un contenant masque le bloc ET oublie son placement', () => {
    const placed = placeBlock(base, 'a', 'popup', { tab: 0, row: 0 })
    const next = unplaceBlock(placed, 'a', 'popup')
    expect(next[0].show.popup).toBe(false)
    expect(next[0].layout).toBeUndefined()
  })

  it('retirer d\'un contenant préserve le placement des AUTRES', () => {
    const placed = placeBlock(
      placeBlock(base, 'a', 'popup', { tab: 0, row: 0 }),
      'a', 'tooltip', { tab: 0, row: 1 })
    const next = unplaceBlock(placed, 'a', 'popup')
    expect(next[0].layout).toEqual({ tooltip: { tab: 0, row: 1 } })
  })

  it('clearLayout revient à l\'empilement sans rien masquer', () => {
    const placed = placeBlock(
      placeBlock(base, 'a', 'popup', { tab: 1, row: 0 }),
      'b', 'popup', { tab: 1, row: 0 })
    const next = clearLayout(placed, 'popup')
    expect(next.every(e => e.layout?.popup === undefined)).toBe(true)
    expect(next.every(e => e.show.popup)).toBe(true)
    expect(ids(layoutFor(next, 'popup')[0])).toEqual([['a'], ['b']])
  })
})

describe('#5 normalisation', () => {
  it('rend les index STOCKÉS égaux aux index AFFICHÉS, sans rien changer à l\'affichage', () => {
    const composition: Type_Composition = [
      entry('a', { tooltip: { tab: 0, row: 0 } }),
      entry('b', { tooltip: { tab: 3, row: 9 } })
    ]
    const before = ids(layoutFor(composition, 'tooltip')[0])
    const next = normalizeLayout(composition, 'tooltip')
    expect(next[1].layout?.tooltip).toEqual({ tab: 1, row: 0 })
    expect(ids(layoutFor(next, 'tooltip')[0])).toEqual(before)
  })

  it('donne un placement explicite aux blocs qui n\'en avaient pas', () => {
    const next = normalizeLayout([entry('a'), entry('b')], 'popup')
    expect(next[0].layout?.popup).toEqual({ tab: 0, row: 0 })
    expect(next[1].layout?.popup).toEqual({ tab: 0, row: 1 })
  })

  it('ne place pas un bloc invisible dans ce contenant', () => {
    const composition: Type_Composition = [
      { block: 'a', show: { tooltip: false, popup: true, sidebar: true } }
    ]
    expect(normalizeLayout(composition, 'tooltip')[0].layout).toBeUndefined()
  })

  it('normalizeAllLayouts rend l\'ORDRE de la liste sans effet sur l\'affichage', () => {
    // C'est l'invariant qui permet à l'éditeur de réordonner la composition pour
    // ranger une rangée, sans bousculer les deux autres contenants.
    const composition: Type_Composition = [entry('a'), entry('b'), entry('c')]
    const fige = normalizeAllLayouts(composition)
    const inverse = [fige[2], fige[1], fige[0]]
    expect(ids(layoutFor(inverse, 'tooltip')[0])).toEqual([['a'], ['b'], ['c']])
    expect(ids(layoutFor(inverse, 'sidebar')[0])).toEqual([['a'], ['b'], ['c']])
  })
})

describe('#5 persistance de la disposition', () => {
  it('round-trip', () => {
    const composition: Type_Composition = [
      entry('a', { tooltip: { tab: 0, row: 0 }, sidebar: { tab: 2, row: 3 } }),
      entry('b')
    ]
    expect(compositionFromJSON(compositionToJSON(composition))).toEqual(composition)
  })

  it('n\'écrit pas de disposition vide', () => {
    const json = compositionToJSON([{ block: 'a', show: DEFAULT_BLOCK_VISIBILITY }])
    expect(json[0].layout).toBeUndefined()
  })

  it('ignore un placement à moitié valide plutôt que d\'en inventer la moitié', () => {
    expect(blockPlacementFromJSON({ tab: 0 })).toBeNull()
    expect(blockPlacementFromJSON({ tab: 0, row: 'x' })).toBeNull()
    expect(blockPlacementFromJSON({ tab: 0, row: 2 })).toEqual({ tab: 0, row: 2 })
  })

  it('un JSON abîmé retombe sur la disposition par défaut, sans jeter', () => {
    const composition = compositionFromJSON([
      { block: 'a', layout: 'nawak' },
      { block: 'b', layout: { tooltip: { tab: 999, row: 0 } } }
    ])
    expect(composition[0].layout).toBeUndefined()
    expect(composition[1].layout).toBeUndefined()
    expect(ids(layoutFor(composition, 'tooltip')[0])).toEqual([['a'], ['b']])
  })
})

describe('#5 étiquettes d\'onglets', () => {
  it('absente = chaîne vide (le rendu nommera l\'onglet d\'après son contenu)', () => {
    expect(tabLabelAt({}, 'tooltip', 0)).toBe('')
  })

  it('renomme sans toucher aux autres contenants', () => {
    const labels = setTabLabel(setTabLabel({}, 'tooltip', 1, 'Détails'), 'sidebar', 0, 'Tout')
    expect(tabLabelAt(labels, 'tooltip', 1)).toBe('Détails')
    expect(tabLabelAt(labels, 'tooltip', 0)).toBe('')
    expect(tabLabelAt(labels, 'sidebar', 0)).toBe('Tout')
  })

  it('round-trip, et n\'écrit rien quand aucun onglet n\'est nommé', () => {
    const labels = setTabLabel({}, 'popup', 0, 'Valeurs')
    expect(tabLabelsFromJSON(tabLabelsToJSON(labels))).toEqual(labels)
    expect(tabLabelsToJSON(setTabLabel({}, 'popup', 0, ''))).toEqual({})
  })

  it('tolère un JSON abîmé', () => {
    expect(tabLabelsFromJSON('nawak')).toEqual({})
    expect(tabLabelsFromJSON({ tooltip: ['ok', 42] })).toEqual({ tooltip: ['ok', ''] })
  })
})
