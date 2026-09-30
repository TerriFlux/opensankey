// sa#581 — LA FEUILLE DU DESSIN AU RAS DU VOLET.
//
// Le dessin trace sa feuille en retrait dans son SVG ; le cadre d'un volet élargit donc le SVG
// d'autant et le découpe d'autant (`inset`), et laisse libre le carré de la poignée de taille d'un
// volet flottant (`notch`). Ce qui est découpé n'est ni vu ni cliquable.

import { canvasFrameClipPath } from './DrawingArea'

describe('sa#581 le découpage du SVG du dessin', () => {

  it('sans retrait ni coin : aucun découpage', () => {
    expect(canvasFrameClipPath({ width: 100, height: 80 })).toBeNull()
  })

  it('un retrait seul : le SVG est découpé d autant de chaque côté', () => {
    expect(canvasFrameClipPath({ width: 100, height: 80, inset: 5 })).toBe('inset(5px)')
  })

  it('avec la poignée : le carré du coin bas-droit est laissé libre', () => {
    expect(canvasFrameClipPath({ width: 100, height: 80, inset: 5, notch: 14 }))
      .toBe('polygon(5px 5px, 95px 5px, 95px 61px, 81px 61px, 81px 75px, 5px 75px)')
  })
})
