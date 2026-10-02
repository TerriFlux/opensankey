// 02/10/2026 — LES ETIQUETTES DETACHEES DE LA COURONNE NE SE CHEVAUCHENT PLUS.
//
// Julien, capture a l appui : « non ça va pas, les labels detaches ». Huit petites parts
// consecutives ecrivaient leurs etiquettes collees au bord de l arc, les unes sur les autres et sur
// le disque. Le patron classique : coude radial, colonne a droite ou a gauche, repoussee verticalement.

import { CALLOUT_MAX_SHIFT_LINES, CALLOUT_STACK_GAP_PX, layoutDonutCallouts } from './donutCalloutLayout'
import type { Type_CalloutRequest } from './donutCalloutLayout'

const RADIUS = 100
const GAP = 10
const H = 14
const W = 90

interface Box { x0: number, x1: number, y0: number, y1: number }

/** Huit parts de 1 % a la suite, a partir de `start` (en part du tour). */
const huitPetites = (start: number): Type_CalloutRequest[] =>
  Array.from({ length: 8 }, (_v, i) => ({
    id: `p${i}`,
    mid_angle: 2 * Math.PI * (start + 0.01 * i + 0.005),
    height: H,
    width: W,
    weight: 8 - i
  }))

const boxesOf = (requests: Type_CalloutRequest[], bounds = {}): Box[] => {
  const placed = layoutDonutCallouts(requests, RADIUS, GAP, GAP, bounds)
  return requests.filter(r => placed.has(r.id)).map(r => {
    const p = placed.get(r.id)!
    const x0 = p.text_anchor === 'start' ? p.x : p.x - W
    return { x0, x1: x0 + W, y0: p.y - H / 2, y1: p.y + H / 2 }
  })
}

const overlap = (a: Box, b: Box): boolean =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1

/** Le point du rectangle le plus proche du centre est-il dans le disque ? */
const surLeDisque = (b: Box): boolean => {
  const cx = Math.max(b.x0, Math.min(0, b.x1))
  const cy = Math.max(b.y0, Math.min(0, b.y1))
  return Math.hypot(cx, cy) < RADIUS
}

describe('etiquettes detachees de la couronne', () => {

  it.each([0, 0.2, 0.45, 0.7, 0.96])('huit petites parts a partir de %p du tour : aucun chevauchement', start => {
    const boxes = boxesOf(huitPetites(start))

    // 02/10/2026 — au plus ce qui tient pres de son ancre : la plus grande part au moins.
    expect(boxes.length).toBeGreaterThan(0)
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlap(boxes[i], boxes[j])).toBe(false)
      }
    }
  })

  it.each([0, 0.2, 0.45, 0.7, 0.96])('huit petites parts a partir de %p du tour : aucune sur le disque', start => {
    boxesOf(huitPetites(start)).forEach(b => expect(surLeDisque(b)).toBe(false))
  })

  it('une colonne garde la hauteur de chaque etiquette plus deux pixels', () => {
    const placed = layoutDonutCallouts(huitPetites(0.1), RADIUS, GAP)
    const ys = [...placed.values()].map(p => p.y).sort((a, b) => a - b)
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(H + CALLOUT_STACK_GAP_PX - 1e-9)
  })

  it('le trait coude sur la direction radiale, a rayon plus ecart', () => {
    const placed = layoutDonutCallouts(huitPetites(0.1), RADIUS, GAP)
    placed.forEach(p => {
      expect(Math.hypot(p.anchor.x, p.anchor.y)).toBeCloseTo(RADIUS)
      expect(Math.hypot(p.elbow.x, p.elbow.y)).toBeCloseTo(RADIUS + GAP)
      expect(p.text_anchor).toBe(p.side > 0 ? 'start' : 'end')
    })
  })

  it('dans un cadre borne, les plus grandes parts gardent leur etiquette et rien ne deborde', () => {
    // La bande d une case de petits multiples : le disque, son coude et une etiquette.
    const half = RADIUS + GAP + H
    const requests = huitPetites(0)
    const placed = layoutDonutCallouts(requests, RADIUS, GAP, GAP, { half_height: half })

    expect(placed.size).toBeLessThan(8)
    expect(placed.has('p0')).toBe(true)
    placed.forEach(p => {
      expect(p.y - H / 2).toBeGreaterThanOrEqual(-half - 1e-9)
      expect(p.y + H / 2).toBeLessThanOrEqual(half + 1e-9)
    })
  })

  // 02/10/2026 — Julien, capture « Export par continent » : dix etiquettes empilees en colonne a
  // gauche, un eventail de traits longs qui se croisent. Chacune reste pres de son ancre, ou se tait.
  it.each([0, 0.2, 0.45, 0.7, 0.96])('a partir de %p du tour : chaque etiquette reste pres de son coude', start => {
    const placed = layoutDonutCallouts(huitPetites(start), RADIUS, GAP)
    placed.forEach(p => {
      expect(Math.abs(p.y - p.elbow.y)).toBeLessThanOrEqual(CALLOUT_MAX_SHIFT_LINES * H + 1e-9)
    })
  })

  it('les plus grandes parts passent d abord quand tout ne tient pas pres de son ancre', () => {
    const placed = layoutDonutCallouts(huitPetites(0), RADIUS, GAP)

    expect(placed.size).toBeLessThan(8)
    expect(placed.has('p0')).toBe(true)
    expect(placed.has('p1')).toBe(true)
  })

  it('des parts eparses gardent toutes leur etiquette, a la hauteur de leur coude', () => {
    const eparses: Type_CalloutRequest[] = [0.1, 0.3, 0.6, 0.85].map((a, i) => ({
      id: `e${i}`, mid_angle: 2 * Math.PI * a, height: H, width: W, weight: 1
    }))
    const placed = layoutDonutCallouts(eparses, RADIUS, GAP)

    expect(placed.size).toBe(4)
    placed.forEach(p => expect(p.y).toBeCloseTo(p.elbow.y))
  })
})
