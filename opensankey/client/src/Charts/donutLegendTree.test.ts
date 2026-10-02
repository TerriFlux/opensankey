// os#1511 (02/10/2026) — LA LEGENDE D UNE COURONNE EN ARBRE, COMME CELLE DU DIAGRAMME.
//
// Julien : « pour la legende il faut faire comme pour les diagrammes : un decalage qui suit le
// niveau hierarchique ». La legende listait des chemins a plat (« Produits bruts - Cereales › Ble »),
// tronques. Elle dit maintenant le nom court, l ancetre ouvert en en-tete, ses parts en retrait.

import { drawDonutChart, drawSmallMultiplesLegend, donutPartColors } from './NodeStatsCharts'
import type { Type_StatSlice } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'
import { legendTreeRows } from '../Elements/legendHierarchy'

givePlainDrawingEnvironment()

const CEREALES = { id: 'cereales', label: 'Cereales' }
const BRUTS = { id: 'bruts', label: 'Produits bruts' }

/** Deux niveaux ouverts sous le sujet : Cereales, puis Produits bruts. */
const TWO_LEVELS: Type_StatSlice[] = [
  { id: 'ble', label: 'Ble', value: 6, depth: 2, parent_label: 'Produits bruts', branch_id: 'cereales',
    path: ['s', 'cereales', 'bruts', 'ble'], ancestors: [CEREALES, BRUTS] },
  { id: 'lait', label: 'Lait', value: 5, depth: 0, parent_label: 'Sujet', branch_id: 'lait',
    path: ['s', 'lait'], ancestors: [] },
  { id: 'orge', label: 'Orge', value: 3, depth: 2, parent_label: 'Produits bruts', branch_id: 'cereales',
    path: ['s', 'cereales', 'bruts', 'orge'], ancestors: [CEREALES, BRUTS] },
  { id: 'transf', label: 'Produits transformes', value: 2, depth: 1, parent_label: 'Cereales',
    branch_id: 'cereales', path: ['s', 'cereales', 'transf'], ancestors: [CEREALES] },
  { id: '__others__', label: 'Autres', value: 1 }
]

const STYLE: Type_FigureChartStyle = {
  ...DONUT_STYLE_DEFAULTS, legend_visible: true, legend_levels: true, legend_position: 'left',
  parts_order: 'model', parts_color_source: 'palette', parts_group_under: 0, parts_max: 20,
  value_label_is_visible: true
}

/** Les lignes de la legende : [texte, retrait, en-tete ?]. */
const rowsOf = (root: ParentNode) =>
  [...root.querySelectorAll('div.node_stats_legend_row')].map(d => [
    d.textContent ?? '',
    Number(d.getAttribute('data-legend-indent')),
    d.classList.contains('node_stats_legend_heading')
  ])

const EXPECTED = [
  ['Cereales', 0, true],
  ['Produits bruts', 1, true],
  ['Ble', 2, false],
  ['Orge', 2, false],
  ['Produits transformes', 1, false],
  ['Lait', 0, false],
  ['Autres', 0, false]
]

afterEach(() => { document.body.innerHTML = '' })

describe('la legende en arbre', () => {
  test('les lignes suivent l arbre, en tete a la place de la premiere part, Autres en dernier', () => {
    const rows = legendTreeRows(TWO_LEVELS, s => s.ancestors, s => s.id === '__others__')
    expect(rows.map(r => [r.kind === 'heading' ? r.label : r.entry.label, r.indent, r.kind === 'heading']))
      .toEqual(EXPECTED)
  })

  test('couronne seule : deux niveaux ouverts donnent des entrees en retrait sous leurs en tetes', () => {
    const el = sizedContainer()
    drawDonutChart(el, TWO_LEVELS, { style: STYLE, format: v => String(v) })
    expect(rowsOf(el)).toEqual(EXPECTED)
    // Le nom court, plus de chemin ; le chemin reste dans l info-bulle.
    const ble = el.querySelector('div.node_stats_legend_item[data-legend-indent="2"]')
    expect(ble?.textContent).not.toContain('›')
    expect(ble?.getAttribute('title')).toContain('Produits bruts › Ble')
  })

  test('legende commune des petits multiples : le meme arbre', () => {
    const legend = document.createElement('div')
    const grid = document.createElement('div')
    document.body.append(legend, grid)
    drawSmallMultiplesLegend(legend, grid, TWO_LEVELS, donutPartColors(TWO_LEVELS, STYLE), STYLE)
    expect(rowsOf(legend)).toEqual(EXPECTED)
  })

  test('sans niveaux en legende, la liste reste a plat au nom court', () => {
    const el = sizedContainer()
    drawDonutChart(el, TWO_LEVELS, { style: { ...STYLE, legend_levels: false }, format: v => String(v) })
    expect(el.querySelectorAll('div.node_stats_legend_heading')).toHaveLength(0)
    expect(rowsOf(el).every(([, indent]) => indent === 0)).toBe(true)
  })
})
