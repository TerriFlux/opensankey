// os#1499 — EMPILER LES PARTS : UNE SEULE BARRE, UN SEGMENT PAR PART.
//
// Julien, devant le selecteur « Disposer » des coordonnees : « pour les barres, que veut dire ca ?
// Sur mon cas tres simple, deja ca n agit pas. »
//
// Il avait raison deux fois. « En parts d une barre » PROMETTAIT une barre unique a segments, et
// les deux choix dessinaient la meme chose — N barres — parce qu aucun trace ne savait empiler des
// parts. Ce que le choix reglait vraiment etait le regime d ANALYSE (les flux s additionnent ou
// non, #389), qui ne se voit qu a l echelle et au croisement d un second axe.
//
// Les deux questions se separent : empiler est de la MISE EN FORME, ca se regle sur la figure et
// ca se voit. Ce fichier tient les deux garanties — le dessin change, et le defaut ne bouge pas.

import { drawBarChart } from './NodeStatsCharts'
import { BARS_STYLE_DEFAULTS } from './figureChartStyle'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

const PARTS = [
  { id: 'a', label: 'Ble', value: 6 },
  { id: 'b', label: 'Mais', value: 4 },
  { id: 'c', label: 'Orge', value: 2 }
]

/** Les rectangles dessines, dans l ordre : (x, largeur, haut, hauteur) arrondis. */
const barres = (stacked: boolean): Array<[number, number, number, number]> => {
  const el = sizedContainer()
  drawBarChart(el, PARTS, {
    style: { ...BARS_STYLE_DEFAULTS, bars_stacked: stacked } as never
  })
  const out = Array.from(el.querySelectorAll('rect')).map(r => ([
    Math.round(Number(r.getAttribute('x'))),
    Math.round(Number(r.getAttribute('width'))),
    Math.round(Number(r.getAttribute('y'))),
    Math.round(Number(r.getAttribute('height')))
  ] as [number, number, number, number]))
  el.remove()
  return out
}

afterEach(() => { document.body.innerHTML = '' })

describe('os#1499 empiler les parts dun histogramme', () => {

  it('LE DEFAUT NE BOUGE PAS : trois barres cote a cote, a trois abscisses', () => {
    // LA GARANTIE DU LOT. `bars_stacked` vaut `false` partout tant que personne ne le coche :
    // aucun histogramme enregistre ne change d aspect.
    const rects = barres(false)

    expect(rects).toHaveLength(3)
    const abscisses = new Set(rects.map(r => r[0]))
    expect(abscisses.size).toBe(3)
    // Et elles partent toutes du meme pied : c est ce qui distingue « cote a cote » d une pile.
    const pieds = new Set(rects.map(r => r[2] + r[3]))
    expect(pieds.size).toBe(1)
  })

  it('EMPILE : une seule abscisse, et chaque segment pose sur le precedent', () => {
    const rects = barres(true)

    expect(rects).toHaveLength(3)
    // UNE SEULE COLONNE : c est la barre unique promise par « en parts d une barre ».
    expect(new Set(rects.map(r => r[0])).size).toBe(1)
    expect(new Set(rects.map(r => r[1])).size).toBe(1)
    // CHACUN SUR LE PRECEDENT : le bas d un segment est le haut du suivant, a un pixel pres.
    const bas = rects.map(r => r[2] + r[3])
    expect(Math.abs(bas[1] - rects[0][2])).toBeLessThanOrEqual(1)
    expect(Math.abs(bas[2] - rects[1][2])).toBeLessThanOrEqual(1)
  })

  it('LA PILE EST A L ECHELLE DU TOTAL, et ses segments sont proportionnels', () => {
    // ⚠️ SANS CELA, UNE PILE DEBORDE : l echelle d un histogramme se fait sur la PLUS GRANDE
    // valeur, et une pile monte a leur SOMME. Le trace lit donc le total quand il empile.
    const rects = barres(true)
    const hauteurs = rects.map(r => r[3])

    // 6 / 4 / 2 : la premiere fait une fois et demie la deuxieme, et le triple de la troisieme.
    expect(hauteurs[0] / hauteurs[1]).toBeCloseTo(1.5, 1)
    expect(hauteurs[0] / hauteurs[2]).toBeCloseTo(3, 1)
    // Et l ensemble tient dans le dessin : le haut du dernier segment reste positif.
    expect(rects[2][2]).toBeGreaterThanOrEqual(0)
  })

  it('EMPILE, LES TEXTES SONT DEDANS : sinon ils se poseraient tous au meme endroit', () => {
    // Sous l axe il n y a qu une barre : trois noms y tomberaient l un sur l autre. Les textes
    // passent donc DANS leur segment, comme sur une couronne — et leurs ordonnees different.
    const el = sizedContainer()
    drawBarChart(el, PARTS, {
      style: {
        ...BARS_STYLE_DEFAULTS, bars_stacked: true, name_label_is_visible: true
      } as never
    })
    // Le nom d une barre est pose par un `transform`, jamais par x/y : c est lui qui porte aussi
    // le pivot a -35 degres quand les noms se serrent sous l axe.
    const y = Array.from(el.querySelectorAll('text.node_stats_bar_label'))
      .map(t => (t.getAttribute('transform') ?? '').replace(/.*,/, '').replace(/[^0-9.-]/g, ''))
    el.remove()

    expect(y).toHaveLength(3)
    expect(new Set(y).size).toBe(3)
  })
})
