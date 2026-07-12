// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

import React, { MutableRefObject } from 'react'
import TestRenderer, { act } from 'react-test-renderer'

import { useModelBinding, useModelSlot } from './useModelBinding'

/**
 * #247 — Le hook remplace le hack `slot.current = () => setCount(a => a + 1)` posé en corps de
 * render. Ce que l'on vérifie ici : le slot est bien lié, le re-render est effectif, et le slot est
 * relâché au démontage (le hack laissait une ref périmée qui déclenchait un setState sur un
 * composant démonté).
 */
const makeSlot = (): MutableRefObject<() => void> => ({ current: () => undefined })

describe('useModelBinding', () => {

  it('lie le slot et force un re-render quand le modèle l\'appelle', () => {
    const slot = makeSlot()
    let renders = 0
    const Component = () => {
      useModelBinding(slot)
      renders++
      return null
    }

    act(() => { TestRenderer.create(<Component />) })
    expect(renders).toBe(1)

    act(() => { slot.current() })
    expect(renders).toBe(2)
  })

  it('relâche le slot au démontage (plus de setState sur composant démonté)', () => {
    const slot = makeSlot()
    const Component = () => {
      useModelBinding(slot)
      return null
    }

    let tree: TestRenderer.ReactTestRenderer
    act(() => { tree = TestRenderer.create(<Component />) })
    const bound_while_mounted = slot.current

    act(() => { tree.unmount() })
    expect(slot.current).not.toBe(bound_while_mounted)
    // Appeler le slot après démontage ne doit plus rien déclencher (ni jeter, ni avertir).
    expect(() => slot.current()).not.toThrow()
  })

  it('lie plusieurs slots à la fois', () => {
    const slot_a = makeSlot()
    const slot_b = makeSlot()
    let renders = 0
    const Component = () => {
      useModelBinding([slot_a, slot_b])
      renders++
      return null
    }

    act(() => { TestRenderer.create(<Component />) })
    act(() => { slot_a.current() })
    act(() => { slot_b.current() })
    expect(renders).toBe(3)
  })

  it('désabonne l\'abonnement optionnel au démontage', () => {
    const listeners: Array<() => void> = []
    const Component = () => {
      useModelBinding(undefined, refresh => {
        listeners.push(refresh)
        return () => listeners.splice(listeners.indexOf(refresh), 1)
      })
      return null
    }

    let tree: TestRenderer.ReactTestRenderer
    act(() => { tree = TestRenderer.create(<Component />) })
    expect(listeners).toHaveLength(1)

    act(() => { tree.unmount() })
    expect(listeners).toHaveLength(0)
  })

})

describe('useModelSlot', () => {

  it('appelle toujours la DERNIÈRE version du handler (closure fraîche sur les props)', () => {
    const slot = makeSlot()
    const seen: number[] = []
    const Component = ({ value }: { value: number }) => {
      useModelSlot(slot, () => seen.push(value))
      return null
    }

    let tree: TestRenderer.ReactTestRenderer
    act(() => { tree = TestRenderer.create(<Component value={1} />) })
    act(() => { slot.current() })

    act(() => { tree.update(<Component value={2} />) })
    act(() => { slot.current() })

    expect(seen).toEqual([1, 2])
  })

  it('relâche le slot au démontage', () => {
    const slot = makeSlot()
    const handler = jest.fn()
    const Component = () => {
      useModelSlot(slot, handler)
      return null
    }

    let tree: TestRenderer.ReactTestRenderer
    act(() => { tree = TestRenderer.create(<Component />) })
    act(() => { tree.unmount() })

    slot.current()
    expect(handler).not.toHaveBeenCalled()
  })

})
