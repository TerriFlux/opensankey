import {
  compositionFromJSON,
  compositionToJSON,
  blocksFor,
  hasContentFor,
  DEFAULT_BLOCK_VISIBILITY,
  MAX_COMPOSITION_ENTRIES,
  type Type_Composition
} from './PresentationComposition'

// OS#305 — modèle RÉDUIT de présentation (patron imposé). Données pures : aucune
// dépendance au modèle ni au rendu. La composition libre (disposition en tableau)
// a été retirée ; ne restent que la liste de blocs et leur visibilité par contenant.

const entry = (block: string, show?: Partial<Record<string, boolean>>): Type_Composition[number] => ({
  block,
  show: { ...DEFAULT_BLOCK_VISIBILITY, ...show }
})

describe('compositionFromJSON — tolérance', () => {
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
    const c = compositionFromJSON([{ block: 'a', show: { tooltip: false } }])
    expect(c[0].show).toEqual({ tooltip: false, popup: true, sidebar: true })
  })

  it('dédoublonne par bloc (première occurrence gardée)', () => {
    const c = compositionFromJSON([{ block: 'a' }, { block: 'a', show: { popup: false } }])
    expect(c).toHaveLength(1)
    expect(c[0].show.popup).toBe(true)
  })

  it('borne la longueur', () => {
    const raw = Array.from({ length: MAX_COMPOSITION_ENTRIES + 20 }, (_, i) => ({ block: 'b' + i }))
    expect(compositionFromJSON(raw)).toHaveLength(MAX_COMPOSITION_ENTRIES)
  })
})

describe('round-trip JSON', () => {
  it('préserve blocs, visibilité et options', () => {
    const composition: Type_Composition = [
      entry('a', { tooltip: false }),
      { block: 'b', show: { ...DEFAULT_BLOCK_VISIBILITY }, options: { show_unit: false } }
    ]
    expect(compositionFromJSON(compositionToJSON(composition))).toEqual(composition)
  })

  it('n\'écrit pas de champ options vide', () => {
    const json = compositionToJSON([{ block: 'a', show: DEFAULT_BLOCK_VISIBILITY, options: {} }])
    expect(json[0].options).toBeUndefined()
  })
})

describe('requêtes par contenant', () => {
  const composition: Type_Composition = [
    entry('value', { tooltip: true, popup: true, sidebar: true }),
    entry('tags', { tooltip: false, popup: true, sidebar: true }),
    entry('analysis', { tooltip: false, popup: false, sidebar: true })
  ]

  it('blocksFor respecte l\'ORDRE et filtre par contenant', () => {
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
