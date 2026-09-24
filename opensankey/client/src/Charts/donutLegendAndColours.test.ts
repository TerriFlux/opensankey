// 24/09/2026 — CE QUE JULIEN A DEMANDE DE LA LEGENDE ET DES COULEURS D UNE COURONNE.
//
// Trois phrases, trois regles, et elles se verifient toutes les trois sur le DOM produit — c est
// le seul endroit ou elles existent vraiment :
//
//   « je vois pas trop l interet de mettre les pourcentages qui sont deja sur le graphe »
//   « la position par defaut devrait etre en dessous »
//   « il faudrait une logique de couleur comme pour le sunburst »
//
// Les deux premieres sont des regles de REDONDANCE et de PLACE : une legende dit ce que le dessin
// n a pas dit, et elle se pose la ou elle ne mange pas le diametre du disque. La troisieme est la
// regle du disque reprise telle quelle — la teinte dit la branche, la clarte dit le niveau — et
// c est elle qui rend lisible un anneau ou cohabitent deux niveaux.

import * as d3 from '../d3Modules'

import { barLabelAngle, barLabelBottom, drawDonutChart } from './NodeStatsCharts'
import type { Type_StatSlice } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

/** Une couronne A PLAT : deux parts, aucune profondeur. Le dessin de toujours. */
const FLAT: Type_StatSlice[] = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Viande', value: 4 }
]

/**
 * Une couronne DESCENDUE : « Cereales » a cede sa place a ses deux enfants, « Viande » est restee
 * elle-meme. Trois parts dans UN anneau, venues de deux niveaux — le cas que la couleur doit dire.
 */
const DESCENDED: Type_StatSlice[] = [
  { id: 'ble', label: 'Ble', value: 6, depth: 1, parent_label: 'Cereales', branch_id: 'cereales' },
  { id: 'mais', label: 'Mais', value: 4, depth: 1, parent_label: 'Cereales', branch_id: 'cereales' },
  { id: 'viande', label: 'Viande', value: 5, depth: 0, parent_label: 'Racine', branch_id: 'viande' }
]

const styleOf = (over: Partial<Type_FigureChartStyle>): Type_FigureChartStyle =>
  ({ ...DONUT_STYLE_DEFAULTS, legend_visible: true, ...over })

const draw = (slices: Type_StatSlice[], over: Partial<Type_FigureChartStyle>): HTMLElement => {
  const el = sizedContainer()
  drawDonutChart(el, slices, { style: styleOf(over), format: v => String(v) })
  return el
}

/** Le texte de la legende seule — jamais celui des secteurs, qui sont des <text> du SVG. */
const legendText = (el: HTMLElement): string =>
  [...el.querySelectorAll('div')]
    .filter(d => d.querySelector('svg') === null && d.children.length > 0)
    .map(d => d.textContent ?? '')
    .join(' ')

/** La couleur de remplissage de chaque secteur, dans l ordre du trace. */
const fills = (el: HTMLElement): string[] =>
  [...el.querySelectorAll('path.node_stats_arc')].map(p => p.getAttribute('fill') ?? '')

afterEach(() => { document.body.innerHTML = '' })

describe('la legende d une couronne', () => {

  test('elle se pose DESSOUS par defaut', () => {
    // Le defaut du trace et celui que l inspecteur montre doivent dire la meme chose : c est
    // `DONUT_HONOURS.legend_position` qui porte l autre moitie (cf. analysisFigureAttributes).
    expect(DONUT_STYLE_DEFAULTS.legend_position).toBe('bottom')
  })

  test('elle ne redit pas le pourcentage que le secteur porte deja', () => {
    // La valeur est visible dans les secteurs (le defaut d une couronne depuis os#1489, en
    // pourcentage) : la legende n a donc pas a l ecrire une seconde fois.
    const el = draw(FLAT, { value_label_is_visible: true, value_label_percent: 'total' })

    expect(legendText(el)).toContain('Ble')
    expect(legendText(el)).not.toContain('%')
  })

  test('mais elle le dit quand le dessin se tait', () => {
    // L autre moitie de la regle, et c est elle qui fait qu on ne perd rien : valeur masquee sur
    // les secteurs, le nombre revient dans la legende.
    const el = draw(FLAT, { value_label_is_visible: false })

    expect(legendText(el)).toContain('%')
  })

  test('sous une descente, elle nomme le parent de chaque part', () => {
    // « Que le nom des noeuds puisse se voir en legende » : le nom seul ne dit plus de quoi un
    // secteur est la coupe quand l anneau melange deux niveaux.
    const el = draw(DESCENDED, { legend_levels: true, value_label_is_visible: true })

    expect(legendText(el)).toContain('Cereales › Ble')
  })
})

describe('les couleurs d une couronne descendue', () => {

  test('la teinte dit la branche, la clarte dit le niveau', () => {
    const el = draw(DESCENDED, {
      parts_color_source: 'palette', parts_depth_shading: true, parts_order: 'model'
    })
    const [ble, mais, viande] = fills(el).map(f => d3.hsl(f))

    // Deux enfants d une meme branche : la MEME teinte.
    expect(Math.round(ble.h)).toBe(Math.round(mais.h))
    // Une autre branche : une autre teinte.
    expect(Math.round(viande.h)).not.toBe(Math.round(ble.h))
    // Et la profondeur ECLAIRCIT : les deux enfants sont au cran 1, la Viande au cran 0.
    expect(ble.l).toBeGreaterThan(viande.l)
  })

  test('le degrade se coupe, et la branche garde sa teinte', () => {
    // Sans lui, les deux niveaux sont deux aplats indistincts — mais c est un choix offert, pas
    // une fatalite, et la teinte de branche doit tenir sans lui.
    const el = draw(DESCENDED, {
      parts_color_source: 'palette', parts_depth_shading: false, parts_order: 'model'
    })
    const [ble, mais, viande] = fills(el)

    expect(ble).toBe(mais)
    expect(viande).not.toBe(ble)
  })

  test('sous « couleur du diagramme », le noeud commande et rien ne l eclaircit', () => {
    // La regle du disque, mot pour mot (`partitionSunburst`) : deux noeuds qui portent leur propre
    // couleur se distinguent deja par elle, l eclaircir ne ferait que la trahir.
    const coloured = DESCENDED.map(s => ({ ...s, color: '#123456' }))
    const el = draw(coloured, { parts_color_source: 'model', parts_depth_shading: true })

    expect(fills(el)).toEqual(['#123456', '#123456', '#123456'])
  })

  test('a plat, aucune part n a de profondeur et la palette est celle d hier', () => {
    // LA GARANTIE : une couronne enregistree ne change pas de couleurs. Sans `branch_id`, c est
    // l index du secteur qui commande, comme depuis toujours — donc deux teintes differentes.
    const el = draw(FLAT, { parts_color_source: 'palette', parts_order: 'model' })
    const [first, second] = fills(el)

    expect(first).not.toBe(second)
  })
})

// ── 24/09/2026 — L INCLINAISON DES ETIQUETTES D UN HISTOGRAMME EST UN REGLAGE ────────────────
//
// Julien, capture a l appui : « sur les barres il y a quelque chose qui se passe qui ne semble pas
// configurable, le label se met de travers. C est pas l esprit de notre appli : les choses doivent
// etre configurables. »
//
// La regle vivait EN DUR dans quatre traceurs — « plus de six barres OU un libelle de plus de huit
// caracteres » — et rien ne pouvait la contredire. Ce bloc fige les deux moities du correctif :
// 'auto' EST cette regle (donc aucun histogramme enregistre ne change), et les trois autres
// valeurs la remplacent.
describe('l inclinaison des etiquettes d un histogramme', () => {

  const COURTES = [{ id: 'a', label: 'Ble', value: 3 }, { id: 'b', label: 'Mais', value: 2 }]
  const LONGUES = [{ id: 'a', label: 'Consommation', value: 3 }, { id: 'b', label: 'Production', value: 2 }]

  test('automatique : a plat tant que les libelles tiennent', () => {
    expect(barLabelAngle(styleOf({}), COURTES)).toBe(0)
  })

  test('automatique : incline des qu un libelle est long', () => {
    // C est le cas de la capture : deux barres seulement, mais « Consommation » depasse.
    expect(barLabelAngle(styleOf({}), LONGUES)).toBe(-35)
  })

  test('automatique : incline des qu il y a plus de six barres', () => {
    const sept = Array.from({ length: 7 }, (_, i) => ({ id: String(i), label: 'x', value: 1 }))
    expect(barLabelAngle(styleOf({}), sept)).toBe(-35)
  })

  test('l auteur peut contredire la regle, dans les deux sens', () => {
    // C est tout l objet du lot : la regle automatique n a plus le dernier mot.
    expect(barLabelAngle(styleOf({ name_label_angle: 'horizontal' }), LONGUES)).toBe(0)
    expect(barLabelAngle(styleOf({ name_label_angle: 'tilted' }), COURTES)).toBe(-35)
    expect(barLabelAngle(styleOf({ name_label_angle: 'vertical' }), COURTES)).toBe(-90)
  })

  test('la bande reservee sous l abscisse suit l angle', () => {
    // Sans quoi des etiquettes verticales deborderaient du cadre, ou une ligne a plat laisserait
    // une bande vide de 46 px.
    expect(barLabelBottom(0)).toBeLessThan(barLabelBottom(-35))
    expect(barLabelBottom(-35)).toBeLessThan(barLabelBottom(-90))
  })
})
