import { Class_ApplicationData } from '../types/ApplicationData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// sa#665 — Julien, 14/10 (SOCLE, page Cereales : un fichier par cereale) : changer de fichier remplace la
// zone de dessin ; l ancienne legende ressurgissait et la colonne restait sur le fichier precedent.

test('la legende en colonne survit au remplacement de la zone de dessin', () => {
  const app = new Class_ApplicationData(false)
  const ancienne = app.drawing_area.legend
  ancienne.in_panel = true
  let notifications = 0
  ancienne.subscribePanel(() => { notifications += 1 })
  app.reset()
  const nouvelle = app.drawing_area.legend
  expect(nouvelle).not.toBe(ancienne)
  expect(nouvelle.in_panel).toBe(true)
  expect(nouvelle.hidden_on_screen).toBe(true)
  nouvelle.panel_items = []
  expect(notifications).toBe(1)
})

test('hors colonne, le remplacement ne pose rien', () => {
  const app = new Class_ApplicationData(false)
  app.reset()
  expect(app.drawing_area.legend.in_panel).toBe(false)
})
