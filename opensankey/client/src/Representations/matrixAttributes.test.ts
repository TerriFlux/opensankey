// sa#623 — LE TABLEAU CROISÉ A SES RÉGLAGES À LUI.
//
// Sans déclaration, la nature ne comptait pas comme réglable et la roue montrait les réglages du
// diagramme. Ce qui est vérifié ici : la déclaration existe et passe par le registre (c'est elle qui
// ouvre le menu), elle ne change pas l'aspect d'un tableau enregistré (défauts = tracé d'hier), et
// la lecture des deux réglages nouveaux retombe sur le calcul d'avant quand rien n'est posé.

import { registerBaseRepresentations } from './registerBaseRepresentations'
import { registerAnalysisRepresentations } from './registerAnalysisRepresentations'
import { representation_registry, representationOptionsRenderer } from './RepresentationRegistry'
import { MATRIX_REPRESENTATION } from './couronneState'
import {
  MATRIX_ATTRIBUTES, MATRIX_DECIMALS_AUTO, MATRIX_DECIMALS_KEY, MATRIX_UNIT_KEY,
  matrixDecimalsChosen, matrixUnitChoices, matrixUnitOf
} from './matrixAttributes'
import { DONUT_STYLE_DEFAULTS } from '../Charts/figureChartStyle'
import { figureControlsOf } from './figureControls'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

beforeAll(() => {
  registerBaseRepresentations()
  registerAnalysisRepresentations()
})

describe('sa#623 — réglages du tableau croisé', () => {
  it('la nature déclare ses réglages : elle a un menu de configuration', () => {
    const entry = representation_registry.get(MATRIX_REPRESENTATION)!
    expect(entry.attributes).toBe(MATRIX_ATTRIBUTES)
    expect(representationOptionsRenderer(entry)).not.toBeNull()
  })

  it('décimales, unité et « Autres » : des réglages de style, aux défauts du tracé d\'hier', () => {
    expect(Object.keys(MATRIX_ATTRIBUTES).sort())
      .toEqual([MATRIX_DECIMALS_KEY, MATRIX_UNIT_KEY, 'parts_group_under', 'parts_max'].sort())
    Object.values(MATRIX_ATTRIBUTES).forEach(a => expect(a.sort).toBe('style'))
    expect(MATRIX_ATTRIBUTES[MATRIX_DECIMALS_KEY].default).toBe(MATRIX_DECIMALS_AUTO)
    expect(MATRIX_ATTRIBUTES[MATRIX_UNIT_KEY].default).toBe('')
    expect(MATRIX_ATTRIBUTES['parts_group_under'].default).toBe(DONUT_STYLE_DEFAULTS.parts_group_under)
    expect(MATRIX_ATTRIBUTES['parts_max'].default).toBe(DONUT_STYLE_DEFAULTS.parts_max)
  })

  it('les quatre réglages paraissent dans l\'onglet Graphe (famille vide), pas sous Styles seulement', () => {
    // L'onglet Graphe rend `family: ''` (cf. FigureOwnSettings) : une clé rangée en Forme ou en
    // Valeur n'y paraissait pas, et l'onglet restait vide (retour de recette, 09/10).
    const items = figureControlsOf(MATRIX_ATTRIBUTES, {}, ['style', 'identity'], 'fr', { app_data: {}, element: null })
    expect(items.map(i => i.key).sort())
      .toEqual([MATRIX_DECIMALS_KEY, MATRIX_UNIT_KEY, 'parts_group_under', 'parts_max'].sort())
    items.forEach(i => expect(i.family).toBe(''))
  })

  it('décimales : fixées de 0 à 6, sinon automatiques', () => {
    expect(matrixDecimalsChosen({})).toBeNull()
    expect(matrixDecimalsChosen({ [MATRIX_DECIMALS_KEY]: MATRIX_DECIMALS_AUTO })).toBeNull()
    expect(matrixDecimalsChosen({ [MATRIX_DECIMALS_KEY]: '0' })).toBe(0)
    expect(matrixDecimalsChosen({ [MATRIX_DECIMALS_KEY]: '3' })).toBe(3)
    expect(matrixDecimalsChosen({ [MATRIX_DECIMALS_KEY]: 2 })).toBe(2)
    expect(matrixDecimalsChosen({ [MATRIX_DECIMALS_KEY]: '7' })).toBeNull()
    expect(matrixDecimalsChosen({ [MATRIX_DECIMALS_KEY]: 'x' })).toBeNull()
  })

  it('unité : celle du diagramme tant que rien n\'est choisi, ou que le choix n\'est plus lisible', () => {
    const fallback = { label: 'kt', factor: 1 }
    expect(matrixUnitOf({}, null, fallback)).toBe(fallback)
    expect(matrixUnitOf({ [MATRIX_UNIT_KEY]: '' }, null, fallback)).toBe(fallback)
    // Un sujet sans flux (ni registre d'unités) : le choix ne peut rien convertir.
    expect(matrixUnitOf({ [MATRIX_UNIT_KEY]: 'mass_Mt' }, { sankey: { links_list: [] } }, fallback)).toBe(fallback)
  })

  it('unité : sans registre, seule l\'unité du diagramme est offerte', () => {
    const choices = matrixUnitChoices({ sankey: { links_list: [] } })
    expect(choices).toHaveLength(1)
    expect(choices[0].value).toBe('')
  })
})
