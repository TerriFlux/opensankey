// os#1511 (04/10/2026) — LA LEGENDE A CASES NE SE REORGANISE PAS QUAND ON DECOCHE.
//
// Julien : « le clic dans la legende est bizarre, ca la fait bouger (a cause de l ordre decroissant)
// et les parties non cochees sont mises en bas. Tout doit rester a sa place, coche ou pas coche. »
// La legende se lit sur toutes les parts candidates aux valeurs pleines (`legend_toggle.all`) ; la
// couronne ne dessine que les cochees.

import { drawDonutChart } from './NodeStatsCharts'
import type { Type_StatSlice } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const BRUTS = { id: 'bruts', label: 'Produits bruts' }
const TRANSF = { id: 'transf', label: 'Produits transformes' }
const part = (id: string, value: number, parent: { id: string, label: string }): Type_StatSlice => ({
  id, label: id, value, depth: 1, parent_label: parent.label, branch_id: parent.id,
  path: ['s', parent.id, id], ancestors: [parent]
})
const ALL: Type_StatSlice[] = [
  part('Ble', 20, BRUTS), part('Orge', 8, BRUTS), part('Mais', 7, BRUTS),
  part('Malt', 1.2, TRANSF), part('Farine', 0.4, TRANSF), part('Sorgho', 0.1, BRUTS),
  // 10/10/2026 (os#1511, lot 4) — la regle commune ne replie jamais une part SEULE : deux petites
  // parts pour que « Autres » se forme.
  part('Seigle', 0.05, BRUTS)
]

const STYLE: Type_FigureChartStyle = {
  ...DONUT_STYLE_DEFAULTS, legend_visible: true, legend_levels: true, legend_position: 'right',
  parts_order: 'value_desc_grouped', parts_color_source: 'palette', parts_group_under: 1, parts_max: 0,
  value_label_is_visible: true
}

/** Les lignes de la legende, dans l ordre : texte et etat de la case (`null` sans case). */
const rowsOf = (root: ParentNode) =>
  [...root.querySelectorAll('div.node_stats_legend_row')].map(d => {
    const box = d.querySelector('input.node_stats_legend_check') as HTMLInputElement | null
    return [d.textContent ?? '', box === null ? null : box.checked]
  })

const draw = (hidden: string[]) => {
  const el = sizedContainer()
  drawDonutChart(el, ALL.filter(s => !hidden.includes(s.id)), {
    style: STYLE,
    format: v => String(v),
    others_label: 'Autres',
    legend_toggle: { toggle: () => undefined, hidden: hidden.map(id => ({ id, label: id })), all: ALL }
  })
  return rowsOf(el)
}

afterEach(() => { document.body.innerHTML = '' })

describe('la legende a cases reste en place', () => {
  test('decocher Ble puis Mais ne deplace ni ne retire aucune ligne', () => {
    const before = draw([])
    const one = draw(['Ble'])
    const two = draw(['Ble', 'Mais'])
    const texts = (rows: ReturnType<typeof rowsOf>) => rows.map(r => r[0])
    expect(texts(one)).toEqual(texts(before))
    expect(texts(two)).toEqual(texts(before))
  })

  test('seules les cases changent, et Autres se replie sur les valeurs pleines', () => {
    const two = draw(['Ble', 'Mais'])
    expect(two).toEqual([
      ['Produits bruts', null],
      ['Ble', false],
      ['Orge', true],
      ['Mais', false],
      ['Produits transformes', null],
      ['Malt', true],
      ['Farine', true],
      ['Autres', null]
    ])
  })
})
