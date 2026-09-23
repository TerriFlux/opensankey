// os#1490 — L UNITE D UNE PART DE FIGURE N EST PAS CELLE D UN FLUX.
//
// Julien, capture a l appui : sa part de couronne se voyait offrir « % de flux en entrees du noeud
// source ». Le selecteur d unite des flux compte douze entrees — unite de tag, ratio, normalise,
// pourcentages de stock — dont presque aucune ne veut dire quoi que ce soit dans une figure.
//
// « Le selecteur d unite peut pas etre le meme sur un noeud, un flux, une part de figure... dans le
// cas d une figure ca va etre beaucoup plus simple. » Quatre choix, et le POURCENTAGE en est un :
// c est la lecture qu il a repetee trois fois — « pour moi c est l affichage de la valeur en unite
// pourcentage » (os#1487, os#1489).
//
// Ce test tient les DEUX faces de la bijection qu il demande :
//   — la surface : le selecteur des flux ne s adresse plus a une part, le sien s y adresse seul ;
//   — le trace   : chacun des quatre choix change ce qui est ecrit.

import { BARS_STYLE_DEFAULTS } from './figureChartStyle'
import type { Type_FigureValueFormat } from './figureFormat'
import { buildParts } from '../Representations/parts/buildParts'
import { Class_ApplicationData } from '../types/ApplicationData'
import { attributeAppliesToElements } from '../Elements/attributeScope'

import { partAspect } from './partAspect'

/**
 * Poser une cle que la classe NE DECLARE PAS en TypeScript mais qu elle porte a l execution :
 * `createDynamicProperties` definit une propriete par cle du catalogue, `Element.tsx` n en declare
 * qu une partie en champs types. L affectation passe par le vrai setter, et `isAttributeOverloaded`
 * la voit comme n importe quelle autre. (Meme procede que `partAspect.test.ts`.)
 */
const setAttr = (part: object, key: string, value: unknown) => {
  (part as { [k: string]: unknown })[key] = value
}

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

const twoParts = () => {
  const doc = new Class_ApplicationData(false)
  doc.drawing_area.bypass_redraws = true
  return buildParts(doc, [
    { id: 'l_ble', label: 'Ble', value: 6 },
    { id: 'l_mais', label: 'Mais', value: 4 }
  ])
}

/** Le format DEJA RESOLU de la figure : c est sur lui que la part se pose. */
const figureFormat = (): Type_FigureValueFormat => ({
  significant_digits: false,
  nb_significant_digits: 1,
  custom_digit: true,
  nb_digit: 0,
  scientific_notation: false,
  unit: 'kt'
})

describe('os#1490 le selecteur dunite dune part', () => {

  it('LA SURFACE : celui des flux ne sadresse plus a une part, le sien si', () => {
    const figure = twoParts()
    const part = figure.by_id['l_ble']

    // LE GESTE DE JULIEN, a la lettre : c est `value_label_unit_type` qui portait les douze
    // entrees, dont « % de flux en entrees du noeud source ».
    expect(attributeAppliesToElements([part], 'value_label_unit_type')).toBe(false)
    expect(attributeAppliesToElements([part], 'value_label_part_unit')).toBe(true)

    // CONTRE-VERIFICATION, sans laquelle ce test passerait au vert sur une declaration qui masque
    // tout : un noeud garde son selecteur, et ne recoit pas celui des parts.
    const node = figure.document.drawing_area.sankey.addNewDefaultNode()
    expect(attributeAppliesToElements([node], 'value_label_unit_type')).toBe(true)
    expect(attributeAppliesToElements([node], 'value_label_part_unit')).toBe(false)

    figure.document.dispose()
  })

  it('ABSENT : la figure decide, et rien du parc ne bouge', () => {
    // LA GARANTIE DU CHANTIER. Une part qui n a rien dit n est ecoutee sur rien : le defaut
    // 'value' du catalogue ne doit PAS eteindre le pourcentage d une couronne enregistree.
    const figure = twoParts()
    const style = { ...BARS_STYLE_DEFAULTS, value_label_percent: 'total' } as never

    const aspect = partAspect(style, figure.by_id['l_ble'])

    expect(aspect.style.value_label_percent).toBe('total')
    expect(aspect.value_percent).toBeUndefined()

    figure.document.dispose()
  })

  it('POURCENTAGE DU TOUT : la part passe en pourcentage, et sans unite par-dessus', () => {
    const figure = twoParts()
    setAttr(figure.by_id['l_ble'], 'value_label_part_unit', 'percent_total')
    // Une decimale demandee, et c est ce qui rend l assertion suivante honnete : sans AUCUNE cle de
    // format dite, `value_format` resterait `undefined` et « ne contient pas kt » passerait au vert
    // sur du vide. Le harnais d os#1481 a deja menti une fois de cette facon.
    figure.by_id['l_ble'].value_label_nb_digit = 0

    const aspect = partAspect(
      BARS_STYLE_DEFAULTS, figure.by_id['l_ble'], { format: figureFormat() }
    )

    expect(aspect.style.value_label_percent).toBe('total')
    expect(aspect.value_percent).toBe('total')
    // « 75 % kt » n aurait aucun sens : le « % » EST deja l unite de ce nombre.
    expect(aspect.value_format?.(87.6)).toBe('88')

    figure.document.dispose()
  })

  it('POURCENTAGE DU PARENT : le meme, sur la part qui la contient', () => {
    const figure = twoParts()
    setAttr(figure.by_id['l_ble'], 'value_label_part_unit', 'percent_parent')

    const aspect = partAspect(BARS_STYLE_DEFAULTS, figure.by_id['l_ble'])

    expect(aspect.style.value_label_percent).toBe('parent')
    expect(aspect.value_percent).toBe('parent')

    figure.document.dispose()
  })

  it('VALEUR : la valeur telle quelle, et le pourcentage de la figure se tait', () => {
    // L autre sens de la meme regle : une couronne dont le DEFAUT est le pourcentage (os#1489)
    // doit pouvoir montrer, part par part, le nombre brut.
    const figure = twoParts()
    setAttr(figure.by_id['l_ble'], 'value_label_part_unit', 'value')
    figure.by_id['l_ble'].value_label_nb_digit = 0
    const style = { ...BARS_STYLE_DEFAULTS, value_label_percent: 'total' } as never

    const aspect = partAspect(style, figure.by_id['l_ble'], { format: figureFormat() })

    expect(aspect.style.value_label_percent).toBe('none')
    // Et l unite de la figure reste : « la valeur telle quelle » ne veut pas dire « sans unite ».
    expect(aspect.value_format?.(87.6)).toBe('88 kt')

    figure.document.dispose()
  })

  it('UNITE PERSONNALISEE : le texte saisi EST le symbole, sans registre a consulter', () => {
    // ⚠️ C EST LA OU LE SELECTEUR DES FLUX FAISAIT LE DEGAT. Son defaut est `unit_model` : dans ce
    // mode `value_label_unit` porte un IDENTIFIANT du registre, pas un symbole, et une part qui
    // ecrivait « pommes » y gagnait... l unite de la figure. Le quatrieme choix dit explicitement
    // que le texte se lit tel quel.
    const figure = twoParts()
    setAttr(figure.by_id['l_ble'], 'value_label_part_unit', 'custom')
    figure.by_id['l_ble'].value_label_unit = 'pommes'

    const aspect = partAspect(
      BARS_STYLE_DEFAULTS, figure.by_id['l_ble'], { format: figureFormat() }
    )

    expect(aspect.value_format?.(87.6)).toBe('88 pommes')

    figure.document.dispose()
  })
})
