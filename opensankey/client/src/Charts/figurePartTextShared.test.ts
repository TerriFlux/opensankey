// os#1476 — LE MEME TEXTE DE PART, ECRIT PAREIL PAR LES TROIS NATURES.
//
// Julien : « tout le look and feel doit etre similaire d un graphe a l autre, comme sur Excel. »
//
// CE QUE CE FICHIER GARDE, et ce n est pas « applyPartTextStyle marche » : c est que LES TROIS
// TRACES L APPELLENT. Une nature qui reposerait sa typographie en ligne divergerait sans qu on le
// voie — c est exactement ce qui etait arrive au disque, et ce que le pas 3 du cap solde.
//
// ⚠️ LA QUESTION EST POSEE AU DOM, PAS AU RESOLVEUR, et c est la lecon d os#1465 : trois fois de
// suite j avais verifie qu un aspect rendait la bonne valeur pendant que l ecran ne montrait rien.
// Ici on dessine pour de vrai et on lit l attribut ecrit.
//
// ── ET LE SUNBURST EN FAIT PARTIE, DESORMAIS ─────────────────────────────────────────────────
//
// Il etait repute non dessinable sous jsdom (`figureIconDrawn.test`, en-tete) : `d3-zoom` lit
// `viewBox` / `width` / `height` au sens de l IDL, que jsdom declare sans les implementer. Trois
// accesseurs suffisent a lever ca (`figureDomHarness.test-utils`), et la nature la plus riche des
// trois entre enfin dans les tests de trace.

import { drawSunburstChart } from './SunburstChart'
import { drawDonutChart, drawBarChart } from './NodeStatsCharts'
import { partAspectResolver } from './partAspect'
import type { Type_FigurePart } from './partAspect'
import { BARS_STYLE_DEFAULTS, DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import { Class_ApplicationData } from '../types/ApplicationData'
import { buildParts } from '../Representations/parts/buildParts'
import type { Type_FigureParts } from '../Representations/parts/buildParts'
import {
  givePlainDrawingEnvironment, sizedContainer, plainSunburstTree
} from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const PARTS = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 4 }
]

/** Des parts REELLES, reglees comme un auteur les reglerait dans l inspecteur. */
const partsReglees = (
  nature: string, reglages: { [attr: string]: unknown }
): Type_FigureParts => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  const figure = buildParts(doc, PARTS, undefined, nature)
  const part = figure.by_id['a'] as unknown as { [k: string]: unknown }
  Object.entries(reglages).forEach(([k, v]) => { part[k] = v })
  return figure
}

const arbre = () => plainSunburstTree(PARTS)

const resolveur = (figure: Type_FigureParts, base = BARS_STYLE_DEFAULTS) =>
  partAspectResolver(base, figure.by_id as unknown as { [id: string]: Type_FigurePart })

/** Le texte que la nature a ecrit pour la part `a`, choisi par sa classe et son contenu. */
const texteDe = (el: HTMLElement, classe: string, contient: string): SVGTextElement => {
  const tous = Array.from(el.querySelectorAll<SVGTextElement>(`text.${classe}`))
  const trouve = tous.find(t => (t.textContent ?? '').includes(contient))
  if (!trouve) throw new Error(`aucun text.${classe} ne contient « ${contient} » (${tous.length} vus)`)
  return trouve
}

afterEach(() => { document.body.innerHTML = '' })

describe('os#1476 une part en gras est en gras sur les trois natures', () => {

  it('LE DISQUE, dessine pour de vrai', () => {
    const figure = partsReglees('sunburst', { name_label_bold: true, name_label_font_size: 17 })
    const el = sizedContainer()

    drawSunburstChart(el, arbre(), {
      parts: figure.by_id as never,
      style: { labels_mode: 'always' }
    })

    // CONTRE-VERIFICATION D ABORD : si rien n est dessine, ce test ne prouve rien.
    expect(el.querySelectorAll('path.sunburst_arc').length).toBe(2)
    const texte = texteDe(el, 'sunburst_arc_label', 'Ble')
    expect(texte.getAttribute('font-weight')).toBe('bold')
    expect(texte.getAttribute('font-size')).toBe('17')
    // Et sa voisine, qui n a rien dit, garde celle de la figure.
    expect(texteDe(el, 'sunburst_arc_label', 'Mais').getAttribute('font-weight')).toBeNull()
  })

  it('LA COURONNE', () => {
    const figure = partsReglees('donut', { name_label_bold: true, name_label_font_size: 17 })
    const el = sizedContainer()

    const style = { ...DONUT_STYLE_DEFAULTS, name_label_is_visible: true }
    drawDonutChart(el, PARTS, { style, part_aspect: resolveur(figure, style) })

    expect(el.querySelectorAll('path.node_stats_arc').length).toBe(2)
    const texte = texteDe(el, 'node_stats_pct', 'Ble')
    expect(texte.getAttribute('font-weight')).toBe('bold')
    expect(texte.getAttribute('font-size')).toBe('17')
  })

  it('LES BARRES', () => {
    const figure = partsReglees('bar', { name_label_bold: true, name_label_font_size: 17 })
    const el = sizedContainer()

    const style = { ...BARS_STYLE_DEFAULTS, name_label_is_visible: true }
    drawBarChart(el, PARTS, { style, part_aspect: resolveur(figure, style) })

    expect(el.querySelectorAll('rect[data-repr-kind="part"]').length).toBe(2)
    const texte = texteDe(el, 'node_stats_bar_label', 'Ble')
    expect(texte.getAttribute('font-weight')).toBe('bold')
    expect(texte.getAttribute('font-size')).toBe('17')
  })
})

describe('os#1476 le nombre dun secteur a SA typographie, et non celle du nom', () => {

  it('regler la police de la VALEUR ne touche pas au nom, et reciproquement', () => {
    // LE DEFAUT QUE CE LOT CORRIGE. Le nombre detache lisait `name_label_font_size` : regler la
    // police du nombre n avait aucun effet, et regler celle du nom deplacait aussi le nombre.
    // C est mot pour mot ce qu os#1469 avait corrige sur les barres — la meme recopie.
    const figure = partsReglees('sunburst', {
      name_label_font_size: 17,
      value_label_is_visible: true,
      value_label_stick_to_label: false,
      value_label_font_size: 25,
      value_label_bold: true
    })
    const el = sizedContainer()

    drawSunburstChart(el, arbre(), {
      parts: figure.by_id as never,
      style: { labels_mode: 'always' }
    })

    const nom = texteDe(el, 'sunburst_arc_label', 'Ble')
    const valeur = Array.from(el.querySelectorAll<SVGTextElement>('text.sunburst_arc_value'))
    expect(valeur.length).toBe(1)
    expect(nom.getAttribute('font-size')).toBe('17')
    expect(nom.getAttribute('font-weight')).toBeNull()
    expect(valeur[0].getAttribute('font-size')).toBe('25')
    expect(valeur[0].getAttribute('font-weight')).toBe('bold')
  })
})

describe('os#1476 le decalage fin agit sur le disque', () => {

  it('une part qui decale son etiquette la voit bouger dans son secteur', () => {
    // `partTextPlacement`, la regle commune : la place proposee par le trace, corrigee de ce que la
    // part demande. Le repere est celui du SECTEUR — il a tourne avec lui —, ce qui est le seul
    // sens utilisable a la main dans un disque.
    const figure = partsReglees('sunburst', {
      name_label_horiz_shift: 12, name_label_vert_shift: -5
    })
    const el = sizedContainer()

    drawSunburstChart(el, arbre(), {
      parts: figure.by_id as never,
      style: { labels_mode: 'always' }
    })

    expect(texteDe(el, 'sunburst_arc_label', 'Ble').getAttribute('transform'))
      .toContain('translate(12,-5)')
    // La voisine, muette, n a pas de translation supplementaire.
    expect(texteDe(el, 'sunburst_arc_label', 'Mais').getAttribute('transform'))
      .not.toContain('translate(12,-5)')
  })
})
