// 03/10/2026 — LA COURONNE SEULE : LE DISQUE AU CENTRE, LE SVG A SA PLACE.
//
// Julien : « le diagramme se coupe parfois a gauche » (couronne SOCLE Export, legende a gauche) et
// « le centrage ne devrait pas prendre en compte les labels detaches, ca fait super bizarre ».
//
// 1. Le svg portait une largeur en PIXELS mesuree au trace : une case qui retrecissait sans redessin
//    le laissait plus large que son cadre, il debordait des deux cotes du flex centre et son bord
//    gauche passait sous le bord de la fenetre. Il prend desormais la place que la legende laisse.
// 2. Le cadre etait l UNION du disque et des etiquettes sorties : des etiquettes d un seul cote
//    poussaient le disque de l autre. La reserve est symetrique.

import { drawDonutChart, smallMultipleCellBox } from './NodeStatsCharts'
import type { Type_StatSlice } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

afterEach(() => { document.body.innerHTML = '' })

const STYLE: Type_FigureChartStyle = {
  ...DONUT_STYLE_DEFAULTS,
  name_label_is_visible: true,
  value_label_is_visible: true,
  labels_small: 'detach',
  labels_min_share: 0
}

const fmt = (v: number) => v.toFixed(1)

/** Une grosse part, puis des miettes consecutives : toutes sorties du meme cote du disque. */
const PARTS: Type_StatSlice[] = [
  { id: 'gros', label: 'Cereales', value: 90 },
  ...Array.from({ length: 6 }, (_v, i) => ({ id: `m${i}`, label: `Petite filiere ${i}`, value: 1.5 }))
]

const svgOf = (el: HTMLElement): SVGSVGElement => el.querySelector('svg') as SVGSVGElement

const viewBoxOf = (el: HTMLElement): number[] =>
  (svgOf(el).getAttribute('viewBox') ?? '').split(' ').map(Number)

describe('la couronne seule se cadre sur son disque', () => {

  test('LE CAS DE JULIEN : des etiquettes d un seul cote ne deplacent pas le centre du disque', () => {
    const el = sizedContainer(600)
    drawDonutChart(el, PARTS, { style: STYLE, format: fmt, others_label: 'Autres' })
    const [x, y, w, h] = viewBoxOf(el)
    const side = Number(svgOf(el).querySelector('g g')?.getAttribute('transform')?.match(/translate\(([\d.]+)/)?.[1]) * 2
    // Le centre du cadre est le centre du disque, a l arrondi pres.
    expect(x + w / 2).toBeCloseTo(side / 2, 5)
    expect(y + h / 2).toBeCloseTo(side / 2, 5)
  })

  test('le svg prend la place que la legende laisse, sans largeur en pixels', () => {
    const el = sizedContainer(600)
    drawDonutChart(el, PARTS, { style: { ...STYLE, legend_visible: true, legend_position: 'left' }, format: fmt })
    const svg = svgOf(el)
    expect(svg.getAttribute('width')).toBe('100%')
    expect(svg.style.flex).toBe('1 1 0px')
    // jsdom garde le zero sans unite tel qu il est ecrit ('0') ; un navigateur le rend '0px'.
    expect(svg.style.minWidth).toMatch(/^0(px)?$/)
  })

  test('la legende a cote garde une largeur reservee, elle ne prend pas le reste', () => {
    const el = sizedContainer(600)
    drawDonutChart(el, PARTS, { style: { ...STYLE, legend_visible: true, legend_position: 'left' }, format: fmt })
    const legend = svgOf(el).parentElement?.lastElementChild as HTMLElement
    expect(legend.style.flex).toMatch(/^0 0 \d+px$/)
  })

  test('sans etiquette sortie, le cadre reste la zone, centree sur le disque', () => {
    const el = sizedContainer(400)
    drawDonutChart(el, [{ id: 'a', label: 'A', value: 1 }, { id: 'b', label: 'B', value: 1 }], {
      style: { ...STYLE, labels_small: 'hide', name_label_is_visible: false, value_label_is_visible: false },
      format: fmt
    })
    const [x, y, w, h] = viewBoxOf(el)
    const side = Number(svgOf(el).querySelector('g g')?.getAttribute('transform')?.match(/translate\(([\d.]+)/)?.[1]) * 2
    expect(x + w / 2).toBeCloseTo(side / 2, 5)
    expect(y + h / 2).toBeCloseTo(side / 2, 5)
  })
})

// 05/10/2026 — LE RAYON NE DEPEND PAS DU SORT DES ETIQUETTES (Julien : « c est bizarre que si on les
// cache, ca change la taille de la couronne »). Le rayon a l ecran est le rayon de l arc rapporte au
// cadre (`viewBox`) : il doit etre le meme sous Detacher, Masquer, a l interieur, et quel que soit le seuil.
describe('le rayon de la couronne ne depend que de sa place', () => {
  const outerRadiusOf = (el: HTMLElement): number => {
    const d = el.querySelector('path')?.getAttribute('d') ?? ''
    const m = d.match(/A([\d.]+),/)
    return Number(m?.[1])
  }
  const shownRadius = (style: Type_FigureChartStyle): number => {
    const el = sizedContainer(600)
    drawDonutChart(el, PARTS, { style, format: fmt, others_label: 'Autres' })
    const [, , w, h] = viewBoxOf(el)
    const r = outerRadiusOf(el)
    document.body.innerHTML = ''
    // L echelle du cadre dans une case de 600 : min(600 / w, 600 / h).
    return r * Math.min(600 / w, 600 / h)
  }

  test('detacher, masquer, a l interieur, radial : meme rayon', () => {
    const ref = shownRadius(STYLE)
    expect(ref).toBeGreaterThan(100)
    for (const mode of ['hide', 'show', 'radial'] as const) {
      expect(shownRadius({ ...STYLE, labels_small: mode })).toBeCloseTo(ref, 5)
    }
  })

  test('le seuil de libelle et la sortie forcee ne changent pas le rayon', () => {
    const ref = shownRadius(STYLE)
    expect(shownRadius({ ...STYLE, labels_min_share: 3 })).toBeCloseTo(ref, 5)
    expect(shownRadius({ ...STYLE, name_label_callout: true })).toBeCloseTo(ref, 5)
  })

  test('la case de petits multiples a le meme cadre quel que soit le mode', () => {
    const m = { name: 'Europe', slices: PARTS, total: PARTS.reduce((s, p) => s + p.value, 0) }
    const ref = smallMultipleCellBox(m, 80, STYLE, fmt)
    expect(smallMultipleCellBox(m, 80, { ...STYLE, labels_small: 'hide' }, fmt)).toEqual(ref)
    expect(smallMultipleCellBox(m, 80, { ...STYLE, labels_min_share: 3 }, fmt)).toEqual(ref)
  })
})

describe('une case de petits multiples centre son disque', () => {
  test('la reserve des etiquettes sorties est la meme des deux cotes', () => {
    const box = smallMultipleCellBox(
      { name: 'Europe', slices: PARTS, total: PARTS.reduce((s, p) => s + p.value, 0) }, 80, STYLE, fmt)
    expect(-box.x0).toBeCloseTo(box.x1, 5)
    expect(-box.y0).toBeCloseTo(box.y1, 5)
  })
})
