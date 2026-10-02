// 02/10/2026 — UN GRAND SECTEUR DONT L ETIQUETTE EST CENTREE EN BAS.
//
// Une part de 96 % de l anneau (debut 0, fin ~6 rad) a son libelle centre vers pi. Un coin du
// cadre juste a gauche du bas donne atan2 ~ -pi : la mesure par les angles le jugeait hors du
// secteur et l etiquette sortait, detachee, alors qu elle tenait largement.

import { angleInSector } from './NodeStatsCharts'

describe('angleInSector', () => {
  test('un secteur de plus d un demi tour contient les deux cotes du bas', () => {
    expect(angleInSector(-Math.PI + 0.01, 0, 6.0)).toBe(true)
    expect(angleInSector(Math.PI - 0.01, 0, 6.0)).toBe(true)
  })

  test('un petit secteur ne contient pas un angle avant son debut', () => {
    expect(angleInSector(-0.5, 0, 1)).toBe(false)
  })

  test('la tolerance elargit le secteur des deux cotes', () => {
    expect(angleInSector(-0.05, 0, 1, 0.1)).toBe(true)
    expect(angleInSector(1.05, 0, 1, 0.1)).toBe(true)
    expect(angleInSector(1.2, 0, 1, 0.1)).toBe(false)
  })
})
