// 03/10/2026 — « SI L ETIQUETTE NE TIENT PAS » : QUATRE CHOIX, ET PLUS UN BOOLEEN (`labels_small`).
//
// Montrer quand meme, Detacher (le defaut), Masquer, Radial. L ancienne cle booleenne
// `labels_callout_small` se relit en un seul endroit (`upgradeLegacyFigureKeys`) : vrai = detacher,
// faux = masquer.

import {
  drawDonutChart, fitRadialLabelInSector, radialLabelRotation
} from './NodeStatsCharts'
import type { Type_StatSlice } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS, figureChartStyleOf } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { upgradeLegacyFigureKeys } from '../Representations/figureLegacyKeys'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

afterEach(() => { document.body.innerHTML = '' })

const STYLE: Type_FigureChartStyle = {
  ...DONUT_STYLE_DEFAULTS,
  name_label_is_visible: true,
  value_label_is_visible: true,
  value_label_percent: 'value_total',
  labels_min_share: 0,
  parts_group_under: 0
}

const fmt = (v: number) => v.toFixed(1)

/** Une grosse part, et des parts etroites dont le nom long ne tient pas a plat. */
const PARTS: Type_StatSlice[] = [
  { id: 'a', label: 'Gros', value: 80 },
  ...Array.from({ length: 8 }, (_v, i) => ({ id: `p${i}`, label: `Produit au nom long ${i}`, value: 2.5 }))
]

const dedans = (el: HTMLElement): Element[] => [...el.querySelectorAll('text.node_stats_pct')]
const dehors = (el: HTMLElement): Element[] => [...el.querySelectorAll('text.node_stats_callout_text')]
const draw = (labels_small: Type_FigureChartStyle['labels_small']) => {
  const el = sizedContainer()
  drawDonutChart(el, PARTS, { style: { ...STYLE, labels_small }, format: fmt })
  return el
}

describe('l ancienne cle booleenne', () => {
  test('vrai se relit Detacher, faux se relit Masquer', () => {
    expect(upgradeLegacyFigureKeys({ labels_callout_small: true })).toEqual({ labels_small: 'detach' })
    expect(upgradeLegacyFigureKeys({ labels_callout_small: false })).toEqual({ labels_small: 'hide' })
  })

  test('la cle neuve deja posee l emporte, et l ancienne disparait', () => {
    expect(upgradeLegacyFigureKeys({ labels_callout_small: false, labels_small: 'radial' }))
      .toEqual({ labels_small: 'radial' })
  })

  test('un sac sans ancienne cle passe tel quel', () => {
    const bag = { labels_small: 'show' }

    expect(upgradeLegacyFigureKeys(bag)).toBe(bag)
  })

  test('le trace lit la cle traduite', () => {
    const st = figureChartStyleOf(upgradeLegacyFigureKeys({ labels_callout_small: false }), DONUT_STYLE_DEFAULTS)

    expect(st.labels_small).toBe('hide')
  })
})

describe('radial : jamais a l envers', () => {
  test('quel que soit l angle, la rotation reste dans [-90, 90]', () => {
    for (let k = 0; k <= 720; k++) {
      const deg = radialLabelRotation(k / 720 * 4 * Math.PI - Math.PI)

      expect(deg).toBeGreaterThanOrEqual(-90)
      expect(deg).toBeLessThanOrEqual(90)
    }
  })

  test('a droite le texte suit le rayon, a gauche il fait un demi-tour de plus', () => {
    // A 3 h (pi/2) : horizontal. A 9 h (3 pi/2) : horizontal aussi, lu de gauche a droite.
    expect(radialLabelRotation(Math.PI / 2)).toBeCloseTo(0)
    expect(radialLabelRotation(3 * Math.PI / 2)).toBeCloseTo(0)
    // A 8 h (4 pi/3) : 240 - 90 = 150, retourne de 180 -> -30.
    expect(radialLabelRotation(4 * Math.PI / 3)).toBeCloseTo(-30)
  })

  test('un secteur trop fin pour la hauteur de ligne ne tient rien, meme couche', () => {
    expect(fitRadialLabelInSector(30, 10, 57, 103, 0, 0.001 * 2 * Math.PI)).toBeNull()
  })

  test('un texte plus long que l epaisseur de l anneau ne tient pas', () => {
    expect(fitRadialLabelInSector(60, 10, 57, 103, 0, 0.2 * 2 * Math.PI)).toBeNull()
  })

  test('un texte court tient couche dans un secteur etroit', () => {
    expect(fitRadialLabelInSector(40, 10, 57, 103, 0, 0.03 * 2 * Math.PI)).not.toBeNull()
  })
})

describe('les quatre modes au trace', () => {
  test('Masquer n ecrit rien de ce qui ne tient pas : ni dedans, ni dehors', () => {
    const el = draw('hide')

    expect(dehors(el)).toHaveLength(0)
    expect(dedans(el).some(t => (t.textContent ?? '').includes('nom long'))).toBe(false)
  })

  test('Montrer quand meme ecrit tout dedans, sans rien detacher', () => {
    const el = draw('show')

    expect(dehors(el)).toHaveLength(0)
    // Depuis le rayon a marge fixe (05/10), le secteur est plus etroit et le nom passe sur deux
    // lignes (`tspan`) : on relit les lignes separees d un blanc, comme a l ecran.
    const ecrit = (t: Element) => [...t.querySelectorAll('tspan')].map(s => s.textContent ?? '').join(' ')
    expect(dedans(el).filter(t => ecrit(t).includes('nom long')).length).toBe(8)
  })

  test('Detacher sort ce qui ne tient pas', () => {
    // 05/10/2026 — la marge des etiquettes sorties est FIXE (`CALLOUT_MARGIN_RATIO`) : un nom long
    // n y tient pas et se tait. Des noms courts, sur des parts trop etroites pour les porter, sortent
    // (legende dessous : la zone est plus large que haute, la marge laterale s ouvre).
    const el = sizedContainer()
    const short: Type_StatSlice[] = [
      { id: 'a', label: 'Gros', value: 80 },
      ...Array.from({ length: 20 }, (_v, i) => ({ id: `p${i}`, label: `P${i}`, value: 1 }))
    ]
    drawDonutChart(el, short, { style: { ...STYLE, labels_small: 'detach', value_label_is_visible: false, legend_visible: true, legend_position: 'bottom' }, format: fmt })

    expect(dehors(el).length).toBeGreaterThan(0)
  })

  test('Detacher : ce qui ne tient pas dans la marge se tait, le disque ne retrecit pas', () => {
    const el = draw('detach')
    const outer = (e: HTMLElement) => Number(/A([\d.]+),/.exec(e.querySelector('path')?.getAttribute('d') ?? '')?.[1])
    const r_detach = outer(el)
    const box_detach = el.querySelector('svg')?.getAttribute('viewBox')
    document.body.innerHTML = ''
    const hidden = draw('hide')

    expect(outer(hidden)).toBeCloseTo(r_detach, 6)
    expect(hidden.querySelector('svg')?.getAttribute('viewBox')).toBe(box_detach)
  })

  test('Radial ne detache rien, et ce qu il couche est tourne lisiblement', () => {
    const el = draw('radial')

    expect(dehors(el)).toHaveLength(0)
    dedans(el).forEach(t => {
      const m = /rotate\(([-\d.e]+)\)/.exec(t.getAttribute('transform') ?? '')
      if (m === null) return
      expect(Math.abs(Number(m[1]))).toBeLessThanOrEqual(90 + 1e-6)
    })
  })
})
