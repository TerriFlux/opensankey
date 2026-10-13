import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// Point de passage accroché à un nœud (Julien, 13/10, SOCLE transfo) : sous le centre du nœud,
// `gap` px sous son bas, et il le suit quand le nœud bouge. Le fichier garde `node` et `gap`.

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const build = () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  const c = sankey.addNewNodeWithName('C')
  a.position_x = 0; a.position_y = 100
  b.position_x = 800; b.position_y = 100
  c.position_x = 400; c.position_y = 300
  const l = sankey.addNewLink(a, b)
  l.valueCurrent = 10
  l.shape_pass_points = [{ u: 0.5, v: 0, node: c.id, gap: 100 }]
  return { app, a, b, c, l }
}

const centres = (l: ReturnType<typeof build>['l']): [[number, number], [number, number]] =>
  [[l.source.position_x, l.source.position_y], [l.target.position_x, l.target.position_y]]

describe('point de passage accroche sous un noeud', () => {
  it('met le HAUT du flux a l ecart voulu sous le centre du noeud, et le suit', () => {
    const { b, c, l } = build()
    expect(l.thickness).toBeGreaterThan(0)
    const expected = (): [number, number] =>
      [c.position_x + c.getShapeWidthToUse() / 2, c.position_y + c.getShapeHeightToUse() + 100 + l.thickness / 2]
    expect(l.routePointNear(b, ...centres(l))).toEqual(expected())
    c.position_y = 500
    expect(l.routePointNear(b, ...centres(l))).toEqual(expected())
  })

  it('garde le noeud et l ecart a l enregistrement', () => {
    const { app, c } = build()
    const json = app.toJSON() as Type_JSON
    const reloaded = new Class_ApplicationData(false)
    reloaded.fromJSON(JSON.parse(JSON.stringify(json)) as never, {}, false)
    const pps = reloaded.drawing_area.sankey.links_list[0].shape_pass_points
    expect(pps).toEqual([{ u: 0.5, v: 0, node: c.id, gap: 100 }])
  })
})
