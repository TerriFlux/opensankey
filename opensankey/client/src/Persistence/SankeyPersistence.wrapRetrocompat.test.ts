import { isVersionBelow, applyWrapLongWordsRetrocompat } from './persistenceMigrations'
import type { Class_Sankey } from '../types/Sankey'
import type { Class_ProtoElement } from '../Elements/Element'

// Regression guard for issue #191 — césure (retour à la ligne) des libellés des
// anciens fichiers. The `wrap_long_words` label attribute shipped with default
// `false` (v0.93) then was flipped to `true` during the label-config refactor
// (v1.1.4). Files saved before 1.1.4 don't serialize the key, so they inherited
// the new `true` default and their single long words got hyphenated
// (IMPORTATIONS -> IMPORTATIO-NS). The migration forces `false` on pre-1.1.4
// files when the key is absent, without touching newer files or explicit choices.

describe('AFMBase issue #191 — isVersionBelow (comparateur de versions pointées)', () => {
  it('classe les versions antérieures à 1.1.4 comme "below"', () => {
    expect(isVersionBelow('0.8', '1.1.4')).toBe(true)
    expect(isVersionBelow('0.92', '1.1.4')).toBe(true)
    expect(isVersionBelow('1.0', '1.1.4')).toBe(true)
    expect(isVersionBelow('1.1', '1.1.4')).toBe(true)
    expect(isVersionBelow('1.1.1', '1.1.4')).toBe(true)
    expect(isVersionBelow('1.1.3', '1.1.4')).toBe(true)
  })

  it('ne classe PAS 1.1.4 et les versions plus récentes comme "below"', () => {
    expect(isVersionBelow('1.1.4', '1.1.4')).toBe(false)
    expect(isVersionBelow('1.1.6', '1.1.4')).toBe(false)
    expect(isVersionBelow('1.2', '1.1.4')).toBe(false)
    expect(isVersionBelow('2.0', '1.1.4')).toBe(false)
  })

  it('traite une version absente comme le fichier le plus ancien', () => {
    expect(isVersionBelow(undefined, '1.1.4')).toBe(true)
    expect(isVersionBelow('', '1.1.4')).toBe(true)
  })
})

// Fake sankey: the migration only reads the three element lists and mutates each
// element's `attributes` bag. No DOM / d3 needed.
function makeFakeElement(initial: Record<string, unknown> = {}): Class_ProtoElement {
  return { attributes: { ...initial } } as unknown as Class_ProtoElement
}
function makeFakeSankey(
  nodes: Class_ProtoElement[] = [],
  links: Class_ProtoElement[] = [],
  containers: Class_ProtoElement[] = []
): Class_Sankey {
  return {
    nodes_list: nodes,
    links_list: links,
    containers_list: containers
  } as unknown as Class_Sankey
}

describe('AFMBase issue #191 — applyWrapLongWordsRetrocompat', () => {
  it('force wrap_long_words=false sur nœuds/liens/conteneurs des fichiers < 1.1.4 (clé absente)', () => {
    const node = makeFakeElement()
    const link = makeFakeElement()
    const container = makeFakeElement()
    const sankey = makeFakeSankey([node], [link], [container])

    applyWrapLongWordsRetrocompat(sankey, '0.92')

    for (const el of [node, link, container]) {
      const store = (el as unknown as { attributes: Record<string, unknown> }).attributes
      expect(store.name_label_wrap_long_words).toBe(false)
      expect(store.value_label_wrap_long_words).toBe(false)
    }
  })

  it("n'écrase pas un choix explicite déjà présent", () => {
    // L'utilisateur d'un ancien fichier a explicitement activé la césure du nom.
    const node = makeFakeElement({ name_label_wrap_long_words: true })
    const sankey = makeFakeSankey([node])

    applyWrapLongWordsRetrocompat(sankey, '1.0')

    const store = (node as unknown as { attributes: Record<string, unknown> }).attributes
    expect(store.name_label_wrap_long_words).toBe(true) // préservé
    expect(store.value_label_wrap_long_words).toBe(false) // l'autre, absent, est forcé
  })

  it('ne touche pas les fichiers ≥ 1.1.4 (comportement courant préservé)', () => {
    const node = makeFakeElement()
    const sankey = makeFakeSankey([node])

    applyWrapLongWordsRetrocompat(sankey, '1.1.6')

    const store = (node as unknown as { attributes: Record<string, unknown> }).attributes
    expect(store.name_label_wrap_long_words).toBeUndefined()
    expect(store.value_label_wrap_long_words).toBeUndefined()
  })
})
