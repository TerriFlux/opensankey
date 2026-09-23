// os#1491 — LE PLACEMENT D UNE ETIQUETTE DE PART, LA OU IL EST OFFERT.
//
// Julien : « c est general, ma remarque : toutes les interfaces doivent faire sens et s adapter
// d une figure a l autre. Ca n a pas l air d etre encore le cas, vois sur le placement des labels
// qui n ont aucun effet. »
//
// Trois defauts distincts se cachaient derriere cette rangee de boutons, et ils n ont pas la meme
// reponse :
//
//   1. SUR UNE COURONNE, les deux decalages fins etaient offerts et morts. Le bloc du secteur est
//      pose par un `transform`, ou `partTextPlacement` n a aucune prise. -> on implemente.
//   2. SUR UNE BARRE, `vert` n agissait QUE si « dedans » etait coche : trois boutons qui en
//      demandaient un quatrieme d abord. -> la hauteur et le « dedans » se combinent desormais.
//   3. SUR UNE COURONNE ET UN DISQUE, les quatre boutons « dans quel coin » n ont pas de sens (un
//      arc n a pas de coins) et la declaration le disait DEJA (os#1483) — mais l inspecteur les
//      affichait quand meme. -> la rangee demande, comme toutes les autres surfaces.
//
// Le troisieme se verifie dans `attributeScope.test.ts` (la declaration) ; les deux premiers ici.

import { drawDonutChart, drawBarChart } from './NodeStatsCharts'
import { partAspectResolver } from './partAspect'
import type { Type_FigurePart } from './partAspect'
import { BARS_STYLE_DEFAULTS, DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import { Class_ApplicationData } from '../types/ApplicationData'
import { buildParts } from '../Representations/parts/buildParts'
import type { Type_FigureParts } from '../Representations/parts/buildParts'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const PARTS = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 4 }
]

const figureDe = (nature: string): Type_FigureParts => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  return buildParts(doc, PARTS, undefined, nature)
}

const allume = <T extends object>(base: T): T => ({
  ...base, name_label_is_visible: true, value_label_is_visible: true
})

/** Pose une cle que la classe ne declare pas en TypeScript mais qu elle porte a l execution. */
const setAttr = (part: object, key: string, value: unknown) => {
  (part as { [k: string]: unknown })[key] = value
}

/** Dessine et rend la place du texte demande : son `transform`, ou son couple x/y. */
const placeDe = (
  nature: string, classe: string, reglages: { [key: string]: unknown }
): string => {
  const figure = figureDe(nature)
  Object.entries(reglages).forEach(([k, v]) => setAttr(figure.by_id.a, k, v))
  const style = allume(nature === 'donut' ? DONUT_STYLE_DEFAULTS : BARS_STYLE_DEFAULTS)
  const resolver = partAspectResolver(
    style as never, figure.by_id as unknown as { [id: string]: Type_FigurePart }
  )
  const el = sizedContainer()
  if (nature === 'donut') {
    drawDonutChart(el, PARTS, { style: style as never, part_aspect: resolver })
  } else {
    drawBarChart(el, PARTS, { style: style as never, part_aspect: resolver })
  }
  const node = el.querySelector(classe)
  const place = node?.getAttribute('transform')
    ?? `${node?.getAttribute('x') ?? ''},${node?.getAttribute('y') ?? ''}`
  el.remove()
  figure.document.dispose()
  return place
}

afterEach(() => { document.body.innerHTML = '' })

describe('os#1491 le placement fin dune part', () => {

  it('LA COURONNE : le decalage horizontal deplace le bloc du secteur', () => {
    const sans = placeDe('donut', 'text.node_stats_pct', {})
    const avec = placeDe('donut', 'text.node_stats_pct', { name_label_horiz_shift: 17 })

    // CONTRE-VERIFICATION D ABORD : sans elle, un secteur qui n ecrit rien rendrait les deux
    // chaines vides et le test passerait au vert sur du neant.
    expect(sans).toContain('translate')
    expect(avec).not.toBe(sans)
  })

  it('LA COURONNE : le decalage vertical aussi, et les deux ne se confondent pas', () => {
    const horiz = placeDe('donut', 'text.node_stats_pct', { name_label_horiz_shift: 17 })
    const vert = placeDe('donut', 'text.node_stats_pct', { name_label_vert_shift: 17 })

    expect(vert).not.toBe(horiz)
  })

  it('LES BARRES : la hauteur agit SANS quon ait coche dedans', () => {
    // LE BOUTON MORT, a la lettre : poser « milieu » seul ne deplacait rien, parce que `vert`
    // n etait lu que dans la branche « dedans ».
    const bas = placeDe('bars', 'text.node_stats_bar_label', {})
    const milieu = placeDe('bars', 'text.node_stats_bar_label', { name_label_vert: 'middle' })
    const haut = placeDe('bars', 'text.node_stats_bar_label', { name_label_vert: 'top' })

    expect(bas).not.toBe(milieu)
    expect(milieu).not.toBe(haut)
    expect(haut).not.toBe(bas)
  })

  it('LES BARRES : et le defaut ne bouge pas dun pixel', () => {
    // LA GARANTIE. « Bas » est le defaut hors de la barre, et il rend exactement la place d hier :
    // le nom sous l axe. Un histogramme enregistre ne change pas d aspect.
    const defaut = placeDe('bars', 'text.node_stats_bar_label', {})
    const dit = placeDe('bars', 'text.node_stats_bar_label', { name_label_vert: 'bottom' })

    expect(dit).toBe(defaut)
  })

  it('LES BARRES : la valeur suit la meme regle que le nom', () => {
    const defaut = placeDe('bars', 'text.node_stats_bar_value', {})
    const milieu = placeDe('bars', 'text.node_stats_bar_value', { value_label_vert: 'middle' })

    expect(defaut).not.toBe('')
    expect(milieu).not.toBe(defaut)
  })
})
