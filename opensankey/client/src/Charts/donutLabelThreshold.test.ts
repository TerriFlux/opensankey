// 26/09/2026 — LE SEUIL D AFFICHAGE DES ETIQUETTES D UNE COURONNE EST UN REGLAGE.
//
// Julien, capture du panneau « Affichage » du diagramme a l appui : « pour les couronnes, un
// affichage des labels en fonction de la taille serait un plus, comme pour le diagramme de
// Sankey. »
//
// La couronne appliquait deja cette regle — un secteur sous 3 % du tout n ecrit rien — mais EN
// DUR (`MIN_LABEL_SHARE`), et rien ne pouvait la contredire. C est exactement le defaut que
// `parts_group_under` et `parts_max` ont connu avant de devenir des reglages : ce qui restait du
// nombre en dur, c est sa valeur d usine.
//
// ⚠️ CE SEUIL NE REPLIE RIEN, et c est ce qui le distingue de son voisin : la part garde sa forme,
// sa couleur et son info-bulle, elle n ecrit pas. `parts_group_under`, lui, la fait disparaitre
// dans « Autres ».

import { drawDonutChart } from './NodeStatsCharts'
import type { Type_StatSlice } from './NodeStatsCharts'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureChartStyle } from './figureChartStyle'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

/** « Miette » pese 1 sur 101, soit moins d un pour cent : sous le seuil d usine, au-dessus de 0. */
const PARTS: Type_StatSlice[] = [
  { id: 'a', label: 'Gros', value: 100 },
  { id: 'b', label: 'Miette', value: 1 }
]

const styleOf = (over: Partial<Type_FigureChartStyle>): Type_FigureChartStyle => ({
  ...DONUT_STYLE_DEFAULTS,
  name_label_is_visible: true,
  name_label_callout: false,
  // Le repliement en « Autres » emporterait la miette avant qu on ait mesure son etiquette : on le
  // coupe pour ne mesurer QUE le seuil d ecriture, qui est le sujet.
  parts_group_under: 0,
  ...over
})

const dessine = (over: Partial<Type_FigureChartStyle>): HTMLElement => {
  const el = sizedContainer()
  drawDonutChart(el, PARTS, { style: styleOf(over), format: v => String(v) })
  return el
}

/** Les textes ECRITS DANS les secteurs (la legende est du HTML, pas du SVG). */
const dansLesSecteurs = (el: HTMLElement): string =>
  [...el.querySelectorAll('svg text')].map(t => t.textContent ?? '').join(' ')

/** Les secteurs eux-memes : ils ne doivent pas bouger quand seule l ecriture change. */
const secteurs = (el: HTMLElement): number =>
  el.querySelectorAll('path.node_stats_arc').length

afterEach(() => { document.body.innerHTML = '' })

describe('le seuil d affichage des etiquettes', () => {

  it('LA VALEUR D USINE EST LA REGLE D HIER : sous 3 %, une part ne s ecrit pas', () => {
    // LA GARANTIE DU PARC, et la premiere chose a verifier : une couronne enregistree dessine
    // exactement ce qu elle dessinait.
    const el = dessine({})

    expect(dansLesSecteurs(el)).toContain('Gros')
    expect(dansLesSecteurs(el)).not.toContain('Miette')
  })

  it('LE CAS DE JULIEN : baisser le seuil nomme les petites', () => {
    const el = dessine({ parts_label_min_share: 0 })

    expect(dansLesSecteurs(el)).toContain('Miette')
  })

  it('ET LE MONTER TAIT LES GROSSES', () => {
    // L autre sens, qui prouve que c est bien un REGLAGE et pas un interrupteur : « Gros » pese
    // 99 %, il faut donc un seuil absurde pour le taire — et il se tait.
    const el = dessine({ parts_label_min_share: 99.5 })

    expect(dansLesSecteurs(el)).not.toContain('Gros')
  })

  it('IL NE REPLIE RIEN : la part se tait, elle ne disparait pas', () => {
    // LA CONTRE-VERIFICATION QUI COMPTE, et elle dit la difference avec `parts_group_under` :
    // au-dessus comme en dessous du seuil, la couronne garde ses DEUX secteurs.
    const nomme = dessine({ parts_label_min_share: 0 })
    const muet = dessine({ parts_label_min_share: 10 })

    expect(secteurs(nomme)).toBe(2)
    expect(secteurs(muet)).toBe(2)
  })
})
