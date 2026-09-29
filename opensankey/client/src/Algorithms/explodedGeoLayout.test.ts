import { explodeAround, greatCircleKm, isExploded, Type_ExplodeItem } from './explodedGeoLayout'

const centre = { x: 0, y: 0 }
const item = (id: string, x: number, y: number, radius = 10, scalable = true): Type_ExplodeItem =>
  ({ id, x, y, radius, scalable })

describe('os#1364 carte eclatee : explodeAround', () => {
  it('garde la direction de chaque territoire isole', () => {
    const out = explodeAround(centre, [item('est', 100, 0), item('nord', 0, -300)], { centre_radius: 20, max_distance: 400 }).placements
    const est = out.get('est')!, nord = out.get('nord')!
    expect(Math.atan2(est.y, est.x)).toBeCloseTo(0, 5)
    expect(Math.atan2(nord.y, nord.x)).toBeCloseTo(-Math.PI / 2, 5)
  })

  it('garde l ordre des distances et ecarte les voisins du centre', () => {
    const out = explodeAround(centre, [item('voisin', 5, 0), item('loin', 0, 900)], { centre_radius: 20, max_distance: 700 }).placements
    const r = (id: string) => Math.hypot(out.get(id)!.x, out.get(id)!.y)
    expect(r('voisin')).toBeGreaterThan(20 + 10)
    expect(r('loin')).toBeGreaterThan(r('voisin'))
    expect(r('loin')).toBeLessThanOrEqual(900)
  })

  it('borne la taille : un micro etat grossit, un continent retrecit', () => {
    const out = explodeAround(centre, [item('micro', 100, 0, 0.5), item('continent', -400, 0, 500)],
      { centre_radius: 20, max_distance: 800 }).placements
    expect(out.get('micro')!.scale).toBeGreaterThan(1)
    expect(out.get('continent')!.scale).toBeLessThan(1)
  })

  it('ne met pas a l echelle un noeud sans territoire', () => {
    const out = explodeAround(centre, [item('region', 300, 0, 200, false)], { centre_radius: 20, max_distance: 800 }).placements
    expect(out.get('region')!.scale).toBe(1)
  })

  it('separe deux territoires dans la meme direction', () => {
    const out = explodeAround(centre, [item('a', 300, 0, 40), item('b', 300, 1, 40)], { centre_radius: 20, max_distance: 800 }).placements
    const a = out.get('a')!, b = out.get('b')!
    const ra = 40 * a.scale, rb = 40 * b.scale
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(ra + rb)
  })
})

describe('os#1364 carte eclatee : le centre', () => {
  it('agrandit un petit centre a la taille des plus grands voisins', () => {
    const { centre_scale } = explodeAround(centre, [item('a', 300, 0)], { centre_radius: 10, max_distance: 800 })
    expect(centre_scale).toBeCloseTo(0.09 * 800 / 10, 5)
  })
  it('ne reduit jamais le centre', () => {
    const { centre_scale } = explodeAround(centre, [item('a', 300, 0)], { centre_radius: 500, max_distance: 800 })
    expect(centre_scale).toBe(1)
  })
})

describe('os#1364 carte eclatee : qui s eclate', () => {
  it('laisse en place le centre et ce qui l entoure sans territoire', () => {
    expect(isExploded(10, true)).toBe(false)
    expect(isExploded(400, false)).toBe(false)
  })
  it('eclate un territoire voisin et un lieu lointain sans contour', () => {
    expect(isExploded(300, true)).toBe(true)
    expect(isExploded(3000, false)).toBe(true)
  })
  it('mesure Paris Bruxelles a environ 260 km', () => {
    expect(greatCircleKm(48.86, 2.35, 50.85, 4.35)).toBeGreaterThan(250)
    expect(greatCircleKm(48.86, 2.35, 50.85, 4.35)).toBeLessThan(275)
  })
})
