import { allocateRadialSlots, groupArrivalsByCone, radialRadius, wrapAngle } from './radialAnchors'

const TWO_PI = 2 * Math.PI
const gapBetween = (a: number, b: number) => {
  let g = wrapAngle(b - a)
  if (g < 0) g += TWO_PI
  return g
}

describe('radialRadius — le contour grandit avec ses flux', () => {
  it('ne descend jamais sous le rayon demande par le noeud', () => {
    expect(radialRadius([{ id: 'a', angle: 0, thickness: 4 }], 20)).toBe(20)
  })

  it('offre au moins la somme des epaisseurs, avec un peu d air', () => {
    const items = [{ id: 'a', angle: 0, thickness: 100 }, { id: 'b', angle: 1, thickness: 100 }]
    const r = radialRadius(items, 1, 1.15)
    expect(r * TWO_PI).toBeCloseTo(230, 9)
  })
})

describe('allocateRadialSlots — chaque ancre au plus pres de sa cible, sans recouvrement', () => {
  it('laisse un flux seul exactement sur l azimut de sa cible', () => {
    const slots = allocateRadialSlots([{ id: 'a', angle: 0.7, thickness: 10 }], 50)
    expect(slots.get('a')).toBeCloseTo(0.7, 12)
  })

  it('ne bouge pas des flux deja assez ecartes', () => {
    const items = [
      { id: 'a', angle: 0, thickness: 10 }, { id: 'b', angle: Math.PI / 2, thickness: 10 },
      { id: 'c', angle: Math.PI, thickness: 10 }
    ]
    const slots = allocateRadialSlots(items, 100)
    expect(slots.get('a')).toBeCloseTo(0, 12)
    expect(slots.get('b')).toBeCloseTo(Math.PI / 2, 12)
    // π et −π sont le même angle : on compare modulo le tour.
    expect(wrapAngle((slots.get('c') as number) - Math.PI)).toBeCloseTo(0, 12)
  })

  it('ecarte deux flux vises au meme endroit, de part et d autre de la cible', () => {
    const items = [{ id: 'a', angle: 0, thickness: 20 }, { id: 'b', angle: 0, thickness: 20 }]
    const slots = allocateRadialSlots(items, 100)
    const a = slots.get('a') as number
    const b = slots.get('b') as number
    // Arcs de 0,2 rad chacun : les centres doivent etre a 0,2 rad l un de l autre, autour de 0.
    expect(Math.abs(a - b)).toBeCloseTo(0.2, 9)
    expect(a + b).toBeCloseTo(0, 9)
  })

  it('ne laisse aucun recouvrement sur un paquet serre, et respecte l ordre des azimuts', () => {
    const items = Array.from({ length: 40 }, (_, i) => ({
      id: 'l' + i, angle: (i % 5) * 0.01, thickness: 6 + (i % 3)
    }))
    const radius = radialRadius(items, 10)
    const slots = allocateRadialSlots(items, radius)
    const ordered = [...items].sort((p, q) => wrapAngle(p.angle) - wrapAngle(q.angle))
    for (let i = 0; i < ordered.length; i++) {
      const cur = ordered[i]
      const nxt = ordered[(i + 1) % ordered.length]
      const gap = gapBetween(slots.get(cur.id) as number, slots.get(nxt.id) as number)
      const needed = (cur.thickness + nxt.thickness) / (2 * radius)
      expect(gap).toBeGreaterThanOrEqual(needed - 1e-6)
    }
  })

  it('tient compte du tour complet : le dernier flux est voisin du premier', () => {
    const items = [
      { id: 'a', angle: Math.PI - 0.01, thickness: 30 },
      { id: 'b', angle: -Math.PI + 0.01, thickness: 30 }
    ]
    const slots = allocateRadialSlots(items, 50)
    // Deux arcs de 30 px sur un rayon de 50 : leurs centres doivent etre a (30 + 30) / (2 · 50).
    const gap = gapBetween(slots.get('a') as number, slots.get('b') as number)
    expect(gap).toBeGreaterThanOrEqual(60 / (2 * 50) - 1e-6)
  })
})

describe('allocateRadialSlots — le departage des flux de meme azimut', () => {
  it('range les flux de meme azimut par leur departage, croissant = angle croissant', () => {
    const items = [
      { id: 'b', angle: 0, thickness: 10, tie: [1] },
      { id: 'a', angle: 0, thickness: 10, tie: [0] },
      { id: 'c', angle: 0, thickness: 10, tie: [2] }
    ]
    const slots = allocateRadialSlots(items, 100)
    expect(slots.get('a')).toBeLessThan(slots.get('b') as number)
    expect(slots.get('b')).toBeLessThan(slots.get('c') as number)
  })

  it('compare le departage terme a terme', () => {
    const items = [
      { id: 'x', angle: 1, thickness: 10, tie: [0, 5] },
      { id: 'y', angle: 1, thickness: 10, tie: [0, 2] },
      { id: 'z', angle: 1, thickness: 10, tie: [-1, 9] }
    ]
    const slots = allocateRadialSlots(items, 100)
    expect(slots.get('z')).toBeLessThan(slots.get('y') as number)
    expect(slots.get('y')).toBeLessThan(slots.get('x') as number)
  })
})

describe('groupArrivalsByCone — une porte par direction', () => {
  const deg = (d: number) => d * Math.PI / 180
  const arr = (id: string, az: number) => ({ id, azimuth: deg(az), angle: deg(az), weight: 1 })

  it('groupe des sources proches en une seule porte', () => {
    const doors = groupArrivalsByCone([arr('a', 10), arr('b', 14), arr('c', 18)])
    expect(new Set([...doors.values()].map(d => d.group)).size).toBe(1)
    expect(doors.get('a')?.angle).toBeCloseTo(deg(14), 5)
  })

  it('separe des sources de directions differentes', () => {
    const doors = groupArrivalsByCone([arr('nord', -90), arr('est', 0), arr('sud', 90)])
    expect(new Set([...doors.values()].map(d => d.group)).size).toBe(3)
    expect(doors.get('est')?.angle).toBeCloseTo(0, 5)
  })

  it('borne la largeur d une porte au lieu de chainer de proche en proche', () => {
    const tour = Array.from({ length: 36 }, (_, k) => arr('p' + k, k * 10))
    const doors = groupArrivalsByCone(tour)
    const groups = new Set([...doors.values()].map(d => d.group)).size
    expect(groups).toBeGreaterThanOrEqual(12)
  })

  it('traverse le demi tour sans couper une porte', () => {
    const doors = groupArrivalsByCone([arr('a', 175), arr('b', -175), arr('c', 0)])
    expect(doors.get('a')?.group).toBe(doors.get('b')?.group)
    expect(doors.get('c')?.group).not.toBe(doors.get('a')?.group)
  })
})
