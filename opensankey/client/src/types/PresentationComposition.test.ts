import {
  compositionFromJSON,
  compositionToJSON,
  blocksFor,
  hasContentFor,
  addBlock,
  removeBlock,
  toggleBlockVisibility,
  moveBlock,
  DEFAULT_BLOCK_VISIBILITY,
  MAX_COMPOSITION_ENTRIES,
  type Type_Composition
} from './PresentationComposition'

// OS#305 Lot 0 — modèle de la présentation composée, testé en isolation (données
// pures : aucune dépendance au modèle ni au rendu).

const entry = (block: string, show?: Partial<Record<string, boolean>>) => ({
  block,
  show: { ...DEFAULT_BLOCK_VISIBILITY, ...show }
})

describe('#305 compositionFromJSON — tolérance', () => {
  it('rend une composition vide pour tout ce qui n\'est pas un tableau', () => {
    [undefined, null, 42, 'x', {}, true].forEach(raw => {
      expect(compositionFromJSON(raw)).toEqual([])
    })
  })

  it('ignore les entrées structurellement invalides', () => {
    const raw = [null, 42, 'x', {}, { block: '' }, { block: 7 }, { block: 'value' }]
    expect(compositionFromJSON(raw).map(e => e.block)).toEqual(['value'])
  })

  it('complète une visibilité absente ou partielle par le défaut (visible)', () => {
    const [a, b] = compositionFromJSON([
      { block: 'a' },
      { block: 'b', show: { tooltip: false } }
    ])
    expect(a.show).toEqual({ tooltip: true, popup: true, sidebar: true })
    expect(b.show).toEqual({ tooltip: false, popup: true, sidebar: true })
  })

  it('ignore les champs de visibilité non booléens', () => {
    const [a] = compositionFromJSON([{ block: 'a', show: { tooltip: 'nope', popup: 0 } }])
    expect(a.show).toEqual({ tooltip: true, popup: true, sidebar: true })
  })

  it('CONSERVE un bloc inconnu (pas de perte de données au round-trip)', () => {
    // Décision #11 : un bloc produit par une version plus récente ne doit ni
    // casser l'ouverture, ni disparaître si un lecteur plus ancien réenregistre.
    const raw = [{ block: 'block_du_futur', show: { tooltip: true, popup: true, sidebar: true } }]
    expect(compositionFromJSON(raw).map(e => e.block)).toEqual(['block_du_futur'])
  })

  it('déduplique en gardant la PREMIÈRE occurrence', () => {
    const out = compositionFromJSON([
      { block: 'a', show: { tooltip: false } },
      { block: 'a', show: { tooltip: true } },
      { block: 'b' }
    ])
    expect(out.map(e => e.block)).toEqual(['a', 'b'])
    expect(out[0].show.tooltip).toBe(false)
  })

  it('conserve les options opaques, et seulement si ce sont des objets', () => {
    const out = compositionFromJSON([
      { block: 'a', options: { fmt: 'pct', depth: 2 } },
      { block: 'b', options: 'nope' }
    ])
    expect(out[0].options).toEqual({ fmt: 'pct', depth: 2 })
    expect(out[1].options).toBeUndefined()
  })

  it('borne une composition pathologique', () => {
    const raw = Array.from({ length: MAX_COMPOSITION_ENTRIES + 50 }, (_, i) => ({ block: 'b' + i }))
    expect(compositionFromJSON(raw)).toHaveLength(MAX_COMPOSITION_ENTRIES)
  })
})

describe('#305 round-trip JSON', () => {
  it('re-lire ce qu\'on a écrit redonne la même composition', () => {
    const composition: Type_Composition = [
      entry('value', { tooltip: false }),
      { block: 'free_text', show: { tooltip: true, popup: true, sidebar: false }, options: { md: '**x**' } }
    ]
    expect(compositionFromJSON(compositionToJSON(composition))).toEqual(composition)
  })

  it('n\'écrit pas de champ options vide', () => {
    const json = compositionToJSON([{ block: 'a', show: DEFAULT_BLOCK_VISIBILITY, options: {} }])
    expect(json[0].options).toBeUndefined()
  })
})

describe('#305 requêtes', () => {
  const composition: Type_Composition = [
    entry('value', { tooltip: true, popup: true, sidebar: true }),
    entry('tags', { tooltip: false, popup: true, sidebar: true }),
    entry('analysis', { tooltip: false, popup: false, sidebar: true })
  ]

  it('blocksFor respecte l\'ORDRE de la composition et filtre par contenant', () => {
    expect(blocksFor(composition, 'tooltip').map(e => e.block)).toEqual(['value'])
    expect(blocksFor(composition, 'popup').map(e => e.block)).toEqual(['value', 'tags'])
    expect(blocksFor(composition, 'sidebar').map(e => e.block)).toEqual(['value', 'tags', 'analysis'])
  })

  it('hasContentFor distingue un contenant pourvu d\'un contenant vide', () => {
    expect(hasContentFor(composition, 'tooltip')).toBe(true)
    expect(hasContentFor([], 'tooltip')).toBe(false)
    expect(hasContentFor([entry('a', { tooltip: false, popup: false, sidebar: false })], 'popup')).toBe(false)
  })
})

describe('#305 helpers d\'édition (immuables)', () => {
  const base: Type_Composition = [entry('a'), entry('b')]

  it('addBlock ajoute en fin, sans doublon, sans muter', () => {
    const next = addBlock(base, 'c')
    expect(next.map(e => e.block)).toEqual(['a', 'b', 'c'])
    expect(base).toHaveLength(2)
    expect(addBlock(base, 'a')).toBe(base)
  })

  it('addBlock respecte le plafond', () => {
    const full = Array.from({ length: MAX_COMPOSITION_ENTRIES }, (_, i) => entry('b' + i))
    expect(addBlock(full, 'extra')).toBe(full)
  })

  it('removeBlock retire le bloc visé', () => {
    expect(removeBlock(base, 'a').map(e => e.block)).toEqual(['b'])
  })

  it('toggleBlockVisibility ne touche que le bloc et le contenant visés', () => {
    const next = toggleBlockVisibility(base, 'a', 'tooltip')
    expect(next[0].show).toEqual({ tooltip: false, popup: true, sidebar: true })
    expect(next[1].show).toEqual(DEFAULT_BLOCK_VISIBILITY)
  })

  it('moveBlock réordonne et borne la cible', () => {
    const three: Type_Composition = [entry('a'), entry('b'), entry('c')]
    expect(moveBlock(three, 0, 2).map(e => e.block)).toEqual(['b', 'c', 'a'])
    expect(moveBlock(three, 2, 99).map(e => e.block)).toEqual(['a', 'b', 'c'])
    expect(moveBlock(three, 1, 1)).toBe(three)
    expect(moveBlock(three, 9, 0)).toBe(three)
  })
})
