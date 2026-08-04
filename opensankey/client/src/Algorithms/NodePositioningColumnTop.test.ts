import { NodePositioning } from './NodePositioning'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'

// #366 — Haut de colonne de l'empilement en ÉCARTEMENT (`shape_position_type` = 'parametric',
// par nœud). La TÊTE d'une colonne n'a personne au-dessus d'elle : elle restait placée par le
// mode global, qui garde son CENTRE fixe quand sa hauteur change. Deux colonnes posées à la même
// hauteur mais dont les nœuds de tête n'ont pas la même taille se désalignaient donc dès le
// premier changement de sélection de data tags — c'est le « les deux colonnes ne se font plus
// face » du ticket. La tête se cale désormais sur le haut de colonne, mémorisé au premier
// empilement sur la disposition de l'auteur.
//
// Le compactage des colonnes lui-même est acquis par #364 (masquer un cadre vidé), #365
// (ré-empiler les enfants d'un cadre masqué) et #368 (dessiner un cadre à membre visible).

type FakeNode = {
  id: string
  name: string
  is_visible: boolean
  shape_position_type: 'parametric' | 'absolute' | 'relative'
  position_u: number
  position_v: number
  position_y: number
  shape_position_dy: number
  height: number
  dimensions_as_child: unknown[]
  dimensions_as_parent: unknown[]
  getShapeHeightToUse: () => number
  applyPosition: () => void
  hasGivenTag: () => boolean
}

function node(
  name: string,
  { v = 0, y, h = 10, dy = 0, ecartement = true, u = 0, visible = true }:
  { v?: number, y: number, h?: number, dy?: number, ecartement?: boolean, u?: number, visible?: boolean }
): FakeNode {
  return {
    id: name,
    name,
    is_visible: visible,
    shape_position_type: ecartement ? 'parametric' : 'absolute',
    position_u: u,
    position_v: v,
    position_y: y,
    shape_position_dy: dy,
    height: h,
    dimensions_as_child: [],
    dimensions_as_parent: [],
    getShapeHeightToUse: function () { return this.height },
    applyPosition: () => { /* pas de SVG ici */ },
    hasGivenTag: () => false,
  }
}

function positioning(nodes: FakeNode[]) {
  const drawingArea = {
    sankey: {
      node_taggs_dict: {},
      get visible_nodes_list() {
        return nodes.filter(n => n.is_visible) as unknown as Class_NodeElement[]
      },
    },
  }
  return new NodePositioning(drawingArea as unknown as Class_DrawingArea)
}

const pile = (nodes: FakeNode[]) => nodes
  .filter(n => n.is_visible)
  .sort((a, b) => a.position_y - b.position_y)
  .map(n => `${n.name}@${n.position_y}`)

describe('#366 écartement — haut de colonne', () => {
  it('garde deux colonnes alignées par le haut quand les têtes changent de taille', () => {
    const g = node('g', { u: 0, y: 60, h: 100 })
    const d = node('d', { u: 1, y: 60, h: 800 })
    const np = positioning([g, d])
    np.anchorParametricNodesToAbsolute()   // mémorise les hauts de colonne : 60 et 60
    expect(Object.fromEntries(np.columnTops)).toEqual({ 0: 60, 1: 60 })

    // Nouveau data tag : les deux têtes maigrissent, chacune autour de SON centre — c'est ce
    // qui les désalignait (60 d'un côté, 459 de l'autre).
    g.height = 1; g.position_y = 109
    d.height = 1; d.position_y = 459
    np.anchorParametricNodesToAbsolute()

    expect([g.position_y, d.position_y]).toEqual([60, 60])
  })

  it('fait remonter la colonne quand c\'est sa TÊTE qui est masquée', () => {
    const a = node('a', { v: 0, y: 100 })
    const b = node('b', { v: 1, y: 110 })
    const np = positioning([a, b])

    np.anchorParametricNodesToAbsolute()   // mémorise le haut de colonne : 100
    a.is_visible = false
    np.anchorParametricNodesToAbsolute()

    expect(b.position_y).toBe(100)
  })

  it('ne touche pas à une tête de colonne en coordonnées ABSOLUES', () => {
    // Le haut de colonne ne vaut que pour l'écartement : une tête absolue reste placée par le
    // mode global, et sert d'ancre à la pile qui pend dessous.
    const a = node('a', { v: 0, y: 100, ecartement: false })
    const b = node('b', { v: 1, y: 900 })
    const np = positioning([a, b])
    np.anchorParametricNodesToAbsolute()

    a.position_y = 400
    np.anchorParametricNodesToAbsolute()

    expect(pile([a, b])).toEqual(['a@400', 'b@410'])
    expect(np.columnTops.size).toBe(0)
  })

  it('mémorise un haut par colonne, indépendamment', () => {
    const g1 = node('g1', { u: 0, v: 0, y: 0 })
    const g2 = node('g2', { u: 0, v: 1, y: 200 })
    const d1 = node('d1', { u: 1, v: 0, y: 50 })
    const d2 = node('d2', { u: 1, v: 1, y: 400 })
    const np = positioning([g1, g2, d1, d2])

    np.anchorParametricNodesToAbsolute()

    expect(Object.fromEntries(np.columnTops)).toEqual({ 0: 0, 1: 50 })
    expect(g2.position_y).toBe(10)
    expect(d2.position_y).toBe(60)
  })

  it('est idempotent : ré-empiler ne déplace plus rien', () => {
    const a = node('a', { v: 0, y: 0 })
    const b = node('b', { v: 1, y: 40 })
    const np = positioning([a, b])

    np.anchorParametricNodesToAbsolute()
    const premier = pile([a, b])
    np.anchorParametricNodesToAbsolute()

    expect(pile([a, b])).toEqual(premier)
  })

  it('oublie le haut de colonne quand l\'utilisateur repose les positions', () => {
    // Sans cet oubli, une tête de colonne déplacée serait rappelée à son ancien haut au dessin
    // suivant. Appelé en fin de déplacement à la souris.
    const a = node('a', { v: 0, y: 0 })
    const b = node('b', { v: 1, y: 40 })
    const np = positioning([a, b])
    np.anchorParametricNodesToAbsolute()

    a.position_y = 200
    b.position_y = 240
    np.clearColumnTops()
    np.anchorParametricNodesToAbsolute()

    expect(pile([a, b])).toEqual(['a@200', 'b@210'])
    expect(Object.fromEntries(np.columnTops)).toEqual({ 0: 200 })
  })
})
