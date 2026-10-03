// os#1511 — CHANGER LA REPRESENTATION D UNE FENETRE NE JETTE PAS LES REGLAGES DE SES FIGURES.
//
// Julien, 03/10/2026 : « quand je passe en tableau croise et reviens sur la couronne, je revois
// apparaitre les boutons pour configurer chaque dimension ». `setMainZoneWindowRepresentation`
// jetait les figures de la fenetre avant de changer sa nature : une couronne DETACHEE (« Liees au
// diagramme » a non) revenait LIEE apres l aller-retour, et la barre du haut lui rendait les menus
// de dimension de la couronne liee. L arbitrage du 18/09 (cf. `figureOf`) dit l inverse : changer
// de nature garde la surcharge, comme Excel garde la mise en forme d un graphique dont on change
// le type. On fait l aller-retour couronne -> tableau croise -> couronne, fenetre liee puis
// detachee, et on lit la surcharge a chaque etape.

import { Class_ApplicationData } from './ApplicationData'
import { representation_registry } from '../Representations/RepresentationRegistry'

const COURONNE = 'test.repr.couronne'
const TABLEAU = 'test.repr.tableau'
const PANE = 'p1'

beforeEach(() => {
  representation_registry.register({ id: COURONNE, scale: 'element', order: 40, label: () => 'Couronne', draw: () => undefined })
  representation_registry.register({ id: TABLEAU, scale: 'element', order: 41, label: () => 'Tableau', draw: () => undefined })
})
afterEach(() => {
  representation_registry.unregister(COURONNE)
  representation_registry.unregister(TABLEAU)
})

describe('aller-retour de representation dans une fenetre', () => {
  it.each([
    ['liee', true],
    ['detachee', false]
  ])('une couronne %s garde son reglage a chaque etape', (_nom, linked) => {
    const mc = new Class_ApplicationData(false).menu_configuration
    const id = mc.openMainZoneWindow({ kind: 'link', id: 'l1' }, COURONNE, 'right')
    const reglage = { coordinates_linked: linked, dimension_opening: { produit: ['cereales'] } }
    mc.setMainZonePaneOptions(id, PANE, reglage)
    const occupant = () => mc.main_zone_occupants.find(o => o.representation === COURONNE || o.representation === TABLEAU)!
    const own = () => mc.figureOf(occupant().id, PANE).own

    expect(own()).toEqual(reglage)
    mc.setMainZoneWindowRepresentation(occupant().id, TABLEAU)
    expect(occupant().representation).toBe(TABLEAU)
    expect(own()).toEqual(reglage)
    mc.setMainZoneWindowRepresentation(occupant().id, COURONNE)
    expect(occupant().representation).toBe(COURONNE)
    expect(own()).toEqual(reglage)
  })
})
