import { Class_ApplicationData } from '../types/ApplicationData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// sa#663 — Julien, 14/10 (SOCLE, page Cereales) : choisir une autre cereale faisait reapparaitre
// l ancienne legende par-dessus le diagramme, et la colonne gardait les entrees de la cereale d ouverture.

test('une legende dans la colonne ne se fige pas', () => {
  const legend = new Class_ApplicationData(false).drawing_area.legend
  legend.in_panel = true
  legend.markBroken()
  expect(legend.managed).toBe(true)
})

test('une legende figee dans la colonne rafraichit quand meme ses entrees au dessin', () => {
  const legend = new Class_ApplicationData(false).drawing_area.legend
  legend.in_panel = true
  legend.managed = false
  let notifications = 0
  legend.subscribePanel(() => { notifications += 1 })
  legend.draw()
  expect(notifications).toBe(1)
})

test('hors de la colonne une legende figee reste inerte', () => {
  const legend = new Class_ApplicationData(false).drawing_area.legend
  legend.managed = false
  let notifications = 0
  legend.subscribePanel(() => { notifications += 1 })
  legend.draw()
  expect(notifications).toBe(0)
})
