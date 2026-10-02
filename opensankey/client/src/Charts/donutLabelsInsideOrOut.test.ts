// 02/10/2026 — UNE ETIQUETTE DE COURONNE S ECRIT DANS SON SECTEUR SI ELLE Y TIENT, SINON DEHORS, SINON
// NULLE PART. JAMAIS EN DEBORDANT.
//
// Julien, capture « Export par continent » (SOCLE, une couronne par continent) : la grosse couronne
// Europe n ecrivait RIEN sur ses grandes parts, sauf « 0,67 Mt (2%) » — la part « Autres », grise et
// etroite — pose dans le secteur en debordant sur ses voisines et le trou ; et Asie, Afrique sortaient
// en detache « 4,32 Mt (52%) », « 9,47 Mt (83%) » qui tiennent dans leur secteur.
//
// Trois causes : « Autres » etait exempte de la sortie (`callsOut`) et s ecrivait donc dedans quoi
// qu il arrive ; le test « tient dedans » ne regardait que le milieu du secteur, ou un texte
// horizontal n entre pas sur le flanc d un anneau ; et la case, carree, ne laissait aucune place aux
// etiquettes sorties de la plus grosse couronne, qui se taisaient toutes.

import {
  drawDonutChart, fitLabelInSector, packSmallMultiples, smallMultipleCentrePlan
} from './NodeStatsCharts'
import type { Type_DrawnBox, Type_StatSlice } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

afterEach(() => { document.body.innerHTML = '' })

const STYLE: Type_FigureChartStyle = {
  ...DONUT_STYLE_DEFAULTS,
  name_label_is_visible: false,
  value_label_is_visible: true,
  value_label_percent: 'value_total',
  labels_callout_small: true,
  labels_min_share: 1
}

const fmt = (v: number) => v.toFixed(1)

/** Trois grosses parts et dix miettes qui se replient en un « Autres » d environ 1,5 %. */
const PARTS: Type_StatSlice[] = [
  { id: 'a', label: 'Gros', value: 50 },
  { id: 'b', label: 'Moyen', value: 30 },
  { id: 'c', label: 'Petit', value: 15 },
  ...Array.from({ length: 10 }, (_v, i) => ({ id: `m${i}`, label: `Miette ${i}`, value: 0.15 }))
]

const dedans = (el: HTMLElement): string[] =>
  [...el.querySelectorAll('text.node_stats_pct')].map(t => t.textContent ?? '')
const dehors = (el: HTMLElement): string[] =>
  [...el.querySelectorAll('text.node_stats_callout_text')].map(t => t.textContent ?? '')

describe('ou s ecrit l etiquette d une part', () => {

  test('LE CAS DE JULIEN : « Autres » qui ne tient pas ne s ecrit pas dans son secteur', () => {
    const el = sizedContainer()
    drawDonutChart(el, PARTS, { style: STYLE, format: fmt, others_label: 'Autres' })
    const autres = '1.5 (2%)'

    expect(dedans(el).some(t => t.includes(autres))).toBe(false)
  })

  test('« Autres » suit la regle de toute part : il sort en detache, ou se tait', () => {
    const el = sizedContainer()
    drawDonutChart(el, PARTS, { style: STYLE, format: fmt, others_label: 'Autres' })
    const sortie = dehors(el).some(t => t.includes('1.5 (2%)'))
    const nulle_part = !dedans(el).concat(dehors(el)).some(t => t.includes('1.5 (2%)'))

    expect(sortie || nulle_part).toBe(true)
  })

  test('sans sortie des petites, « Autres » qui ne tient pas se tait', () => {
    const el = sizedContainer()
    drawDonutChart(el, PARTS, {
      style: { ...STYLE, labels_callout_small: false, name_label_prune_if_unfitting: true },
      format: fmt,
      others_label: 'Autres'
    })

    expect(dedans(el).concat(dehors(el)).some(t => t.includes('1.5 (2%)'))).toBe(false)
  })

  test('une grosse part s ecrit DANS son secteur, pas en detache', () => {
    const el = sizedContainer()
    drawDonutChart(el, PARTS, { style: STYLE, format: fmt, others_label: 'Autres' })

    expect(dedans(el).some(t => t.includes('50.0'))).toBe(true)
    expect(dehors(el).some(t => t.includes('50.0'))).toBe(false)
  })
})

describe('un texte horizontal dans un secteur d anneau', () => {
  const R = 103
  const INNER = 57

  test('un demi-tour sur le flanc droit : le texte tient plus bas dans le secteur', () => {
    // Au milieu (le flanc, a 3 h), l anneau court verticalement sur 46 px : 70 px n y entrent pas.
    const spot = fitLabelInSector(70, 10.4, INNER, R, 0, 0.52 * 2 * Math.PI)

    expect(spot).not.toBeNull()
  })

  test('le seul milieu, comme avant, ne le trouvait pas', () => {
    expect(fitLabelInSector(70, 10.4, INNER, R, 0, 0.52 * 2 * Math.PI, true)).toBeNull()
  })

  test('un secteur de 1 % ne tient rien', () => {
    expect(fitLabelInSector(40, 10, INNER, R, 0, 0.01 * 2 * Math.PI)).toBeNull()
  })

  test('le texte trouve reste hors du trou et dans le disque', () => {
    const w = 70
    const h = 10.4
    const spot = fitLabelInSector(w, h, INNER, R, 0, 0.52 * 2 * Math.PI)
    if (spot === null) throw new Error('pas de place')
    const near = Math.hypot(Math.max(0, Math.abs(spot.x) - w / 2), Math.max(0, Math.abs(spot.y) - h / 2))
    const far = Math.hypot(Math.abs(spot.x) + w / 2, Math.abs(spot.y) + h / 2)

    expect(near).toBeGreaterThanOrEqual(INNER - 1)
    expect(far).toBeLessThanOrEqual(R + 1)
  })
})

describe('le centre d une case de petits multiples', () => {
  test('une valeur plus large que le trou passe sous le disque, le nom au-dessus', () => {
    const plan = smallMultipleCentrePlan('Ameriques', '1,19 Mt', 10)

    expect(plan.value?.below).toBe(true)
    expect(plan.name.above).toBe(true)
  })

  test('un grand trou garde nom et valeur dedans', () => {
    const plan = smallMultipleCentrePlan('Europe', '38,38 Mt', 120)

    expect(plan.value?.below).toBe(false)
    expect(plan.name.above).toBe(false)
  })
})

describe('les cases rangees a la taille de leur disque', () => {
  const totals = [38.38, 11.39, 8.25, 1.19, 0.11]
  const boxOf = (_i: number, r: number): Type_DrawnBox => ({ x0: -r - 60, x1: r + 10, y0: -r - 15, y1: r + 15 })

  test('tout tient dans le cadre, sans chevauchement', () => {
    const placed = packSmallMultiples(totals, boxOf, 1250, 760)
    const boxes = placed.map(p => ({
      x0: p.cx + p.box.x0, x1: p.cx + p.box.x1, y0: p.cy + p.box.y0, y1: p.cy + p.box.y1
    }))
    boxes.forEach(b => {
      expect(b.x0).toBeGreaterThanOrEqual(-1e-6)
      expect(b.x1).toBeLessThanOrEqual(1250 + 1e-6)
      expect(b.y0).toBeGreaterThanOrEqual(-1e-6)
      expect(b.y1).toBeLessThanOrEqual(760 + 1e-6)
    })
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        expect(a.x0 < b.x1 - 1e-6 && b.x0 < a.x1 - 1e-6 && a.y0 < b.y1 - 1e-6 && b.y0 < a.y1 - 1e-6).toBe(false)
      }
    }
  })

  test('une seule echelle : l aire dit le total', () => {
    const placed = packSmallMultiples(totals, boxOf, 1250, 760)

    expect(placed[1].radius / placed[0].radius).toBeCloseTo(Math.sqrt(11.39 / 38.38))
  })

  test('plus dense qu une grille de cases egales : la grosse couronne depasse le tiers de la hauteur', () => {
    const placed = packSmallMultiples(totals, boxOf, 1250, 760)

    expect(2 * placed[0].radius).toBeGreaterThan(760 / 2)
  })
})
