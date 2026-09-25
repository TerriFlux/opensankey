// 25/09/2026 — LE CENTRE D UNE COURONNE EST UNE PART.
//
// Julien : « pour la couronne, il me semble que le centre peut aussi etre considere comme un
// element, non ? »
//
// Oui, et c est le meme mouvement que les secteurs. Le centre ecrit le nom de l objet regarde et
// son total ; il se reglait par une liste fermee de quatre choix (`centre_content`) pendant que
// tout le reste de la figure est un element avec son libelle et sa valeur — quatre cases la ou il
// y avait trente reglages a cote.
//
// ── CE QUE CE FICHIER TIENT ──────────────────────────────────────────────────────────────────
//
// 1. LE PARC NE BOUGE PAS. `centre_content` reste le defaut : une couronne enregistree dessine
//    exactement ce qu elle dessinait. C est la premiere chose a verifier, et la seule qui puisse
//    casser des documents.
// 2. LA PART GAGNE quand elle dit quelque chose — la doctrine du lecteur commun, sans exception
//    nouvelle.
// 3. ELLE N EST PAS UN SECTEUR : elle ne se decoupe pas en arc, elle n herite pas du style « Part
//    de couronne », et les reglages d arc ne lui sont pas offerts.

import { drawDonutChart } from './NodeStatsCharts'
import type { Type_StatSlice } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { partAspectResolver } from './partAspect'
import type { Type_FigurePart } from './partAspect'
import { Class_ApplicationData } from '../types/ApplicationData'
import { buildParts } from '../Representations/parts/buildParts'
import type { Type_FigureParts } from '../Representations/parts/buildParts'
import {
  FIGURE_CENTRE_NATURE, FIGURE_CENTRE_PART_ID
} from '../Representations/parts/centrePart'
import { attributeAppliesToElements } from '../Elements/attributeScope'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const SECTEURS: Type_StatSlice[] = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 4 }
]

/** Une couronne et ses parts : deux secteurs, plus le centre — comme la nature les produit. */
const uneCouronne = (): Type_FigureParts => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  return buildParts(doc, [
    ...SECTEURS,
    {
      id: FIGURE_CENTRE_PART_ID,
      label: 'Cereales',
      value: 10,
      part_nature: FIGURE_CENTRE_NATURE,
      subject: { kind: 'whole', whole: { id: FIGURE_CENTRE_PART_ID, name: 'Cereales' } }
    }
  ], undefined, 'donut')
}

/** Le trou doit etre assez grand pour que le centre s ecrive (`inner >= 12`). */
const styleOf = (over: Partial<Type_FigureChartStyle>): Type_FigureChartStyle =>
  ({ ...DONUT_STYLE_DEFAULTS, centre_hole: 60, ...over })

const dessine = (figure: Type_FigureParts, style: Type_FigureChartStyle): HTMLElement => {
  const el = sizedContainer()
  drawDonutChart(el, SECTEURS, {
    style,
    format: v => String(v),
    title_fallback: 'Cereales',
    part_aspect: partAspectResolver(
      style, figure.by_id as unknown as { [id: string]: Type_FigurePart }
    )
  })
  return el
}

/** Le texte du centre : le seul `<text>` sans classe du dessin (les secteurs en ont une). */
const centreText = (el: HTMLElement): string =>
  [...el.querySelectorAll('text')]
    .filter(t => t.getAttribute('class') === null)
    .map(t => t.textContent ?? '')
    .join(' ')

const centreSpans = (el: HTMLElement): SVGTSpanElement[] =>
  [...el.querySelectorAll('text')]
    .filter(t => t.getAttribute('class') === null)
    .flatMap(t => [...t.querySelectorAll('tspan')] as SVGTSpanElement[])

afterEach(() => { document.body.innerHTML = '' })

describe('le parc ne bouge pas : centre_content reste le defaut', () => {

  it('« nom et valeur » ecrit les deux, comme hier', () => {
    const el = dessine(uneCouronne(), styleOf({ centre_content: 'both' }))

    expect(centreText(el)).toContain('Cereales')
    expect(centreText(el)).toContain('10')
  })

  it('« valeur seule » n ecrit pas le nom', () => {
    const el = dessine(uneCouronne(), styleOf({ centre_content: 'value' }))

    expect(centreText(el)).not.toContain('Cereales')
    expect(centreText(el)).toContain('10')
  })

  it('« rien » laisse le trou vide', () => {
    const el = dessine(uneCouronne(), styleOf({ centre_content: 'none' }))

    expect(centreText(el)).toBe('')
  })
})

describe('mais la part gagne des qu elle dit quelque chose', () => {

  it('LE CAS DE JULIEN : le centre se regle comme un element', () => {
    // « Valeur seule » sur la figure, et la part rallume son nom : c est exactement ce qu un
    // secteur peut faire depuis os#1463, et que le centre ne pouvait pas.
    const figure = uneCouronne()
    const centre = figure.by_id[FIGURE_CENTRE_PART_ID] as unknown as { [k: string]: unknown }
    centre['name_label_is_visible'] = true

    const el = dessine(figure, styleOf({ centre_content: 'value' }))

    expect(centreText(el)).toContain('Cereales')
  })

  it('ET ELLE PEUT TAIRE ce que la figure montre', () => {
    const figure = uneCouronne()
    const centre = figure.by_id[FIGURE_CENTRE_PART_ID] as unknown as { [k: string]: unknown }
    centre['value_label_is_visible'] = false

    const el = dessine(figure, styleOf({ centre_content: 'both' }))

    expect(centreText(el)).toContain('Cereales')
    expect(centreText(el)).not.toContain('10')
  })

  it('SA MISE EN FORME EST LA SIENNE : police, taille, encre, graisse', () => {
    // Les trente reglages qu une liste de quatre choix ne pouvait pas offrir.
    const figure = uneCouronne()
    const centre = figure.by_id[FIGURE_CENTRE_PART_ID] as unknown as { [k: string]: unknown }
    centre['value_label_font_size'] = 42
    centre['value_label_color'] = '#123456'
    centre['name_label_italic'] = true

    const el = dessine(figure, styleOf({ centre_content: 'both' }))
    const spans = centreSpans(el)

    expect(spans.some(s => s.getAttribute('font-size') === '42')).toBe(true)
    expect(spans.some(s => s.getAttribute('fill') === '#123456')).toBe(true)
    expect(spans.some(s => s.getAttribute('font-style') === 'italic')).toBe(true)
  })
})

describe('le centre n est pas un secteur', () => {

  it('IL NE SE DECOUPE PAS EN ARC', () => {
    // LA CONTRE-VERIFICATION QUI COMPTE : il voyage dans la meme liste de parts — c est ce qui lui
    // donne un element, une selection et un inspecteur — mais la figure garde DEUX secteurs.
    const el = dessine(uneCouronne(), styleOf({}))

    expect(el.querySelectorAll('path.node_stats_arc').length).toBe(2)
  })

  it('IL N HERITE PAS DU STYLE « PART DE COURONNE »', () => {
    // Le style des secteurs est ce que l auteur regle pour SES SECTEURS. Le centre s en tient au
    // style generique des parts (cf. `buildParts`, la nature propre d une part).
    const figure = uneCouronne()
    const centre = figure.by_id[FIGURE_CENTRE_PART_ID] as unknown as {
      hasStyle: (id: string) => boolean, figure_nature: string
    }

    expect(centre.figure_nature).toBe(FIGURE_CENTRE_NATURE)
    expect(centre.hasStyle('DonutPartStyle')).toBe(false)
    expect((figure.by_id['a'] as unknown as { hasStyle: (id: string) => boolean })
      .hasStyle('DonutPartStyle')).toBe(true)
  })

  it('ET LES REGLAGES D ARC NE LUI SONT PAS OFFERTS', () => {
    // `name_label_orientation` est portee `{ figures: { only: ['donut', 'sunburst'] } }` : elle
    // disparait d elle-meme sur une part qui n est ni l un ni l autre. Aucune ligne pour ca — c est
    // la portee par nature de figure (os#1483) qui en tire la consequence.
    const figure = uneCouronne()

    expect(attributeAppliesToElements(
      [figure.by_id[FIGURE_CENTRE_PART_ID]], 'name_label_orientation'
    )).toBe(false)
    expect(attributeAppliesToElements(
      [figure.by_id['a']], 'name_label_orientation'
    )).toBe(true)
  })
})
