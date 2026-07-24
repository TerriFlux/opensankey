import {
  Class_PresentationBlockRegistry,
  presentation_block_registry,
  renderPresentationBlock,
  type Type_PresentationBlock,
  type Type_BlockRenderContext
} from './PresentationBlockRegistry'
import type { Class_ApplicationData } from '../../../types/ApplicationData'

// OS#305 Lot 1 — Catalogue de blocs d'affichage, testé en isolation : seules la
// résolution par cible, la dédup par id, le gating et l'ordre comptent (aucun
// rendu réel — comme InspectorRegistry.test.ts).

const fake_app = { has_sankey_plus: false } as unknown as Class_ApplicationData

const ctx = (over: Partial<Type_BlockRenderContext> = {}): Type_BlockRenderContext => ({
  app_data: fake_app,
  element: null,
  mode: 'popup',
  ...over
})

function block(over: Partial<Type_PresentationBlock> & { id: string }): Type_PresentationBlock {
  return {
    target: 'node',
    order: 10,
    label: () => over.id,
    render: () => null,
    ...over
  }
}

describe('#305 Class_PresentationBlockRegistry', () => {
  let registry: Class_PresentationBlockRegistry

  beforeEach(() => {
    registry = new Class_PresentationBlockRegistry()
  })

  it('enregistre et retrouve un bloc par id', () => {
    registry.register(block({ id: 'a' }))
    expect(registry.has('a')).toBe(true)
    expect(registry.get('a')?.id).toBe('a')
    expect(registry.size).toBe(1)
  })

  it('ré-enregistrer le même id REMPLACE (idempotent, hot reload / surcharge)', () => {
    registry.register(block({ id: 'a', order: 1 }))
    registry.register(block({ id: 'a', order: 99 }))
    expect(registry.size).toBe(1)
    expect(registry.get('a')?.order).toBe(99)
  })

  it('filtre par cible, y compris quand le bloc en déclare plusieurs', () => {
    registry.register(block({ id: 'node_only', target: 'node' }))
    registry.register(block({ id: 'shared', target: ['node', 'link'] }))
    registry.register(block({ id: 'button_only', target: 'button' }))
    expect(registry.getBlocksFor('node', fake_app).map(b => b.id)).toEqual(['node_only', 'shared'])
    expect(registry.getBlocksFor('link', fake_app).map(b => b.id)).toEqual(['shared'])
    expect(registry.getBlocksFor('button', fake_app).map(b => b.id)).toEqual(['button_only'])
    expect(registry.getBlocksFor('container', fake_app)).toEqual([])
  })

  it('trie par ordre croissant', () => {
    registry.register(block({ id: 'c', order: 30 }))
    registry.register(block({ id: 'a', order: 10 }))
    registry.register(block({ id: 'b', order: 20 }))
    expect(registry.getBlocksFor('node', fake_app).map(b => b.id)).toEqual(['a', 'b', 'c'])
  })

  it('applique le gating', () => {
    registry.register(block({ id: 'libre' }))
    registry.register(block({ id: 'plus', gate: (a) => a.has_sankey_plus }))
    expect(registry.getBlocksFor('node', fake_app).map(b => b.id)).toEqual(['libre'])
    const with_plus = { has_sankey_plus: true } as unknown as Class_ApplicationData
    expect(registry.getBlocksFor('node', with_plus).map(b => b.id)).toEqual(['libre', 'plus'])
  })

  it('unregister et clear', () => {
    registry.register(block({ id: 'a' }))
    registry.register(block({ id: 'b' }))
    registry.unregister('a')
    expect(registry.has('a')).toBe(false)
    expect(registry.size).toBe(1)
    registry.clear()
    expect(registry.size).toBe(0)
  })
})

describe('#305 renderPresentationBlock — tolérance aux blocs inconnus', () => {
  afterEach(() => presentation_block_registry.clear())

  it('rend null pour un id INCONNU au lieu de jeter', () => {
    // Contrepartie du Lot 0 : le modèle CONSERVE un bloc produit par une version
    // plus récente ; c'est le rendu qui le saute silencieusement.
    expect(renderPresentationBlock('bloc.du.futur', ctx())).toBeNull()
  })

  it('rend null pour un bloc dont le gate est faux', () => {
    presentation_block_registry.register(block({
      id: 'g', gate: () => false, render: () => 'contenu'
    }))
    expect(renderPresentationBlock('g', ctx())).toBeNull()
  })

  it('délègue au rendu du bloc en lui passant le contexte', () => {
    presentation_block_registry.register(block({
      id: 'ok',
      render: (c) => `mode=${c.mode}|opt=${String(c.options?.['show_unit'])}`
    }))
    expect(renderPresentationBlock('ok', ctx({ mode: 'tooltip', options: { show_unit: false } })))
      .toBe('mode=tooltip|opt=false')
  })
})
