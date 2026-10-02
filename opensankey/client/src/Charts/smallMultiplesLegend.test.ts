// 02/10/2026 — PETITS MULTIPLES : LES NOMS DANS UNE LEGENDE COMMUNE, PAS DANS CHAQUE CASE.
//
// Julien : « pour les multiples, il ne faut pas voir les labels qui sont repetes. Par contre une
// place commune pour la legende serait interessante. »
//
// Une case garde ce qui varie (sa valeur, son pourcentage) ; le nom des parts, le meme partout,
// est dit une fois par la legende commune, avec la MEME couleur dans chaque case.

import {
  drawDonutChart, drawSmallMultiplesLegend, donutPartColors, smallMultiplesLegendEntries
} from './NodeStatsCharts'
import type { Type_StatSlice } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'
import { figureControlsOf } from '../Representations/figureControls'
import { DONUT_ATTRIBUTES, SMALL_MULTIPLES_KEY } from '../Representations/analysisFigureAttributes'

givePlainDrawingEnvironment()

const STYLE: Type_FigureChartStyle = {
  ...DONUT_STYLE_DEFAULTS,
  parts_color_source: 'palette',
  name_label_is_visible: true,
  value_label_is_visible: true,
  value_label_percent: 'total'
}

const CELL_A: Type_StatSlice[] = [
  { id: 'ble', label: 'Ble', value: 6 },
  { id: 'mais', label: 'Mais', value: 4 }
]
// « Ble » manque ici : par son rang, « Mais » prendrait la premiere teinte de la palette.
const CELL_B: Type_StatSlice[] = [
  { id: 'mais', label: 'Mais', value: 5 }
]

const drawCell = (slices: Type_StatSlice[], colors: Map<string, string>, drawn: Type_StatSlice[][]) => {
  const el = sizedContainer()
  drawDonutChart(el, slices, {
    style: STYLE,
    format: v => String(v),
    small_multiple: {
      radius_ratio: 1, callout_gap_px: 8, frame: () => undefined, colors, drawn: kept => { drawn.push(kept) }
    }
  })
  return el
}

const svgTexts = (el: HTMLElement): string =>
  [...el.querySelectorAll('svg text')].map(t => t.textContent ?? '').join(' ')

afterEach(() => { document.body.innerHTML = '' })

describe('petits multiples — une case n ecrit pas le nom des parts', () => {
  test('la valeur et le pourcentage restent, le nom part a la legende', () => {
    const colors = donutPartColors(CELL_A, STYLE)
    const el = drawCell(CELL_A, colors, [])
    expect(svgTexts(el)).toContain('60%')
    expect(svgTexts(el)).not.toContain('Ble')
    expect(svgTexts(el)).not.toContain('Mais')
  })

  test('une part qui n a plus rien a dire n a ni etiquette ni trait', () => {
    const el = sizedContainer()
    drawDonutChart(el, CELL_A, {
      style: { ...STYLE, value_label_is_visible: false, name_label_callout: true },
      small_multiple: { radius_ratio: 1, callout_gap_px: 8, frame: () => undefined }
    })
    expect(el.querySelectorAll('.node_stats_callout').length).toBe(0)
    expect(el.querySelectorAll('text.node_stats_pct').length).toBe(0)
  })

  test('une case n a pas de legende a elle, meme legende allumee', () => {
    const el = sizedContainer()
    drawDonutChart(el, CELL_A, {
      style: { ...STYLE, legend_visible: true },
      small_multiple: { radius_ratio: 1, callout_gap_px: 8, frame: () => undefined }
    })
    expect(el.querySelectorAll('.node_stats_legend_item').length).toBe(0)
  })

  test('la meme part a la meme couleur dans chaque case', () => {
    const colors = donutPartColors([...CELL_A], STYLE)
    const a = drawCell(CELL_A, colors, [])
    const b = drawCell(CELL_B, colors, [])
    const fillOf = (el: HTMLElement, id: string) =>
      el.querySelector(`path.node_stats_arc[data-repr-id="${id}"]`)?.getAttribute('fill')
    expect(fillOf(b, 'mais')).toBe(fillOf(a, 'mais'))
    expect(fillOf(b, 'mais')).toBe(colors.get('mais'))
  })
})

describe('petits multiples — la legende commune', () => {
  test('l union des parts dessinees, dans l ordre des parts, Autres en dernier', () => {
    const entries = smallMultiplesLegendEntries(['ble', 'mais', 'soja'], [
      [{ id: '__others__', label: 'Autres', value: 1 }, { id: 'mais', label: 'Mais', value: 4 }],
      [{ id: 'soja', label: 'Soja', value: 2 }, { id: 'ble', label: 'Ble', value: 6 }]
    ])
    expect(entries.map(e => e.id)).toEqual(['ble', 'mais', 'soja', '__others__'])
  })

  test('une entree par part, nommee une seule fois pour toutes les cases', () => {
    const colors = donutPartColors(CELL_A, STYLE)
    const drawn: Type_StatSlice[][] = []
    const grid = document.createElement('div')
    document.body.appendChild(grid)
    grid.appendChild(drawCell(CELL_A, colors, drawn))
    grid.appendChild(drawCell(CELL_B, colors, drawn))
    const legend = document.createElement('div')
    document.body.appendChild(legend)
    drawSmallMultiplesLegend(legend, grid, smallMultiplesLegendEntries(['ble', 'mais'], drawn), colors, STYLE)
    const items = [...legend.querySelectorAll('.node_stats_legend_item')].map(i => i.textContent)
    expect(items).toEqual(['Ble', 'Mais'])
  })
})

describe('petits multiples — le panneau dit vrai', () => {
  // Le panneau recoit les reglages EFFECTIFS (cascade resolue, cf. `figureControlsOf`) : une
  // couronne qui n a rien surcharge y lit le defaut de la couronne, `legend_visible: false`. Le
  // sac brut, sans ce defaut, ferait croire la legende allumee.
  const keysOf = (options: { [k: string]: unknown }) =>
    figureControlsOf(DONUT_ATTRIBUTES, { legend_visible: false, ...options }, ['style'], 'fr', { app_data: {} })
      .map(c => c.key)

  test('le nom des parts et l interrupteur de legende se cachent, la position de la legende se montre', () => {
    // Legende eteinte au reglage : en petits multiples, la legende commune est posee d office.
    const keys = keysOf({ [SMALL_MULTIPLES_KEY]: 'pays', name_label_is_visible: true })
    expect(keys).not.toContain('name_label_is_visible')
    expect(keys).not.toContain('name_label_uppercase')
    expect(keys).not.toContain('legend_visible')
    expect(keys).not.toContain('legend_parts')
    expect(keys).toContain('legend_position')
    expect(keys).toContain('value_label_is_visible')
  })

  test('une couronne seule n est pas touchee', () => {
    const keys = keysOf({ name_label_is_visible: true })
    expect(keys).toContain('name_label_is_visible')
    expect(keys).toContain('legend_visible')
    expect(keys).not.toContain('legend_position')
    // Et legende allumee, sa position revient — la meme regle qu avant les petits multiples.
    expect(keysOf({ legend_visible: true })).toContain('legend_position')
  })
})
