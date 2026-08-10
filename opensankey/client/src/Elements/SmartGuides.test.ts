// os#671 — smart guides d'alignement au drag : logique de snap (index des bords
// candidats, tolérance, axes contraints par le modèle, débrayage). Le rendu D3
// n'est pas exercé (d3_selection_elements_group null → couche de guides inerte).

import { Class_SmartGuides } from './SmartGuides'

import type { Class_NodeBase } from './NodeBase'
import type { Class_DrawingArea } from '../types/DrawingArea'

interface FakeNodeSpec {
  id: string
  x: number
  y: number
  w: number
  h: number
  free_axes?: { x: boolean, y: boolean }
}

function fakeNode(spec: FakeNodeSpec): Class_NodeBase {
  return {
    id: spec.id,
    position_x: spec.x,
    position_y: spec.y,
    getShapeWidthToUse: () => spec.w,
    getShapeHeightToUse: () => spec.h,
    getFreeDragSnapAxes: () => spec.free_axes ?? { x: true, y: true },
  } as unknown as Class_NodeBase
}

function fakeDrawingArea(candidates: Class_NodeBase[], zoom = 1): Class_DrawingArea {
  return {
    getZoomScale: () => zoom,
    d3_selection_elements_group: null,
    sankey: {
      visible_nodes_list: candidates,
      visible_containers_list: [],
    },
  } as unknown as Class_DrawingArea
}

describe('Class_SmartGuides — snap doux au drag (os#671)', () => {

  // Un voisin fixe : boîte 100..150 en x, 200..240 en y (centre 125, 220).
  const neighbor = fakeNode({ id: 'B', x: 100, y: 200, w: 50, h: 40 })

  const makeGuides = (dragged: Class_NodeBase, zoom = 1) =>
    new Class_SmartGuides(fakeDrawingArea([neighbor], zoom), new Set([dragged.id]), [dragged])

  it('aligne bord-à-bord quand le bord gauche approche celui du voisin', () => {
    const dragged = fakeNode({ id: 'A', x: 0, y: 0, w: 30, h: 20 })
    const guides = makeGuides(dragged)
    // Boîte brute : left = 104 → à 4 px du bord gauche du voisin (100).
    const { dx, dy } = guides.update({ x: 104, y: 0, w: 30, h: 20 }, true)
    expect(dx).toBe(-4)
    // Aucun bord/centre y du voisin (200/220/240) à moins de 6 px de 0/10/20.
    expect(dy).toBe(0)
  })

  it('aligne le bord droit sur un bord candidat (droit du voisin)', () => {
    const dragged = fakeNode({ id: 'A', x: 0, y: 0, w: 30, h: 20 })
    const guides = makeGuides(dragged)
    // right brut = 117 + 30 = 147 → à 3 px du bord droit du voisin (150).
    const { dx } = guides.update({ x: 117, y: 0, w: 30, h: 20 }, true)
    expect(dx).toBe(3)
  })

  it('aligne centre-à-centre (jamais bord-à-centre)', () => {
    const dragged = fakeNode({ id: 'A', x: 0, y: 0, w: 30, h: 20 })
    const guides = makeGuides(dragged)
    // Centre y brut = 208 + 10 = 218 → à 2 px du centre y du voisin (220).
    // (bords y bruts 208/228 : à 8 px de 200 et 12 px de 240 → hors tolérance)
    const { dy } = guides.update({ x: 0, y: 208, w: 30, h: 20 }, true)
    expect(dy).toBe(2)
  })

  it('ne snappe pas hors tolérance', () => {
    const dragged = fakeNode({ id: 'A', x: 0, y: 0, w: 30, h: 20 })
    const guides = makeGuides(dragged)
    // left brut = 110 → à 10 px de 100 ; centre 125 à 0 px du centre voisin ? non : 110+15=125 !
    // Prendre une boîte sans AUCUN alignement à moins de 6 px : left=112 (12 px de 100,
    // centre 127 à 2 px de 125… décale encore) → left=90 : 10 px de 100, centre 105 (20 px), right 120 (20 px de 100, 30 de 150).
    const { dx } = guides.update({ x: 90, y: 0, w: 30, h: 20 }, true)
    expect(dx).toBe(0)
  })

  it('la tolérance suit le zoom (px écran constants)', () => {
    const dragged = fakeNode({ id: 'A', x: 0, y: 0, w: 30, h: 20 })
    // Zoom x2 → tolérance monde = 3 px : un écart de 4 px ne snappe plus.
    const guides = makeGuides(dragged, 2)
    const { dx } = guides.update({ x: 104, y: 0, w: 30, h: 20 }, true)
    expect(dx).toBe(0)
    // Mais un écart de 2 px snappe.
    const second = makeGuides(dragged, 2)
    expect(second.update({ x: 102, y: 0, w: 30, h: 20 }, true).dx).toBe(-2)
  })

  it('snap débrayé (Alt) : aucune correction', () => {
    const dragged = fakeNode({ id: 'A', x: 0, y: 0, w: 30, h: 20 })
    const guides = makeGuides(dragged)
    const { dx, dy } = guides.update({ x: 104, y: 196, w: 30, h: 20 }, false)
    expect(dx).toBe(0)
    expect(dy).toBe(0)
  })

  it('respecte l\'axe contraint par le modèle (hook getFreeDragSnapAxes)', () => {
    // Nœud dont le x est re-dérivé par la mise en page (ex. paramétrique).
    const dragged = fakeNode({ id: 'A', x: 0, y: 0, w: 30, h: 20, free_axes: { x: false, y: true } })
    const guides = makeGuides(dragged)
    const { dx, dy } = guides.update({ x: 104, y: 196, w: 30, h: 20 }, true)
    expect(dx).toBe(0) // alignement x pourtant à 4 px — refusé par la contrainte
    expect(dy).toBe(4) // top brut 196 → bord haut du voisin 200
  })

  it('exclut du champ des candidats tout ce que le drag emporte', () => {
    const dragged = fakeNode({ id: 'B', x: 0, y: 0, w: 30, h: 20 })
    // Le seul voisin indexable est B lui-même (même id) → aucun candidat.
    const guides = new Class_SmartGuides(fakeDrawingArea([neighbor]), new Set(['B']), [dragged])
    const { dx, dy } = guides.update({ x: 104, y: 196, w: 30, h: 20 }, true)
    expect(dx).toBe(0)
    expect(dy).toBe(0)
  })

  it('clear() est sans effet quand rien n\'a été dessiné', () => {
    const dragged = fakeNode({ id: 'A', x: 0, y: 0, w: 30, h: 20 })
    const guides = makeGuides(dragged)
    expect(() => guides.clear()).not.toThrow()
  })
})
