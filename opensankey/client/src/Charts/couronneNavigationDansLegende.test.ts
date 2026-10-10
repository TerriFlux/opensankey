// os#1527 (10/10) — LE TABLEAU DE NAVIGATION D'UNE COURONNE MONTE EN TETE DE SA COLONNE DE LEGENDE.
//
// Julien : « la meme chose pour les couronnes » que le Sankey. Legende a cote du disque : le tableau,
// en rendu vertical (pas de <table>), se pose en haut de la colonne, au-dessus des lignes, et la place
// reservee a la legende le couvre. Legende dessous (ou masquee) : la bande horizontale reste au-dessus
// du disque. Le rendu vertical garde l echange d ordre (⇅ / ▲▼) et la ⚙ des reglages.

import { drawDonutChart, donutLegendBeside } from './NodeStatsCharts'
import type { Type_StatSlice } from './NodeStatsCharts'
import { sunburstLegendBeside } from './SunburstChart'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { LEGEND_NAVIGATION_MIN_PX } from './legendChecks'
import { buildFigureNavigationTable } from '../Representations/figureNavigationTable'
import type { Type_FigureNavDimension, Type_FigureNavTable } from '../Representations/figureNavigationTable'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const SLICES: Type_StatSlice[] = [
  { id: 'a', label: 'Cereales', value: 6 },
  { id: 'b', label: 'Viande', value: 4 }
]

const styleOf = (over: Partial<Type_FigureChartStyle>): Type_FigureChartStyle =>
  ({ ...DONUT_STYLE_DEFAULTS, legend_visible: true, legend_parts: 'all', ...over })

const LABELS: Type_FigureNavTable['labels'] = {
  title: 'Niveau de detail',
  dimension: (n: string) => n,
  cut_by: (l: string) => `Decouper par ${l}`,
  clear_zoom: 'Annuler',
  pick_zoom: 'Choisir',
  drawing: 'Dessin',
  uncut: (l: string) => `Decoupe par ${l}`,
  ctrl_hint: 'Ctrl+clic',
  swap: 'Echanger',
  move_up: 'Monter',
  move_down: 'Descendre',
  settings: 'Reglages',
  members: 'Membres'
}

const dims = (n: number, choose_with?: () => void): Type_FigureNavDimension[] =>
  [...Array(n).keys()].map(i => ({
    id: `d${i}`,
    name: `Dimension ${i}`,
    levels: [
      { label: 'Filieres', active: true, column: true, choose: () => undefined, choose_with },
      { label: 'Produits', active: false, choose: () => undefined, choose_with }
    ]
  }))

const tableOf = (over: Partial<Type_FigureNavTable>): HTMLElement => buildFigureNavigationTable({
  dimensions: dims(2),
  labels: LABELS,
  t: (k: string) => k,
  memory_key: 'w/p',
  move: () => undefined,
  settings: [{ key: 'interaction_click', label: 'Clic', value: 'a', options: [{ value: 'a', label: 'A' }], set: () => undefined }],
  ...over
} as Type_FigureNavTable)

afterEach(() => { document.body.innerHTML = '' })

describe('le tableau de navigation en colonne', () => {
  test('en colonne, pas de tableau, et l echange et la roue restent accessibles', () => {
    const moved: [string, number][] = []
    const box = tableOf({ vertical: true, move: (id, d) => { moved.push([id, d]) } })
    expect(box.querySelector('table')).toBeNull()
    expect(box.querySelectorAll('.figure_navigation_column_dimension')).toHaveLength(2)
    expect(box.querySelector('.figure_navigation_settings')).not.toBeNull()
    const swaps = box.querySelectorAll<HTMLButtonElement>('.figure_navigation_swap')
    // Deux dimensions : un seul ⇅, sur la premiere.
    expect(swaps).toHaveLength(1)
    swaps[0].click()
    expect(moved).toEqual([['d0', 1]])
  })

  test('plus de deux dimensions : ▲▼ par dimension, bornes grisees', () => {
    const box = tableOf({ vertical: true, dimensions: dims(3) })
    const ups = box.querySelectorAll<HTMLButtonElement>('.figure_navigation_up')
    const downs = box.querySelectorAll<HTMLButtonElement>('.figure_navigation_down')
    expect(ups).toHaveLength(3)
    expect(downs).toHaveLength(3)
    expect(ups[0].disabled).toBe(true)
    expect(downs[2].disabled).toBe(true)
  })

  test('ctrl+clic sur un niveau ajoute la colonne, comme dans la bande', () => {
    let added = 0
    const box = tableOf({ vertical: true, dimensions: dims(2, () => { added++ }) })
    const level = box.querySelector('.figure_navigation_level button') as HTMLButtonElement
    level.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
    expect(added).toBe(1)
  })
})

describe('la couronne pose le tableau dans sa colonne de legende', () => {
  test('les regles de place : a cote oui, dessous ou masquee non', () => {
    expect(donutLegendBeside(styleOf({ legend_position: 'left' }))).toBe(true)
    expect(donutLegendBeside(styleOf({ legend_position: 'right' }))).toBe(true)
    expect(donutLegendBeside(styleOf({ legend_position: 'bottom' }))).toBe(false)
    expect(donutLegendBeside(styleOf({ legend_visible: false }))).toBe(false)
    expect(sunburstLegendBeside({ legend_visible: true, legend_position: 'right' })).toBe(true)
    expect(sunburstLegendBeside({ legend_visible: true, legend_position: 'bottom' })).toBe(false)
    expect(sunburstLegendBeside({ legend_visible: false, legend_position: 'left' })).toBe(false)
  })

  test('legende a cote : le tableau vertical en tete de colonne, au-dessus des lignes', () => {
    const el = sizedContainer(800)
    const nav = tableOf({ vertical: true })
    drawDonutChart(el, SLICES, { style: styleOf({ legend_position: 'left' }), format: v => String(v), legend_navigation: nav })
    const wrap = el.querySelector('.figure_legend_navigation') as HTMLElement
    expect(wrap).not.toBeNull()
    expect(wrap.contains(nav)).toBe(true)
    expect(nav.querySelector('table')).toBeNull()
    // Rien au-dessus du disque : pas de bande.
    expect(el.querySelector('.figure_titled')).toBeNull()
    // En tete de colonne : premier enfant de la colonne, les lignes de legende apres.
    const column = wrap.parentElement as HTMLElement
    expect(column.firstElementChild).toBe(wrap)
    expect(column.textContent).toContain('Cereales')
    // La place reservee couvre le tableau.
    expect(parseInt(column.style.flex.split(' ')[2], 10)).toBeGreaterThanOrEqual(LEGEND_NAVIGATION_MIN_PX)
  })

  test('legende dessous : la bande horizontale reste au-dessus du disque', () => {
    const el = sizedContainer(800)
    const band = tableOf({ vertical: false })
    drawDonutChart(el, SLICES, { style: styleOf({ legend_position: 'bottom' }), format: v => String(v), breadcrumb: band })
    expect(el.querySelector('.figure_legend_navigation')).toBeNull()
    const titled = el.querySelector('.figure_titled') as HTMLElement
    expect(titled.contains(band)).toBe(true)
    expect(band.querySelector('table')).not.toBeNull()
  })

  test('legende dessous, tableau passe pour la colonne : le trace ne le pose pas', () => {
    const el = sizedContainer(800)
    const nav = tableOf({ vertical: true })
    drawDonutChart(el, SLICES, { style: styleOf({ legend_position: 'bottom' }), format: v => String(v), legend_navigation: nav })
    expect(el.querySelector('.figure_legend_navigation')).toBeNull()
  })
})
