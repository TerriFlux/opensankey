// ==================================================================================================
// os#1340 (lot 1 quick wins) — duplication unifiée de la sélection (Ctrl+D) et
// verrouillage d'élément.
//
// 1. `duplicateSelection` : duplique nœuds + liens INTERNES à la sélection + zones de
//    texte, décale les copies de 50 px, en fait la nouvelle sélection ; une seule
//    transition d'historique (undo = suppression des copies).
// 2. `cloneSelectionInPlace` (alt-glisser = cloner) : mêmes copies mais SANS décalage.
// 3. Verrouillage (`shape_is_locked`) : un élément verrouillé n'entre jamais dans la
//    sélection (garde centrale addElementToSelection) et survit au round-trip JSON.
// ==================================================================================================

import { Class_ApplicationData } from './ApplicationData'
import type { Type_JSON } from './Utils'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Petite scène : deux nœuds reliés + un nœud isolé + une zone de texte. */
function buildScene() {
  const app = new Class_ApplicationData(false)
  const da = app.drawing_area
  const sankey = da.sankey
  const a = sankey.addNewNode('a', 'A')
  const b = sankey.addNewNode('b', 'B')
  const c = sankey.addNewNode('c', 'C')
  sankey.addNewLink(a, b)
  sankey.addNewLink(b, c)
  const z = sankey.addNewContainer('z', 'Zone')
  a.position_x = 100; a.position_y = 110
  b.position_x = 300; b.position_y = 120
  c.position_x = 500; c.position_y = 130
  z.position_x = 50; z.position_y = 60
  return { app, da, sankey, a, b, c, z }
}

describe('os#1340 — duplicateSelection (Ctrl+D)', () => {
  it('duplique nœuds, liens internes et zones ; les copies deviennent la sélection', () => {
    const { da, sankey, a, b, z } = buildScene()
    da.addElementToSelection(a)
    da.addElementToSelection(b)
    da.addElementToSelection(z)

    const links_before = sankey.links_list.length // a→b, b→c
    da.duplicateSelection()

    // Copies créées, avec l'offset de 50 px
    const a_copy = sankey.nodes_dict['a_copy']
    const b_copy = sankey.nodes_dict['b_copy']
    const z_copy = sankey.containers_dict['z_copy']
    expect(a_copy).toBeDefined()
    expect(b_copy).toBeDefined()
    expect(z_copy).toBeDefined()
    expect(sankey.nodes_dict['c_copy']).toBeUndefined() // c n'était pas sélectionné
    expect(a_copy.position_x).toBe(a.position_x + 50)
    expect(a_copy.position_y).toBe(a.position_y + 50)
    expect(z_copy.position_x).toBe(z.position_x + 50)

    // Seul le lien INTERNE à la sélection (a→b) est dupliqué, pas b→c
    expect(sankey.links_list.length).toBe(links_before + 1)
    const copied_link = sankey.links_list.find(l => l.source === a_copy && l.target === b_copy)
    expect(copied_link).toBeDefined()

    // La sélection est maintenant les copies
    const selected_ids = da.selected_elements_list.map(el => el.id).sort()
    expect(selected_ids).toContain('a_copy')
    expect(selected_ids).toContain('b_copy')
    expect(selected_ids).toContain('z_copy')
    expect(selected_ids).not.toContain('a')
  })

  it('undo supprime les copies, redo les recrée', () => {
    const { app, da, sankey, a } = buildScene()
    da.addElementToSelection(a)
    da.duplicateSelection()
    expect(sankey.nodes_dict['a_copy']).toBeDefined()

    app.history.applyUndo()
    expect(sankey.nodes_dict['a_copy']).toBeUndefined()

    app.history.applyRedo()
    expect(sankey.nodes_dict['a_copy']).toBeDefined()
  })

  it('cloneSelectionInPlace : copies exactement sous les originaux (offset 0)', () => {
    const { da, sankey, a } = buildScene()
    da.addElementToSelection(a)
    da.cloneSelectionInPlace()
    const a_copy = sankey.nodes_dict['a_copy']
    expect(a_copy).toBeDefined()
    expect(a_copy.position_x).toBe(a.position_x)
    expect(a_copy.position_y).toBe(a.position_y)
  })
})

describe('os#1340 — verrouillage (shape_is_locked)', () => {
  it('un élément verrouillé n\'entre pas dans la sélection (clic, Ctrl+A)', () => {
    const { da, a, z } = buildScene()
    expect(z.is_locked).toBe(false)
    z.shape_is_locked = true
    expect(z.is_locked).toBe(true)

    da.addElementToSelection(z)
    expect(da.selected_elements_list.length).toBe(0)

    // Ctrl+A (addAllVisibleElementsToSelection) saute les verrouillés
    da.addAllVisibleElementsToSelection()
    const ids = da.selected_elements_list.map(el => el.id)
    expect(ids).toContain(a.id)
    expect(ids).not.toContain(z.id)
  })

  it('le verrou survit au round-trip JSON (clé additive, absente = false)', () => {
    const { app, z } = buildScene()
    z.shape_is_locked = true
    const json = app.toJSON() as Type_JSON

    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(structuredClone(json) as never, {}, false)
    const z2 = app2.drawing_area.sankey.containers_dict['z']
    expect(z2).toBeDefined()
    expect(z2.is_locked).toBe(true)
    // Les autres éléments restent déverrouillés (défaut)
    expect(app2.drawing_area.sankey.nodes_dict['a'].is_locked).toBe(false)
  })
})
