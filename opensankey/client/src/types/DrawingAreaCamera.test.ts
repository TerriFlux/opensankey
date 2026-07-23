import { contentBoundsFromModel } from './DrawingAreaCamera'
import type { Class_DrawingArea } from './DrawingArea'

// #1250 phase 3a — bounds des formes calculés depuis le MODÈLE (labels exclus).
// Testables sans DOM : c'est tout l'intérêt de la bascule (l'ancienne mesure masquait
// des éléments puis appelait getBBox, donc n'était pas testable hors navigateur).

/** Nœud/ZDT minimal : seuls les accesseurs lus par contentBoundsFromModel. */
const fakeNode = (
  x: number, y: number, w: number, h: number,
  margins: { l?: number, r?: number, t?: number, b?: number } = {}
) => ({
  position_x: x,
  position_y: y,
  getShapeWidthToUse: () => w,
  getShapeHeightToUse: () => h,
  shape_margin_left: margins.l ?? 0,
  shape_margin_right: margins.r ?? 0,
  shape_margin_top: margins.t ?? 0,
  shape_margin_bottom: margins.b ?? 0,
  is_visible: true
})

/** Flux minimal. `control_points` par défaut = les extrémités (tracé droit). */
const fakeLink = (
  x0: number, y0: number, x1: number, y1: number,
  thickness = 0,
  control_points: number[][] = []
) => ({
  position_x_start: x0,
  position_y_start: y0,
  position_x_end: x1,
  position_y_end: y1,
  thickness,
  control_points_position: control_points.length
    ? Object.fromEntries(control_points.map((p, i) => [`cp${i}`, p]))
    : {}
})

const fakeDA = (
  nodes: unknown[] = [],
  links: unknown[] = [],
  containers: unknown[] = []
) => ({
  sankey: {
    visible_nodes_list: nodes,
    visible_links_list: links,
    containers_list: containers
  }
}) as unknown as Class_DrawingArea

describe('#1250 contentBoundsFromModel', () => {
  it('null quand rien n\'est visible', () => {
    expect(contentBoundsFromModel(fakeDA())).toBeNull()
  })

  it('borne un nœud par sa position et sa taille', () => {
    const da = fakeDA([fakeNode(10, 20, 100, 50)])
    expect(contentBoundsFromModel(da)).toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('inclut les marges de forme (translate(-margin_left,-margin_top) au dessin)', () => {
    const da = fakeDA([fakeNode(10, 20, 100, 50, { l: 5, r: 3, t: 2, b: 4 })])
    // s'étend de (10−5, 20−2) à (10+100+3, 20+50+4)
    expect(contentBoundsFromModel(da)).toEqual({ x: 5, y: 18, width: 108, height: 56 })
  })

  it('englobe plusieurs nœuds', () => {
    const da = fakeDA([fakeNode(0, 0, 10, 10), fakeNode(100, 200, 10, 10)])
    expect(contentBoundsFromModel(da)).toEqual({ x: 0, y: 0, width: 110, height: 210 })
  })

  it('prend en compte les zones de texte visibles, et ignore les invisibles', () => {
    const hidden = { ...fakeNode(500, 500, 10, 10), is_visible: false }
    const da = fakeDA([fakeNode(0, 0, 10, 10)], [], [fakeNode(50, 60, 20, 20), hidden])
    expect(contentBoundsFromModel(da)).toEqual({ x: 0, y: 0, width: 70, height: 80 })
  })

  it('élargit un flux de sa demi-épaisseur', () => {
    const da = fakeDA([], [fakeLink(0, 100, 200, 100, 20)])
    // épaisseur 20 → ±10 autour de la ligne centrale
    expect(contentBoundsFromModel(da)).toEqual({ x: -10, y: 90, width: 220, height: 20 })
  })

  it('majore le tracé via l\'enveloppe des points de contrôle (flux qui boucle)', () => {
    // Un flux de recyclage boucle HORS du segment source→cible : sans les points de
    // contrôle, la bbox le tronquerait.
    const da = fakeDA([], [fakeLink(0, 0, 100, 0, 0, [[50, -80]])])
    expect(contentBoundsFromModel(da)).toEqual({ x: 0, y: -80, width: 100, height: 80 })
  })

  it('ne sous-estime jamais : le résultat contient nœuds ET flux', () => {
    const da = fakeDA(
      [fakeNode(0, 0, 10, 10)],
      [fakeLink(10, 5, 300, 5, 4)]
    )
    const b = contentBoundsFromModel(da)!
    expect(b.x).toBeLessThanOrEqual(0)
    expect(b.y).toBeLessThanOrEqual(0)
    expect(b.x + b.width).toBeGreaterThanOrEqual(300)
  })

  it('ignore les coordonnées non finies au lieu de propager NaN', () => {
    // Un flux non encore positionné peut porter des NaN ; ils ne doivent pas
    // contaminer les bounds (NaN se propagerait à tout le cadrage).
    const da = fakeDA([fakeNode(0, 0, 10, 10)], [fakeLink(NaN, NaN, NaN, NaN, 0)])
    expect(contentBoundsFromModel(da)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })
})
