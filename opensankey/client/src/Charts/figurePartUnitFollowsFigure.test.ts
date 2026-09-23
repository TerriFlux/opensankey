// os#1503 — LE SELECTEUR D UNITE D UNE PART MONTRE CE QUE LA FIGURE ECRIT.
//
// Julien, capture a l appui : « pour l unite, c est la selection avec l option Valeur, alors que ce
// qui est dessine, c est des % ».
//
// `value_label_part_unit` (os#1490) est une cle d ELEMENT : la figure ne la declare pas, donc le
// defaut de nature qui a repare le reste du panneau (os#1502) n a rien a en dire, et l inspecteur
// retombait sur la valeur d usine d un NOEUD — « Valeur ». Or ce que la figure fait est connu :
// c est `value_label_percent`, resolu, et il est desormais stampe sur chaque part au cablage.

import { figurePartsWiring } from '../Representations/parts/figurePartsWiring'
import { DONUT_STYLE_DEFAULTS } from './figureChartStyle'
import { VALUE_LABEL_CONFIG, getConfigValues } from '../Elements/ElementsAttributesConfig'
import type { ElementsType } from '../Elements/ElementsAttributesConfig'
import { Class_ApplicationData } from '../types/ApplicationData'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

/** Une couronne cablee comme le trace la cable, sous le pourcentage demande. */
const uneCouronne = (percent: string) => {
  const app = new Class_ApplicationData(false)
  app.drawing_area.bypass_redraws = true
  const wiring = figurePartsWiring(
    { app_data: app } as never,
    [{ id: 'a', label: 'Ble', value: 6 }, { id: 'b', label: 'Mais', value: 4 }],
    'donut',
    { ...DONUT_STYLE_DEFAULTS, value_label_percent: percent } as never
  )
  return { app, wiring }
}

/** Ce que l inspecteur lit sur cette part, pour la famille « Valeur ». */
const luSurLaPart = (part: unknown) =>
  getConfigValues(
    [part] as unknown as ElementsType, VALUE_LABEL_CONFIG, 'value_label', () => undefined
  )

describe('os#1503 lunite dune part suit ce que la figure ecrit', () => {

  it('LE CAS DE JULIEN : la couronne ecrit des pourcentages du tout, le selecteur le dit', () => {
    const { app, wiring } = uneCouronne('total')
    const part = wiring.by_id['a']

    expect((part as unknown as { [k: string]: unknown })['figure_value_percent']).toBe('total')
    expect(luSurLaPart(part).part_unit).toBe('percent_total')

    wiring.release()
    app.dispose()
  })

  it('POURCENTAGE DU PARENT : le selecteur suit aussi', () => {
    const { app, wiring } = uneCouronne('parent')

    expect(luSurLaPart(wiring.by_id['a']).part_unit).toBe('percent_parent')

    wiring.release()
    app.dispose()
  })

  it('SANS POURCENTAGE, le selecteur dit « Valeur » — et cest vrai cette fois', () => {
    // LA CONTRE-VERIFICATION : sans elle, ce fichier passerait au vert sur un lecteur qui rendrait
    // un pourcentage a tout le monde.
    const { app, wiring } = uneCouronne('none')

    expect(luSurLaPart(wiring.by_id['a']).part_unit).toBe('value')

    wiring.release()
    app.dispose()
  })

  it('CE QUE LA PART DIT ELLE-MEME GAGNE, comme partout', () => {
    const { app, wiring } = uneCouronne('total')
    const part = wiring.by_id['a'] as unknown as { [k: string]: unknown }
    part['value_label_part_unit'] = 'custom'

    expect(luSurLaPart(part).part_unit).toBe('custom')

    wiring.release()
    app.dispose()
  })
})
