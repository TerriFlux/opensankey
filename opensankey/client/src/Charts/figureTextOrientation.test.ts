// os#1486 — LE TEXTE D UN SECTEUR TOURNE DANS LE BON SENS.
//
// Julien, capture a l appui : « le radial c est un peu a l envers :-) ».
//
// Il l etait deux fois, et les deux defauts sont du meme genre : une convention recopiee de
// travers. Le disque fait tourner ses etiquettes depuis longtemps ; la couronne l a appris hier,
// et elle l a mal appris.
//
//   1. LE FLIP INVERSE. `arcTextTransform` (SunburstChart) applique `flip ? 90 : -90` ; la couronne
//      avait `flip ? -90 : 90`, soit un demi-tour d ecart. Le texte lisible devenait celui qu on
//      lit la tete en bas.
//   2. « RADIALE » NE TOURNAIT PAS. Elle tombait dans le cas « on ne fait rien », alors que
//      l arbitrage disait l inverse : on honore les mots a la lettre plutot que de les tordre.
//
// ── CE QUE CE FICHIER GARDE, ET POURQUOI IL NE PEUT PAS ETRE UNE CAPTURE D ECRAN ─────────────
//
// Le harnais d os#1481 dit si un reglage MORD ; il ne dit rien du SENS. Tourner de +90 ou de -90
// change le DOM dans les deux cas — il aurait vu « radial mord » et serait passe au vert sur un
// texte illisible. C est la limite d une mesure qui compare deux dessins sans les lire.
//
// Ce qui se verifie ici est donc l ANGLE lui-meme, et la regle qui le gouverne : au-dela du
// demi-tour, un texte se retourne. Elle vaut pour les deux natures rondes, et ce test la pose sur
// les deux — c est ce qui empeche la couronne de re-diverger du disque.

import { drawDonutChart } from './NodeStatsCharts'
import { partAspectResolver } from './partAspect'
import type { Type_FigurePart } from './partAspect'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import { Class_ApplicationData } from '../types/ApplicationData'
import { buildParts } from '../Representations/parts/buildParts'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

// Quatre parts egales : leurs centres tombent a 45°, 135°, 225° et 315°, donc DEUX dans la moitie
// lisible et DEUX dans celle qui demande un retournement. C est ce qu il faut pour voir le flip.
const PARTS = [
  { id: 'a', label: 'Ble', value: 1 },
  { id: 'b', label: 'Mais', value: 1 },
  { id: 'c', label: 'Orge', value: 1 },
  { id: 'd', label: 'Avoine', value: 1 }
]

const dessine = (orientation: string): { [id: string]: number } => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  const figure = buildParts(doc, PARTS, undefined, 'donut')
  PARTS.forEach(p => {
    const part = figure.by_id[p.id] as unknown as { [k: string]: unknown }
    part['name_label_orientation'] = orientation
  })
  const style = { ...DONUT_STYLE_DEFAULTS, name_label_is_visible: true }
  const el = sizedContainer()
  drawDonutChart(el, PARTS, {
    style: style as never,
    part_aspect: partAspectResolver(
      style as never, figure.by_id as unknown as { [id: string]: Type_FigurePart }
    )
  })
  // L angle ecrit par le trace, part par part, dans l ordre du dessin.
  const angles: { [id: string]: number } = {}
  Array.from(el.querySelectorAll<SVGTextElement>('text.node_stats_pct')).forEach((t, i) => {
    const m = /rotate\((-?[\d.]+)\)/.exec(t.getAttribute('transform') ?? '')
    angles[PARTS[i].id] = m ? Math.round(parseFloat(m[1])) : 0
  })
  el.remove()
  return angles
}

afterEach(() => { document.body.innerHTML = '' })

describe('os#1486 l orientation du texte dans un secteur de couronne', () => {

  it('HORIZONTALE ne tourne rien : le dessin d hier', () => {
    // La garantie qui protege le parc : une couronne enregistree ne pivote pas ses etiquettes
    // parce qu on a branche le reglage.
    const angles = dessine('horizontal')
    expect(Object.values(angles)).toEqual([0, 0, 0, 0])
  })

  it('RADIALE suit le rayon, et se RETOURNE dans la moitie basse', () => {
    // Quatre parts egales : les centres sont a 45, 135, 225 et 315 degres. `deg` vaut l angle
    // moins 90 — donc -45, 45, 135 et 225 —, et au-dela du demi-tour on ajoute 180.
    const angles = dessine('radial')

    expect(angles['a']).toBe(-45)
    expect(angles['b']).toBe(45)
    // Ces deux-la se liraient la tete en bas : elles sont retournees.
    expect(angles['c']).toBe(135 + 180)
    expect(angles['d']).toBe(225 + 180)
  })

  it('LE LONG DE L ARC pivote d un quart de tour, du bon cote', () => {
    // ⚠️ LE SIGNE EST CELUI DU DISQUE, et c est tout l objet de ce lot : `flip ? 90 : -90`. Ecrit
    // dans l autre sens, le texte est lisible exactement la ou il ne devrait pas l etre.
    const angles = dessine('tangential')

    expect(angles['a']).toBe(-45 - 90)
    expect(angles['b']).toBe(45 - 90)
    expect(angles['c']).toBe(135 + 90)
    expect(angles['d']).toBe(225 + 90)
  })

  it('les deux natures rondes tournent PAREIL, et c est ce qui les empeche de diverger', () => {
    // On ne compare pas les angles — les deux traces n ont pas le meme repere de depart (le disque
    // amene son texte par une rotation, la couronne par un centroide). On compare LA REGLE : de
    // combien le retournement decale le texte, dans chaque mode.
    const radial = dessine('radial')
    const tangential = dessine('tangential')

    // RADIALE : un demi-tour entre une part lisible et son opposee.
    expect(radial['c'] - 135).toBe(180)
    // LE LONG DE L ARC : un quart de tour de chaque cote, soit un demi-tour d ecart.
    expect((tangential['c'] - 135) - (tangential['a'] + 45)).toBe(180)
  })
})
