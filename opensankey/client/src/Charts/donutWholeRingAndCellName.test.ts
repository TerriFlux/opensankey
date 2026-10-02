// 02/10/2026 — COURONNE A PART UNIQUE ET NOM DE CASE DES PETITS MULTIPLES.
//
// Julien, sur « Tous produits » : « un label detache completement inutile ». Une part qui fait
// tout l anneau ne porte aucune etiquette : le centre dit deja la valeur. Et en petits multiples,
// le nom du membre de la case s ecrit au centre de sa couronne, au-dessus de la valeur.

import { drawDonutChart, isWholeRing, smallMultipleCentreName } from './NodeStatsCharts'
import type { Type_StatSlice } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const STYLE: Type_FigureChartStyle = {
  ...DONUT_STYLE_DEFAULTS,
  name_label_is_visible: true,
  value_label_is_visible: true,
  value_label_percent: 'value_total',
  centre_content: 'value',
  labels_callout_small: true
}
const WHOLE: Type_StatSlice[] = [{ id: 'tous', label: 'Tous produits', value: 550 }]

afterEach(() => { document.body.innerHTML = '' })

describe('une part qui fait tout l anneau', () => {
  test('isWholeRing reconnait l anneau plein et lui seul', () => {
    expect(isWholeRing(0, 2 * Math.PI)).toBe(true)
    expect(isWholeRing(0, Math.PI)).toBe(false)
  })

  test('couronne seule : ni etiquette, ni trait, ni nombre detache', () => {
    const el = sizedContainer()
    drawDonutChart(el, WHOLE, { style: { ...STYLE, name_label_callout: true }, format: v => String(v) })
    expect(el.querySelectorAll('.node_stats_callout').length).toBe(0)
    expect(el.querySelectorAll('text.node_stats_pct').length).toBe(0)
    expect(el.querySelectorAll('text.node_stats_value').length).toBe(0)
  })

  test('petits multiples : pas d etiquette non plus, le centre porte nom et valeur', () => {
    const el = sizedContainer()
    drawDonutChart(el, WHOLE, {
      style: STYLE,
      format: v => String(v),
      small_multiple: { radius_ratio: 1, callout_gap_px: 8, frame: () => undefined, name: 'Europe' }
    })
    expect(el.querySelectorAll('.node_stats_callout').length).toBe(0)
    expect(el.querySelectorAll('text.node_stats_pct').length).toBe(0)
    const name = el.querySelector('tspan.node_stats_cell_name')
    const value = el.querySelector('tspan.node_stats_cell_value')
    expect(name?.textContent).toBe('Europe')
    expect(value?.textContent).toBe('550')
    // Le nom au-dessus de la valeur, dans le trou.
    expect(Number(name?.getAttribute('y'))).toBeLessThan(Number(value?.getAttribute('y')))
  })

  test('deux parts : l etiquette tient dans son secteur et reste dedans', () => {
    const el = sizedContainer()
    drawDonutChart(el, [{ id: 'a', label: 'A', value: 1 }, { id: 'b', label: 'B', value: 1 }],
      { style: STYLE, format: v => String(v) })
    expect(el.querySelectorAll('.node_stats_callout').length).toBe(0)
    expect(el.querySelectorAll('text.node_stats_pct').length).toBe(2)
  })
})

describe('le nom d une case de petits multiples', () => {
  test('tient dans un grand trou, plus petit que la valeur', () => {
    const r = smallMultipleCentreName('Europe', 80, 22)
    expect(r.above).toBe(false)
    expect(r.lines).toEqual(['Europe'])
    expect(r.size).toBeLessThan(22)
  })

  test('trop long : coupe sur deux lignes avant de sortir', () => {
    const r = smallMultipleCentreName('Amerique du Sud et Caraibes', 60, 17)
    expect(r.above).toBe(false)
    expect(r.lines.length).toBe(2)
  })

  test('en dernier recours, au-dessus du disque', () => {
    expect(smallMultipleCentreName('Europe', 8, null).above).toBe(true)
    expect(smallMultipleCentreName('Amerique-du-Sud-et-Caraibes', 20, 11).above).toBe(true)
  })
})
