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
  MAX_COLS,
  MAX_ROWS,
  DEFAULT_BLOCK_VISIBILITY,
  type Type_Composition
} from './PresentationComposition'
import type { Type_PanelMode } from './PanelManager'

// AJUSTEMENT #5 — la disposition est un TABLEAU : des onglets, découpés en
// colonnes, chaque colonne empilant des rangées. Un bloc occupe une cellule.

const entry = (block: string, layout?: unknown): never =>
  ({ block, show: { ...DEFAULT_BLOCK_VISIBILITY }, ...(layout ? { layout } : {}) }) as never

/** Vue lisible : onglets -> colonnes -> rangées -> blocs. */
const grid = (composition: Type_Composition, mode: Type_PanelMode) =>
  layoutFor(composition, mode).map(cols => cols.map(rows => rows.map(cell => cell.map(e => e.block))))

/** Première colonne du premier onglet — la disposition « en pile ». */
const stack = (composition: Type_Composition, mode: Type_PanelMode) => grid(composition, mode)[0]?.[0]

describe('#5 layoutFor — disposition par défaut', () => {
  it('sans placement : un onglet, une colonne, un bloc par rangée', () => {
    // C'est l'empilement d'avant #5 : un document déjà composé ne bouge pas.
    const composition: Type_Composition = [entry('a'), entry('b'), entry('c')]
    expect(grid(composition, 'tooltip')).toEqual([[[['a'], ['b'], ['c']]]])
  })

  it('ne retient que les blocs visibles DANS CE CONTENANT', () => {
    const composition: Type_Composition = [
      { block: 'a', show: { tooltip: true, popup: true, sidebar: true } },
      { block: 'b', show: { tooltip: false, popup: true, sidebar: true } }
    ]
    expect(stack(composition, 'tooltip')).toEqual([['a']])
    expect(stack(composition, 'popup')).toEqual([['a'], ['b']])
  })

  it('rend une liste vide quand rien n\'est visible ici', () => {
    expect(layoutFor([], 'tooltip')).toEqual([])
  })
})

describe('#5 layoutFor — colonnes, rangées, onglets', () => {
  it('deux COLONNES mettent les blocs côte à côte', () => {
    const composition: Type_Composition = [
      entry('gauche', { tooltip: { tab: 0, col: 0, row: 0 } }),
      entry('droite', { tooltip: { tab: 0, col: 1, row: 0 } })
    ]
    expect(grid(composition, 'tooltip')).toEqual([[[['gauche']], [['droite']]]])
  })

  it('une colonne accueille PLUSIEURS rangées', () => {
    const composition: Type_Composition = [
      entry('haut', { tooltip: { tab: 0, col: 1, row: 0 } }),
      entry('bas', { tooltip: { tab: 0, col: 1, row: 1 } }),
      entry('seul', { tooltip: { tab: 0, col: 0, row: 0 } })
    ]
    expect(grid(composition, 'tooltip')).toEqual([[[['seul']], [['haut'], ['bas']]]])
  })

  it('deux blocs dans la MÊME cellule s\'y empilent, dans l\'ordre de la composition', () => {
    const composition: Type_Composition = [
      entry('a', { tooltip: { tab: 0, col: 0, row: 0 } }),
      entry('b', { tooltip: { tab: 0, col: 0, row: 0 } })
    ]
    expect(stack(composition, 'tooltip')).toEqual([['a', 'b']])
  })

  it('des onglets différents donnent plusieurs onglets, triés par index', () => {
    const composition: Type_Composition = [
      entry('second', { tooltip: { tab: 1, col: 0, row: 0 } }),
      entry('premier', { tooltip: { tab: 0, col: 0, row: 0 } })
    ]
    expect(grid(composition, 'tooltip')).toEqual([[[['premier']]], [[['second']]]])
  })

  it('COMPACTE les onglets, colonnes et rangées vides', () => {
    // L'auteur a vidé la colonne du milieu : le lecteur ne doit pas voir de
    // bande blanche, ni d'onglet fantôme.
    const composition: Type_Composition = [
      entry('seul', { tooltip: { tab: 3, col: 4, row: 7 } })
    ]
    expect(grid(composition, 'tooltip')).toEqual([[[['seul']]]])
  })

  it('un bloc NON placé prend une rangée propre en première colonne, APRÈS les placés', () => {
    const composition: Type_Composition = [
      entry('libre'),
      entry('place', { tooltip: { tab: 0, col: 0, row: 0 } })
    ]
    expect(stack(composition, 'tooltip')).toEqual([['place'], ['libre']])
  })

  it('la disposition est PROPRE À CHAQUE CONTENANT', () => {
    const composition: Type_Composition = [
      entry('a', { tooltip: { tab: 0, col: 0, row: 0 }, sidebar: { tab: 0, col: 0, row: 0 } }),
      entry('b', { tooltip: { tab: 0, col: 1, row: 0 }, sidebar: { tab: 0, col: 0, row: 1 } })
    ]
    // Deux colonnes en info-bulle, une seule (empilée) dans le panneau étroit.
    expect(grid(composition, 'tooltip')).toEqual([[[['a']], [['b']]]])
    expect(grid(composition, 'sidebar')).toEqual([[[['a'], ['b']]]])
  })
})

describe('#5 placeBlock / unplaceBlock', () => {
  const base: Type_Composition = [entry('a'), entry('b')]

  it('placer rend le bloc visible dans ce contenant', () => {
    const composition: Type_Composition = [
      { block: 'a', show: { tooltip: false, popup: true, sidebar: true } }
    ]
    const next = placeBlock(composition, 'a', 'tooltip', { tab: 0, col: 0, row: 0 })
    expect(next[0].show.tooltip).toBe(true)
    expect(next[0].layout?.tooltip).toEqual({ tab: 0, col: 0, row: 0 })
  })

  it('ne mute pas la composition d\'origine', () => {
    placeBlock(base, 'a', 'popup', { tab: 1, col: 0, row: 2 })
    expect(base[0].layout).toBeUndefined()
  })

  it('ne touche pas aux autres contenants', () => {
    const next = placeBlock(
      placeBlock(base, 'a', 'popup', { tab: 0, col: 0, row: 0 }),
      'a', 'sidebar', { tab: 1, col: 2, row: 3 })
    expect(next[0].layout).toEqual({
      popup: { tab: 0, col: 0, row: 0 },
      sidebar: { tab: 1, col: 2, row: 3 }
    })
  })

  it('refuse un placement hors bornes plutôt que de le tronquer', () => {
    expect(placeBlock(base, 'a', 'popup', { tab: MAX_TABS, col: 0, row: 0 })).toBe(base)
    expect(placeBlock(base, 'a', 'popup', { tab: 0, col: MAX_COLS, row: 0 })).toBe(base)
    expect(placeBlock(base, 'a', 'popup', { tab: 0, col: 0, row: MAX_ROWS })).toBe(base)
    expect(placeBlock(base, 'a', 'popup', { tab: 0, col: -1, row: 0 })).toBe(base)
  })

  it('retirer d\'un contenant masque le bloc ET oublie son placement', () => {
    const placed = placeBlock(base, 'a', 'popup', { tab: 0, col: 0, row: 0 })
    const next = unplaceBlock(placed, 'a', 'popup')
    expect(next[0].show.popup).toBe(false)
    expect(next[0].layout).toBeUndefined()
  })

  it('retirer d\'un contenant préserve le placement des AUTRES', () => {
    const placed = placeBlock(
      placeBlock(base, 'a', 'popup', { tab: 0, col: 0, row: 0 }),
      'a', 'tooltip', { tab: 0, col: 0, row: 1 })
    const next = unplaceBlock(placed, 'a', 'popup')
    expect(next[0].layout).toEqual({ tooltip: { tab: 0, col: 0, row: 1 } })
  })

  it('clearLayout revient à l\'empilement sans rien masquer', () => {
    const placed = placeBlock(
      placeBlock(base, 'a', 'popup', { tab: 1, col: 1, row: 0 }),
      'b', 'popup', { tab: 1, col: 0, row: 0 })
    const next = clearLayout(placed, 'popup')
    expect(next.every(e => e.layout?.popup === undefined)).toBe(true)
    expect(next.every(e => e.show.popup)).toBe(true)
    expect(stack(next, 'popup')).toEqual([['a'], ['b']])
  })
})

describe('#5 normalisation', () => {
  it('rend les index STOCKÉS égaux aux index AFFICHÉS, sans rien changer à l\'affichage', () => {
    const composition: Type_Composition = [
      entry('a', { tooltip: { tab: 0, col: 0, row: 0 } }),
      entry('b', { tooltip: { tab: 3, col: 5, row: 9 } })
    ]
    const before = grid(composition, 'tooltip')
    const next = normalizeLayout(composition, 'tooltip')
    expect(next[1].layout?.tooltip).toEqual({ tab: 1, col: 0, row: 0 })
    expect(grid(next, 'tooltip')).toEqual(before)
  })

  it('donne un placement explicite aux blocs qui n\'en avaient pas', () => {
    const next = normalizeLayout([entry('a'), entry('b')], 'popup')
    expect(next[0].layout?.popup).toEqual({ tab: 0, col: 0, row: 0 })
    expect(next[1].layout?.popup).toEqual({ tab: 0, col: 0, row: 1 })
  })

  it('ne place pas un bloc invisible dans ce contenant', () => {
    const composition: Type_Composition = [
      { block: 'a', show: { tooltip: false, popup: true, sidebar: true } }
    ]
    expect(normalizeLayout(composition, 'tooltip')[0].layout).toBeUndefined()
  })

  it('normalizeAllLayouts rend l\'ORDRE de la liste sans effet sur l\'affichage', () => {
    // C'est l'invariant qui permet à l'éditeur de réordonner la composition pour
    // ranger une cellule, sans bousculer les deux autres contenants.
    const composition: Type_Composition = [entry('a'), entry('b'), entry('c')]
    const fige = normalizeAllLayouts(composition)
    const inverse = [fige[2], fige[1], fige[0]]
    expect(stack(inverse, 'tooltip')).toEqual([['a'], ['b'], ['c']])
    expect(stack(inverse, 'sidebar')).toEqual([['a'], ['b'], ['c']])
  })
})

describe('#5 persistance de la disposition', () => {
  it('round-trip', () => {
    const composition: Type_Composition = [
      entry('a', { tooltip: { tab: 0, col: 0, row: 0 }, sidebar: { tab: 2, col: 1, row: 3 } }),
      entry('b')
    ]
    expect(compositionFromJSON(compositionToJSON(composition))).toEqual(composition)
  })

  it('n\'écrit pas de disposition vide', () => {
    const json = compositionToJSON([{ block: 'a', show: DEFAULT_BLOCK_VISIBILITY }])
    expect(json[0].layout).toBeUndefined()
  })

  it('un placement sans COLONNE tombe dans la première — la disposition n\'était pas encore un tableau', () => {
    expect(blockPlacementFromJSON({ tab: 1, row: 2 })).toEqual({ tab: 1, col: 0, row: 2 })
  })

  it('ignore un placement à moitié valide plutôt que d\'en inventer la moitié', () => {
    expect(blockPlacementFromJSON({ tab: 0 })).toBeNull()
    expect(blockPlacementFromJSON({ tab: 0, row: 'x' })).toBeNull()
    expect(blockPlacementFromJSON({ tab: 0, col: 1, row: 2 })).toEqual({ tab: 0, col: 1, row: 2 })
  })

  it('un JSON abîmé retombe sur la disposition par défaut, sans jeter', () => {
    const composition = compositionFromJSON([
      { block: 'a', layout: 'nawak' },
      { block: 'b', layout: { tooltip: { tab: 999, col: 0, row: 0 } } }
    ])
    expect(composition[0].layout).toBeUndefined()
    expect(composition[1].layout).toBeUndefined()
    expect(stack(composition, 'tooltip')).toEqual([['a'], ['b']])
  })

  it('une colonne hors bornes retombe sur la première, sans perdre le placement', () => {
    const composition = compositionFromJSON([
      { block: 'a', layout: { tooltip: { tab: 0, col: 999, row: 2 } } }
    ])
    expect(composition[0].layout?.tooltip).toEqual({ tab: 0, col: 0, row: 2 })
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
