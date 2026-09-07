import {
  Class_RepresentationRegistry,
  diagramCapabilities,
  diagramContext,
  elementContext,
  isOfferedToReader,
  type Type_RepresentationEntry
} from './RepresentationRegistry'
import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_Presentable } from '../components/panels/presentation/openPresentation'

// os#1361 (D0) — le CONTRAT du registre, testé en isolation : échelle, gating,
// exigences, liste blanche de publication, ordre. Aucun rendu réel — même
// discipline que PresentationBlockRegistry.test.ts.

type Fake = {
  is_static?: boolean
  publish_options?: Record<string, unknown>
  sankey?: { level_taggs_list: unknown[], nodes_list: { dimensions_as_parent: unknown[] }[] }
}

const app = (over: Fake = {}): Class_ApplicationData => ({
  is_static: over.is_static ?? false,
  publish_options: over.publish_options ?? { representations: null },
  drawing_area: {
    sankey: over.sankey ?? { level_taggs_list: [], nodes_list: [] }
  }
} as unknown as Class_ApplicationData)

const element = { id: 'n1', getElementProperty: () => undefined } as Type_Presentable

function entry(
  over: Partial<Type_RepresentationEntry> & { id: string }
): Type_RepresentationEntry {
  return {
    scale: 'diagram',
    order: 10,
    label: () => over.id,
    draw: () => undefined,
    ...over
  } as Type_RepresentationEntry
}

describe('os#1361 Class_RepresentationRegistry', () => {
  let registry: Class_RepresentationRegistry

  beforeEach(() => {
    registry = new Class_RepresentationRegistry()
  })

  it('enregistre et retrouve une entree par id', () => {
    registry.register(entry({ id: 'a' }))
    expect(registry.has('a')).toBe(true)
    expect(registry.get('a')?.id).toBe('a')
    expect(registry.size).toBe(1)
  })

  it('reenregistrer le meme id remplace, il ne duplique pas', () => {
    registry.register(entry({ id: 'a', order: 1 }))
    registry.register(entry({ id: 'a', order: 2 }))
    expect(registry.size).toBe(1)
    expect(registry.get('a')?.order).toBe(2)
  })

  it('ne melange jamais les deux echelles', () => {
    registry.register(entry({ id: 'd', scale: 'diagram' }))
    registry.register(entry({ id: 'e', scale: 'element' }))
    const a = app()
    expect(registry.list(diagramContext(a)).map(x => x.id)).toEqual(['d'])
    expect(registry.list(elementContext(a, element)).map(x => x.id)).toEqual(['e'])
  })

  it('trie par ordre declare', () => {
    registry.register(entry({ id: 'z', order: 30 }))
    registry.register(entry({ id: 'a', order: 10 }))
    registry.register(entry({ id: 'm', order: 20 }))
    expect(registry.list(diagramContext(app())).map(x => x.id)).toEqual(['a', 'm', 'z'])
  })

  it('ecarte une entree dont le gate refuse', () => {
    registry.register(entry({ id: 'a', gate: () => false }))
    expect(registry.list(diagramContext(app()))).toHaveLength(0)
  })

  it('ecarte une entree qui exige une hierarchie absente', () => {
    registry.register(entry({ id: 'sunburst', needs: { hierarchy: true } }))
    expect(registry.list(diagramContext(app()))).toHaveLength(0)
    const with_levels = app({ sankey: { level_taggs_list: [{}], nodes_list: [] } })
    expect(registry.list(diagramContext(with_levels))).toHaveLength(1)
  })

  it('ecarte une entree qui exige la geographie, tant qu aucune brique carto n existe', () => {
    registry.register(entry({ id: 'map', needs: { geography: true } }))
    const with_levels = app({ sankey: { level_taggs_list: [{}], nodes_list: [] } })
    expect(registry.list(diagramContext(with_levels))).toHaveLength(0)
  })

  it('un isAvailable qui leve vaut refus, il n emporte pas le selecteur', () => {
    registry.register(entry({ id: 'ok' }))
    registry.register(entry({
      id: 'boom',
      order: 5,
      isAvailable: () => { throw new Error('descripteur absent') }
    }))
    expect(registry.list(diagramContext(app())).map(x => x.id)).toEqual(['ok'])
  })

  it('all() ne filtre rien : l auteur doit voir ce qu il retire', () => {
    registry.register(entry({ id: 'a', gate: () => false }))
    registry.register(entry({ id: 'b', needs: { geography: true } }))
    expect(registry.all('diagram').map(x => x.id)).toEqual(['a', 'b'])
  })
})

describe('os#1361 offre au lecteur', () => {
  it('hors page publiee, tout est offert', () => {
    const e = entry({ id: 'a', publish_option: 'doc' })
    expect(isOfferedToReader(e, app({ is_static: false }))).toBe(true)
  })

  it('sur une page publiee sans liste blanche, tout est offert', () => {
    const e = entry({ id: 'a' })
    const a = app({ is_static: true, publish_options: { representations: null } })
    expect(isOfferedToReader(e, a)).toBe(true)
  })

  it('la liste blanche retire ce qu elle ne cite pas', () => {
    const a = app({ is_static: true, publish_options: { representations: ['os.repr.sankey'] } })
    expect(isOfferedToReader(entry({ id: 'os.repr.sankey' }), a)).toBe(true)
    expect(isOfferedToReader(entry({ id: 'os.repr.doc' }), a)).toBe(false)
  })

  it('la cle de publication declaree par l entree doit etre vraie', () => {
    const off = app({ is_static: true, publish_options: { representations: null, doc: false } })
    const on = app({ is_static: true, publish_options: { representations: null, doc: true } })
    const e = entry({ id: 'a', publish_option: 'doc' })
    expect(isOfferedToReader(e, off)).toBe(false)
    expect(isOfferedToReader(e, on)).toBe(true)
  })
})

describe('os#1361 diagramCapabilities', () => {
  it('voit une hierarchie portee par les dimensions de noeuds', () => {
    const a = app({ sankey: { level_taggs_list: [], nodes_list: [{ dimensions_as_parent: [{}] }] } })
    expect(diagramCapabilities(a).hierarchy).toBe(true)
  })

  it('ne voit aucune hierarchie sur un diagramme plat', () => {
    const a = app({ sankey: { level_taggs_list: [], nodes_list: [{ dimensions_as_parent: [] }] } })
    expect(diagramCapabilities(a).hierarchy).toBe(false)
  })
})
