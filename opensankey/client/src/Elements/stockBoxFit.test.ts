import { stockBoxFittedFontSize } from './stockBoxFit'

const base = {
  font_size: 20,
  line_gap: 3,
  nb_lines: 5,
  text_width: 100,
  avail_width: 200,
  avail_height: 500,
  inside_h: true,
  inside_v: true
}

describe('stockBoxFittedFontSize', () => {
  it('garde la police quand la boite tient deja', () => {
    expect(stockBoxFittedFontSize(base)).toBe(20)
  })

  it('reduit la police au ratio de largeur quand la boite deborde en largeur', () => {
    expect(stockBoxFittedFontSize({ ...base, text_width: 400 })).toBeCloseTo(10)
  })

  it('ne reduit pas une boite exterieure meme si elle est plus large que le noeud', () => {
    expect(stockBoxFittedFontSize({ ...base, text_width: 400, inside_h: false })).toBe(20)
  })

  it('reduit la police au ratio de hauteur quand la boite deborde en hauteur', () => {
    // 5 lignes de 23 = 115 pour 46 de place : ratio 0,4 puis correction de l interligne fixe
    const fitted = stockBoxFittedFontSize({ ...base, avail_height: 46 })
    expect(fitted).toBeLessThan(20)
    expect(5 * (fitted + 3)).toBeLessThanOrEqual(46 + 1e-9)
  })

  it('ne rend jamais une police negative', () => {
    expect(stockBoxFittedFontSize({ ...base, avail_height: 5 })).toBe(0)
    expect(stockBoxFittedFontSize({ ...base, avail_width: 0, text_width: 50 })).toBe(0)
  })

  it('prend le plus contraignant des deux axes', () => {
    // largeur : ratio 0,5 ; hauteur : 5 lignes de 23 = 115 pour 230 = ratio 2 → largeur gagne
    expect(stockBoxFittedFontSize({ ...base, text_width: 400, avail_height: 230 })).toBeCloseTo(10)
  })
})
