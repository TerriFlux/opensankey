// os#1488 — LA FORME DU CARTOUCHE, ET SON LISERE TIRETE.
//
// Julien, a l ecran : « pour le fond du label il y a un probleme de tonalite, mais en plus changer
// la forme ne fait rien sur le fond » — puis, capture a l appui : « les pointilles non plus ».
//
// Les deux cases existaient dans l inspecteur depuis que le cartouche existe (os#1468) ; le traceur
// n en lisait aucune. Il posait un `rect` plein, quoi qu on demande.
//
// ⚠️ ET LE HARNAIS D os#1481 NE POUVAIT PAS LES VOIR : toutes les cles du cartouche sont dans sa
// liste HORS_PORTEE_DE_JSDOM, parce que `drawFigureLabelBackground` rend la main sur une boite
// vide — et jsdom ne met rien en page, donc `getBBox` rend toujours une boite vide.
//
// CE FICHIER LEVE CETTE LIMITE, et c est ce qui le rend utile : on truque `getBBox` pour qu il
// rende une boite plausible. Le cartouche se dessine alors pour de vrai, et on peut LIRE ce qu il a
// ecrit. Les vingt-deux autres cles du cartouche deviennent testables par le meme chemin.

import * as d3 from '../d3Modules'
import { drawFigureLabelBackground } from './figureLabelBackground'
import { givePlainDrawingEnvironment, sizedContainer } from './figureDomHarness.test-utils'

givePlainDrawingEnvironment()

/**
 * Un texte DEJA MESURE : sans cela, `drawFigureLabelBackground` rend la main sans rien dessiner —
 * et le test passerait au vert sur un cartouche absent.
 */
const texteMesure = () => {
  const el = sizedContainer()
  const svg = d3.select(el).append('svg')
  const g = svg.append('g')
  const text = g.append('text').text('Ble')
  const node = text.node()!
  node.getBBox = () => ({
    x: 10, y: 20, width: 40, height: 12, top: 20, left: 10, right: 50, bottom: 32,
    toJSON: () => ({})
  }) as DOMRect
  return { el, text }
}

/** Le cartouche pose derriere le texte, ou `null`. */
const cartouche = (bg: Parameters<typeof drawFigureLabelBackground>[1]): Element | null => {
  const { el, text } = texteMesure()
  drawFigureLabelBackground(text, bg)
  return el.querySelector('.figure_label_background')
}

afterEach(() => { document.body.innerHTML = '' })

describe('os#1488 la forme du cartouche derriere une etiquette', () => {

  it('CONTRE-VERIFICATION : sans texte mesure, rien ne se dessine', () => {
    // La raison pour laquelle toutes ces cles etaient reputees non mesurables. Si ce cas tombait,
    // c est que le decor ci-dessus ne sert a rien et que les autres cas ne prouvent rien.
    const el = sizedContainer()
    const text = d3.select(el).append('svg').append('g').append('text').text('Ble')

    drawFigureLabelBackground(text, { bg_visible: true })

    expect(el.querySelector('.figure_label_background')).toBeNull()
  })

  it('RECTANGLE par defaut : le dessin d hier, et il ne change pas', () => {
    const el = cartouche({ bg_visible: true })

    expect(el?.tagName.toLowerCase()).toBe('rect')
    expect(el?.getAttribute('width')).toBe('48')
  })

  it('ELLIPSE : un AUTRE element, pose par son centre', () => {
    // Un `rect` arrondi ne fait pas une ellipse : `rx` plafonne a la moitie du cote, et une
    // etiquette large garde des flancs droits. Il faut la balise.
    const el = cartouche({ bg_visible: true, bg_type: 'ellipse' })

    expect(el?.tagName.toLowerCase()).toBe('ellipse')
    expect(el?.getAttribute('cx')).toBe('30')
    expect(el?.getAttribute('rx')).toBe('24')
  })

  it('CAPSULE : un rectangle dont le rayon vaut la moitie du petit cote', () => {
    const debout = cartouche({ bg_visible: true, bg_type: 'capsule' })
    const couche = cartouche({ bg_visible: true, bg_type: 'capsule_h' })

    // 12 de haut + 2 x 2 de marge = 16, donc un rayon de 8.
    expect(debout?.getAttribute('rx')).toBe('8')
    // 40 de large + 2 x 4 de marge = 48, donc un rayon de 24.
    expect(couche?.getAttribute('rx')).toBe('24')
  })

  it('LE LISERE TIRETE, qui ne faisait rien non plus', () => {
    const el = cartouche({
      bg_visible: true, bg_border_visible: true, bg_border_thickness: 2, bg_border_dashed: true
    })

    expect(el?.getAttribute('stroke-dasharray')).toBe('8 4')
  })

  it('pas de tirete sans lisere : on ne tirette pas un trait qu on ne dessine pas', () => {
    const el = cartouche({ bg_visible: true, bg_border_dashed: true })

    expect(el?.getAttribute('stroke-dasharray')).toBeNull()
  })
})
