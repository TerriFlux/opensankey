import { Class_ApplicationData } from './ApplicationData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 09/10 : le titre se cale en haut du diagramme, pas sur des coordonnees fixes
// (« le y peut etre negatif »).

test('le titre se pose au-dessus des noeuds, centre sur leur largeur, ou qu ils soient', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNodeWithName('A')
  const b = sankey.addNewNodeWithName('B')
  a.setPosXY(100, -300)
  b.setPosXY(500, -200)
  sankey.addNewLink(a, b)
  const titre = sankey.getOrCreateTitleContainer()
  expect(titre.title_on_top).toBe(true)
  titre.setPosXY(9999, 9999)
  sankey.placeTitleOnTop()
  const haut = Math.min(a.position_y, b.position_y)
  expect(titre.position_y + titre.getShapeHeightToUse()).toBeLessThanOrEqual(haut)
  const centre_noeuds = (a.position_x + b.position_x + b.getShapeWidthToUse()) / 2
  expect(titre.position_x + titre.getShapeWidthToUse() / 2).toBeCloseTo(centre_noeuds, 6)
})

test('un titre sans le reglage garde sa place', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  sankey.addNewNodeWithName('A')
  const titre = sankey.getOrCreateTitleContainer()
  titre.title_on_top = false
  titre.setPosXY(42, 43)
  sankey.placeTitleOnTop()
  expect([titre.position_x, titre.position_y]).toEqual([42, 43])
})

test('le titre cale en haut ne compte pas dans le cadrage du diagramme', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { contentBoundsFromModel } = require('./DrawingAreaCamera')
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const a = sankey.addNewNodeWithName('A')
  a.setPosXY(0, 0)
  const sans = contentBoundsFromModel(app.drawing_area)
  const titre = sankey.getOrCreateTitleContainer()
  titre.setPosXY(-5000, -5000)
  const avec = contentBoundsFromModel(app.drawing_area)
  expect(avec).toEqual(sans)
})
