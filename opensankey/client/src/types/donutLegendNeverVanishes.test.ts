// os#1511 — LA LEGENDE D UNE COURONNE NE DISPARAIT JAMAIS D ELLE-MEME.
//
// Julien, 03/10/2026 : « quand je manipule souvent, la legende disparait, je te l avais deja dit ».
// sa!868 avait traite deux gestes (sortir des petits multiples, desactiver une dimension) ; la
// legende tombait encore par tous les autres, parce qu elle etait CALCULEE. La regle (cf.
// `donutLegendShown`) : sans reglage, legende des deux dimensions ; le premier dessin qui la montre
// l ECRIT sur la figure ; seul l interrupteur de l auteur l eteint.
//
// On enchaine une SERIE de gestes sur une vraie figure (la cascade de `Class_Figure`, avec sa
// surcharge minimale) et on verifie apres CHAQUE geste ce que le dessin montrerait. Un geste est
// ce que la barre du haut ecrit (le sac entier, une cle changee) et la forme qu il donne a la
// figure (combien de dimensions la decoupent, petits multiples ou non) ; « dessiner » applique ce
// que fait le trace de la couronne (`latchDonutLegend`).

import { Class_ApplicationData } from './ApplicationData'
import { representation_registry } from '../Representations/RepresentationRegistry'
import {
  DONUT_ATTRIBUTES, SMALL_MULTIPLES_KEY, donutLegendLatched, donutLegendShown, type Type_DonutLegendShape
} from '../Representations/analysisFigureAttributes'
import { figureControlsOf } from '../Representations/figureControls'
import type { Type_JSON } from './Utils'

const COURONNE = 'test.repr.couronne_legende'
const TABLEAU = 'test.repr.tableau_legende'
const PANE = 'p1'

beforeEach(() => {
  representation_registry.register({
    id: COURONNE, scale: 'element', order: 40, label: () => 'Couronne', draw: () => undefined,
    attributes: DONUT_ATTRIBUTES
  })
  representation_registry.register({ id: TABLEAU, scale: 'element', order: 41, label: () => 'Tableau', draw: () => undefined })
})
afterEach(() => {
  representation_registry.unregister(COURONNE)
  representation_registry.unregister(TABLEAU)
})

type Type_Bag = { [k: string]: unknown }

const UNE = (over: Partial<Type_DonutLegendShape> = {}): Type_DonutLegendShape =>
  ({ dimensions: 1, small_multiples: false, ...over })
const DEUX = (over: Partial<Type_DonutLegendShape> = {}): Type_DonutLegendShape =>
  ({ dimensions: 2, small_multiples: false, ...over })

const banc = () => {
  const mc = new Class_ApplicationData(false).menu_configuration
  mc.openMainZoneWindow({ kind: 'link', id: 'l1' }, COURONNE, 'right')
  const occupant = () => mc.main_zone_occupants.find(o => o.representation === COURONNE || o.representation === TABLEAU)!
  const figure = () => mc.figureOf(occupant().id, PANE)
  const options = () => figure().attributes as Type_Bag
  /** Ce que la barre du haut ecrit : le sac effectif, une ou deux cles changees. */
  const ecrit = (change: (o: Type_Bag) => Type_Bag) =>
    mc.setMainZonePaneOptions(occupant().id, PANE, change({ ...options() }) as Type_JSON)
  /** Le dessin de la couronne : la legende montree d office s ecrit sur la figure. */
  const dessine = (shape: Type_DonutLegendShape): boolean => {
    const next = donutLegendLatched(options(), shape)
    if (next !== null) mc.setMainZonePaneOptions(occupant().id, PANE, next as Type_JSON)
    return donutLegendShown(options(), shape)
  }
  return { mc, occupant, figure, options, ecrit, dessine }
}

describe('la regle', () => {
  test('sans reglage : pas de legende a une dimension, une legende des deux ou en petits multiples', () => {
    expect(donutLegendShown({}, UNE())).toBe(false)
    expect(donutLegendShown({}, DEUX())).toBe(true)
    expect(donutLegendShown({}, UNE({ small_multiples: true }))).toBe(true)
  })

  test('l interrupteur de l auteur gagne, dans les deux sens', () => {
    expect(donutLegendShown({ legend_visible: false }, DEUX())).toBe(false)
    expect(donutLegendShown({ legend_visible: true }, UNE())).toBe(true)
    // Rien ne s ecrit par-dessus un choix de l auteur.
    expect(donutLegendLatched({ legend_visible: false }, DEUX())).toBeNull()
  })

  test('la couronne n a pas de valeur d usine pour la legende, et la case reste une case', () => {
    expect(DONUT_ATTRIBUTES.legend_visible.default).toBeUndefined()
    const item = figureControlsOf(DONUT_ATTRIBUTES, {}, ['style'], 'fr', { app_data: {} })
      .find(c => c.key === 'legend_visible')
    expect(item?.kind).toBe('checkbox')
  })
})

describe('une serie de gestes ne fait jamais tomber la legende une fois apparue', () => {
  test('multiples, Monde et Continents, double fleche, activation, zoom, sunburst, detacher, tableau croise', () => {
    const b = banc()

    // Une couronne a une dimension : pas de legende, et rien n est ecrit.
    expect(b.dessine(UNE())).toBe(false)
    expect(b.figure().isAttributeExplicit('legend_visible')).toBe(false)

    // Petits multiples : la legende commune apparait, et s ecrit.
    b.ecrit(o => ({ ...o, [SMALL_MULTIPLES_KEY]: 'pays' }))
    expect(b.dessine(UNE({ small_multiples: true }))).toBe(true)
    expect(b.figure().own['legend_visible']).toBe(true)

    // A partir d ici, apres CHAQUE geste, la legende reste.
    const gestes: [string, (o: Type_Bag) => Type_Bag, Type_DonutLegendShape][] = [
      ['sortir des multiples', o => ({ ...o, [SMALL_MULTIPLES_KEY]: undefined }), UNE()],
      ['pays a Continents (diagramme)', o => o, DEUX()],
      ['pays a Monde (diagramme)', o => o, UNE()],
      ['double fleche', o => ({ ...o, descriptor: { decompose: { kind: 'data_dimension', data_tagg_id: 'produit' } } }), DEUX()],
      ['desactiver une dimension', o => ({ ...o, dimension_opening: { inactive: ['pays'] } }), UNE()],
      ['reactiver', o => ({ ...o, dimension_opening: { inactive: [] } }), DEUX()],
      ['zoomer', o => ({ ...o, hierarchy_focus: ['produit:cereales'] }), UNE()],
      ['dezoomer', o => ({ ...o, hierarchy_focus: [] }), DEUX()],
      ['en sunburst', o => ({ ...o, levels_display: 'rings' }), DEUX()],
      ['en secteurs', o => ({ ...o, levels_display: 'in_place' }), UNE()],
      ['detacher', o => ({ ...o, coordinates_linked: false }), UNE()],
      ['lier', o => ({ ...o, coordinates_linked: true }), UNE()],
      ['multiples de nouveau', o => ({ ...o, [SMALL_MULTIPLES_KEY]: 'pays' }), UNE({ small_multiples: true })],
      ['multiples rendus impossibles', o => ({ ...o, dimension_opening: { inactive: ['produit'] } }), UNE()]
    ]
    gestes.forEach(([nom, change, shape]) => {
      b.ecrit(change)
      expect([nom, b.dessine(shape)]).toEqual([nom, true])
    })

    // Couronne -> tableau croise -> couronne : la figure garde son reglage.
    b.mc.setMainZoneWindowRepresentation(b.occupant().id, TABLEAU)
    b.mc.setMainZoneWindowRepresentation(b.occupant().id, COURONNE)
    expect(b.dessine(UNE())).toBe(true)
  })

  test('seul l interrupteur de l auteur l eteint, et elle reste eteinte', () => {
    const b = banc()
    expect(b.dessine(DEUX())).toBe(true)

    // L auteur l eteint : `false` s ecrit (aucune usine a laquelle il serait egal).
    b.ecrit(o => ({ ...o, legend_visible: false }))
    expect(b.figure().own['legend_visible']).toBe(false)
    expect(b.dessine(DEUX())).toBe(false)
    // Un autre geste ne la rallume pas, meme a deux dimensions.
    b.ecrit(o => ({ ...o, levels_display: 'rings' }))
    expect(b.dessine(DEUX())).toBe(false)
    // Les petits multiples posent leur legende commune d office... et ne reecrivent pas le choix.
    b.ecrit(o => ({ ...o, [SMALL_MULTIPLES_KEY]: 'pays' }))
    expect(b.dessine(UNE({ small_multiples: true }))).toBe(true)
    b.ecrit(o => ({ ...o, [SMALL_MULTIPLES_KEY]: undefined }))
    expect(b.dessine(UNE())).toBe(false)

    // Rallumee, elle reste.
    b.ecrit(o => ({ ...o, legend_visible: true }))
    expect(b.dessine(UNE())).toBe(true)
  })
})
