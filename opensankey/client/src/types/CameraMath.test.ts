import * as d3 from '../d3Modules'
import { sameZoomTransform, fitTransform, centerTransform, shiftTransformByWorldDelta } from './CameraMath'

// #242 — Maths pures de caméra, testées en isolation.

describe('#242 sameZoomTransform', () => {
  it('vrai pour deux transforms identiques', () => {
    const a = d3.zoomIdentity.translate(10, 20).scale(2)
    const b = d3.zoomIdentity.translate(10, 20).scale(2)
    expect(sameZoomTransform(a, b)).toBe(true)
  })

  it('faux si k, x ou y diffèrent au-delà de l\'epsilon', () => {
    const a = d3.zoomIdentity.translate(10, 20).scale(2)
    expect(sameZoomTransform(a, d3.zoomIdentity.translate(10, 20).scale(2.001))).toBe(false)
    expect(sameZoomTransform(a, d3.zoomIdentity.translate(10.001, 20).scale(2))).toBe(false)
    expect(sameZoomTransform(a, d3.zoomIdentity.translate(10, 20.001).scale(2))).toBe(false)
  })
})

describe('#242 fitTransform', () => {
  it('cadre les bounds dans le viewport en préservant le ratio', () => {
    // bounds 100x50, viewport 300x300 (marge 0) => k limité par la hauteur : 300/50=6 vs 300/100=3 => k=3
    const t = fitTransform({ x: 0, y: 0, width: 100, height: 50 }, { width: 300, height: 300, top_offset: 0 }, 0)
    expect(t.k).toBeCloseTo(3)
    // translate = -bounds*k (origine à 0,0, marge 0, top_offset 0)
    expect(t.x).toBeCloseTo(0)
    expect(t.y).toBeCloseTo(0)
  })

  it('borne l\'échelle à [0.05, 20]', () => {
    // bounds minuscules => k voudrait exploser, borné à 20
    const t = fitTransform({ x: 0, y: 0, width: 1, height: 1 }, { width: 1000, height: 1000, top_offset: 0 }, 0)
    expect(t.k).toBe(20)
    // bounds énormes => k voudrait tendre vers 0, borné à 0.05
    const t2 = fitTransform({ x: 0, y: 0, width: 1e6, height: 1e6 }, { width: 100, height: 100, top_offset: 0 }, 0)
    expect(t2.k).toBe(0.05)
  })

  it('applique la marge et le décalage vertical (top_offset)', () => {
    const t = fitTransform({ x: 0, y: 0, width: 100, height: 100 }, { width: 200, height: 200, top_offset: 30 }, 20)
    // k = (200-20)/100 = 1.8
    expect(t.k).toBeCloseTo(1.8)
    // x = margin/2 - x*k = 10 ; y = top_offset + margin/2 - y*k = 30 + 10 = 40
    expect(t.x).toBeCloseTo(10)
    expect(t.y).toBeCloseTo(40)
  })
})

describe('#1250 centerTransform', () => {
  it('place le point monde sous le point écran à l\'échelle donnée', () => {
    // world (50,40) doit se retrouver à l'écran en (200,150) avec k=2
    const t = centerTransform({ x: 50, y: 40 }, { x: 200, y: 150 }, 2)
    expect(t.k).toBe(2)
    // translate = screen - k*world = 200-100=100 ; 150-80=70
    expect(t.x).toBeCloseTo(100)
    expect(t.y).toBeCloseTo(70)
    // vérif inverse : appliquer le transform au point monde redonne le point écran
    expect(t.applyX(50)).toBeCloseTo(200)
    expect(t.applyY(40)).toBeCloseTo(150)
  })
})

describe('#1250 shiftTransformByWorldDelta', () => {
  it('préserve le rendu écran après un décalage monde de tous les points', () => {
    const t0 = d3.zoomIdentity.translate(10, 20).scale(3)
    const dx = 5, dy = -4
    const t = shiftTransformByWorldDelta(t0, dx, dy)
    // échelle inchangée
    expect(t.k).toBe(3)
    // un point monde P, une fois décalé de (dx,dy), doit rendre au MÊME pixel qu'avant
    const px = 12, py = 7
    expect(t.applyX(px + dx)).toBeCloseTo(t0.applyX(px))
    expect(t.applyY(py + dy)).toBeCloseTo(t0.applyY(py))
  })

  it('delta nul = transform inchangé', () => {
    const t0 = d3.zoomIdentity.translate(3, 4).scale(1.5)
    expect(sameZoomTransform(shiftTransformByWorldDelta(t0, 0, 0), t0)).toBe(true)
  })
})
