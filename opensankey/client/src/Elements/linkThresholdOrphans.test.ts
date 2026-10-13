import { Class_ApplicationData } from '../types/ApplicationData'

// Seuil de flux et nœuds orphelins (Julien, 13/10) : un nœud dont TOUS les flux passent sous le
// seuil n'a plus rien de tracé ; c'est alors la case « Nœuds orphelins » qui décide s'il reste.

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const build = () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const source = sankey.addNewNodeWithName('Source')
  const hub = sankey.addNewNodeWithName('Hub')
  const petit = sankey.addNewNodeWithName('Petit')
  sankey.addNewLink(source, hub).valueCurrent = 100
  sankey.addNewLink(petit, hub).valueCurrent = 1
  return { app, source, hub, petit }
}

describe('seuil de flux et noeuds orphelins', () => {
  it('en valeur : le noeud dont tous les flux passent sous le seuil disparait', () => {
    const { app, hub, petit } = build()
    expect(petit.is_visible).toBe(true)
    app.drawing_area.filter_link_value = 10
    expect(petit.has_drawn_link).toBe(false)
    expect(petit.is_visible).toBe(false)
    expect(hub.is_visible).toBe(true)
    app.drawing_area.show_orphan_nodes = true
    expect(petit.is_visible).toBe(true)
  })

  it('en pixels : meme regle', () => {
    const { app, petit } = build()
    app.drawing_area.filter_unit = 'pixel'
    app.drawing_area.filter_link_value_px = 1e6
    expect(petit.is_visible).toBe(false)
  })
})
