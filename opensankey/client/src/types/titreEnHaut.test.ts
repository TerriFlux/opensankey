import { Class_ApplicationData } from './ApplicationData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1511 — Julien, 09/10 : le titre se cale en haut de l ecran, pas sur des coordonnees fixes
// (« le y peut etre negatif »). C est un affichage d ecran (calque ecran) dont le texte vient de
// la zone de texte titre.

test('un titre neuf est cale en haut, dans le calque ecran', () => {
  const app = new Class_ApplicationData(false)
  const titre = app.drawing_area.sankey.getOrCreateTitleContainer()
  expect(titre.title_on_top).toBe(true)
  expect(titre.on_screen_layer).toBe(true)
})

test('sans ecran, le titre cale en haut garde sa place', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  sankey.addNewNodeWithName('A')
  const titre = sankey.getOrCreateTitleContainer()
  titre.setPosXY(42, 43)
  app.drawing_area.placeTitleAtScreenTop()
  expect([titre.position_x, titre.position_y]).toEqual([42, 43])
})

test('un titre sans le reglage est une zone du dessin, comptee dans le cadrage', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { contentBoundsFromModel } = require('./DrawingAreaCamera')
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  sankey.addNewNodeWithName('A').setPosXY(0, 0)
  const titre = sankey.getOrCreateTitleContainer()
  titre.title_on_top = false
  expect(titre.on_screen_layer).toBe(false)
  titre.setPosXY(-5000, -5000)
  expect(contentBoundsFromModel(app.drawing_area).x).toBeLessThanOrEqual(-5000)
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

test('le titre cale en haut vit dans le calque ecran, hors du contenu', () => {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  sankey.addNewNodeWithName('A')
  const titre = sankey.getOrCreateTitleContainer()
  expect((titre as unknown as { _svg_parent_group: string })._svg_parent_group).toBe('g_screen_overlay')
  titre.title_on_top = false
  expect((titre as unknown as { _svg_parent_group: string })._svg_parent_group).toBe('g_elements_sankey')
})
