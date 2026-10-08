import {
  passPointCenterline, passPointToWorld, worldToPassPoint, polylineMidpoint, Type_Pt
} from './linkPassPoints'

// opensankey#1301 — points de passage lisses : repère relatif et courbe C1.

describe('points de passage', () => {
  const s: Type_Pt = [0, 0]
  const t: Type_Pt = [200, 100]

  test('aller retour monde relatif dans les trois repères', () => {
    const w: Type_Pt = [80, -30]
    for (const frame of ['h', 'v', 'chord'] as const) {
      const back = passPointToWorld(worldToPassPoint(w, s, t, frame), s, t, frame)
      expect(back[0]).toBeCloseTo(w[0])
      expect(back[1]).toBeCloseTo(w[1])
    }
  })

  test('le point suit les ancres quand le noeud cible bouge', () => {
    const p = worldToPassPoint([100, 20], s, t, 'h')
    const moved = passPointToWorld(p, s, [200, 300], 'h')
    expect(moved[0]).toBeCloseTo(100)
    expect(moved[1]).toBeCloseTo(120)
  })

  test('la courbe passe par le point avec une tangente horizontale', () => {
    const pass: Type_Pt = [100, -40]
    const pts = passPointCenterline({
      p0: [0, 0], p1: [10, 0], p2: [55, 0], p4: [145, 100], p5: [190, 100], p6: [200, 100],
      pass: [pass], frame: 'h', curved: true
    })
    const i = pts.findIndex(p => Math.hypot(p[0] - pass[0], p[1] - pass[1]) < 1e-6)
    expect(i).toBeGreaterThan(0)
    // Voisins de part et d'autre à la même hauteur (tangente horizontale, au 2e ordre près)
    expect(Math.abs(pts[i - 1][1] - pass[1])).toBeLessThan(1)
    expect(Math.abs(pts[i + 1][1] - pass[1])).toBeLessThan(1)
    expect(pts[0]).toEqual([0, 0])
    expect(pts[pts.length - 1]).toEqual([200, 100])
  })

  test('milieu curviligne', () => {
    expect(polylineMidpoint([[0, 0], [10, 0], [10, 10]])).toEqual([10, 0])
  })
})
