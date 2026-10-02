import { smallMultipleCalloutGap, smallMultipleRadiusRatio, unionDrawnBox } from './NodeStatsCharts'

// 02/10/2026 — LES PETITS MULTIPLES A LA MEME ECHELLE. Julien : « en mode multiple avec des labels
// detaches on a l impression de ne pas avoir la meme echelle ». L aire dit la valeur, et toutes les
// cases se cadrent sur la meme boite.

describe('petits multiples — le rayon dit la valeur', () => {
  test('la plus grosse couronne prend tout le rayon de sa case', () => {
    expect(smallMultipleRadiusRatio(80, 80)).toBe(1)
  })

  test('un quart du total, la moitie du rayon : l aire est proportionnelle', () => {
    expect(smallMultipleRadiusRatio(20, 80)).toBeCloseTo(0.5)
  })

  test('une couronne vide n a pas de rayon', () => {
    expect(smallMultipleRadiusRatio(0, 80)).toBe(0)
    expect(smallMultipleRadiusRatio(0, 0)).toBe(0)
  })
})

describe('petits multiples — les etiquettes sorties restent pres du disque', () => {
  test('l ecart suit la taille de la case', () => {
    expect(smallMultipleCalloutGap(200)).toBe(8)
  })

  test('jamais plus que celui d une couronne seule, jamais moins de 3 px', () => {
    expect(smallMultipleCalloutGap(2000)).toBe(14)
    expect(smallMultipleCalloutGap(20)).toBe(3)
  })
})

describe('petits multiples — un seul cadre pour toutes les cases', () => {
  test('le cadre commun est l union des cadres, reserve d etiquettes la plus large comprise', () => {
    expect(unionDrawnBox([
      { x0: -50, x1: 50, y0: -50, y1: 50 },
      { x0: -120, x1: 30, y0: -30, y1: 60 }
    ])).toEqual({ x0: -120, x1: 50, y0: -50, y1: 60 })
  })

  test('sans case, pas de cadre', () => {
    expect(unionDrawnBox([])).toBeNull()
  })
})
